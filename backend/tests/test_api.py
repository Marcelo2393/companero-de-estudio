"""Pruebas básicas de los endpoints de la API."""


def test_root(client):
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_login_valid_dni(client):
    res = client.post("/api/students/login", json={"dni": "16447495"})
    assert res.status_code == 200
    data = res.json()
    assert data["dni"] == "16447495"
    assert data["name"] == "Ana García"
    assert "id" in data


def test_login_invalid_dni(client):
    res = client.post("/api/students/login", json={"dni": "NOEXISTE"})
    assert res.status_code == 404


def test_login_empty_dni(client):
    res = client.post("/api/students/login", json={"dni": ""})
    assert res.status_code == 422  # validación de Pydantic (min_length=1)


def test_dashboard(client):
    login = client.post("/api/students/login", json={"dni": "16447495"}).json()
    sid = login["id"]
    res = client.get(f"/api/students/{sid}/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert data["student"]["name"] == "Ana García"
    assert "date" in data
    assert "scheduled_hours" in data
    assert "completed_hours" in data
    assert "compliance_percentage" in data
    assert isinstance(data["today_plan"], list)
    assert isinstance(data["pending_alerts"], list)


def test_weekly_plan(client):
    sid = client.post("/api/students/login", json={"dni": "16447495"}).json()["id"]
    res = client.get(f"/api/study-plans/{sid}")
    assert res.status_code == 200
    sessions = res.json()
    assert len(sessions) > 0


def test_weekly_plan_elena(client):
    sid = client.post("/api/students/login", json={"dni": "58934210"}).json()["id"]
    res = client.get(f"/api/study-plans/{sid}")
    assert res.status_code == 200
    assert len(res.json()) > 0


def test_weekly_plan_isabel(client):
    sid = client.post("/api/students/login", json={"dni": "84512036"}).json()["id"]
    res = client.get(f"/api/study-plans/{sid}")
    assert res.status_code == 200
    assert len(res.json()) > 0


def test_students_have_different_courses(client):
    sid1 = client.post("/api/students/login", json={"dni": "16447495"}).json()["id"]
    sid2 = client.post("/api/students/login", json={"dni": "58934210"}).json()["id"]
    sid3 = client.post("/api/students/login", json={"dni": "84512036"}).json()["id"]
    c1 = {s["course_name"] for s in client.get(f"/api/study-plans/{sid1}").json()}
    c2 = {s["course_name"] for s in client.get(f"/api/study-plans/{sid2}").json()}
    c3 = {s["course_name"] for s in client.get(f"/api/study-plans/{sid3}").json()}
    assert c1 != c2
    assert c2 != c3


def test_today_plan(client):
    sid = client.post("/api/students/login", json={"dni": "16447495"}).json()["id"]
    res = client.get(f"/api/study-plans/{sid}/today")
    assert res.status_code == 200
    sessions = res.json()
    # El número de sesiones de hoy depende del día; puede ser 0 o más.
    assert isinstance(sessions, list)


def test_start_and_finish_session(client):
    sid = client.post("/api/students/login", json={"dni": "16447495"}).json()["id"]
    today = client.get(f"/api/study-plans/{sid}/today").json()
    session_id = today[0]["id"]

    start = client.post(f"/api/study-plans/sessions/{session_id}/start")
    assert start.status_code == 200
    assert start.json()["session"]["status"] == "in_progress"

    finish = client.post(
        f"/api/study-plans/sessions/{session_id}/finish", json={"note": "Repasé algoritmos"}
    )
    assert finish.status_code == 200
    finished = finish.json()["session"]
    assert finished["status"] == "completed"
    assert finished["actual_duration_minutes"] == finished["duration_minutes"]
    assert finished["note"] == "Repasé algoritmos"


def test_finish_without_start_fails(client):
    sid = client.post("/api/students/login", json={"dni": "16447495"}).json()["id"]
    today = client.get(f"/api/study-plans/{sid}/today").json()
    session_id = today[0]["id"]
    res = client.post(f"/api/study-plans/sessions/{session_id}/finish")
    # La sesión no fue iniciada -> mensaje, pero no 404; el estado sigue pendiente.
    assert res.status_code == 200
    assert res.json()["session"]["status"] == "pending"


def test_alerts_check_and_list(client):
    sid = client.post("/api/students/login", json={"dni": "16447495"}).json()["id"]
    check = client.post(f"/api/alerts/{sid}/check")
    assert check.status_code == 200
    listing = client.get(f"/api/alerts/{sid}")
    assert listing.status_code == 200
    assert isinstance(listing.json(), list)


def test_mark_alert_as_read(client, engine):
    from sqlalchemy.orm import sessionmaker
    from app.models import Alert

    sid = client.post("/api/students/login", json={"dni": "16447495"}).json()["id"]
    # Forzamos una alerta directamente en la BD de prueba.
    Session = sessionmaker(bind=engine)
    db = Session()
    alert = Alert(student_id=sid, type="session_not_started", message="Test")
    db.add(alert)
    db.commit()
    db.refresh(alert)
    alert_id = alert.id
    db.close()

    res = client.patch(f"/api/alerts/{alert_id}/read")
    assert res.status_code == 200
    assert res.json()["is_read"] is True
