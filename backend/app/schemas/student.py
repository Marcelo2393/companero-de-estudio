"""Esquemas relacionados con el estudiante y el dashboard."""
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.alert import AlertResponse
from app.schemas.study_session import StudySessionResponse


class StudentLoginRequest(BaseModel):
    """Solicitud de acceso mediante DNI (solo demostración)."""

    dni: str = Field(..., min_length=1, description="DNI del estudiante de demostración")


class StudentResponse(BaseModel):
    """Perfil público del estudiante."""

    id: int
    dni: str
    name: str
    email: Optional[str] = None
    target_hours_daily: float

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    """Datos agregados que el dashboard muestra al estudiante."""

    student: StudentResponse
    date: str
    scheduled_hours: float
    completed_hours: float
    compliance_percentage: float
    next_session: Optional[StudySessionResponse] = None
    today_plan: list[StudySessionResponse]
    pending_alerts: list[AlertResponse]
