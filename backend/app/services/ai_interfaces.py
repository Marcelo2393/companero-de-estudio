"""Interfaces para la integración futura de modelos de IA.

Estos contratos definen los puntos de extensión donde se incorporarán
posteriormente los modelos de personalización, predicción de abandono y
recomendaciones académicas. Por ahora NO se implementa ningún modelo; cada
interfaz provee una implementación por defecto (``Null...``) que se usa mientras
los modelos reales no estén disponibles, de modo que el resto del sistema
funciona sin depender de ellos.

Puntos de integración futuros:
- ``PersonalizationEngine``: generará planes de estudio personalizados.
- ``DropoutRiskPredictor``: estimará el riesgo de abandono del estudiante.
- ``RecommendationEngine``: sugerirá acciones académicas para reducir el abandono.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class PredictionContext:
    """Contexto agregado que los modelos consumirán en el futuro."""

    student_id: int
    completed_hours: float
    scheduled_hours: float
    pending_sessions: int
    overdue_sessions: int
    days_active: int = 0
    extra: dict[str, Any] | None = None


@dataclass
class RiskAssessment:
    """Resultado de la predicción de riesgo de abandono."""

    risk_score: float  # 0.0 (sin riesgo) - 1.0 (alto riesgo)
    risk_level: str  # "bajo" | "medio" | "alto"
    reasons: list[str]


class PersonalizationEngine(ABC):
    """Contrato para el motor de planificación personalizada.

    Punto de integración futuro: reemplazar ``NullPersonalizationEngine`` por una
    implementación que use el modelo de personalización entrenado.
    """

    @abstractmethod
    def generate_plan(self, context: PredictionContext) -> list[dict[str, Any]]:
        """Devuelve un plan de estudio personalizado como lista de sesiones."""


class DropoutRiskPredictor(ABC):
    """Contrato para el modelo de predicción de riesgo de abandono.

    Punto de integración futuro: reemplazar ``NullDropoutRiskPredictor`` por una
    implementación que consuma el modelo predictivo.
    """

    @abstractmethod
    def predict_risk(self, context: PredictionContext) -> RiskAssessment:
        """Estima el riesgo de abandono del estudiante."""


class RecommendationEngine(ABC):
    """Contrato para el motor de recomendaciones académicas.

    Punto de integración futuro: reemplazar ``NullRecommendationEngine`` por una
    implementación que genere recomendaciones a partir del modelo.
    """

    @abstractmethod
    def recommend(self, context: PredictionContext) -> list[str]:
        """Devuelve recomendaciones académicas para el estudiante."""


# ---------------------------------------------------------------------------
# Implementaciones nulas (por defecto, sin modelo).
# ---------------------------------------------------------------------------


class NullPersonalizationEngine(PersonalizationEngine):
    """Planificador por defecto: no personaliza (uso del plan de demostración)."""

    def generate_plan(self, context: PredictionContext) -> list[dict[str, Any]]:
        return []


class NullDropoutRiskPredictor(DropoutRiskPredictor):
    """Predictor por defecto: no usa modelo, devuelve riesgo neutral."""

    def predict_risk(self, context: PredictionContext) -> RiskAssessment:
        return RiskAssessment(risk_score=0.0, risk_level="bajo", reasons=[])


class NullRecommendationEngine(RecommendationEngine):
    """Recomendador por defecto: no usa modelo, sin recomendaciones."""

    def recommend(self, context: PredictionContext) -> list[str]:
        return []


# Instancias por defecto intercambiables cuando se integren los modelos reales.
default_personalization_engine: PersonalizationEngine = NullPersonalizationEngine()
default_dropout_risk_predictor: DropoutRiskPredictor = NullDropoutRiskPredictor()
default_recommendation_engine: RecommendationEngine = NullRecommendationEngine()
