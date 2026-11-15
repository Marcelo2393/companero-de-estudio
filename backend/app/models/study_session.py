"""Modelo de Sesión de Estudio."""
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class StudySession(Base):
    """Sesión de estudio programada dentro del plan semanal del estudiante.

    El estado puede ser: ``pending`` (pendiente), ``in_progress`` (en curso) o
    ``completed`` (finalizada).
    """

    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    course_name = Column(String, nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Lunes ... 6=Domingo
    start_time = Column(String, nullable=False)  # formato "HH:MM"
    end_time = Column(String, nullable=False)  # formato "HH:MM"
    duration_minutes = Column(Integer, nullable=False)
    status = Column(String, default="pending", nullable=False)  # pending|in_progress|completed
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    actual_duration_minutes = Column(Integer, nullable=True)
    note = Column(String, nullable=True)  # nota que el estudiante escribe al finalizar
