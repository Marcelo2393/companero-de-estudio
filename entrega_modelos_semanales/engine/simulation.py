"""Simulación semanal rápida con externalidades estructuradas.

No usa NLP ni datasets: cada evento es una opción cerrada y la salida sirve
para demo, QA y explicación del flujo de alertas y apoyos.
"""
from __future__ import annotations

from copy import deepcopy

EXTERNALITIES = {
    "laptop_dañada": ("material_digital", 6.0, ["soporte_ti", "bibliotecario"]),
    "sin_conectividad": ("material_digital", 4.0, ["soporte_ti", "bienestar"]),
    "trabajo_extra": ("time", 5.0, ["trabajador_social", "tutor_academico"]),
    "cuidado_familiar": ("time", 4.0, ["trabajador_social", "mentor_pares"]),
    "enfermedad": ("integration_motivation", 4.0, ["orientador", "bienestar"]),
    "problema_transporte": ("time", 3.0, ["bienestar", "mentor_pares"]),
    "examen_no_previsto": ("academic", 3.0, ["tutor_academico", "coordinador_carrera"]),
}
INTERVENTIONS = {
    "academic": "refuerzo por competencias y tutoría",
    "time": "reorganización del calendario y recuperación gradual",
    "material_digital": "recursos offline, préstamo y soporte TI",
    "integration_motivation": "orientación y acompañamiento humano",
}


def simulate(events: dict[int, str] | None = None, weeks: int = 9,
             base_hours: float = 10.0) -> list[dict]:
    """Devuelve un recorrido semanal explicable.

    events usa semana 1-based y una opción de EXTERNALITIES.
    """
    events = events or {}
    rows = []
    pending_recovery = 0.0
    active = set()
    for week in range(1, weeks + 1):
        event = events.get(week)
        if event is not None and event not in EXTERNALITIES:
            raise ValueError(f"externalidad no soportada: {event}")
        barrier, lost, roles = EXTERNALITIES[event] if event else (None, 0.0, [])
        if barrier:
            active.add(barrier)
        recovery = min(pending_recovery, 1.0)
        pending_recovery = max(0.0, pending_recovery - recovery)
        available = max(0.0, base_hours - lost + recovery)
        if lost:
            pending_recovery += lost * 0.25
        risk = min(0.99, max(0.05, (base_hours - available) / base_hours + len(active) * 0.08))
        rows.append({
            "week": week,
            "externality": event,
            "macroprofiles": sorted(active) or ["stable"],
            "available_hours": round(available, 1),
            "lost_hours": lost,
            "recovery_hours": round(recovery, 1),
            "alert": bool(event or risk >= 0.35),
            "risk": round(risk, 3),
            "interventions": [INTERVENTIONS[b] for b in sorted(active)],
            "support_roles": sorted(set(roles)),
            "plan_action": "reacomodar horario con CP-SAT" if event else "mantener y revisar plan",
        })
    return rows

