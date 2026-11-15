"""Pruebas de la lógica de alertas determinista."""
from datetime import datetime

from app.models import Alert, Student, StudySession
from app.services.alert_service import (
    DAILY_NONCOMPLIANCE,
    SESSION_NOT_STARTED,
    check_alerts,
)

# Viernes 30 de octubre de 2026.
REF_DATE = datetime(2026, 10, 30)
WEEKDAY = REF_DATE.weekday()


def _make_student(db, target=3.0):
    student = Student(
        dni="00000000X",
        name="Test Estudiante",
        email="test@demo.com",
        target_hours_daily=target,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def _make_session(db, student_id, course, start, end, dow=WEEKDAY, status="pending"):
    duration = 60
    db.add(
        StudySession(
            student_id=student_id,
            course_name=course,
            day_of_week=dow,
            start_time=start,
            end_time=end,
            duration_minutes=duration,
            status=status,
        )
    )
    db.commit()


def test_alert_session_not_started_fires_after_grace(db_session):
    student = _make_student(db_session)
    _make_session(db_session, student.id, "Matemáticas", "08:00", "09:00")

    # 08:15 supera los 10 minutos de gracia sobre las 08:00.
    created = check_alerts(db_session, student.id, ref_time=REF_DATE.replace(hour=8, minute=15))
    assert len(created) == 1
    assert created[0].type == SESSION_NOT_STARTED
    assert "Matemáticas" in created[0].message


def test_alert_session_not_started_within_grace_does_not_fire(db_session):
    student = _make_student(db_session)
    _make_session(db_session, student.id, "Matemáticas", "08:00", "09:00")

    # 08:05 está dentro de los 10 minutos de gracia: sin alerta.
    created = check_alerts(db_session, student.id, ref_time=REF_DATE.replace(hour=8, minute=5))
    assert created == []


def test_alert_session_not_started_no_duplicate(db_session):
    student = _make_student(db_session)
    _make_session(db_session, student.id, "Matemáticas", "08:00", "09:00")

    check_alerts(db_session, student.id, ref_time=REF_DATE.replace(hour=9, minute=0))
    created_again = check_alerts(db_session, student.id, ref_time=REF_DATE.replace(hour=10, minute=0))
    assert created_again == []
    total = db_session.query(Alert).filter(
        Alert.type == SESSION_NOT_STARTED,
        Alert.student_id == student.id,
    ).count()
    assert total == 1


def test_alert_daily_noncompliance_fires_when_day_over(db_session):
    student = _make_student(db_session, target=3.0)
    # Sesiones 08:00-12:00 (todas en el pasado respecto a las 12:30).
    for i, (start, end) in enumerate(
        [("08:00", "09:00"), ("09:00", "10:00"), ("10:00", "11:00"), ("11:00", "12:00")]
    ):
        _make_session(db_session, student.id, f"C{i}", start, end)
    # Ninguna completada: 0h < 3h objetivo.
    created = check_alerts(db_session, student.id, ref_time=REF_DATE.replace(hour=12, minute=30))
    types = [a.type for a in created]
    assert DAILY_NONCOMPLIANCE in types


def test_alert_daily_noncompliance_no_duplicate(db_session):
    student = _make_student(db_session, target=3.0)
    for i, (start, end) in enumerate(
        [("08:00", "09:00"), ("09:00", "10:00"), ("10:00", "11:00"), ("11:00", "12:00")]
    ):
        _make_session(db_session, student.id, f"C{i}", start, end)
    check_alerts(db_session, student.id, ref_time=REF_DATE.replace(hour=12, minute=30))
    again = check_alerts(db_session, student.id, ref_time=REF_DATE.replace(hour=13, minute=0))
    assert all(a.type != DAILY_NONCOMPLIANCE for a in again)
    total = db_session.query(Alert).filter(
        Alert.type == DAILY_NONCOMPLIANCE,
        Alert.student_id == student.id,
    ).count()
    assert total == 1


def test_alert_daily_noncompliance_not_fired_if_future_session(db_session):
    student = _make_student(db_session, target=3.0)
    # ref_time 10:30: queda la sesión de las 11:00 en el futuro.
    for i, (start, end) in enumerate(
        [("08:00", "09:00"), ("09:00", "10:00"), ("10:00", "11:00"), ("11:00", "12:00")]
    ):
        _make_session(db_session, student.id, f"C{i}", start, end)
    created = check_alerts(db_session, student.id, ref_time=REF_DATE.replace(hour=10, minute=30))
    assert all(a.type != DAILY_NONCOMPLIANCE for a in created)


def test_alert_daily_not_fired_when_target_met(db_session):
    student = _make_student(db_session, target=1.0)
    for i, (start, end) in enumerate(
        [("08:00", "09:00"), ("09:00", "10:00"), ("10:00", "11:00"), ("11:00", "12:00")]
    ):
        _make_session(db_session, student.id, f"C{i}", start, end, status="completed",
                      )
    # Marcar completadas con duración >= objetivo (1h).
    db_session.query(StudySession).update({StudySession.actual_duration_minutes: 60})
    db_session.commit()
    created = check_alerts(db_session, student.id, ref_time=REF_DATE.replace(hour=12, minute=30))
    assert all(a.type != DAILY_NONCOMPLIANCE for a in created)
