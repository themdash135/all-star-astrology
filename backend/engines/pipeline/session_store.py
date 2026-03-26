"""Persistent session memory for offline neuro-symbolic runs."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .runtime_config import RuntimeConfig


def _safe_session_id(session_id: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9._-]+", "_", session_id.strip())
    return safe or "default"


def session_path(session_id: str, config: RuntimeConfig) -> Path:
    return Path(config.session_store_dir) / f"{_safe_session_id(session_id)}.json"


def load_session_state(session_id: str, config: RuntimeConfig) -> dict[str, Any]:
    path = session_path(session_id, config)
    if not path.exists():
        return {"session_id": _safe_session_id(session_id), "created_at": "", "updated_at": "", "interactions": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            data.setdefault("interactions", [])
            return data
    except (OSError, json.JSONDecodeError):
        pass
    return {"session_id": _safe_session_id(session_id), "created_at": "", "updated_at": "", "interactions": []}


def save_session_state(session_id: str, config: RuntimeConfig, payload: dict[str, Any]) -> str:
    path = session_path(session_id, config)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True, default=str), encoding="utf-8")
    return str(path)


def merge_session_inputs(
    session_id: str | None,
    config: RuntimeConfig,
    question_history: list[str] | None,
    prior_confidences: list[float] | None,
) -> tuple[list[str], list[float], dict[str, Any] | None]:
    if not session_id or not config.feature_flags.session_store:
        return list(question_history or []), list(prior_confidences or []), None

    state = load_session_state(session_id, config)
    interactions = state.get("interactions", [])
    stored_questions = [str(item.get("question", "")) for item in interactions][-10:]
    stored_confidences = [
        float(item.get("confidence", 0.0))
        for item in interactions
        if item.get("confidence") is not None
    ]

    explicit_history = list(question_history or [])
    merged_history = explicit_history + [question for question in reversed(stored_questions) if question]

    explicit_confidences = list(prior_confidences or [])
    merged_confidences = stored_confidences + explicit_confidences

    deduped_history: list[str] = []
    seen_questions: set[str] = set()
    for question in merged_history:
        if question and question not in seen_questions:
            deduped_history.append(question)
            seen_questions.add(question)

    return deduped_history[:10], merged_confidences[-10:], state


def append_session_interaction(
    session_id: str,
    config: RuntimeConfig,
    *,
    question: str,
    response: Any,
    classification: Any,
    trace_id: str,
) -> str:
    state = load_session_state(session_id, config)
    now = datetime.now(timezone.utc).isoformat()
    if not state.get("created_at"):
        state["created_at"] = now
    state["updated_at"] = now
    interactions = list(state.get("interactions", []))
    interactions.append(
        {
            "timestamp": now,
            "trace_id": trace_id,
            "question": question,
            "answer": getattr(response, "answer", ""),
            "confidence": getattr(response, "confidence", None),
            "winner": getattr(getattr(response, "aggregation", None), "winner", None),
            "areas": list(getattr(response, "areas", [])),
            "advisories": list(getattr(response, "advisories", [])),
            "entities": dict(getattr(classification, "entities", {})),
            "goal_intent": getattr(classification, "goal_intent", ""),
            "time_window": dict(getattr(classification, "time_window", {})),
        }
    )
    state["interactions"] = interactions[-50:]
    return save_session_state(session_id, config, state)


def summarize_session_state(state: dict[str, Any]) -> dict[str, Any]:
    interactions = list(state.get("interactions", []))
    if not interactions:
        return {"interaction_count": 0, "recent_questions": [], "recent_entities": []}

    recent_questions = [item.get("question", "") for item in interactions[-3:]]
    recent_entities: list[str] = []
    for item in interactions[-5:]:
        entities = item.get("entities", {})
        if isinstance(entities, dict):
            for values in entities.values():
                if isinstance(values, list):
                    recent_entities.extend(str(value) for value in values)
    deduped_entities = list(dict.fromkeys(recent_entities))[:5]
    return {
        "interaction_count": len(interactions),
        "recent_questions": recent_questions,
        "recent_entities": deduped_entities,
    }
