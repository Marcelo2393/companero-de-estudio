"""Esquemas relacionados con las alertas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AlertCreate(BaseModel):
    """Datos necesarios para crear una alerta (uso interno del servicio)."""

    student_id: int
    type: str
    message: str
    related_session_id: Optional[int] = None


class AlertResponse(BaseModel):
    """Alerta serializada."""

    id: int
    student_id: int
    type: str
    message: str
    related_session_id: Optional[int] = None
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True
