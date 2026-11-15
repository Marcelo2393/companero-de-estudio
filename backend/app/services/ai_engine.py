"""Integración real con el engine de entrega_modelos_semanales.

Expone tres capacidades a la API de Kuska:

1. ``simulate_student``  – recorre semanas con externalidades opcionales usando
   engine/simulation.py (no requiere datasets externos).

2. ``get_risk_assessment`` – calcula riesgo de abandono y macroperfiles a partir
   de la trayectoria real del estudiante (sesiones completadas, alertas y
   cumplimiento) usando la lógica de simulation.py como estimador determinista.
   Los modelos .joblib requieren el dataset ScholarSim para reentrenarse; en
   producción se reemplaza esta función por engine/models.predict().

3. ``build_cpsat_plan``  – construye o actualiza el plan semanal usando el solver
   CP-SAT de engine/schedule.py con los objetivos y disponibilidad del estudiante.
"""
from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from app.engine.simulation import EXTERNALITIES, INTERVENTIONS, simulate
from app.engine.schedule import (
    DAYS,
    Target,
    busy_blocks,
    cpsat_plan,
    greedy_plan,
)
from app.models import Alert, Student, StudySession

# ---------------------------------------------------------------------------
# Tipos de salida
# ---------------------------------------------------------------------------

BARRIERS_ES = {
    "academic":               "Barreras académicas",
    "time":                   "Barreras de tiempo",
    "material_digital":       "Barreras materiales y digitales",
    "integration_motivation": "Barreras de integración y motivación",
}

INTERVENTIONS_ES = {
    "academic":               "Refuerzo por competencias y tutorías",
    "time":                   "Optimización del calendario y recuperación gradual",
    "material_digital":       "Recursos offline, préstamo y soporte TI",
    "integration_motivation": "Orientación, acompañamiento humano y comunidad",
    "stable":                 "Seguimiento ligero y planificación",
}

SUPPORT_ROLES = {
    "academic":               ["Tutor/a académico/a", "Coordinador/a de carrera"],
    "time":                   ["Trabajador/a social", "Mentor/a de pares"],
    "material_digital":       ["Soporte TI", "Bibliotecario/a"],
    "integration_motivation": ["Orientador/a psicológico/a", "Bienestar estudiantil"],
    "stable":                 [],
}

EXTERNALITIES_ES = {k: v[0] for k, v in EXTERNALITIES.items()}


# ---------------------------------------------------------------------------
# 1. Simulación semanal
# ---------------------------------------------------------------------------

def simulate_student(events: dict[int, str] | None = None, weeks: int = 9,
                     base_hours: float = 10.0) -> list[dict]:
    """Simulación semanal con externalidades opcionales.

    Devuelve el recorrido con macroperfiles, riesgo, alertas e intervenciones.
    ``events`` es un dict {semana: nombre_externalidad} usando las claves de
    EXTERNALITIES (p.ej. ``{3: "laptop_dañada", 6: "trabajo_extra"}``).
    """
    rows = simulate(events=events, weeks=weeks, base_hours=base_hours)
    # Enriquecer con traducciones y roles de apoyo
    for r in rows:
        r["macroprofiles_es"] = [
            BARRIERS_ES.get(b, b) if b != "stable" else "Trayectoria estable"
            for b in r["macroprofiles"]
        ]
        r["interventions_es"] = [
            INTERVENTIONS_ES.get(b, b) for b in r["macroprofiles"]
        ]
        r["support_roles"] = list({
            role
            for b in r["macroprofiles"]
            for role in SUPPORT_ROLES.get(b, [])
        })
    return rows


# ---------------------------------------------------------------------------
# 2. Evaluación de riesgo a partir de datos reales del estudiante
# ---------------------------------------------------------------------------

def get_risk_assessment(db: Session, student_id: int) -> dict:
    """Estima el riesgo y macroperfiles a partir de la trayectoria real.

    Usa la lógica determinista de simulation.py adaptada a los datos reales:
    - alertas acumuladas → mapa a barreras
    - cumplimiento → riesgo base
    - sesiones pendientes vencidas → barrera de tiempo o integración

    En producción se sustituye por engine.models.predict() con modelos .joblib
    reentrenados con datos validados.
    """
    student = db.get(Student, student_id)
    if not student:
        return {"error": "Estudiante no encontrado"}

    today = date.today()
    sessions = db.query(StudySession).filter(StudySession.student_id == student_id).all()
    alerts   = db.query(Alert).filter(Alert.student_id == student_id).all()

    # --- métricas básicas ---
    today_sessions = [s for s in sessions if s.day_of_week == today.weekday()]
    completed = [s for s in today_sessions if s.status == "completed"]
    total_mins = sum(s.duration_minutes for s in today_sessions)
    done_mins  = sum(s.actual_duration_minutes or 0 for s in completed)
    compliance = done_mins / total_mins if total_mins else 0.0

    noncompliance_alerts = [a for a in alerts if a.type == "daily_noncompliance"]
    not_started_alerts   = [a for a in alerts if a.type == "session_not_started"]

    # --- barreras activas (reglas deterministas) ---
    active_barriers: list[str] = []
    risk_score = 0.0

    # Barrera académica: muchas sesiones sin iniciar → posible dificultad de contenido
    if len(not_started_alerts) >= 3:
        active_barriers.append("academic")
        risk_score += 0.15

    # Barrera de tiempo: incumplimiento diario recurrente
    if len(noncompliance_alerts) >= 2:
        active_barriers.append("time")
        risk_score += 0.20

    # Barrera de integración/motivación: muy bajo cumplimiento hoy
    if compliance < 0.3 and len(today_sessions) > 0:
        active_barriers.append("integration_motivation")
        risk_score += 0.15

    # Riesgo base proporcional a alertas totales
    risk_score += min(len(alerts) * 0.05, 0.40)
    risk_score = min(round(risk_score, 3), 0.99)

    if not active_barriers:
        active_barriers = ["stable"]

    risk_level = (
        "alto"   if risk_score >= 0.60 else
        "medio"  if risk_score >= 0.35 else
        "bajo"
    )

    return {
        "student_id":       student_id,
        "week":             (today - date(today.year, 1, 1)).days // 7,
        "risk_score":       risk_score,
        "risk_level":       risk_level,
        "macroprofiles":    active_barriers,
        "macroprofiles_es": [
            BARRIERS_ES.get(b, b) if b != "stable" else "Trayectoria estable"
            for b in active_barriers
        ],
        "interventions": [INTERVENTIONS_ES.get(b, b) for b in active_barriers],
        "support_roles": list({
            role for b in active_barriers for role in SUPPORT_ROLES.get(b, [])
        }),
        "metrics": {
            "compliance_today":     round(compliance, 3),
            "noncompliance_alerts": len(noncompliance_alerts),
            "not_started_alerts":   len(not_started_alerts),
            "total_alerts":         len(alerts),
            "target_hours_daily":   student.target_hours_daily,
        },
    }


# ---------------------------------------------------------------------------
# 3. Planificador CP-SAT
# ---------------------------------------------------------------------------

DAY_NAME_TO_IDX = {d: i for i, d in enumerate(DAYS)}
DAY_IDX_TO_BACKEND = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6}  # ortools=backend (ambos Lun=0)


def build_cpsat_plan(
    db: Session,
    student_id: int,
    week: int,
    capacity_hours: float = 10.0,
    extra_busy: set[tuple[str, int]] | None = None,
) -> dict:
    """Genera un plan semanal óptimo con CP-SAT para el estudiante.

    Construye los targets a partir de las sesiones del plan actual (una hora
    por curso como objetivo base). Devuelve el plan serializado con sesiones,
    faltantes y número de cambios.
    """
    sessions = db.query(StudySession).filter(StudySession.student_id == student_id).all()
    if not sessions:
        return {"error": "Sin sesiones para planificar"}

    # Agrupar horas por curso para construir los targets
    course_hours: dict[str, float] = {}
    for s in sessions:
        course_hours[s.course_name] = course_hours.get(s.course_name, 0) + s.duration_minutes / 60

    # Normalizar prioridad: cursos con más horas tienen mayor prioridad
    max_h = max(course_hours.values(), default=1)
    targets = [
        Target(
            course_id=course,
            hours=round(hours, 1),
            priority=round(hours / max_h, 2),
        )
        for course, hours in course_hours.items()
    ]

    busy: set[tuple[str, int]] = set(extra_busy or ())

    try:
        plan = cpsat_plan(
            week=week,
            targets=targets,
            busy=busy,
            capacity_hours=capacity_hours,
        )
    except Exception:
        # Fallback a greedy si CP-SAT falla (sin solver instalado o timeout)
        plan = greedy_plan(
            week=week,
            targets=targets,
            busy=busy,
            capacity_hours=capacity_hours,
        )

    return plan.to_dict()


def available_externalities() -> dict[str, str]:
    """Lista de externalidades disponibles para la simulación."""
    return {
        k: f"{v[0]} (−{v[1]}h)"
        for k, v in EXTERNALITIES.items()
    }
