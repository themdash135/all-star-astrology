"""Lightweight latency benchmark helpers for the neuro-symbolic pipeline."""

from __future__ import annotations

import time
from typing import Any, Callable


def benchmark_pipeline(
    runner: Callable[[str, dict[str, Any]], Any],
    cases: list[dict[str, Any]],
    iterations: int = 1,
) -> dict[str, float]:
    if not cases:
        return {"cases": 0.0, "iterations": float(iterations), "avg_ms": 0.0, "p95_ms": 0.0}

    durations: list[float] = []
    for _ in range(max(iterations, 1)):
        for case in cases:
            start = time.perf_counter()
            runner(case["question"], case["reading"])
            durations.append((time.perf_counter() - start) * 1000)

    ordered = sorted(durations)
    p95_index = min(len(ordered) - 1, max(0, int(len(ordered) * 0.95) - 1))
    return {
        "cases": float(len(cases)),
        "iterations": float(max(iterations, 1)),
        "avg_ms": round(sum(durations) / len(durations), 3),
        "p95_ms": round(ordered[p95_index], 3),
    }
