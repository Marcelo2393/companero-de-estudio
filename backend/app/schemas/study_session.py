"""Esquemas relacionados con las sesiones de estudio."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class StudySessionResponse(BaseModel):
    """Sesión de estudio serializada."""

    id: int
    student_id: int
    course_name: str
    day_of_week: int
    start_time: str
    end_time: str
    duration_minutes: int
    status: str
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    actual_duration_minutes: Optional[int] = None
    note: Optional[str] = None

    class Config:
        from_attributes = True


class SessionActionResponse(BaseModel):
    """Respuesta tras iniciar o finalizar una sesión."""

    session: StudySessionResponse
    message: str


class FinishSessionRequest(BaseModel):
    """Cuerpo opcional al finalizar una sesión: la nota que el estudiante escribió."""

    note: Optional[str] = None
