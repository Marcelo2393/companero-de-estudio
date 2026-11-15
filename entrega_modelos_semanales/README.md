# Entrega de modelos semanales

Paquete sin datos sintéticos. El planificador trabaja por semana y puede reacomodar el horario ante cambios de disponibilidad, externalidades o sesiones fijadas.

## Contenido

- \`models/\`: cuatro modelos serializados y su manifiesto.
- \`engine/models.py\`: carga y predicción de macroperfiles y riesgo.
- \`engine/schedule.py\`: planificación semanal greedy y CP-SAT.
- \`engine/features.py\`, \`profiles.py\`, \`risk.py\`, \`data.py\`: dependencias del motor.
- \`docs/manual-modelos.html\`: manual completo con inputs, perfiles, apoyos y replanificación.

## Instalación

Copiar esta carpeta dentro del proyecto Becario existente y ejecutar:

    uv run python -m engine.models predict b-00004 --week 6

Los modelos esperan las fuentes operacionales configuradas por el proyecto principal. No se incluyen \`data/synthetic/\`, \`synth/\` ni datasets de prueba.

## Plan semanal

El planificador recibe los objetivos y ocupaciones de la semana:

    from engine.schedule import cpsat_plan

    plan = cpsat_plan(
        week=4,
        targets=targets_actualizados,
        busy=bloques_ocupados,
        capacity_hours=horas_disponibles,
        previous=plan_anterior.sessions,
        pinned=sesiones_fijadas,
    )

\`previous\` permite conservar el horario anterior y \`pinned\` protege sesiones que no deben moverse. El resultado incluye sesiones, cambios y \`shortfall\`.

