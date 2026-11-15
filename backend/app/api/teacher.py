"""Endpoints del panel del docente.

Permite consultar el estado de todos los estudiantes, filtrar por fecha o rango
de fechas, y obtener métricas agregadas para las gráficas del dashboard docente.
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert, Student, StudySession

router = APIRouter(prefix="/api/teacher", tags=["teacher"])

# Contraseña de demo (solo para la documentación; la validación real está en el frontend).
TEACHER_PASS = "PROFE2024"


# ---------------------------------------------------------------------------
# Schemas de respuesta
# ---------------------------------------------------------------------------

class StudentSummary(BaseModel):
    id: int
    dni: str
    name: str
    semester_label: str
    scheduled_sessions: int
    completed_sessions: int
    pending_sessions: int
    compliance_pct: float
    total_alerts: int
    unread_alerts: int
    risk_level: str   # bajo | medio | alto


class DayActivity(BaseModel):
    date: str        # YYYY-MM-DD
    completed: int
    pending: int
    alerts: int


class CourseDistribution(BaseModel):
    course_name: str
    total_sessions: int
    completed: int
    compliance_pct: float


class TeacherDashboard(BaseModel):
    date_from: str
    date_to: str
    total_students: int
    avg_compliance: float
    high_risk_count: int
    students: list[StudentSummary]
    daily_activity: list[DayActivity]
    course_distribution: list[CourseDistribution]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Mapa aproximado de semestre por rango de ID (depende del orden de creación).
SEMESTER_BY_DNI = {
    "16447495": "Semestre 3", "72345678": "Semestre 3",
    "30567890": "Semestre 3", "45123789": "Semestre 3",
    "58934210": "Semestre 5", "63210987": "Semestre 5",
    "71890234": "Semestre 5", "29034567": "Semestre 5",
    "84512036": "Semestre 7", "37890124": "Semestre 7",
    "92034785": "Semestre 7", "10456823": "Semestre 7",
}


def _risk(alerts: int, compliance: float) -> str:
    if compliance < 0.3 or alerts >= 5:
        return "alto"
    if compliance < 0.6 or alerts >= 2:
        return "medio"
    return "bajo"


def _student_summary(
    student: Student,
    sessions: list[StudySession],
    alerts: list[Alert],
    day_from: date,
    day_to: date,
) -> StudentSummary:
    # Días de la semana en el rango [day_from, day_to]
    active_dows = set()
    cur = day_from
    while cur <= day_to:
        active_dows.add(cur.weekday())
        cur += timedelta(days=1)

    filtered = [s for s in sessions if s.day_of_week in active_dows]
    completed = sum(1 for s in filtered if s.status == "completed")
    scheduled = len(filtered)
    compliance = round(completed / scheduled * 100, 1) if scheduled else 0.0
    unread = sum(1 for a in alerts if not a.is_read)

    return StudentSummary(
        id=student.id,
        dni=student.dni,
        name=student.name,
        semester_label=SEMESTER_BY_DNI.get(student.dni, "—"),
        scheduled_sessions=scheduled,
        completed_sessions=completed,
        pending_sessions=scheduled - completed,
        compliance_pct=compliance,
        total_alerts=len(alerts),
        unread_alerts=unread,
        risk_level=_risk(len(alerts), compliance / 100),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/dashboard", response_model=TeacherDashboard)
def teacher_dashboard(
    date_from: Optional[str] = Query(None, description="YYYY-MM-DD"),
    date_to:   Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """Panel del docente: resumen de todos los estudiantes con métricas
    filtradas por fecha o rango de fechas.

    Si no se pasan fechas, se usa la semana actual (lunes → hoy).
    """
    today = date.today()
    if date_from:
        day_from = date.fromisoformat(date_from)
    else:
        day_from = today - timedelta(days=today.weekday())   # lunes de esta semana
    if date_to:
        day_to = date.fromisoformat(date_to)
    else:
        day_to = today

    students   = db.query(Student).all()
    summaries  = []
    all_alerts = db.query(Alert).all()

    for student in students:
        s_sessions = db.query(StudySession).filter(StudySession.student_id == student.id).all()
        s_alerts   = [a for a in all_alerts if a.student_id == student.id]
        summaries.append(_student_summary(student, s_sessions, s_alerts, day_from, day_to))

    avg_comp      = round(sum(s.compliance_pct for s in summaries) / len(summaries), 1) if summaries else 0.0
    high_risk     = sum(1 for s in summaries if s.risk_level == "alto")

    # Actividad diaria en el rango
    daily: list[DayActivity] = []
    cur = day_from
    while cur <= day_to:
        dow = cur.weekday()
        all_sessions_dow = db.query(StudySession).filter(StudySession.day_of_week == dow).all()
        day_alerts        = [a for a in all_alerts if a.created_at.date() == cur]
        daily.append(DayActivity(
            date=cur.isoformat(),
            completed=sum(1 for s in all_sessions_dow if s.status == "completed"),
            pending=sum(1 for s in all_sessions_dow if s.status == "pending"),
            alerts=len(day_alerts),
        ))
        cur += timedelta(days=1)

    # Distribución por curso (todas las sesiones del rango de días)
    active_dows = set()
    cur2 = day_from
    while cur2 <= day_to:
        active_dows.add(cur2.weekday())
        cur2 += timedelta(days=1)

    all_sessions = db.query(StudySession).filter(StudySession.day_of_week.in_(list(active_dows))).all()
    course_map: dict[str, dict] = {}
    for s in all_sessions:
        c = s.course_name
        if c not in course_map:
            course_map[c] = {"total": 0, "completed": 0}
        course_map[c]["total"] += 1
        if s.status == "completed":
            course_map[c]["completed"] += 1

    course_dist = sorted(
        [
            CourseDistribution(
                course_name=c,
                total_sessions=v["total"],
                completed=v["completed"],
                compliance_pct=round(v["completed"] / v["total"] * 100, 1) if v["total"] else 0.0,
            )
            for c, v in course_map.items()
        ],
        key=lambda x: -x.total_sessions,
    )[:12]   # top 12 cursos

    return TeacherDashboard(
        date_from=day_from.isoformat(),
        date_to=day_to.isoformat(),
        total_students=len(students),
        avg_compliance=avg_comp,
        high_risk_count=high_risk,
        students=summaries,
        daily_activity=daily,
        course_distribution=course_dist,
    )
