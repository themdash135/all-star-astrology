"""Offline evaluation harness for labeled neuro-symbolic prompts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Callable

from .calibration import save_calibration_store
from .governance import validate_weight_changes
from .runtime_config import RuntimeConfig


def load_labeled_cases(path: str | Path) -> list[dict[str, Any]]:
    raw = Path(path).read_text(encoding="utf-8")
    data = json.loads(raw)
    if not isinstance(data, list):
        raise ValueError("Evaluation cases must be a JSON list")
    return data


def evaluate_cases(
    cases: list[dict[str, Any]],
    runner: Callable[[str, dict[str, Any]], Any],
) -> dict[str, Any]:
    results: list[dict[str, Any]] = []
    correct = 0
    for case in cases:
        question = str(case["question"])
        reading = dict(case["reading"])
        expected = str(case["expected"])
        response = runner(question, reading)
        actual = getattr(response, "aggregation", None)
        winner = getattr(actual, "winner", None) if actual is not None else None
        is_correct = winner == expected
        results.append(
            {
                "question": question,
                "expected": expected,
                "winner": winner,
                "correct": is_correct,
                "confidence": getattr(response, "confidence", None),
            }
        )
        if is_correct:
            correct += 1

    accuracy = round(correct / len(cases), 3) if cases else 0.0
    return {"accuracy": accuracy, "cases": results, "count": len(cases)}


def build_calibration_from_report(report: dict[str, Any]) -> dict[str, Any]:
    accuracy = float(report.get("accuracy", 0.0))
    midpoint = 0.5 - max(min((accuracy - 0.5) * 0.2, 0.1), -0.1)
    slope = 8.0 + max(min((accuracy - 0.5) * 4.0, 2.0), -2.0)
    return {
        "confidence_curve": {
            "slope": round(slope, 2),
            "midpoint": round(midpoint, 2),
        },
        "system_weights": {},
    }


def save_calibrated_report(
    report: dict[str, Any],
    current_weights: dict[str, float],
    proposed_weights: dict[str, float],
    config: RuntimeConfig,
) -> list[str]:
    issues = validate_weight_changes(
        current_weights,
        proposed_weights,
        config,
        eval_case_count=int(report.get("count", 0)),
    )
    if issues:
        return issues

    calibration = build_calibration_from_report(report)
    calibration["system_weights"] = proposed_weights
    save_calibration_store(config, calibration)
    return []
