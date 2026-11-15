"""Endpoints del plan de estudio y de iniciar/finalizar sesiones."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Student, StudySession
from app.schemas import FinishSessionRequest, SessionActionResponse, StudySessionResponse
from app.services.alert_service import check_alerts
from app.services.study_service import finish_session, start_session

router = APIRouter(prefix="/api/study-plans", tags=["study-plans"])


@router.get("/{student_id}", response_model=list[StudySessionResponse])
def get_weekly_plan(student_id: int, db: Session = Depends(get_db)):
    """Devuelve el plan de estudio semanal completo del estudiante."""
    if not db.get(Student, student_id):
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return (
        db.query(StudySession)
        .filter(StudySession.student_id == student_id)
        .order_by(StudySession.day_of_week, StudySession.start_time)
        .all()
    )


@router.get("/{student_id}/today", response_model=list[StudySessionResponse])
def get_today_plan(student_id: int, db: Session = Depends(get_db)):
    """Devuelve las sesiones de estudio programadas para hoy."""
    if not db.get(Student, student_id):
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    today = date.today()
    return (
        db.query(StudySession)
        .filter(
            StudySession.student_id == student_id,
            StudySession.day_of_week == today.weekday(),
        )
        .order_by(StudySession.start_time)
        .all()
    )


@router.post("/sessions/{session_id}/start", response_model=SessionActionResponse)
def start(session_id: int, db: Session = Depends(get_db)):
    """Inicia una sesión de estudio ('Iniciar estudio')."""
    session, message = start_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail=message)
    return SessionActionResponse(session=session, message=message)


@router.post("/sessions/{session_id}/finish", response_model=SessionActionResponse)
def finish(
    session_id: int,
    payload: FinishSessionRequest | None = None,
    db: Session = Depends(get_db),
):
    """Finaliza una sesión de estudio ('Finalizar estudio') y registra el tiempo.

    El cuerpo opcional ``{ "note": "..." }`` guarda la nota que el estudiante escribió.
    """
    note = payload.note if payload else None
    session, message = finish_session(db, session_id, note=note)
    if not session:
        raise HTTPException(status_code=404, detail=message)
    # Tras finalizar, se reevalúan las alertas deterministas.
    check_alerts(db, session.student_id)
    return SessionActionResponse(session=session, message=message)
