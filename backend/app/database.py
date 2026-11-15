"""Configuración de la base de datos SQLAlchemy con SQLite para desarrollo local.

El motor se crea con ``check_same_thread=False`` porque FastAPI puede acceder a la
sesión desde hilos diferentes al de la creación. La URL de conexión puede
sobreescribirse mediante la variable de entorno ``DATABASE_URL``.
"""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./companero_estudio.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependencia de FastAPI que provee una sesión de base de datos por petición."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Crea todas las tablas definidas en los modelos."""
    # Importamos los modelos para que SQLAlchemy los registre en Base.metadata
    from app.models import student, study_session, alert  # noqa: F401

    Base.metadata.create_all(bind=engine)
