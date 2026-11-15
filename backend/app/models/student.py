"""Modelo de Estudiante."""
from sqlalchemy import Column, Float, Integer, String

from app.database import Base


class Student(Base):
    """Estudiante de demostración identificado por su DNI.

    Para el MVP el DNI únicamente identifica un perfil de demostración y no
    constituye una autenticación segura de producción.
    """

    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    dni = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    target_hours_daily = Column(Float, default=4.0, nullable=False)
