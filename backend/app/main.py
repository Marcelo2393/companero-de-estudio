"""Punto de entrada de la API Compañero de Estudio contra el Abandono.

Configura FastAPI, CORS para desarrollo local, routers y la inicialización de
la base de datos SQLite con datos de demostración al arrancar.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, risk, study_plans, students, teacher
from app.database import SessionLocal, init_db
from app.services.seed import seed_demo_data

# Orígenes permitidos para el frontend en desarrollo local y red local.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.5:5173",   # IP local de la máquina host (red WiFi/LAN)
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa la base de datos y los datos de demostración al arrancar."""
    init_db()
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Compañero de Estudio contra el Abandono",
    description="API educativa para reducir el abandono escolar mediante "
    "seguimiento del estudio y alertas deterministas. Preparada para integrar "
    "modelos de IA (personalización, predicción de abandono y recomendaciones) "
    "en el futuro.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students.router)
app.include_router(study_plans.router)
app.include_router(alerts.router)
app.include_router(risk.router)
app.include_router(teacher.router)


@app.get("/", tags=["salud"])
def root():
    return {"status": "ok", "service": "Compañero de Estudio API"}


@app.get("/health", tags=["salud"])
def health():
    return {"status": "healthy"}
