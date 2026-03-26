"""Governance rules for learned weights and calibration artifacts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .runtime_config import RuntimeConfig


DEFAULT_POLICY: dict[str, Any] = {
    "max_weight_delta": 0.2,
    "min_weight": 0.6,
    "max_weight": 1.4,
    "required_eval_cases": 10,
}


def load_policy(config: RuntimeConfig) -> dict[str, Any]:
    path = Path(config.governance_file)
    if not path.exists():
        return dict(DEFAULT_POLICY)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return dict(DEFAULT_POLICY)
        merged = dict(DEFAULT_POLICY)
        merged.update(data)
        return merged
    except (OSError, json.JSONDecodeError):
        return dict(DEFAULT_POLICY)


def validate_weight_changes(
    current_weights: dict[str, float],
    proposed_weights: dict[str, float],
    config: RuntimeConfig,
    eval_case_count: int = 0,
) -> list[str]:
    policy = load_policy(config)
    issues: list[str] = []
    max_delta = float(policy["max_weight_delta"])
    min_weight = float(policy["min_weight"])
    max_weight = float(policy["max_weight"])
    min_cases = int(policy["required_eval_cases"])

    if eval_case_count < min_cases:
        issues.append(f"insufficient_eval_cases:{eval_case_count}")

    for system_id, proposed in proposed_weights.items():
        current = current_weights.get(system_id, 1.0)
        if abs(proposed - current) > max_delta:
            issues.append(f"weight_delta_too_large:{system_id}")
        if proposed < min_weight or proposed > max_weight:
            issues.append(f"weight_out_of_bounds:{system_id}")

    return issues
