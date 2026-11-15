"""Endpoints de estudiantes y dashboard."""
from datetime import date, datetime, time as dtime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert, Student, StudySession
from app.schemas import (
    DashboardResponse,
    StudentLoginRequest,
    StudentResponse,
)
from app.services.alert_service import check_alerts

router = APIRouter(prefix="/api/students", tags=["students"])


def _get_student_or_404(db: Session, student_id: int) -> Student:
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return student


@router.post("/login", response_model=StudentResponse)
def login(payload: StudentLoginRequest, db: Session = Depends(get_db)):
    """Acceso mediante DNI de demostración. NO es autenticación segura."""
    student = db.query(Student).filter(Student.dni == payload.dni.strip()).first()
    if not student:
        raise HTTPException(
            status_code=404,
            detail="DNI no encontrado. Usa un DNI de demostración válido.",
        )
    return student


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    return _get_student_or_404(db, student_id)


@router.get("/{student_id}/dashboard", response_model=DashboardResponse)
def get_dashboard(student_id: int, db: Session = Depends(get_db)):
    student = _get_student_or_404(db, student_id)
    today = date.today()

    sessions_today = (
        db.query(StudySession)
        .filter(
            StudySession.student_id == student_id,
            StudySession.day_of_week == today.weekday(),
        )
        .order_by(StudySession.start_time)
        .all()
    )

    # Se evalúan las alertas deterministas antes de devolver el dashboard.
    check_alerts(db, student_id)

    scheduled_minutes = sum(s.duration_minutes for s in sessions_today)
    scheduled_hours = scheduled_minutes / 60.0
    completed_minutes = sum(
        s.actual_duration_minutes or 0 for s in sessions_today if s.status == "completed"
    )
    completed_hours = completed_minutes / 60.0
    compliance = (
        round((completed_hours / scheduled_hours) * 100, 1) if scheduled_hours > 0 else 0.0
    )

    # Próxima sesión: la siguiente pendiente que no haya empezado, o la primera pendiente.
    now = datetime.now()
    next_session = None
    for s in sessions_today:
        if s.status == "pending":
            hours, minutes = s.start_time.split(":")
            start_dt = datetime.combine(today, dtime(int(hours), int(minutes)))
            if start_dt >= now:
                next_session = s
                break
    if next_session is None:
        for s in sessions_today:
            if s.status == "pending":
                next_session = s
                break

    pending_alerts = (
        db.query(Alert)
        .filter(Alert.student_id == student_id, Alert.is_read == False)
        .order_by(Alert.created_at.desc())
        .all()
    )

    return DashboardResponse(
        student=student,
        date=today.isoformat(),
        scheduled_hours=round(scheduled_hours, 2),
        completed_hours=round(completed_hours, 2),
        compliance_percentage=compliance,
        next_session=next_session,
        today_plan=sessions_today,
        pending_alerts=pending_alerts,
    )
