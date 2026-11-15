"""Macroperfiles de barrera: clasificación supervisada multietiqueta.

Cinco macroperfiles (docs/results.md): trayectoria estable y cuatro barreras que pueden coexistir.
Un clasificador por barrera da su probabilidad; el becario es «estable» si ninguna supera
el umbral. Cada barrera decide su intervención principal:

    academic                 refuerzo por competencias y tutorías
    time                     optimización del calendario y de la carga
    material_digital         recursos sin conexión y derivación a apoyos
    integration_motivation   mentoría, orientación y apoyo humano

En ScholarSim la etiqueta sale de evaluation (arquetipos y causas). Con becarios reales saldrá
de los motivos que declaran en las alertas (barrier_reports) y de la validación de tutores.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, f1_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from . import features
from .data import Evaluation, Operational

SEED = 42
BARRIERS = ["academic", "time", "material_digital", "integration_motivation"]
ARCHETYPE_TO_BARRIER = {
    "learning_gap": "academic",
    "academic_overload": "time",
    "caregiving": "time",
    "working": "time",
    "financial_constraints": "material_digital",
    "digital_barriers": "material_digital",
    "no_support": "integration_motivation",
    "relocated": "integration_motivation",
    "low_motivation": "integration_motivation",
}
CAUSE_TO_BARRIER = {
    "course_difficulty": "academic",
    "academic_load": "time", "work_schedule": "time", "caregiving": "time", "transport": "time",
    "financial": "material_digital", "connectivity": "material_digital",
    "motivation": "integration_motivation", "personal": "integration_motivation",
}
INTERVENTION = {
    "stable": "seguimiento ligero y planificación",
    "academic": "refuerzo por competencias y tutorías",
    "time": "optimización del calendario y de la carga",
    "material_digital": "recursos sin conexión y derivación a apoyos",
    "integration_motivation": "mentoría, orientación y apoyo humano",
}


def labels(op: Operational, ev: Evaluation) -> pd.DataFrame:
    lat = ev.latent.set_index("student_id").loc[op.students["student_id"]]
    y = pd.DataFrame(0, index=lat.index, columns=BARRIERS)
    for sid, r in lat.iterrows():
        archs = [r["primary_archetype"]] + [a for a in str(r["secondary_archetypes"]).split(";") if a]
        causes = [c for c in str(r["causes"]).split(";") if c]
        for a in archs:
            if a in ARCHETYPE_TO_BARRIER:
                y.loc[sid, ARCHETYPE_TO_BARRIER[a]] = 1
        for c in causes:
            if c in CAUSE_TO_BARRIER:
                y.loc[sid, CAUSE_TO_BARRIER[c]] = 1
    return y


def model():
    return make_pipeline(SimpleImputer(strategy="median"), StandardScaler(),
                         LogisticRegression(max_iter=3000, class_weight="balanced"))


def evaluate(op: Operational, ev: Evaluation, weeks=(0, 3, 6, 9)) -> dict:
    """AUC y F1 por barrera con validación cruzada; semana 0 = solo el cuestionario inicial."""
    y = labels(op, ev)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    out = {"prevalence": y.mean().round(3).to_dict(),
           "stable_share": round(float((y.sum(axis=1) == 0).mean()), 3), "by_week": []}
    for week in weeks:
        x = features.build(op, max(week, 1), "profile" if week == 0 else "all")
        probs = pd.DataFrame(index=y.index)
        row = {"week": week, "features": "profile" if week == 0 else "all"}
        for b in BARRIERS:
            p = cross_val_predict(model(), x, y[b], cv=cv, method="predict_proba")[:, 1]
            probs[b] = p
            row[b] = {"auc": round(roc_auc_score(y[b], p), 3),
                      "average_precision": round(average_precision_score(y[b], p), 3),
                      "f1_at_0.5": round(f1_score(y[b], p >= 0.5), 3)}
        pred = probs >= 0.5
        row["exact_profile_match"] = round(float((pred.to_numpy() == y.to_numpy().astype(bool)).all(axis=1).mean()), 3)
        row["stable_recall"] = round(float(((pred.sum(axis=1) == 0) & (y.sum(axis=1) == 0)).sum()
                                           / max((y.sum(axis=1) == 0).sum(), 1)), 3)
        row["macro_auc"] = round(float(np.mean([row[b]["auc"] for b in BARRIERS])), 3)
        out["by_week"].append(row)
    return out


def top_signals(op: Operational, ev: Evaluation, week: int = 6, top: int = 5) -> dict:
    """Coeficientes de la logística por barrera: qué variables la delatan (para explicar)."""
    y = labels(op, ev)
    x = features.build(op, week, "all")
    out = {}
    for b in BARRIERS:
        m = model().fit(x, y[b])
        coef = pd.Series(m[-1].coef_[0], index=x.columns).sort_values(key=abs, ascending=False).head(top)
        out[b] = {k: round(float(v), 2) for k, v in coef.items()}
    return out
