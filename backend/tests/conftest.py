"""Fixtures compartidas para las pruebas.

Usa una base de datos SQLite en memoria compartida (StaticPool) para que todas
las sesiones vean los mismos datos durante la prueba.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.services.seed import seed_demo_data


@pytest.fixture()
def engine():
    eng = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)


@pytest.fixture()
def db_session(engine):
    Session = sessionmaker(bind=engine)
    session = Session()
    seed_demo_data(session)
    yield session
    session.close()


@pytest.fixture()
def client(engine):
    Session = sessionmaker(bind=engine)
    # Seed inicial para las sesiones que usará el cliente.
    seed_session = Session()
    seed_demo_data(seed_session)
    seed_session.close()

    def override_get_db():
        session = Session()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    # Sin `with`: evita ejecutar el lifespan (que sembraría la BD de producción).
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()
