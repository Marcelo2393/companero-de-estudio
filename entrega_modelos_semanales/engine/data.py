"""Carga de ScholarSim para el motor.

El motor solo debe leer la versión operational. La versión evaluation se carga aparte y
solo la usan los evaluadores (engine/evaluate.py).
"""

from __future__ import annotations

import json
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "scholarsim"


def load_curriculum() -> dict[str, dict]:
    cur = json.loads((ROOT / "synth" / "curriculum.json").read_text())
    return {c["course_id"]: c for c in cur["courses"]}


def load_simulation_calendar() -> dict:
    """Calendario del ciclo (semanas, evaluaciones, fases). Es información pública, no latente."""
    sim = tomllib.loads((ROOT / "synth" / "scholarsim.toml").read_text())["simulation"]
    keys = ("weeks", "term_start", "diagnostic_week", "assessment_weeks", "closing_weeks", "phases", "passing_grade")
    return {k: sim[k] for k in keys}


@dataclass
class Operational:
    students: pd.DataFrame
    enrollments: pd.DataFrame
    weekly: pd.DataFrame
    events: pd.DataFrame
    alerts: pd.DataFrame
    courses: dict[str, dict]
    calendar: dict
    _by_student: dict = field(default_factory=dict, repr=False)

    def student(self, sid: str) -> dict:
        if not self._by_student:
            self._by_student = {
                "students": self.students.set_index("student_id"),
                "enrollments": dict(tuple(self.enrollments.groupby("student_id"))),
                "weekly": dict(tuple(self.weekly.groupby("student_id"))),
                "events": dict(tuple(self.events.groupby("student_id"))),
            }
        b = self._by_student
        return {
            "profile": b["students"].loc[sid].to_dict() | {"student_id": sid},
            "enrollments": b["enrollments"].get(sid, self.enrollments.iloc[0:0]),
            "weekly": b["weekly"].get(sid, self.weekly.iloc[0:0]),
            "events": b["events"].get(sid, self.events.iloc[0:0]),
        }


def load_operational(root: Path = DATA, events: bool = True) -> Operational:
    op = root / "operational"
    ev = pd.read_csv(op / "learning_events.csv", dtype={"value": str, "detail": str, "course_id": str}) \
        if events else pd.DataFrame()
    return Operational(
        students=pd.read_csv(op / "students.csv", keep_default_na=False, na_values=[""]),
        enrollments=pd.read_csv(op / "enrollments.csv"),
        weekly=pd.read_csv(op / "weekly_states.csv"),
        events=ev,
        alerts=pd.read_csv(op / "alerts.csv"),
        courses=load_curriculum(),
        calendar=load_simulation_calendar(),
    )


@dataclass
class Evaluation:
    latent: pd.DataFrame
    shocks: pd.DataFrame
    weekly_latent: pd.DataFrame
    outcomes: pd.DataFrame
    results: pd.DataFrame


def load_evaluation(root: Path = DATA) -> Evaluation:
    ev = root / "evaluation"
    return Evaluation(
        latent=pd.read_csv(ev / "students_latent.csv", keep_default_na=False),
        shocks=pd.read_csv(ev / "shocks.csv", keep_default_na=False),
        weekly_latent=pd.read_csv(ev / "weekly_latent.csv", keep_default_na=False),
        outcomes=pd.read_csv(ev / "outcomes.csv"),
        results=pd.read_csv(ev / "enrollment_results.csv"),
    )
