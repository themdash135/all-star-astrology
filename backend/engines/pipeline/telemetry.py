"""Structured telemetry for pipeline runs."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from time import time_ns
from typing import Any

from .runtime_config import RuntimeConfig


def build_trace_fingerprint(
    question: str,
    reading: dict[str, Any],
    *,
    profile: str = "",
    response_mode: str = "",
) -> str:
    raw = json.dumps(
        {
            "question": question,
            "systems": sorted(reading.get("systems", {}).keys()),
            "profile": profile,
            "response_mode": response_mode,
        },
        sort_keys=True,
        default=str,
    )
    return hashlib.md5(raw.encode("utf-8")).hexdigest()[:12]


def build_trace_id(question: str, reading: dict[str, Any], *, profile: str = "", response_mode: str = "") -> str:
    digest = build_trace_fingerprint(
        question,
        reading,
        profile=profile,
        response_mode=response_mode,
    )
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    nonce = f"{time_ns() % 1_000_000_000:09d}"
    return f"ns-{stamp}-{nonce}-{digest}"


def emit_pipeline_telemetry(
    trace_id: str,
    payload: dict[str, Any],
    config: RuntimeConfig,
) -> str | None:
    if not config.feature_flags.telemetry_logging:
        return None

    path = Path(config.telemetry_dir)
    path.mkdir(parents=True, exist_ok=True)
    file_path = path / f"{datetime.now(timezone.utc).strftime('%Y%m%d')}.jsonl"
    record = {"trace_id": trace_id, **payload}
    with file_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, sort_keys=True, default=str) + "\n")
    return str(file_path)


def write_trace_bundle(
    trace_id: str,
    payload: dict[str, Any],
    config: RuntimeConfig,
) -> str | None:
    if not config.feature_flags.trace_bundles:
        return None

    path = Path(config.trace_bundle_dir)
    path.mkdir(parents=True, exist_ok=True)
    file_path = path / f"{trace_id}.json"
    file_path.write_text(json.dumps(payload, indent=2, sort_keys=True, default=str), encoding="utf-8")
    return str(file_path)


def load_trace_bundle(trace_id: str, config: RuntimeConfig) -> dict[str, Any]:
    path = Path(config.trace_bundle_dir) / f"{trace_id}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def summarize_telemetry_file(path: str | Path) -> dict[str, Any]:
    file_path = Path(path)
    records: list[dict[str, Any]] = []
    with file_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            records.append(json.loads(line))

    selected_counts: dict[str, int] = {}
    abstained = 0
    total_confidence = 0.0
    advisory_counts: dict[str, int] = {}
    for record in records:
        aggregation = record.get("aggregation", {}) if isinstance(record, dict) else {}
        if aggregation.get("abstained"):
            abstained += 1
        confidence = aggregation.get("confidence")
        if isinstance(confidence, (int, float)):
            total_confidence += float(confidence)
        for system_id in record.get("selected_systems", []):
            selected_counts[system_id] = selected_counts.get(system_id, 0) + 1
        advisories = record.get("advisories", [])
        if isinstance(advisories, list):
            for advisory in advisories:
                advisory_counts[str(advisory)] = advisory_counts.get(str(advisory), 0) + 1

    avg_confidence = round(total_confidence / len(records), 3) if records else 0.0
    return {
        "records": len(records),
        "abstained": abstained,
        "average_confidence": avg_confidence,
        "selected_system_counts": selected_counts,
        "advisory_counts": advisory_counts,
    }
