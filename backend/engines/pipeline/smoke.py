"""Offline smoke runner for the neuro-symbolic pipeline."""

from __future__ import annotations

import argparse
import json
import os
from contextlib import contextmanager
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
    from neuro_symbolic.engines.pipeline.benchmark import benchmark_pipeline
    from neuro_symbolic.engines.pipeline.engine import run
    from neuro_symbolic.engines.pipeline.offline_samples import sample_cases, sample_reading
    from neuro_symbolic.engines.pipeline.registry import (
        get_adapter_health_snapshot,
        get_adapter_registry,
        restore_registry_state,
        snapshot_registry_state,
    )
else:
    from .benchmark import benchmark_pipeline
    from .engine import run
    from .offline_samples import sample_cases, sample_reading
    from .registry import (
        get_adapter_health_snapshot,
        get_adapter_registry,
        restore_registry_state,
        snapshot_registry_state,
    )


@contextmanager
def _temporary_env(updates: dict[str, str]):
    previous = {name: os.environ.get(name) for name in updates}
    try:
        for name, value in updates.items():
            os.environ[name] = value
        yield
    finally:
        for name, value in previous.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value


def run_smoke(
    reading: dict[str, Any] | None = None,
    cases: list[dict[str, Any]] | None = None,
    *,
    session_prefix: str = "smoke",
    persist_sessions: bool = False,
) -> dict[str, Any]:
    reading = reading or sample_reading()
    cases = cases or sample_cases()
    baseline_state = snapshot_registry_state()
    try:
        restore_registry_state({"health": {}, "eval_cache": {}})
        results: list[dict[str, Any]] = []
        for index, case in enumerate(cases):
            response = run(
                case["question"],
                reading,
                question_history=case.get("history"),
                prior_confidences=case.get("prior_confidences"),
                profile=case.get("profile"),
                response_mode=case.get("response_mode"),
                session_id=(f"{session_prefix}-{index}" if persist_sessions else None),
                persist_session=persist_sessions,
            )
            results.append(
                {
                    "label": case.get("label", f"case-{index}"),
                    "winner": response.aggregation.winner,
                    "confidence": response.confidence,
                    "epistemic_confidence": response.epistemic_confidence,
                    "advice_strength": response.advice_strength,
                    "response_mode": response.response_mode,
                    "abstained": response.abstained,
                    "trace_id": response.trace_id,
                    "advisories": response.advisories,
                    "session_file": response.diagnostics.get("session_file", ""),
                    "trace_bundle_file": response.diagnostics.get("trace_bundle_file", ""),
                    "telemetry_file": response.diagnostics.get("telemetry_file", ""),
                }
            )

        smoke_state = snapshot_registry_state()
        with _temporary_env(
            {
                "NEURO_SYMBOLIC_FLAG_TELEMETRY": "0",
                "NEURO_SYMBOLIC_FLAG_TRACE_BUNDLES": "0",
                "NEURO_SYMBOLIC_FLAG_SESSION_STORE": "0",
            }
        ):
            benchmark = benchmark_pipeline(
                lambda question, payload: run(
                    question,
                    payload,
                    profile="balanced",
                    response_mode="direct",
                    persist_session=False,
                ),
                [{"question": case["question"], "reading": reading} for case in cases],
                iterations=1,
            )
        restore_registry_state(smoke_state)
        return {
            "registry_systems": sorted(get_adapter_registry().keys()),
            "adapter_health": get_adapter_health_snapshot(),
            "benchmark": benchmark,
            "results": results,
        }
    finally:
        restore_registry_state(baseline_state)


def main() -> None:
    parser = argparse.ArgumentParser(description="Offline smoke runner for the neuro-symbolic engine")
    parser.add_argument("--output", help="Optional JSON output path")
    parser.add_argument("--persist-sessions", action="store_true", help="Persist smoke runs to the session store")
    args = parser.parse_args()

    summary = run_smoke(persist_sessions=args.persist_sessions)
    rendered = json.dumps(summary, indent=2, default=str)
    print(rendered)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(rendered + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
