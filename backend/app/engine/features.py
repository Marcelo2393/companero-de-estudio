"""Variables por becario para predicción y segmentación, solo con datos operational.

`build(op, upto_week)` usa lo observado hasta esa semana inclusive: así un modelo entrenado
con k semanas puede usarse en la semana k del ciclo real sin mirar el futuro.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from .data import Operational

ORDINAL = {
    "level": {"low": 0, "medium": 1, "high": 2},
    "access": {"adequate": 0, "limited": 1, "none": 2},
    "support": {"yes": 0, "sometimes": 1, "no": 2},
    "yes_no": {"no": 0, "yes": 1},
    "connection": {"stable": 0, "intermittent": 1, "unstable": 2},
    "device_availability": {"always": 0, "shared": 1, "limited": 2},
    "continue": {"yes": 0, "unsure": 1, "no": 2},
}
PROFILE_ORDINAL = {
    "schedule_flexibility": "level", "financial_pressure": "level", "help_seeking_behavior": "level",
    "relocation_adaptation": "level", "academic_motivation": "level", "career_satisfaction": "level",
    "goal_clarity": "level", "academic_self_efficacy": "level",
    "transport_affordability": "access", "study_material_access": "access", "study_space_access": "access",
    "academic_guidance_access": "access",
    "family_support": "support", "peer_support": "support",
    "academic_mentorship": "yes_no", "financial_dependents": "yes_no", "offline_material_needs": "yes_no",
    "scholarship_payment_regular": "yes_no", "first_generation": "yes_no", "migrated_to_study": "yes_no",
    "connection_reliability": "connection", "device_availability": "device_availability",
    "intention_to_continue": "continue",
}
PROFILE_NUMERIC = ["academic_cycle", "weekly_work_hours", "caregiving_hours", "weekly_study_availability",
                   "enrolled_credits", "completed_credits", "academic_average"]


def profile_features(op: Operational) -> pd.DataFrame:
    s = op.students.set_index("student_id")
    out = pd.DataFrame(index=s.index)
    for c in PROFILE_NUMERIC:
        out[c] = pd.to_numeric(s[c], errors="coerce")
    out["academic_average"] = out["academic_average"].fillna(out["academic_average"].median())
    out["commute_hours_week"] = s["commute_time"] * s["commute_days_week"] / 60
    for c, scale in PROFILE_ORDINAL.items():
        v = s[c].map(ORDINAL[scale])
        out[c] = v.fillna(-1)                     # declinado o vacío: -1, con indicador abajo
    out["declined_count"] = s[list(PROFILE_ORDINAL)].isna().sum(axis=1)
    out["smartphone_only"] = (s["device_type"] == "smartphone_only").astype(int)
    for v in ("part_time", "full_time", "informal"):
        out[f"employment_{v}"] = (s["employment_status"] == v).astype(int)
    for v in sorted(s["career"].unique()):
        out[f"career_{v}"] = (s["career"] == v).astype(int)
    out["n_difficulties"] = s["learning_difficulties"].fillna("").map(lambda x: len([y for y in str(x).split(";") if y]))
    out["n_failed"] = s["failed_courses"].fillna("").map(lambda x: len([y for y in str(x).split(";") if y]))
    # presión de carga oficial: horas de estudio de los cursos / horas declaradas
    self_study = op.enrollments.assign(
        h=op.enrollments["course_id"].map(lambda c: op.courses[c]["weekly_hours"]["self_study"])
    ).groupby("student_id")["h"].sum()
    out["official_pressure"] = (self_study / out["weekly_study_availability"].clip(lower=1)).reindex(out.index).fillna(0)
    return out


def _slope(y: pd.Series) -> float:
    y = y.dropna()
    if len(y) < 2:
        return 0.0
    x = y.index.to_numpy(dtype=float)
    return float(np.polyfit(x, y.to_numpy(dtype=float), 1)[0])


def behavior_features(op: Operational, upto_week: int) -> pd.DataFrame:
    w = op.weekly[(op.weekly["week"] <= upto_week) & (op.weekly["phase"] != "closing")]
    rows = {}
    for sid, g in w.groupby("student_id"):
        g = g.set_index("week")
        resp = g[g["checkin_responded"] == 1]
        comp = resp["weekly_plan_completion"]
        sched = g["classes_scheduled"].sum()
        due = (g["submissions_on_time"] + g["submissions_late"] + g["submissions_missing"]).sum()
        last2 = comp[comp.index > upto_week - 2]
        rows[sid] = {
            "completion_mean": comp.mean() if len(comp) else np.nan,
            "completion_last2": last2.mean() if len(last2) else np.nan,
            "completion_min": comp.min() if len(comp) else np.nan,
            "completion_slope": _slope(comp),
            "completion_drop": (comp.iloc[: min(3, len(comp))].mean() - last2.mean()) if len(last2) and len(comp) else 0.0,
            "checkin_rate": len(resp) / len(g),
            "attendance_rate": g["classes_attended"].sum() / sched if sched else 0.0,
            "late_rate": (g["submissions_late"] + g["submissions_missing"]).sum() / due if due else 1.0,
            "missing_rate": g["submissions_missing"].sum() / due if due else 1.0,
            "inactive_weeks": int((g["classes_scheduled"] == 0).sum()),
            "perceived_mean": resp["perceived_workload"].mean() if len(resp) else np.nan,
            "perceived_max": resp["perceived_workload"].max() if len(resp) else np.nan,
            "study_hours_mean": resp["weekly_study_hours"].mean() if len(resp) else np.nan,
            "availability_change": (resp["weekly_study_availability"].iloc[-1] - resp["weekly_study_availability"].iloc[0])
            if len(resp) > 1 else 0.0,
            "tutorial_hours": g["tutorial_hours"].sum(),
        }
    out = pd.DataFrame.from_dict(rows, orient="index")
    if not op.events.empty:
        ev = op.events[(op.events["week"] <= upto_week)]
        graded = ev[ev["event_type"].isin(["diagnostic", "assessment"])].copy()
        graded["v"] = pd.to_numeric(graded["value"], errors="coerce")
        out["diagnostic_mean"] = graded[graded["event_type"] == "diagnostic"].groupby("student_id")["v"].mean()
        out["diagnostic_min"] = graded[graded["event_type"] == "diagnostic"].groupby("student_id")["v"].min()
        a = graded[graded["event_type"] == "assessment"].groupby("student_id")["v"]
        out["assessment_mean"] = a.mean()
        out["assessment_min"] = a.min()
    al = op.alerts[op.alerts["week"] <= upto_week]
    for t in sorted(op.alerts["alert_type"].unique()):
        out[f"alerts_{t}"] = al[al["alert_type"] == t].groupby("student_id").size()
    alert_cols = [c for c in out if c.startswith("alerts_")]
    out[alert_cols] = out[alert_cols].fillna(0)
    return out


def build(op: Operational, upto_week: int, kind: str = "all") -> pd.DataFrame:
    """kind: profile, behavior o all."""
    parts = []
    if kind in ("profile", "all"):
        parts.append(profile_features(op))
    if kind in ("behavior", "all"):
        parts.append(behavior_features(op, upto_week))
    x = pd.concat(parts, axis=1).loc[op.students["student_id"]]
    return x.dropna(axis=1, how="all")       # p. ej. notas antes de la primera evaluación
