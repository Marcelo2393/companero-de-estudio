"""Lógica de sesiones de estudio: iniciar y finalizar, registrando el tiempo.

En el MVP, al finalizar una sesión se registra como tiempo estudiado la duración
planificada (el bloque de estudio completado). Esto mantiene el dashboard y el
cálculo de cumplimiento coherentes para la demostración.
"""
from datetime import datetime

from sqlalchemy.orm import Session

from app.models import StudySession


def start_session(db: Session, session_id: int) -> tuple[StudySession | None, str]:
    """Inicia una sesión pendiente: pasa a ``in_progress`` y registra ``started_at``."""
    session = db.get(StudySession, session_id)
    if not session:
        return None, "Sesión no encontrada"
    if session.status == "completed":
        return session, "La sesión ya fue finalizada"
    if session.status == "in_progress":
        return session, "La sesión ya está en curso"
    session.status = "in_progress"
    session.started_at = datetime.now()
    db.commit()
    db.refresh(session)
    return session, "Sesión iniciada correctamente"


def finish_session(
    db: Session, session_id: int, note: str | None = None
) -> tuple[StudySession | None, str]:
    """Finaliza una sesión en curso: pasa a ``completed`` y registra el tiempo estudiado.

    Opcionalmente guarda la nota que el estudiante escribió (máx. 280 caracteres).
    """
    session = db.get(StudySession, session_id)
    if not session:
        return None, "Sesión no encontrada"
    if session.status == "pending":
        return session, "La sesión no fue iniciada"
    if session.status == "completed":
        return session, "La sesión ya fue finalizada"
    now = datetime.now()
    session.status = "completed"
    session.finished_at = now
    # Se registra la duración planificada como tiempo estudiado (bloque completado).
    session.actual_duration_minutes = session.duration_minutes
    if note is not None:
        session.note = note.strip()[:280] or None
    db.commit()
    db.refresh(session)
    return session, "Sesión finalizada. Tiempo de estudio registrado."
