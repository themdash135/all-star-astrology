"""Summarize neuro-symbolic telemetry files."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

if __package__ in {None, ""}:
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
    from neuro_symbolic.engines.pipeline.runtime_config import load_runtime_config
    from neuro_symbolic.engines.pipeline.telemetry import summarize_telemetry_file
else:
    from .runtime_config import load_runtime_config
    from .telemetry import summarize_telemetry_file


def summarize_latest() -> dict:
    config = load_runtime_config()
    telemetry_dir = Path(config.telemetry_dir)
    files = sorted(telemetry_dir.glob("*.jsonl"))
    if not files:
        return {"records": 0, "abstained": 0, "average_confidence": 0.0, "selected_system_counts": {}, "advisory_counts": {}}
    return summarize_telemetry_file(files[-1])


def main() -> None:
    parser = argparse.ArgumentParser(description="Summarize neuro-symbolic telemetry")
    parser.add_argument("--file", help="Telemetry jsonl file to summarize")
    args = parser.parse_args()

    if args.file:
        summary = summarize_telemetry_file(args.file)
    else:
        summary = summarize_latest()
    print(json.dumps(summary, indent=2, default=str))


if __name__ == "__main__":
    main()
