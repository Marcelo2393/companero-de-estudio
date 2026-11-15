"""Modelos entrenados, guardados y listos para usar.

    uv run python -m engine.models train          # entrena con todo ScholarSim y guarda en models/
    uv run python -m engine.models predict b-00004 --week 6

Por cada semana de corte (0 = solo cuestionario, 3, 6, 9) se guarda:
    macroperfiles   un clasificador por barrera (engine/profiles.py)
    riesgo          probabilidad de retiro o pausa al final del ciclo (engine/risk.py)
Ambos son regresiones logísticas: en la evaluación igualan o superan a gradient boosting y
se pueden explicar (coeficientes). Cada modelo guarda la lista de variables que espera.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from . import features, profiles, risk
from .data import ROOT, load_evaluation, load_operational

MODELS = ROOT / "models"
WEEKS = [0, 3, 6, 9]
THRESHOLD = 0.5            # una barrera se asigna si su probabilidad supera esto
RISK_TOP_SHARE = 0.1       # «riesgo alto» = el 10 % superior de la población de entrenamiento


def _x(op, week: int) -> pd.DataFrame:
    return features.build(op, max(week, 1), "profile" if week == 0 else "all")


def train() -> dict:
    op, ev = load_operational(), load_evaluation()
    y_prof = profiles.labels(op, ev)
    y_risk = risk.labels(op, ev)
    MODELS.mkdir(exist_ok=True)
    manifest = {"weeks": WEEKS, "barriers": profiles.BARRIERS, "threshold": THRESHOLD, "models": {}}
    for week in WEEKS:
        x = _x(op, week)
        bundle = {"week": week, "columns": list(x.columns), "barriers": {}}
        for b in profiles.BARRIERS:
            bundle["barriers"][b] = profiles.model().fit(x, y_prof[b])
        r = risk.models()["logistic"].fit(x, y_risk)
        scores = r.predict_proba(x)[:, 1]
        bundle["risk"] = r
        bundle["risk_high_cutoff"] = float(np.quantile(scores, 1 - RISK_TOP_SHARE))
        path = MODELS / f"week{week:02d}.joblib"
        joblib.dump(bundle, path)
        manifest["models"][str(week)] = {"file": path.name, "features": len(x.columns),
                                         "risk_high_cutoff": round(bundle["risk_high_cutoff"], 4)}
    manifest["trained_on"] = {"students": len(op.students), "source": "ScholarSim (sintético)"}
    (MODELS / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    return manifest


def load(week: int) -> dict:
    """El modelo de la semana de corte más cercana sin pasarse (no usa datos del futuro)."""
    cut = max(w for w in WEEKS if w <= week)
    return joblib.load(MODELS / f"week{cut:02d}.joblib")


def explain(bundle: dict, row: pd.DataFrame, barrier: str, top: int = 3) -> list[str]:
    """Variables que más empujan la probabilidad de esta barrera para este becario."""
    pipe = bundle["barriers"][barrier]
    z = pipe[:-1].transform(row)[0]
    contrib = pd.Series(z * pipe[-1].coef_[0], index=bundle["columns"])
    return list(contrib.sort_values(ascending=False).head(top).index)


def predict(op, sid: str, week: int) -> dict:
    bundle = load(week)
    x = _x(op, bundle["week"]).reindex(columns=bundle["columns"])   # mismas variables que en el entrenamiento
    row = x.loc[[sid]]
    probs = {b: round(float(m.predict_proba(row)[0, 1]), 3) for b, m in bundle["barriers"].items()}
    active = [b for b, p in sorted(probs.items(), key=lambda kv: -kv[1]) if p >= THRESHOLD]
    risk_p = float(bundle["risk"].predict_proba(row)[0, 1])
    return {
        "student_id": sid, "week": week, "model_week": bundle["week"],
        "macroprofiles": active or ["stable"],
        "probabilities": probs,
        "interventions": [profiles.INTERVENTION[b] for b in (active or ["stable"])],
        "signals": {b: explain(bundle, row, b) for b in active},
        "disengagement_risk": round(risk_p, 3),
        "risk_level": "high" if risk_p >= bundle["risk_high_cutoff"] else "normal",
    }


def main() -> None:
    ap = argparse.ArgumentParser(prog="engine.models")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("train")
    p = sub.add_parser("predict")
    p.add_argument("student_id")
    p.add_argument("--week", type=int, default=6)
    args = ap.parse_args()
    if args.cmd == "train":
        print(json.dumps(train(), ensure_ascii=False, indent=2))
    else:
        op = load_operational()
        print(json.dumps(predict(op, args.student_id, args.week), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
