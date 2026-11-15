"""Endpoints del sistema de alertas."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert
from app.schemas import AlertResponse
from app.services.alert_service import check_alerts

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/{student_id}", response_model=list[AlertResponse])
def get_alerts(student_id: int, db: Session = Depends(get_db)):
    """Devuelve todas las alertas del estudiante (más recientes primero)."""
    return (
        db.query(Alert)
        .filter(Alert.student_id == student_id)
        .order_by(Alert.created_at.desc())
        .all()
    )


@router.post("/{student_id}/check", response_model=list[AlertResponse])
def check(student_id: int, db: Session = Depends(get_db)):
    """Evalúa las reglas deterministas y devuelve las alertas creadas en esta revisión."""
    return check_alerts(db, student_id)


@router.patch("/{alert_id}/read", response_model=AlertResponse)
def mark_as_read(alert_id: int, db: Session = Depends(get_db)):
    """Marca una alerta como leída."""
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert
