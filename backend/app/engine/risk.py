"""Predicción temprana de desvinculación (retiro o pausa al final del ciclo).

Validación: k-fold estratificado sobre ScholarSim; la etiqueta sale de evaluation/outcomes.csv
y las variables solo de operational hasta la semana k (sin mirar el futuro).
Métricas que importan para la estrategia: AUC, precisión promedio (la clase es rara) y
cobertura en el top 10 % (si el equipo de tutores solo puede atender a 1 de cada 10).
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from . import features
from .data import Evaluation, Operational

DISENGAGED = {"withdrawn", "paused"}
SEED = 42


def labels(op: Operational, ev: Evaluation) -> pd.Series:
    o = ev.outcomes.set_index("student_id")["final_status"]
    return o.isin(DISENGAGED).astype(int).loc[op.students["student_id"]]


def models() -> dict:
    return {
        "logistic": make_pipeline(SimpleImputer(strategy="median"), StandardScaler(),
                                  LogisticRegression(max_iter=2000, class_weight="balanced")),
        "gradient_boosting": HistGradientBoostingClassifier(max_iter=300, learning_rate=0.05,
                                                            class_weight="balanced", random_state=SEED),
    }


def top_share_recall(y: np.ndarray, score: np.ndarray, share: float = 0.1) -> float:
    k = max(1, int(len(y) * share))
    top = np.argsort(-score)[:k]
    return float(y[top].sum() / max(y.sum(), 1))


def evaluate(op: Operational, ev: Evaluation, weeks: list[int], kinds=("profile", "behavior", "all")) -> list[dict]:
    y = labels(op, ev).to_numpy()
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    rows = []
    for k in weeks:
        for kind in kinds:
            x = features.build(op, k, kind)
            for name, model in models().items():
                p = cross_val_predict(model, x, y, cv=cv, method="predict_proba")[:, 1]
                rows.append({"week": k, "features": kind, "model": name, "auc": round(roc_auc_score(y, p), 3),
                             "average_precision": round(average_precision_score(y, p), 3),
                             "base_rate": round(float(y.mean()), 3),
                             "recall_top10": round(top_share_recall(y, p, 0.1), 3)})
    return rows


def importance(op: Operational, ev: Evaluation, week: int, top: int = 12) -> list[dict]:
    """Importancia por permutación en un tercio reservado (no en el entrenamiento)."""
    x = features.build(op, week, "all")
    y = labels(op, ev)
    rng = np.random.default_rng(SEED)
    test = rng.random(len(x)) < 0.33
    m = models()["gradient_boosting"].fit(x[~test], y[~test])
    r = permutation_importance(m, x[test], y[test], scoring="average_precision", n_repeats=5, random_state=SEED)
    order = np.argsort(-r.importances_mean)[:top]
    return [{"feature": x.columns[i], "importance": round(float(r.importances_mean[i]), 4)} for i in order]
