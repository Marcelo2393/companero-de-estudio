"""Plan semanal: repartir sesiones de estudio en las franjas libres del becario.

Paso [3] del diseño. Dos resolvedores con la misma entrada y salida:

    greedy_plan   heurística de prioridad (plazo, brecha, arrastre): línea base rápida
    cpsat_plan    CP-SAT: maximiza horas útiles por prioridad, reparte en la semana y, si hay
                  un plan anterior, cambia lo menos posible (perturbación mínima, paso [4] y [6])

La grilla es de bloques de 30 minutos entre las 07:00 y las 23:00, de lunes a domingo.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field

from ortools.sat.python import cp_model

DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
DAY_START = 7 * 60
BLOCK = 30
N_BLOCKS = (23 * 60 - DAY_START) // BLOCK   # 32 bloques por día
SESSION_BLOCKS = 2                           # sesión de 1 hora
MAX_SESSIONS_PER_COURSE_DAY = 2
MAX_STUDY_HOURS_DAY = 4                      # no más de 4 h de estudio autónomo en un día
WORK_TEMPLATES = {                           # día de la semana -> hora de inicio del turno
    "day": {d: 8 * 60 for d in DAYS[:5]},
    "night": {d: 18 * 60 for d in DAYS[:5]},
    "weekend": {d: 8 * 60 for d in DAYS[5:]},
    "rotating": {"mon": 8 * 60, "tue": 18 * 60, "wed": 8 * 60, "thu": 18 * 60, "fri": 8 * 60},
}


def to_block(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return (int(h) * 60 + int(m) - DAY_START) // BLOCK


def block_time(b: int) -> str:
    t = DAY_START + b * BLOCK
    return f"{t // 60:02d}:{t % 60:02d}"


@dataclass
class Session:
    course_id: str
    day: str
    start: int                 # bloque
    kind: str = "study"        # study, exam_prep, reinforcement
    competency_id: str = ""
    pinned: bool = False

    @property
    def blocks(self) -> list[tuple[str, int]]:
        return [(self.day, self.start + k) for k in range(SESSION_BLOCKS)]

    def label(self) -> str:
        return f"{self.day} {block_time(self.start)}-{block_time(self.start + SESSION_BLOCKS)} {self.course_id}"


@dataclass
class Target:
    course_id: str
    hours: float               # horas de estudio que pide esta semana
    priority: float
    reasons: list[str] = field(default_factory=list)
    exam_day: str | None = None   # si hay evaluación esta semana, el estudio debe ir antes
    focus: list[str] = field(default_factory=list)   # competencias a reforzar, en orden


@dataclass
class Plan:
    week: int
    sessions: list[Session]
    targets: list[Target]
    capacity_hours: float
    solver: str
    shortfall: dict[str, float] = field(default_factory=dict)
    changed: int = 0           # sesiones del plan anterior que se movieron o quitaron

    def hours_by_course(self) -> dict[str, float]:
        out: dict[str, float] = {}
        for s in self.sessions:
            out[s.course_id] = out.get(s.course_id, 0) + SESSION_BLOCKS * BLOCK / 60
        return out

    def to_dict(self) -> dict:
        return {"week": self.week, "solver": self.solver, "capacity_hours": self.capacity_hours,
                "changed": self.changed, "shortfall": self.shortfall,
                "targets": [asdict(t) for t in self.targets],
                "sessions": [asdict(s) | {"time": s.label()} for s in self.sessions]}


# --- franjas ocupadas ---------------------------------------------------------

def busy_blocks(profile: dict, schedules: list[str], extra: set[tuple[str, int]] | None = None) -> set[tuple[str, int]]:
    """Bloques ocupados por clases, trabajo y cuidado (más traslado alrededor de las clases)."""
    busy: set[tuple[str, int]] = set(extra or ())
    commute_blocks = max(1, round(float(profile.get("commute_time") or 0) / 2 / BLOCK))
    for sched in schedules:
        for item in str(sched).split(";"):
            if not item.strip():
                continue
            day, span = item.split()
            a, b = (to_block(x) for x in span.split("-"))
            for k in range(a - commute_blocks, b + commute_blocks):
                if 0 <= k < N_BLOCKS:
                    busy.add((day, k))
    shift = profile.get("work_shift") or "none"
    hours = float(profile.get("weekly_work_hours") or 0)
    if shift in WORK_TEMPLATES and hours > 0:
        days = WORK_TEMPLATES[shift]
        per_day = hours / len(days)
        for day, start in days.items():
            a = (start - DAY_START) // BLOCK
            for k in range(a, a + round(per_day * 60 / BLOCK)):
                if 0 <= k < N_BLOCKS:
                    busy.add((day, k))
    care = float(profile.get("caregiving_hours") or 0)
    if care > 0:
        per_day = round(care / 7 * 60 / BLOCK)
        for day in DAYS:   # el cuidado se ubica al empezar la tarde
            for k in range(to_block("14:00"), to_block("14:00") + per_day):
                busy.add((day, k))
    return busy


def candidate_starts(busy: set[tuple[str, int]], exclude: set[tuple[str, int]] = frozenset()) -> list[tuple[str, int]]:
    out = []
    for day in DAYS:
        for b in range(N_BLOCKS - SESSION_BLOCKS + 1):
            if all((day, b + k) not in busy and (day, b + k) not in exclude for k in range(SESSION_BLOCKS)):
                out.append((day, b))
    return out


def sessions_needed(t: Target) -> int:
    return max(0, round(t.hours * 60 / (SESSION_BLOCKS * BLOCK)))


def _allowed(t: Target, day: str) -> bool:
    return t.exam_day is None or DAYS.index(day) < DAYS.index(t.exam_day)


def _kind(t: Target, k: int) -> tuple[str, str]:
    if k < len(t.focus):
        return "reinforcement", t.focus[k]
    return ("exam_prep" if t.exam_day else "study"), ""


# --- línea base: heurística de prioridad -------------------------------------

def greedy_plan(week: int, targets: list[Target], busy: set[tuple[str, int]], capacity_hours: float) -> Plan:
    cap = int(capacity_hours * 60 // (SESSION_BLOCKS * BLOCK))
    pending = {t.course_id: sessions_needed(t) for t in targets}
    by_id = {t.course_id: t for t in targets}
    occupied = set(busy)
    per_day: dict[tuple[str, str], int] = {}
    day_load: dict[str, int] = {d: 0 for d in DAYS}
    sessions: list[Session] = []
    # turnos: en cada vuelta, una sesión por curso en orden de prioridad (reparte entre cursos)
    while len(sessions) < cap and any(pending.values()):
        progress = False
        for t in sorted(targets, key=lambda x: -x.priority):
            if len(sessions) >= cap or not pending[t.course_id]:
                continue
            best = None
            for day in sorted(DAYS, key=lambda d: (per_day.get((t.course_id, d), 0), day_load[d], DAYS.index(d))):
                if not _allowed(t, day) or per_day.get((t.course_id, day), 0) >= MAX_SESSIONS_PER_COURSE_DAY \
                        or day_load[day] + SESSION_BLOCKS * BLOCK / 60 > MAX_STUDY_HOURS_DAY:
                    continue
                starts = candidate_starts(occupied)
                starts = [s for s in starts if s[0] == day]
                if starts:
                    best = starts[0]
                    break
            if best is None:
                pending[t.course_id] = 0   # no cabe más esta semana
                continue
            k = sessions_needed(t) - pending[t.course_id]
            kind, comp = _kind(t, k)
            s = Session(t.course_id, best[0], best[1], kind, comp)
            sessions.append(s)
            occupied.update(s.blocks)
            per_day[(t.course_id, best[0])] = per_day.get((t.course_id, best[0]), 0) + 1
            day_load[best[0]] += SESSION_BLOCKS * BLOCK / 60
            pending[t.course_id] -= 1
            progress = True
        if not progress:
            break
    plan = Plan(week, sessions, targets, capacity_hours, "greedy")
    plan.shortfall = _shortfall(plan, by_id)
    return plan


def _shortfall(plan: Plan, by_id: dict[str, Target]) -> dict[str, float]:
    got = plan.hours_by_course()
    return {cid: round(t.hours - got.get(cid, 0), 1) for cid, t in by_id.items() if t.hours - got.get(cid, 0) >= 0.5}


# --- CP-SAT con perturbación mínima ------------------------------------------

def cpsat_plan(week: int, targets: list[Target], busy: set[tuple[str, int]], capacity_hours: float,
               previous: list[Session] | None = None, pinned: list[Session] | None = None,
               keep_weight: int = 30, time_limit: float = 2.0) -> Plan:
    """Plan óptimo por prioridad; con `previous` premia mantener sesiones (cambia lo mínimo).

    Las sesiones `pinned` (fijadas por el becario) son restricciones duras: no se mueven.
    """
    pinned = pinned or []
    by_id = {t.course_id: t for t in targets}
    pinned_blocks = {b for s in pinned for b in s.blocks}
    starts = candidate_starts(busy, exclude=pinned_blocks)
    pinned_count = {cid: sum(1 for s in pinned if s.course_id == cid) for cid in by_id}
    pinned_hours_day = {d: sum(SESSION_BLOCKS * BLOCK / 60 for s in pinned if s.day == d) for d in DAYS}
    cap = int(capacity_hours * 60 // (SESSION_BLOCKS * BLOCK)) - len(pinned)
    prev_keys = {(s.course_id, s.day, s.start) for s in (previous or []) if not s.pinned}

    m = cp_model.CpModel()
    x: dict[tuple[str, str, int], cp_model.IntVar] = {}
    for t in targets:
        for day, b in starts:
            if _allowed(t, day):
                x[(t.course_id, day, b)] = m.NewBoolVar(f"x_{t.course_id}_{day}_{b}")
    # cada bloque, a lo más una sesión
    cover: dict[tuple[str, int], list] = {}
    for (cid, day, b), v in x.items():
        for k in range(SESSION_BLOCKS):
            cover.setdefault((day, b + k), []).append(v)
    for vs in cover.values():
        m.Add(sum(vs) <= 1)
    for t in targets:
        cid = t.course_id
        vs = [v for (c, _, _), v in x.items() if c == cid]
        m.Add(sum(vs) <= max(0, sessions_needed(t) - pinned_count[cid]))
        for day in DAYS:
            dv = [v for (c, d, _), v in x.items() if c == cid and d == day]
            pin_d = sum(1 for s in pinned if s.course_id == cid and s.day == day)
            if dv:
                m.Add(sum(dv) <= max(0, MAX_SESSIONS_PER_COURSE_DAY - pin_d))
    for day in DAYS:
        dv = [v for (_, d, _), v in x.items() if d == day]
        if dv:
            room = int((MAX_STUDY_HOURS_DAY - pinned_hours_day[day]) * 60 // (SESSION_BLOCKS * BLOCK))
            m.Add(sum(dv) <= max(0, room))
    m.Add(sum(x.values()) <= max(0, cap))

    # objetivo: rendimientos decrecientes por curso (cada curso recibe su parte antes de que uno
    # acapare la semana), repartir días y mantener el plan anterior
    obj = []
    for t in targets:
        cid = t.course_id
        vs = [v for (c, _, _), v in x.items() if c == cid]
        n_max = max(0, sessions_needed(t) - pinned_count[cid])
        if not vs or n_max == 0:
            continue
        steps = [m.NewBoolVar(f"k_{cid}_{k}") for k in range(n_max)]
        for a, b in zip(steps, steps[1:]):
            m.Add(a >= b)
        m.Add(sum(steps) == sum(vs))
        for k, z in enumerate(steps, start=pinned_count[cid] + 1):
            obj.append(int(100 * t.priority / k ** 0.5) * z)
    for (cid, day, b), v in x.items():
        if (cid, day, b) in prev_keys:
            obj.append(keep_weight * v)
    for t in targets:   # usar días distintos para un mismo curso
        for day in DAYS:
            dv = [v for (c, d, _), v in x.items() if c == t.course_id and d == day]
            if dv:
                used = m.NewBoolVar(f"u_{t.course_id}_{day}")
                m.AddMaxEquality(used, dv)
                obj.append(5 * used)
    m.Maximize(sum(obj))
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit
    solver.parameters.num_workers = 8
    status = solver.Solve(m)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise RuntimeError("CP-SAT no encontró un plan")

    sessions = list(pinned)
    count = {cid: pinned_count[cid] for cid in by_id}
    for (cid, day, b), v in sorted(x.items(), key=lambda kv: (DAYS.index(kv[0][1]), kv[0][2])):
        if solver.Value(v):
            kind, comp = _kind(by_id[cid], count[cid])
            count[cid] += 1
            sessions.append(Session(cid, day, b, kind, comp))
    plan = Plan(week, sessions, targets, capacity_hours, "cpsat")
    plan.shortfall = _shortfall(plan, by_id)
    if previous is not None:
        plan.changed = len(prev_keys - {(s.course_id, s.day, s.start) for s in sessions})
    return plan
