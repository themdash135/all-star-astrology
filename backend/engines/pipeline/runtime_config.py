"""Runtime configuration for the neuro-symbolic pipeline.

Profiles let the pipeline trade off decisiveness versus caution without
changing code. Feature flags gate newer behavior so upgrades can ship
without destabilizing existing consumers.
"""

from __future__ import annotations

import os
from typing import Literal

from pydantic import BaseModel, Field


ProfileName = Literal["balanced", "conservative", "exploratory"]
ResponseMode = Literal["reflective", "direct", "technical"]


class FeatureFlags(BaseModel):
    adapter_discovery: bool = True
    adapter_cache: bool = True
    semantic_evidence_dedup: bool = True
    dynamic_weights: bool = True
    confidence_calibration: bool = True
    telemetry_logging: bool = True
    session_store: bool = True
    trace_bundles: bool = True
    shadow_mode: bool = True
    deterministic_text: bool = True
    abstain_gate: bool = True
    feature_governance: bool = True


class RuntimeConfig(BaseModel):
    profile: ProfileName = "balanced"
    response_mode: ResponseMode = "reflective"
    feature_flags: FeatureFlags = Field(default_factory=FeatureFlags)
    quarantine_failures: int = 3
    adapter_cache_size: int = 256
    abstain_threshold: float = 0.16
    low_signal_threshold: float = 0.28
    telemetry_dir: str = "Saved/AI/NeuroSymbolic/telemetry"
    trace_bundle_dir: str = "Saved/AI/NeuroSymbolic/traces"
    session_store_dir: str = "Saved/AI/NeuroSymbolic/sessions"
    evaluation_dir: str = "Saved/AI/NeuroSymbolic/evaluations"
    calibration_file: str = "Saved/AI/NeuroSymbolic/calibration/system_accuracy.json"
    governance_file: str = "Saved/AI/NeuroSymbolic/governance/weight_policy.json"
    shadow_profile: ProfileName | None = "conservative"


_PROFILE_DEFAULTS: dict[ProfileName, dict[str, float | str | None]] = {
    "balanced": {
        "abstain_threshold": 0.16,
        "low_signal_threshold": 0.28,
        "shadow_profile": "conservative",
    },
    "conservative": {
        "abstain_threshold": 0.22,
        "low_signal_threshold": 0.34,
        "shadow_profile": "balanced",
    },
    "exploratory": {
        "abstain_threshold": 0.12,
        "low_signal_threshold": 0.22,
        "shadow_profile": "balanced",
    },
}


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() not in {"0", "false", "no", "off"}


def load_runtime_config(
    profile: ProfileName | None = None,
    response_mode: ResponseMode | None = None,
) -> RuntimeConfig:
    env_profile = os.getenv("NEURO_SYMBOLIC_PROFILE")
    env_mode = os.getenv("NEURO_SYMBOLIC_RESPONSE_MODE")

    selected_profile = profile or (env_profile if env_profile in _PROFILE_DEFAULTS else "balanced")
    selected_mode = response_mode or (
        env_mode if env_mode in {"reflective", "direct", "technical"} else "reflective"
    )

    defaults = _PROFILE_DEFAULTS[selected_profile]
    flags = FeatureFlags(
        adapter_discovery=_env_bool("NEURO_SYMBOLIC_FLAG_ADAPTER_DISCOVERY", True),
        adapter_cache=_env_bool("NEURO_SYMBOLIC_FLAG_ADAPTER_CACHE", True),
        semantic_evidence_dedup=_env_bool("NEURO_SYMBOLIC_FLAG_SEMANTIC_DEDUP", True),
        dynamic_weights=_env_bool("NEURO_SYMBOLIC_FLAG_DYNAMIC_WEIGHTS", True),
        confidence_calibration=_env_bool("NEURO_SYMBOLIC_FLAG_CONFIDENCE_CALIBRATION", True),
        telemetry_logging=_env_bool("NEURO_SYMBOLIC_FLAG_TELEMETRY", True),
        session_store=_env_bool("NEURO_SYMBOLIC_FLAG_SESSION_STORE", True),
        trace_bundles=_env_bool("NEURO_SYMBOLIC_FLAG_TRACE_BUNDLES", True),
        shadow_mode=_env_bool("NEURO_SYMBOLIC_FLAG_SHADOW_MODE", True),
        deterministic_text=_env_bool("NEURO_SYMBOLIC_FLAG_DETERMINISTIC_TEXT", True),
        abstain_gate=_env_bool("NEURO_SYMBOLIC_FLAG_ABSTAIN_GATE", True),
        feature_governance=_env_bool("NEURO_SYMBOLIC_FLAG_GOVERNANCE", True),
    )

    return RuntimeConfig(
        profile=selected_profile,
        response_mode=selected_mode,
        feature_flags=flags,
        quarantine_failures=int(os.getenv("NEURO_SYMBOLIC_QUARANTINE_FAILURES", "3")),
        adapter_cache_size=int(os.getenv("NEURO_SYMBOLIC_CACHE_SIZE", "256")),
        abstain_threshold=float(os.getenv("NEURO_SYMBOLIC_ABSTAIN_THRESHOLD", str(defaults["abstain_threshold"]))),
        low_signal_threshold=float(
            os.getenv("NEURO_SYMBOLIC_LOW_SIGNAL_THRESHOLD", str(defaults["low_signal_threshold"]))
        ),
        telemetry_dir=os.getenv("NEURO_SYMBOLIC_TELEMETRY_DIR", "Saved/AI/NeuroSymbolic/telemetry"),
        trace_bundle_dir=os.getenv("NEURO_SYMBOLIC_TRACE_BUNDLE_DIR", "Saved/AI/NeuroSymbolic/traces"),
        session_store_dir=os.getenv("NEURO_SYMBOLIC_SESSION_STORE_DIR", "Saved/AI/NeuroSymbolic/sessions"),
        evaluation_dir=os.getenv("NEURO_SYMBOLIC_EVAL_DIR", "Saved/AI/NeuroSymbolic/evaluations"),
        calibration_file=os.getenv(
            "NEURO_SYMBOLIC_CALIBRATION_FILE",
            "Saved/AI/NeuroSymbolic/calibration/system_accuracy.json",
        ),
        governance_file=os.getenv(
            "NEURO_SYMBOLIC_GOVERNANCE_FILE",
            "Saved/AI/NeuroSymbolic/governance/weight_policy.json",
        ),
        shadow_profile=defaults["shadow_profile"],  # type: ignore[arg-type]
    )
