"""Lógica de alertas determinista.

Implementa dos reglas sin modelos predictivos:

1. ``session_not_started``: si el estudiante no inicia una sesión dentro de los
   10 minutos posteriores a la hora programada, se genera una alerta.

2. ``daily_noncompliance``: si al finalizar la jornada de estudio (cuando ya no
   quedan sesiones programadas para hoy) las horas completadas son inferiores al
   objetivo diario, se genera una alerta.

Las alertas se persisten en SQLite y se evitan duplicados comprobando si ya
existe una alerta equivalente (mismo tipo, estudiante y, en su caso, sesión).
"""
from datetime import date, datetime, time as dtime, timedelta

from sqlalchemy.orm import Session

from app.models import Alert, Student, StudySession

SESSION_NOT_STARTED = "session_not_started"
DAILY_NONCOMPLIANCE = "daily_noncompliance"
GRACE_MINUTES = 10


def _parse_hm(value: str) -> dtime:
    hours, minutes = value.split(":")
    return dtime(int(hours), int(minutes))


def _session_start_dt(session: StudySession, ref_date: date) -> datetime:
    return datetime.combine(ref_date, _parse_hm(session.start_time))


def _session_end_dt(session: StudySession, ref_date: date) -> datetime:
    return datetime.combine(ref_date, _parse_hm(session.end_time))


def _start_of_day(ref_date: date) -> datetime:
    return datetime.combine(ref_date, dtime.min)


def check_alerts(db: Session, student_id: int, ref_time: datetime | None = None) -> list[Alert]:
    """Evalúa las reglas deterministas y crea alertas nuevas sin duplicar.

    Devuelve la lista de alertas creadas en esta evaluación.
    """
    ref_time = ref_time or datetime.now()
    today = ref_time.date()
    created: list[Alert] = []

    student = db.get(Student, student_id)
    if not student:
        return []

    sessions_today = (
        db.query(StudySession)
        .filter(
            StudySession.student_id == student_id,
            StudySession.day_of_week == today.weekday(),
        )
        .order_by(StudySession.start_time)
        .all()
    )
    if not sessions_today:
        return []

    # --- Alerta 1: sesión no iniciada ---
    for session in sessions_today:
        if session.status != "pending":
            continue
        start_dt = _session_start_dt(session, today)
        if ref_time < start_dt + timedelta(minutes=GRACE_MINUTES):
            continue  # todavía dentro de los 10 minutos de gracia
        duplicate = (
            db.query(Alert)
            .filter(
                Alert.student_id == student_id,
                Alert.type == SESSION_NOT_STARTED,
                Alert.related_session_id == session.id,
            )
            .first()
        )
        if duplicate:
            continue
        alert = Alert(
            student_id=student_id,
            type=SESSION_NOT_STARTED,
            message=(
                f"No iniciaste la sesión de {session.course_name} programada "
                f"a las {session.start_time}."
            ),
            related_session_id=session.id,
        )
        db.add(alert)
        created.append(alert)

    # --- Alerta 2: incumplimiento diario ---
    # La jornada de estudio finaliza cuando ya han terminado todas las sesiones
    # programadas (hora actual >= fin de la última sesión del día).
    last_end_dt = max(_session_end_dt(s, today) for s in sessions_today)
    day_started = _session_start_dt(sessions_today[0], today) <= ref_time
    day_over = ref_time >= last_end_dt
    if day_started and day_over:
        completed_minutes = sum(s.actual_duration_minutes or 0 for s in sessions_today)
        completed_hours = completed_minutes / 60.0
        if completed_hours < student.target_hours_daily:
            duplicate = (
                db.query(Alert)
                .filter(
                    Alert.student_id == student_id,
                    Alert.type == DAILY_NONCOMPLIANCE,
                    Alert.created_at >= _start_of_day(today),
                )
                .first()
            )
            if not duplicate:
                alert = Alert(
                    student_id=student_id,
                    type=DAILY_NONCOMPLIANCE,
                    message=(
                        f"No completaste las horas objetivo diarias: "
                        f"{completed_hours:.1f}h de "
                        f"{student.target_hours_daily:.1f}h."
                    ),
                )
                db.add(alert)
                created.append(alert)

    if created:
        db.commit()
        for alert in created:
            db.refresh(alert)
    return created
