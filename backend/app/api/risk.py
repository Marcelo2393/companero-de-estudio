"""Endpoints de predicción de riesgo, macroperfiles, simulación y planificación.

Expone el engine de entrega_modelos_semanales a través de la API REST de Kuska.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Student
from app.services.ai_engine import (
    available_externalities,
    build_cpsat_plan,
    get_risk_assessment,
    simulate_student,
)

router = APIRouter(prefix="/api/risk", tags=["risk-ai"])


# ---------------------------------------------------------------------------
# Schemas de request/response
# ---------------------------------------------------------------------------

class SimulationRequest(BaseModel):
    events: Optional[dict[str, str]] = None   # {"3": "laptop_dañada", "6": "trabajo_extra"}
    weeks: int = 9
    base_hours: float = 10.0


class PlanRequest(BaseModel):
    week: Optional[int] = None   # semana del año; si None usa la actual
    capacity_hours: float = 10.0


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/{student_id}", summary="Evaluación de riesgo de abandono")
def risk_assessment(student_id: int, db: Session = Depends(get_db)):
    """Evalúa el riesgo de abandono y los macroperfiles del estudiante usando
    la lógica del engine de entrega_modelos_semanales.

    Devuelve: nivel de riesgo, macroperfiles activos (barreras), intervenciones
    recomendadas, roles de apoyo y métricas de trayectoria.
    """
    if not db.get(Student, student_id):
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    return get_risk_assessment(db, student_id)


@router.post("/simulate", summary="Simulación semanal con externalidades")
def simulation(payload: SimulationRequest):
    """Recorre N semanas con externalidades opcionales (sin datos reales).

    Devuelve el recorrido semanal: macroperfiles activos, horas disponibles,
    riesgo acumulado, alertas, intervenciones y acción del planificador.

    Externalidades disponibles: laptop_dañada, sin_conectividad, trabajo_extra,
    cuidado_familiar, enfermedad, problema_transporte, examen_no_previsto.
    """
    # Convertir claves str a int (JSON solo admite str como claves de objeto)
    events_int: dict[int, str] | None = None
    if payload.events:
        try:
            events_int = {int(k): v for k, v in payload.events.items()}
        except ValueError:
            raise HTTPException(status_code=422, detail="Las semanas deben ser números enteros")
    return simulate_student(events=events_int, weeks=payload.weeks, base_hours=payload.base_hours)


@router.post("/{student_id}/plan", summary="Plan semanal CP-SAT")
def cpsat_plan_endpoint(student_id: int, payload: PlanRequest, db: Session = Depends(get_db)):
    """Genera un plan semanal óptimo usando el solver CP-SAT del engine.

    Distribuye las horas de cada curso en la semana respetando límites diarios
    (máx. 4h de estudio autónomo/día) y prioridades por carga horaria.
    """
    if not db.get(Student, student_id):
        raise HTTPException(status_code=404, detail="Estudiante no encontrado")
    week = payload.week or (date.today() - date(date.today().year, 1, 1)).days // 7
    result = build_cpsat_plan(db, student_id, week=week, capacity_hours=payload.capacity_hours)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/externalities/list", summary="Externalidades disponibles para simulación")
def list_externalities():
    """Lista las externalidades disponibles para usar en la simulación."""
    return available_externalities()
