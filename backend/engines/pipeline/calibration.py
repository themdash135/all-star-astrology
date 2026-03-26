"""Calibration and learned-weight helpers for the neuro-symbolic pipeline."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .runtime_config import RuntimeConfig


_DEFAULT_CALIBRATION: dict[str, Any] = {
    "confidence_curve": {"slope": 8.0, "midpoint": 0.45},
    "system_weights": {},
}


def load_calibration_store(config: RuntimeConfig) -> dict[str, Any]:
    path = Path(config.calibration_file)
    if not path.exists():
        return dict(_DEFAULT_CALIBRATION)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return dict(_DEFAULT_CALIBRATION)
        merged = dict(_DEFAULT_CALIBRATION)
        merged.update(data)
        return merged
    except (OSError, json.JSONDecodeError):
        return dict(_DEFAULT_CALIBRATION)


def save_calibration_store(config: RuntimeConfig, payload: dict[str, Any]) -> None:
    path = Path(config.calibration_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True), encoding="utf-8")


def get_learned_weight_multiplier(system_id: str, config: RuntimeConfig) -> float:
    if not config.feature_flags.dynamic_weights:
        return 1.0
    store = load_calibration_store(config)
    weights = store.get("system_weights", {})
    raw = weights.get(system_id, 1.0)
    try:
        return max(0.6, min(1.4, float(raw)))
    except (TypeError, ValueError):
        return 1.0


def calibrate_confidence(raw_confidence: float, config: RuntimeConfig) -> float:
    if not config.feature_flags.confidence_calibration:
        return raw_confidence
    store = load_calibration_store(config)
    curve = store.get("confidence_curve", {})
    try:
        slope = float(curve.get("slope", 8.0))
        midpoint = float(curve.get("midpoint", 0.45))
    except (TypeError, ValueError):
        slope = 8.0
        midpoint = 0.45

    import math

    calibrated = 1.0 / (1.0 + math.exp(-slope * (raw_confidence - midpoint)))
    return round(max(0.05, min(0.95, calibrated)), 2)
