"""Admin storage, quality heuristics, health aggregation, and analytics.

File-based persistence following the existing Saved/ convention used by
the neuro-symbolic pipeline (Saved/AI/NeuroSymbolic/).  All admin data
lives under Saved/admin/ (overridable via ADMIN_STORAGE_DIR env var).

Layout::

    Saved/admin/
        readings/       <- one JSON per reading session
        compatibility/  <- one JSON per compatibility session
        errors.jsonl    <- append-only error log
        analytics.jsonl <- append-only analytics event log
"""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

logger = logging.getLogger(__name__)

# ── Storage paths ───────────────────────────────────────────────────

_STORAGE_BASE = os.getenv("ADMIN_STORAGE_DIR", "Saved/admin")

def _base_dir() -> Path:
    return Path(_STORAGE_BASE)

def _readings_dir() -> Path:
    p = _base_dir() / "readings"
    p.mkdir(parents=True, exist_ok=True)
    return p

def _compatibility_dir() -> Path:
    p = _base_dir() / "compatibility"
    p.mkdir(parents=True, exist_ok=True)
    return p

def _errors_path() -> Path:
    _base_dir().mkdir(parents=True, exist_ok=True)
    return _base_dir() / "errors.jsonl"

def _analytics_path() -> Path:
    _base_dir().mkdir(parents=True, exist_ok=True)
    return _base_dir() / "analytics.jsonl"

# ── System constants ────────────────────────────────────────────────

SYSTEM_NAMES = (
    "western", "vedic", "chinese", "bazi",
    "numerology", "kabbalistic", "gematria", "persian",
)

_FALLBACK_PHRASES = [
    "the stars suggest",
    "cosmic energy",
    "universal forces",
    "trust the process",
    "everything happens for a reason",
    "the universe has a plan",
    "stay open to possibilities",
]

_COMPAT_NARRATIVE_SECTIONS = (
    "tier1_synthesis",
    "relationship_roles",
    "when_you_clash",
    "relationship_playbook",
    "couple_guide",
)

_COMPAT_MIN_CHARS: dict[str, int] = {
    "tier1_synthesis": 100,
    "relationship_roles": 80,
    "when_you_clash": 80,
    "relationship_playbook": 100,
    "couple_guide": 100,
}

# ── File-based storage ──────────────────────────────────────────────

def _make_session_id() -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    short_uuid = uuid.uuid4().hex[:8]
    return f"{stamp}-{short_uuid}"


def save_reading(
    result: dict[str, Any],
    *,
    duration_ms: float | None = None,
    request_meta: dict[str, Any] | None = None,
) -> str:
    """Persist a reading result to disk. Returns the session ID."""
    session_id = _make_session_id()
    envelope: dict[str, Any] = {
        "session_id": session_id,
        "type": "reading",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "duration_ms": duration_ms,
        "request_meta": request_meta or {},
        "result": result,
        "quality": score_reading(result),
    }
    path = _readings_dir() / f"{session_id}.json"
    path.write_text(json.dumps(envelope, indent=2, default=str), encoding="utf-8")
    logger.info("Saved reading session %s -> %s", session_id, path)
    return session_id


def save_compatibility(
    result: dict[str, Any],
    *,
    duration_ms: float | None = None,
    request_meta: dict[str, Any] | None = None,
) -> str:
    """Persist a compatibility result to disk. Returns the session ID."""
    session_id = _make_session_id()
    envelope: dict[str, Any] = {
        "session_id": session_id,
        "type": "compatibility",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "duration_ms": duration_ms,
        "request_meta": request_meta or {},
        "result": result,
        "quality": score_compatibility(result),
    }
    path = _compatibility_dir() / f"{session_id}.json"
    path.write_text(json.dumps(envelope, indent=2, default=str), encoding="utf-8")
    logger.info("Saved compatibility session %s -> %s", session_id, path)
    return session_id


# ── Error logging ───────────────────────────────────────────────────

def log_error(
    endpoint: str,
    error: str,
    *,
    request_meta: dict[str, Any] | None = None,
    traceback_str: str | None = None,
) -> None:
    """Append an error record to the JSONL error log."""
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "endpoint": endpoint,
        "error": error,
        "request_meta": request_meta or {},
        "traceback": traceback_str,
    }
    try:
        with _errors_path().open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, default=str) + "\n")
    except Exception:
        logger.exception("Failed to write admin error log")


# ── Analytics event logging ─────────────────────────────────────────

def log_event(
    event: str,
    *,
    data: dict[str, Any] | None = None,
) -> None:
    """Append an analytics event to the JSONL analytics log."""
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "data": data or {},
    }
    try:
        with _analytics_path().open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record, default=str) + "\n")
    except Exception:
        logger.exception("Failed to write admin analytics log")


# ── Quality heuristics ──────────────────────────────────────────────

def _extract_text(value: Any) -> str:
    """Recursively extract all string content from a value."""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return " ".join(_extract_text(v) for v in value.values())
    if isinstance(value, (list, tuple)):
        return " ".join(_extract_text(v) for v in value)
    return ""


def _count_fallback_phrases(text: str) -> int:
    """Count occurrences of known fallback phrases (case-insensitive)."""
    lower = text.lower()
    return sum(lower.count(phrase) for phrase in _FALLBACK_PHRASES)


def _ngrams(text: str, n: int = 4) -> list[tuple[str, ...]]:
    """Extract word-level n-grams from text."""
    words = re.findall(r"[a-z]+", text.lower())
    if len(words) < n:
        return []
    return [tuple(words[i : i + n]) for i in range(len(words) - n + 1)]


def _detect_repetition(sections_text: list[str], *, n: int = 4, threshold: int = 3) -> bool:
    """Return True if any 4-gram appears >= threshold times across all sections."""
    counter: Counter[tuple[str, ...]] = Counter()
    for text in sections_text:
        counter.update(_ngrams(text, n))
    return any(count >= threshold for count in counter.values())


def _detect_truncation(text: str) -> bool:
    """Return True if text appears truncated (ends with '...')."""
    stripped = text.rstrip()
    return stripped.endswith("...")


def _status_from_flags(flags: list[str]) -> Literal["healthy", "review", "poor"]:
    count = len(flags)
    if count == 0:
        return "healthy"
    elif count <= 2:
        return "review"
    else:
        return "poor"


def score_reading(result: dict[str, Any]) -> dict[str, Any]:
    """Score a reading result for quality issues.

    Returns a dict with ``status``, ``flags`` list, and ``details``.
    """
    flags: list[str] = []
    details: dict[str, Any] = {}

    systems = result.get("systems") or {}
    combined = result.get("combined")
    daily_block = result.get("daily")

    # -- Check each of the 8 systems present and >= 50 chars --
    missing_systems: list[str] = []
    short_systems: list[str] = []
    for name in SYSTEM_NAMES:
        sys_data = systems.get(name)
        if sys_data is None:
            missing_systems.append(name)
        else:
            text = _extract_text(sys_data)
            if len(text) < 50:
                short_systems.append(name)

    if missing_systems:
        flags.append("missing_systems")
        details["missing_systems"] = missing_systems
    if short_systems:
        flags.append("short_systems")
        details["short_systems"] = short_systems

    # -- Check combined present and >= 100 chars --
    if combined is None:
        flags.append("missing_combined")
    else:
        combined_text = _extract_text(combined)
        if len(combined_text) < 100:
            flags.append("short_combined")
            details["combined_length"] = len(combined_text)

    # -- Check daily present and >= 40 chars --
    if daily_block is None:
        flags.append("missing_daily")
    else:
        daily_text = _extract_text(daily_block)
        if len(daily_text) < 40:
            flags.append("short_daily")
            details["daily_length"] = len(daily_text)

    # -- Fallback phrase detection --
    all_text = _extract_text(result)
    fallback_count = _count_fallback_phrases(all_text)
    if fallback_count >= 5:
        flags.append("fallback_heavy")
        details["fallback_count"] = fallback_count

    status = _status_from_flags(flags)
    return {"status": status, "flags": flags, "details": details}


def score_compatibility(result: dict[str, Any]) -> dict[str, Any]:
    """Score a compatibility result for quality issues.

    Returns a dict with ``status``, ``flags`` list, and ``details``.
    """
    flags: list[str] = []
    details: dict[str, Any] = {}

    # -- Check narrative sections present and meet min char counts --
    missing_sections: list[str] = []
    short_sections: list[str] = []
    narrative_texts: list[str] = []

    for section_name in _COMPAT_NARRATIVE_SECTIONS:
        section_data = result.get(section_name)
        if section_data is None:
            missing_sections.append(section_name)
        else:
            text = _extract_text(section_data)
            narrative_texts.append(text)
            min_chars = _COMPAT_MIN_CHARS.get(section_name, 80)
            if len(text) < min_chars:
                short_sections.append(section_name)

    if missing_sections:
        flags.append("missing_sections")
        details["missing_sections"] = missing_sections
    if short_sections:
        flags.append("short_sections")
        details["short_sections"] = short_sections

    # -- Check all 8 system results present --
    systems = result.get("systems") or {}
    missing_systems: list[str] = []
    for name in SYSTEM_NAMES:
        if name not in systems:
            missing_systems.append(name)
    if missing_systems:
        flags.append("missing_systems")
        details["missing_systems"] = missing_systems

    # -- Repetition detection across narrative sections (4-gram, 3+ times) --
    if narrative_texts and _detect_repetition(narrative_texts, n=4, threshold=3):
        flags.append("repetitive_language")

    # -- Fallback phrase detection --
    all_text = _extract_text(result)
    fallback_count = _count_fallback_phrases(all_text)
    if fallback_count >= 5:
        flags.append("fallback_heavy")
        details["fallback_count"] = fallback_count

    # -- Truncation detection on narrative sections --
    truncated_sections: list[str] = []
    for section_name in _COMPAT_NARRATIVE_SECTIONS:
        section_data = result.get(section_name)
        if section_data is not None:
            text = _extract_text(section_data)
            if _detect_truncation(text):
                truncated_sections.append(section_name)
    if truncated_sections:
        flags.append("possible_truncation")
        details["truncated_sections"] = truncated_sections

    status = _status_from_flags(flags)
    return {"status": status, "flags": flags, "details": details}


# ── Health aggregation ──────────────────────────────────────────────

def _read_jsonl(path: Path) -> list[dict[str, Any]]:
    """Read all records from a JSONL file, skipping malformed lines."""
    if not path.exists():
        return []
    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return records


def _list_session_files(session_type: str | None = None) -> list[Path]:
    """List all session JSON files, optionally filtered by type."""
    files: list[Path] = []
    if session_type is None or session_type == "reading":
        rd = _base_dir() / "readings"
        if rd.exists():
            files.extend(rd.glob("*.json"))
    if session_type is None or session_type == "compatibility":
        cd = _base_dir() / "compatibility"
        if cd.exists():
            files.extend(cd.glob("*.json"))
    return sorted(files, key=lambda p: p.stem, reverse=True)


def _load_envelope(path: Path) -> dict[str, Any] | None:
    """Load a session envelope from disk, returning None on failure."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        logger.warning("Failed to load session file %s", path)
        return None


def _parse_ts(iso_str: str) -> datetime | None:
    """Parse an ISO timestamp string, returning None on failure."""
    try:
        dt = datetime.fromisoformat(iso_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


def get_health(
    hours_24: int = 24,
    hours_7d: int = 168,
) -> dict[str, Any]:
    """Compute health stats over the last 24h and 7d windows.

    Returns generation counts, error counts, avg/slowest response times,
    and success rate for both windows.
    """
    now = datetime.now(timezone.utc)

    # -- Collect session metadata --
    all_files = _list_session_files()
    sessions: list[dict[str, Any]] = []
    for f in all_files:
        envelope = _load_envelope(f)
        if envelope:
            sessions.append(envelope)

    # -- Collect errors --
    errors = _read_jsonl(_errors_path())

    def _window_stats(
        window_hours: int,
    ) -> dict[str, Any]:
        cutoff = now.timestamp() - window_hours * 3600

        # Filter sessions
        window_sessions = []
        for s in sessions:
            ts = _parse_ts(s.get("timestamp", ""))
            if ts and ts.timestamp() >= cutoff:
                window_sessions.append(s)

        # Filter errors
        window_errors = []
        for e in errors:
            ts = _parse_ts(e.get("timestamp", ""))
            if ts and ts.timestamp() >= cutoff:
                window_errors.append(e)

        reading_count = sum(1 for s in window_sessions if s.get("type") == "reading")
        compat_count = sum(1 for s in window_sessions if s.get("type") == "compatibility")
        total_gen = reading_count + compat_count
        error_count = len(window_errors)

        # Duration stats
        durations = [
            s["duration_ms"]
            for s in window_sessions
            if isinstance(s.get("duration_ms"), (int, float))
        ]
        avg_duration = round(sum(durations) / len(durations), 1) if durations else 0.0
        slowest = max(durations) if durations else 0.0

        success_rate = (
            round(total_gen / (total_gen + error_count), 3)
            if (total_gen + error_count) > 0
            else 1.0
        )

        return {
            "readings": reading_count,
            "compatibility": compat_count,
            "total_generations": total_gen,
            "errors": error_count,
            "avg_duration_ms": avg_duration,
            "slowest_duration_ms": slowest,
            "success_rate": success_rate,
            "recent_errors": window_errors[-10:],
        }

    return {
        "last_24h": _window_stats(hours_24),
        "last_7d": _window_stats(hours_7d),
    }


# ── Analytics aggregation ───────────────────────────────────────────

def get_analytics(
    limit: int = 50,
    hours: int | None = None,
) -> dict[str, Any]:
    """Aggregate analytics events.

    Returns event counts, section view counts, and the most recent events.
    When *hours* is provided, only events within that time window are included.
    """
    records = _read_jsonl(_analytics_path())

    # Apply time window filter if requested
    if hours is not None:
        cutoff = datetime.now(timezone.utc).timestamp() - hours * 3600
        records = [
            r for r in records
            if (_parse_ts(r.get("timestamp", "")) or _parse_ts("2000-01-01")).timestamp() >= cutoff
        ]

    # Event counts
    event_counts: Counter[str] = Counter()
    section_views: Counter[str] = Counter()

    for record in records:
        event_name = record.get("event", "unknown")
        event_counts[event_name] += 1
        data = record.get("data") or {}
        if event_name == "section_view" and "section" in data:
            section_views[data["section"]] += 1

    # Recent events (most recent first)
    recent = list(reversed(records[-limit:]))

    return {
        "total_events": len(records),
        "event_counts": dict(event_counts.most_common()),
        "section_views": dict(section_views.most_common()),
        "recent": recent,
        "period_hours": hours,
    }


# ── Session listing ─────────────────────────────────────────────────

def list_sessions(
    *,
    session_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> dict[str, Any]:
    """List stored sessions sorted by date (newest first).

    Optionally filter by ``session_type`` ('reading' or 'compatibility').
    Returns lightweight summaries without full result payloads.
    """
    files = _list_session_files(session_type)
    total = len(files)

    page = files[offset : offset + limit]
    items: list[dict[str, Any]] = []
    for f in page:
        envelope = _load_envelope(f)
        if not envelope:
            continue
        quality = envelope.get("quality") or {}
        items.append({
            "session_id": envelope.get("session_id", f.stem),
            "type": envelope.get("type", "unknown"),
            "timestamp": envelope.get("timestamp"),
            "duration_ms": envelope.get("duration_ms"),
            "quality_status": quality.get("status", "unknown"),
            "quality_flags": quality.get("flags", []),
        })

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "sessions": items,
    }


# ── Session detail ──────────────────────────────────────────────────

def get_session(session_id: str) -> dict[str, Any] | None:
    """Get a single session by ID. Searches both readings and compatibility.

    Returns the full envelope including the result payload, or None if not found.
    """
    # Try readings first
    path = _base_dir() / "readings" / f"{session_id}.json"
    if path.exists():
        return _load_envelope(path)

    # Try compatibility
    path = _base_dir() / "compatibility" / f"{session_id}.json"
    if path.exists():
        return _load_envelope(path)

    return None


# ── Quality summary ─────────────────────────────────────────────────

def get_quality_summary(
    *,
    session_type: str | None = None,
    limit: int = 100,
) -> dict[str, Any]:
    """Aggregate quality status counts and top flags across recent sessions.

    Returns status distribution, top flags, and breakdown by type.
    """
    files = _list_session_files(session_type)[:limit]

    status_counts: Counter[str] = Counter()
    flag_counts: Counter[str] = Counter()
    type_status: dict[str, Counter[str]] = {
        "reading": Counter(),
        "compatibility": Counter(),
    }

    for f in files:
        envelope = _load_envelope(f)
        if not envelope:
            continue

        quality = envelope.get("quality") or {}
        status = quality.get("status", "unknown")
        flags = quality.get("flags", [])
        session_type_val = envelope.get("type", "unknown")

        status_counts[status] += 1
        for flag in flags:
            flag_counts[flag] += 1

        if session_type_val in type_status:
            type_status[session_type_val][status] += 1

    return {
        "total_reviewed": sum(status_counts.values()),
        "status_counts": dict(status_counts),
        "top_flags": dict(flag_counts.most_common(10)),
        "by_type": {
            k: dict(v) for k, v in type_status.items()
        },
    }
