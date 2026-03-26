"""Replay previously saved neuro-symbolic trace bundles."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
    from neuro_symbolic.engines.pipeline.engine import run
    from neuro_symbolic.engines.pipeline.runtime_config import load_runtime_config
    from neuro_symbolic.engines.pipeline.telemetry import load_trace_bundle
else:
    from .engine import run
    from .runtime_config import load_runtime_config
    from .telemetry import load_trace_bundle


def replay_trace(
    *,
    trace_id: str | None = None,
    bundle_path: str | None = None,
    profile: str | None = None,
    response_mode: str | None = None,
) -> dict[str, Any]:
    if not trace_id and not bundle_path:
        raise ValueError("trace_id or bundle_path is required")

    config = load_runtime_config(profile=profile, response_mode=response_mode)
    payload = (
        load_trace_bundle(trace_id, config) if trace_id
        else json.loads(Path(bundle_path).read_text(encoding="utf-8"))
    )

    response = run(
        payload["question"],
        payload["reading"],
        question_history=payload.get("question_history"),
        prior_confidences=payload.get("prior_confidences"),
        profile=profile or payload.get("profile"),
        response_mode=response_mode or payload.get("response_mode"),
        session_id=None,
        persist_session=False,
    )
    return {
        "source_trace_id": payload.get("trace_id", ""),
        "replay_trace_id": response.trace_id,
        "winner": response.aggregation.winner,
        "confidence": response.confidence,
        "advisories": response.advisories,
        "response_mode": response.response_mode,
        "trace_bundle_file": response.diagnostics.get("trace_bundle_file", ""),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Replay a saved neuro-symbolic trace bundle")
    parser.add_argument("--trace-id", help="Trace id saved under the configured trace bundle directory")
    parser.add_argument("--bundle", help="Explicit trace bundle JSON path")
    parser.add_argument("--profile", help="Optional override profile")
    parser.add_argument("--response-mode", help="Optional override response mode")
    args = parser.parse_args()

    result = replay_trace(
        trace_id=args.trace_id,
        bundle_path=args.bundle,
        profile=args.profile,
        response_mode=args.response_mode,
    )
    print(json.dumps(result, indent=2, default=str))


if __name__ == "__main__":
    main()
