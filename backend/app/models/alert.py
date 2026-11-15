"""Modelo de Alerta."""
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.database import Base


class Alert(Base):
    """Alerta determinista generada por las reglas del sistema.

    Tipos posibles:
    - ``session_not_started``: la sesión no se inició dentro de los 10 minutos
      posteriores a la hora programada.
    - ``daily_noncompliance``: al finalizar la jornada no se completaron las horas
      objetivo diarias.
    """

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    type = Column(String, nullable=False)  # session_not_started | daily_noncompliance
    message = Column(String, nullable=False)
    related_session_id = Column(Integer, ForeignKey("study_sessions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
