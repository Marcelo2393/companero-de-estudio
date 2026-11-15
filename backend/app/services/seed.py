"""Datos de demostración — 12 estudiantes de Ciencias de la Computación.

Cuatro estudiantes por cada semestre (3°, 5°, 7°) con mallas únicas y
actividad semanal variada, de modo que el dashboard, las alertas y el
widget de riesgo muestren situaciones distintas al evaluar el demo.

Los DNI son de 8 dígitos (formato peruano) y no corresponden a personas reales.
"""
from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models import Alert, Student, StudySession

# ---------------------------------------------------------------------------
# Definición de estudiantes
# ---------------------------------------------------------------------------
DEMO_STUDENTS: list[dict] = [
    # ── Semestre 3 ────────────────────────────────────────────────────────
    {"dni": "16447495", "name": "Ana García",      "email": "ana@demo.com",      "target_hours_daily": 3.0},
    {"dni": "72345678", "name": "Bruno López",     "email": "bruno@demo.com",    "target_hours_daily": 3.0},
    {"dni": "30567890", "name": "Carla Ruiz",      "email": "carla@demo.com",    "target_hours_daily": 3.0},
    {"dni": "45123789", "name": "Diego Morales",   "email": "diego@demo.com",    "target_hours_daily": 2.5},
    # ── Semestre 5 ────────────────────────────────────────────────────────
    {"dni": "58934210", "name": "Elena Vargas",    "email": "elena@demo.com",    "target_hours_daily": 3.5},
    {"dni": "63210987", "name": "Favio Quispe",    "email": "favio@demo.com",    "target_hours_daily": 3.5},
    {"dni": "71890234", "name": "Gabriela Soto",   "email": "gabi@demo.com",     "target_hours_daily": 3.5},
    {"dni": "29034567", "name": "Hugo Mendoza",    "email": "hugo@demo.com",     "target_hours_daily": 3.0},
    # ── Semestre 7 ────────────────────────────────────────────────────────
    {"dni": "84512036", "name": "Isabel Flores",   "email": "isabel@demo.com",   "target_hours_daily": 4.0},
    {"dni": "37890124", "name": "Javier Castillo", "email": "javier@demo.com",   "target_hours_daily": 4.0},
    {"dni": "92034785", "name": "Karen Paredes",   "email": "karen@demo.com",    "target_hours_daily": 4.0},
    {"dni": "10456823", "name": "Luis Aguilar",    "email": "luis@demo.com",     "target_hours_daily": 3.5},
]

# ---------------------------------------------------------------------------
# Mallas curriculares
# Formato: (curso, día_semana 0=Lun…6=Dom, hora_inicio, hora_fin)
# Cada malla tiene huecos distintos para reflejar la variedad de horarios
# universitarios reales.
# ---------------------------------------------------------------------------

# ── Semestre 3 ──────────────────────────────────────────────────────────────

# Ana — cumplimiento alto (estudiante modelo)
S_ANA = [
    ("Cálculo I",              0, "07:00", "09:00"),
    ("Programación I",         0, "10:00", "12:00"),
    ("Álgebra Lineal",         1, "08:00", "10:00"),
    ("Física I",               1, "11:30", "13:00"),
    ("Cálculo I",              2, "07:00", "09:00"),
    ("Programación I (lab)",   2, "09:30", "11:30"),
    ("Álgebra Lineal",         3, "08:00", "10:00"),
    ("Física I (lab)",         3, "12:00", "14:00"),
    ("Inglés I",               4, "10:00", "12:00"),
    ("Tutoría Matemáticas",    5, "09:00", "11:00"),
]

# Bruno — cumplimiento medio, algunas sesiones perdidas
S_BRUNO = [
    ("Cálculo I",              0, "08:00", "10:00"),
    ("Introducción CS",        0, "11:00", "13:00"),
    ("Álgebra Lineal",         1, "07:00", "09:00"),
    ("Lógica Matemática",      1, "10:00", "12:00"),
    ("Cálculo I",              2, "08:00", "10:00"),
    ("Introducción CS (lab)",  2, "14:00", "16:00"),
    ("Lógica Matemática",      3, "09:00", "11:00"),
    ("Álgebra Lineal",         4, "08:00", "10:00"),
    ("Inglés I",               4, "11:30", "13:00"),
    ("Repaso Lógica",          5, "10:00", "12:00"),
]

# Carla — horario tarde, trabaja por las mañanas
S_CARLA = [
    ("Cálculo I",              0, "14:00", "16:00"),
    ("Programación I",         0, "16:30", "18:00"),
    ("Álgebra Lineal",         1, "13:00", "15:00"),
    ("Estructuras Discretas",  1, "15:30", "17:00"),
    ("Cálculo I",              2, "14:00", "16:00"),
    ("Programación I (lab)",   2, "16:30", "18:30"),
    ("Estructuras Discretas",  3, "13:00", "15:00"),
    ("Álgebra Lineal",         4, "14:00", "16:00"),
    ("Inglés I",               4, "16:30", "18:00"),
]

# Diego — pocas horas disponibles, riesgo medio
S_DIEGO = [
    ("Cálculo I",              0, "07:00", "09:00"),
    ("Programación I",         1, "08:00", "10:00"),
    ("Álgebra Lineal",         2, "07:00", "09:00"),
    ("Física I",               2, "10:00", "12:00"),
    ("Programación I (lab)",   3, "09:00", "11:00"),
    ("Cálculo I",              4, "08:00", "10:00"),
    ("Inglés I",               5, "10:00", "12:00"),
]

# ── Semestre 5 ──────────────────────────────────────────────────────────────

# Elena — sin barreras, cumplimiento excelente
S_ELENA = [
    ("Sistemas Operativos",    0, "07:00", "09:00"),
    ("IA Fundamentos",         0, "10:00", "12:00"),
    ("Redes I",                1, "08:00", "10:00"),
    ("Bases de Datos II",      1, "11:30", "13:30"),
    ("Sistemas Operativos",    2, "07:00", "09:00"),
    ("IA Fundamentos (lab)",   2, "09:30", "11:30"),
    ("Redes I",                3, "08:00", "10:00"),
    ("Bases de Datos II",      3, "11:00", "13:00"),
    ("Inglés Técnico II",      4, "10:00", "12:00"),
    ("Seminario IA",           5, "09:00", "11:00"),
]

# Favio — barrera de tiempo (trabaja part-time)
S_FAVIO = [
    ("Cálculo Numérico",       0, "07:00", "09:00"),
    ("Compiladores",           0, "10:00", "12:00"),
    ("Sistemas Operativos",    1, "08:00", "10:00"),
    # hueco largo (trabajo 12-18)
    ("Compiladores (lab)",     1, "18:30", "20:00"),
    ("Cálculo Numérico",       2, "07:00", "09:00"),
    ("Sistemas Operativos",    3, "08:00", "10:00"),
    ("Compiladores",           4, "07:00", "09:00"),
    ("Tutoría OS",             5, "10:00", "12:00"),
]

# Gabriela — barrera de integración/motivación
S_GABRIELA = [
    ("Arquitectura SW",        0, "09:00", "11:00"),
    ("Seguridad Informática",  0, "13:00", "15:00"),
    ("Arquitectura SW",        1, "09:00", "11:00"),
    ("Teoría de Grafos",       2, "08:00", "10:00"),
    ("Seguridad Informática",  2, "11:00", "13:00"),
    ("Teoría de Grafos",       3, "08:00", "10:00"),
    ("Arquitectura SW (lab)",  3, "11:30", "13:30"),
    ("Inglés Técnico II",      4, "10:00", "12:00"),
]

# Hugo — buen ritmo, horario equilibrado
S_HUGO = [
    ("Diseño de Algoritmos",   0, "08:00", "10:00"),
    ("Probabilidad",           0, "11:00", "13:00"),
    ("Paradigmas Program.",    1, "07:00", "09:00"),
    ("Diseño de Algoritmos",   1, "10:00", "12:00"),
    ("Probabilidad",           2, "08:00", "10:00"),
    ("Paradigmas Program.",    2, "11:30", "13:30"),
    ("Diseño de Algoritmos",   3, "08:00", "10:00"),
    ("Probabilidad",           3, "11:00", "13:00"),
    ("Inglés Técnico II",      4, "09:00", "11:00"),
    ("Repaso Algoritmos",      5, "10:00", "12:00"),
]

# ── Semestre 7 ──────────────────────────────────────────────────────────────

# Isabel — tesis avanzada, riesgo bajo
S_ISABEL = [
    ("Aprendizaje Automático", 0, "07:00", "09:30"),
    ("Procesamiento Lenguaje", 0, "13:00", "15:00"),
    ("Cloud Computing",        1, "08:00", "10:00"),
    ("Tesis II (asesoría)",    1, "11:30", "13:00"),
    ("Aprendizaje Automático", 2, "07:00", "09:30"),
    ("Inglés Avanzado",        2, "10:00", "12:00"),
    ("ML (lab)",               2, "14:30", "17:00"),
    ("Cloud Computing",        3, "08:00", "10:00"),
    ("Tesis II (escritura)",   3, "14:00", "16:00"),
    ("Inglés Avanzado",        4, "09:00", "11:00"),
    ("Tesis II (invest.)",     5, "09:00", "12:00"),
]

# Javier — riesgo alto, muchas alertas acumuladas
S_JAVIER = [
    ("Sistemas Distribuidos",  0, "08:00", "10:00"),
    ("Seguridad Avanzada",     0, "12:00", "14:00"),
    ("Ingeniería de SW",       1, "09:00", "11:00"),
    ("Sistemas Distribuidos",  2, "08:00", "10:00"),
    ("Tesis II (asesoría)",    2, "11:00", "12:30"),
    ("Seguridad Avanzada",     3, "08:00", "10:00"),
    ("Ingeniería de SW",       4, "09:00", "11:00"),
    ("Tesis II (escritura)",   4, "13:00", "15:00"),
]

# Karen — horario muy cargado, barrera académica
S_KAREN = [
    ("Compiladores II",        0, "07:00", "09:30"),
    ("Redes Avanzadas",        0, "10:00", "12:00"),
    ("Minería de Datos",       1, "08:00", "10:00"),
    ("Compiladores II",        1, "11:00", "13:30"),
    ("Redes Avanzadas",        2, "10:00", "12:00"),
    ("Minería de Datos",       2, "13:00", "15:00"),
    ("Compiladores II (lab)",  3, "09:00", "11:30"),
    ("Tesis II (asesoría)",    3, "13:00", "14:30"),
    ("Minería de Datos",       4, "08:00", "10:00"),
    ("Inglés Avanzado",        4, "11:00", "13:00"),
    ("Repaso Compiladores",    5, "09:00", "11:00"),
]

# Luis — última recta, equilibrado
S_LUIS = [
    ("Visión por Computador",  0, "09:00", "11:00"),
    ("Ética en Tecnología",    0, "13:00", "14:30"),
    ("Tesis II (escritura)",   1, "09:00", "12:00"),
    ("Visión por Computador",  2, "09:00", "11:00"),
    ("Robótica Intro",         2, "13:00", "15:00"),
    ("Ética en Tecnología",    3, "10:00", "11:30"),
    ("Robótica Intro (lab)",   3, "13:00", "15:00"),
    ("Tesis II (invest.)",     4, "10:00", "13:00"),
    ("Inglés Avanzado",        5, "09:00", "11:00"),
]

# Mapa DNI → sesiones
SESSIONS_BY_DNI: dict[str, list[tuple[str, int, str, str]]] = {
    "16447495": S_ANA,
    "72345678": S_BRUNO,
    "30567890": S_CARLA,
    "45123789": S_DIEGO,
    "58934210": S_ELENA,
    "63210987": S_FAVIO,
    "71890234": S_GABRIELA,
    "29034567": S_HUGO,
    "84512036": S_ISABEL,
    "37890124": S_JAVIER,
    "92034785": S_KAREN,
    "10456823": S_LUIS,
}

# Actividad simulada: qué sesiones ya se completaron (índices 0-based por día_semana)
# Formato: dni -> lista de índices de sesión que ya fueron completadas
COMPLETED_BY_DNI: dict[str, list[int]] = {
    "16447495": [0, 1, 2, 3, 4, 5, 6, 7],   # Ana: muy activa
    "72345678": [0, 2, 4, 6],                # Bruno: cumplimiento medio
    "30567890": [0, 1, 2],                   # Carla: horario tarde, pocas completadas
    "45123789": [0],                         # Diego: riesgo medio
    "58934210": [0, 1, 2, 3, 4, 5, 6, 7, 8],# Elena: excelente
    "63210987": [0, 1],                      # Favio: trabaja, poco tiempo
    "71890234": [0, 2],                      # Gabriela: motivación baja
    "29034567": [0, 1, 2, 3, 4, 5],         # Hugo: buen ritmo
    "84512036": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],  # Isabel: tesis avanzada
    "37890124": [],                          # Javier: en riesgo alto
    "92034785": [0, 1, 2, 3],               # Karen: barrera académica
    "10456823": [0, 1, 2, 3, 4, 5, 6],     # Luis: equilibrado
}


def _duration(start: str, end: str) -> int:
    sh, sm = map(int, start.split(":"))
    eh, em = map(int, end.split(":"))
    return (eh * 60 + em) - (sh * 60 + sm)


def seed_demo_data(db: Session) -> None:
    """Crea los 12 estudiantes y sus planes de estudio (idempotente)."""
    for stu_data in DEMO_STUDENTS:
        if db.query(Student).filter(Student.dni == stu_data["dni"]).first():
            continue

        student = Student(**stu_data)
        db.add(student)
        db.flush()

        session_list = SESSIONS_BY_DNI.get(stu_data["dni"], [])
        completed_indices = set(COMPLETED_BY_DNI.get(stu_data["dni"], []))

        for idx, (course_name, day_of_week, start_time, end_time) in enumerate(session_list):
            dur = _duration(start_time, end_time)
            is_completed = idx in completed_indices
            db.add(
                StudySession(
                    student_id=student.id,
                    course_name=course_name,
                    day_of_week=day_of_week,
                    start_time=start_time,
                    end_time=end_time,
                    duration_minutes=dur,
                    status="completed" if is_completed else "pending",
                    actual_duration_minutes=dur if is_completed else None,
                )
            )

        # Alertas pre-existentes para estudiantes con problemas
        if stu_data["dni"] == "37890124":   # Javier — riesgo alto
            for i in range(4):
                db.add(Alert(
                    student_id=student.id,
                    type="session_not_started",
                    message=f"No iniciaste una sesión programada (alerta {i+1}).",
                ))
            db.add(Alert(
                student_id=student.id,
                type="daily_noncompliance",
                message="No completaste las horas objetivo diarias: 0.0h de 3.5h.",
            ))

        if stu_data["dni"] == "63210987":   # Favio — tiempo
            db.add(Alert(
                student_id=student.id,
                type="daily_noncompliance",
                message="No completaste las horas objetivo diarias: 1.0h de 3.5h.",
            ))

        if stu_data["dni"] == "71890234":   # Gabriela — motivación
            db.add(Alert(
                student_id=student.id,
                type="session_not_started",
                message="No iniciaste la sesión de Seguridad Informática.",
            ))
            db.add(Alert(
                student_id=student.id,
                type="daily_noncompliance",
                message="No completaste las horas objetivo diarias: 0.5h de 3.5h.",
            ))

    db.commit()
