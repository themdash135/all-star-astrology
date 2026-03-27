"""Comprehensive tests for backend/admin.py.

Uses tmp_path fixture and monkeypatching to isolate all file I/O from
real storage directories.
"""

import json
import time
import pytest
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import patch

from backend import admin
from backend.admin import (
    SYSTEM_NAMES,
    get_analytics,
    get_health,
    get_quality_summary,
    get_session,
    list_sessions,
    log_error,
    log_event,
    save_compatibility,
    save_reading,
    score_compatibility,
    score_reading,
)


# ── Helpers ────────────────────────────────────────────────────────

def _make_system_payload(text: str = "A" * 60) -> dict:
    """Return a dummy system payload with enough text to pass the 50-char check."""
    return {"narrative": text}


def _healthy_reading_result() -> dict:
    """Return a result dict that scores as healthy."""
    systems = {name: _make_system_payload() for name in SYSTEM_NAMES}
    combined = {"narrative": "C" * 120}
    daily = {"message": "D" * 50}
    return {"systems": systems, "combined": combined, "daily": daily}


def _healthy_compat_result() -> dict:
    """Return a compatibility result dict that scores as healthy."""
    sections = {
        "tier1_synthesis": "T" * 120,
        "relationship_roles": "R" * 100,
        "when_you_clash": "W" * 100,
        "relationship_playbook": "P" * 120,
        "couple_guide": "G" * 120,
    }
    systems = {name: _make_system_payload() for name in SYSTEM_NAMES}
    return {**sections, "systems": systems}


@pytest.fixture(autouse=True)
def _isolate_storage(tmp_path, monkeypatch):
    """Point all admin storage to a temporary directory for every test."""
    monkeypatch.setattr(admin, "_STORAGE_BASE", str(tmp_path / "admin"))


# ── score_reading ─────────────────────────────────────────────────


class TestScoreReading:
    def test_healthy_reading(self):
        result = _healthy_reading_result()
        score = score_reading(result)
        assert score["status"] == "healthy"
        assert score["flags"] == []

    def test_missing_one_system(self):
        result = _healthy_reading_result()
        del result["systems"]["western"]
        score = score_reading(result)
        assert "missing_systems" in score["flags"]
        assert "western" in score["details"]["missing_systems"]
        # 1 flag => "review"
        assert score["status"] == "review"

    def test_missing_multiple_systems(self):
        result = _healthy_reading_result()
        del result["systems"]["western"]
        del result["systems"]["vedic"]
        del result["systems"]["chinese"]
        del result["systems"]["bazi"]
        score = score_reading(result)
        assert "missing_systems" in score["flags"]
        assert len(score["details"]["missing_systems"]) == 4

    def test_short_system(self):
        result = _healthy_reading_result()
        result["systems"]["persian"] = {"narrative": "tiny"}
        score = score_reading(result)
        assert "short_systems" in score["flags"]
        assert "persian" in score["details"]["short_systems"]

    def test_missing_combined(self):
        result = _healthy_reading_result()
        del result["combined"]
        score = score_reading(result)
        assert "missing_combined" in score["flags"]

    def test_short_combined(self):
        result = _healthy_reading_result()
        result["combined"] = {"narrative": "short"}
        score = score_reading(result)
        assert "short_combined" in score["flags"]
        assert "combined_length" in score["details"]

    def test_missing_daily(self):
        result = _healthy_reading_result()
        del result["daily"]
        score = score_reading(result)
        assert "missing_daily" in score["flags"]

    def test_short_daily(self):
        result = _healthy_reading_result()
        result["daily"] = {"message": "hi"}
        score = score_reading(result)
        assert "short_daily" in score["flags"]

    def test_fallback_heavy(self):
        result = _healthy_reading_result()
        # Inject 5+ fallback phrases into system data
        phrases = [
            "the stars suggest",
            "cosmic energy",
            "universal forces",
            "trust the process",
            "everything happens for a reason",
        ]
        result["systems"]["western"]["narrative"] = ". ".join(phrases) + ". " + "A" * 60
        score = score_reading(result)
        assert "fallback_heavy" in score["flags"]
        assert score["details"]["fallback_count"] >= 5

    def test_poor_status_with_many_flags(self):
        result = {
            "systems": {},
            # missing combined and daily too
        }
        score = score_reading(result)
        # missing_systems (8 systems), missing_combined, missing_daily => 3+ flags
        assert score["status"] == "poor"
        assert len(score["flags"]) >= 3

    def test_review_status_with_two_flags(self):
        result = _healthy_reading_result()
        del result["combined"]
        del result["daily"]
        score = score_reading(result)
        assert score["status"] == "review"
        assert len(score["flags"]) == 2

    def test_empty_result(self):
        score = score_reading({})
        assert score["status"] == "poor"
        assert "missing_combined" in score["flags"]
        assert "missing_daily" in score["flags"]


# ── score_compatibility ───────────────────────────────────────────


class TestScoreCompatibility:
    def test_healthy(self):
        result = _healthy_compat_result()
        score = score_compatibility(result)
        assert score["status"] == "healthy"
        assert score["flags"] == []

    def test_missing_tier1_synthesis(self):
        result = _healthy_compat_result()
        del result["tier1_synthesis"]
        score = score_compatibility(result)
        assert "missing_sections" in score["flags"]
        assert "tier1_synthesis" in score["details"]["missing_sections"]

    def test_missing_multiple_sections(self):
        result = _healthy_compat_result()
        del result["tier1_synthesis"]
        del result["couple_guide"]
        score = score_compatibility(result)
        assert "missing_sections" in score["flags"]
        assert set(score["details"]["missing_sections"]) == {"tier1_synthesis", "couple_guide"}

    def test_short_section(self):
        result = _healthy_compat_result()
        result["tier1_synthesis"] = "tiny"  # needs 100 chars
        score = score_compatibility(result)
        assert "short_sections" in score["flags"]
        assert "tier1_synthesis" in score["details"]["short_sections"]

    def test_missing_systems(self):
        result = _healthy_compat_result()
        del result["systems"]["vedic"]
        score = score_compatibility(result)
        assert "missing_systems" in score["flags"]
        assert "vedic" in score["details"]["missing_systems"]

    def test_repetitive_language(self):
        result = _healthy_compat_result()
        # Create a 4-gram that appears 3+ times across sections
        repeated_phrase = "the quick brown fox jumps over the lazy dog "
        # Put the same text into multiple sections so the 4-gram appears >= 3 times
        for section in ("tier1_synthesis", "relationship_roles", "when_you_clash"):
            result[section] = repeated_phrase * 10 + "X" * 120
        score = score_compatibility(result)
        assert "repetitive_language" in score["flags"]

    def test_fallback_heavy(self):
        result = _healthy_compat_result()
        phrases = [
            "the stars suggest",
            "cosmic energy",
            "universal forces",
            "trust the process",
            "everything happens for a reason",
        ]
        result["tier1_synthesis"] = ". ".join(phrases) + ". " + "X" * 120
        score = score_compatibility(result)
        assert "fallback_heavy" in score["flags"]

    def test_possible_truncation(self):
        result = _healthy_compat_result()
        result["tier1_synthesis"] = "A" * 120 + "..."
        score = score_compatibility(result)
        assert "possible_truncation" in score["flags"]
        assert "tier1_synthesis" in score["details"]["truncated_sections"]

    def test_empty_result(self):
        score = score_compatibility({})
        # Empty dict => missing_sections + missing_systems = 2 flags => "review"
        assert score["status"] == "review"
        assert "missing_sections" in score["flags"]
        assert "missing_systems" in score["flags"]

    def test_no_truncation_on_normal_text(self):
        result = _healthy_compat_result()
        score = score_compatibility(result)
        assert "possible_truncation" not in score["flags"]


# ── save_reading / save_compatibility ─────────────────────────────


class TestStorage:
    def test_save_reading_creates_file(self, tmp_path):
        result = _healthy_reading_result()
        session_id = save_reading(result, duration_ms=1234.5)
        assert isinstance(session_id, str)
        assert len(session_id) > 0

        path = tmp_path / "admin" / "readings" / f"{session_id}.json"
        assert path.exists()

        envelope = json.loads(path.read_text(encoding="utf-8"))
        assert envelope["session_id"] == session_id
        assert envelope["type"] == "reading"
        assert envelope["duration_ms"] == 1234.5
        assert envelope["quality"]["status"] == "healthy"

    def test_save_reading_with_request_meta(self, tmp_path):
        result = _healthy_reading_result()
        meta = {"birth_date": "1990-01-01"}
        session_id = save_reading(result, request_meta=meta)

        path = tmp_path / "admin" / "readings" / f"{session_id}.json"
        envelope = json.loads(path.read_text(encoding="utf-8"))
        assert envelope["request_meta"] == meta

    def test_save_reading_default_meta(self, tmp_path):
        result = _healthy_reading_result()
        session_id = save_reading(result)

        path = tmp_path / "admin" / "readings" / f"{session_id}.json"
        envelope = json.loads(path.read_text(encoding="utf-8"))
        assert envelope["request_meta"] == {}
        assert envelope["duration_ms"] is None

    def test_save_compatibility_creates_file(self, tmp_path):
        result = _healthy_compat_result()
        session_id = save_compatibility(result, duration_ms=5678)
        assert isinstance(session_id, str)

        path = tmp_path / "admin" / "compatibility" / f"{session_id}.json"
        assert path.exists()

        envelope = json.loads(path.read_text(encoding="utf-8"))
        assert envelope["type"] == "compatibility"
        assert envelope["duration_ms"] == 5678
        assert "status" in envelope["quality"]

    def test_save_reading_produces_valid_json(self, tmp_path):
        result = _healthy_reading_result()
        session_id = save_reading(result)
        path = tmp_path / "admin" / "readings" / f"{session_id}.json"
        # Should not raise
        data = json.loads(path.read_text(encoding="utf-8"))
        assert "session_id" in data

    def test_session_ids_are_unique(self):
        result = _healthy_reading_result()
        ids = {save_reading(result) for _ in range(10)}
        assert len(ids) == 10


# ── log_error / log_event ─────────────────────────────────────────


class TestLogging:
    def test_log_error_creates_file(self, tmp_path):
        log_error("/api/reading", "something broke")
        path = tmp_path / "admin" / "errors.jsonl"
        assert path.exists()

    def test_log_error_appends_valid_json(self, tmp_path):
        log_error("/api/reading", "error one")
        log_error("/api/ask", "error two", request_meta={"q": "test"})
        path = tmp_path / "admin" / "errors.jsonl"
        lines = [l for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]
        assert len(lines) == 2
        for line in lines:
            record = json.loads(line)
            assert "timestamp" in record
            assert "endpoint" in record
            assert "error" in record

    def test_log_error_includes_traceback(self, tmp_path):
        log_error("/api/reading", "fail", traceback_str="Traceback ...")
        path = tmp_path / "admin" / "errors.jsonl"
        record = json.loads(path.read_text(encoding="utf-8").strip())
        assert record["traceback"] == "Traceback ..."

    def test_log_event_creates_file(self, tmp_path):
        log_event("page_view")
        path = tmp_path / "admin" / "analytics.jsonl"
        assert path.exists()

    def test_log_event_appends_valid_json(self, tmp_path):
        log_event("page_view", data={"page": "home"})
        log_event("section_view", data={"section": "oracle"})
        log_event("button_click")
        path = tmp_path / "admin" / "analytics.jsonl"
        lines = [l for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]
        assert len(lines) == 3
        for line in lines:
            record = json.loads(line)
            assert "timestamp" in record
            assert "event" in record

    def test_log_event_default_data(self, tmp_path):
        log_event("click")
        path = tmp_path / "admin" / "analytics.jsonl"
        record = json.loads(path.read_text(encoding="utf-8").strip())
        assert record["data"] == {}


# ── get_health ────────────────────────────────────────────────────


class TestGetHealth:
    def test_empty_data_shape(self):
        health = get_health()
        assert "last_24h" in health
        assert "last_7d" in health
        for window in (health["last_24h"], health["last_7d"]):
            assert window["readings"] == 0
            assert window["compatibility"] == 0
            assert window["total_generations"] == 0
            assert window["errors"] == 0
            assert window["avg_duration_ms"] == 0.0
            assert window["slowest_duration_ms"] == 0.0
            assert window["success_rate"] == 1.0
            assert window["recent_errors"] == []

    def test_with_sessions(self):
        save_reading(_healthy_reading_result(), duration_ms=100)
        save_reading(_healthy_reading_result(), duration_ms=200)
        save_compatibility(_healthy_compat_result(), duration_ms=300)

        health = get_health()
        w24 = health["last_24h"]
        assert w24["readings"] == 2
        assert w24["compatibility"] == 1
        assert w24["total_generations"] == 3
        assert w24["avg_duration_ms"] == 200.0  # (100+200+300)/3
        assert w24["slowest_duration_ms"] == 300

    def test_with_errors(self):
        save_reading(_healthy_reading_result(), duration_ms=100)
        log_error("/api/reading", "boom")
        log_error("/api/ask", "crash")

        health = get_health()
        w24 = health["last_24h"]
        assert w24["errors"] == 2
        assert w24["total_generations"] == 1
        # success_rate = 1 / (1+2) = 0.333
        assert w24["success_rate"] == pytest.approx(0.333, abs=0.001)

    def test_recent_errors_capped(self):
        for i in range(15):
            log_error("/api/reading", f"error {i}")
        health = get_health()
        assert len(health["last_24h"]["recent_errors"]) == 10


# ── list_sessions ─────────────────────────────────────────────────


class TestListSessions:
    def test_empty(self):
        result = list_sessions()
        assert result["total"] == 0
        assert result["sessions"] == []

    def test_returns_records_sorted_by_date(self):
        id1 = save_reading(_healthy_reading_result())
        id2 = save_reading(_healthy_reading_result())
        id3 = save_compatibility(_healthy_compat_result())

        result = list_sessions()
        assert result["total"] == 3
        ids = [s["session_id"] for s in result["sessions"]]
        # Should be newest first (reverse sorted by stem)
        assert ids == sorted(ids, reverse=True)

    def test_type_filter_reading(self):
        save_reading(_healthy_reading_result())
        save_compatibility(_healthy_compat_result())

        result = list_sessions(session_type="reading")
        assert result["total"] == 1
        assert result["sessions"][0]["type"] == "reading"

    def test_type_filter_compatibility(self):
        save_reading(_healthy_reading_result())
        save_compatibility(_healthy_compat_result())

        result = list_sessions(session_type="compatibility")
        assert result["total"] == 1
        assert result["sessions"][0]["type"] == "compatibility"

    def test_pagination(self):
        for _ in range(5):
            save_reading(_healthy_reading_result())

        result = list_sessions(limit=2, offset=0)
        assert result["total"] == 5
        assert len(result["sessions"]) == 2
        assert result["limit"] == 2
        assert result["offset"] == 0

        result2 = list_sessions(limit=2, offset=2)
        assert len(result2["sessions"]) == 2
        assert result2["offset"] == 2

    def test_session_summary_fields(self):
        save_reading(_healthy_reading_result(), duration_ms=999)
        result = list_sessions()
        session = result["sessions"][0]
        assert "session_id" in session
        assert "type" in session
        assert "timestamp" in session
        assert "duration_ms" in session
        assert "quality_status" in session
        assert "quality_flags" in session


# ── get_session ───────────────────────────────────────────────────


class TestGetSession:
    def test_returns_reading_by_id(self):
        sid = save_reading(_healthy_reading_result(), duration_ms=42)
        envelope = get_session(sid)
        assert envelope is not None
        assert envelope["session_id"] == sid
        assert envelope["type"] == "reading"

    def test_returns_compatibility_by_id(self):
        sid = save_compatibility(_healthy_compat_result())
        envelope = get_session(sid)
        assert envelope is not None
        assert envelope["type"] == "compatibility"

    def test_returns_none_for_missing_id(self):
        assert get_session("nonexistent-00000000") is None

    def test_full_envelope_content(self):
        result = _healthy_reading_result()
        sid = save_reading(result, duration_ms=100, request_meta={"k": "v"})
        envelope = get_session(sid)
        assert envelope["result"] == result
        assert envelope["request_meta"] == {"k": "v"}
        assert "quality" in envelope


# ── get_quality_summary ───────────────────────────────────────────


class TestGetQualitySummary:
    def test_empty(self):
        summary = get_quality_summary()
        assert summary["total_reviewed"] == 0
        assert summary["status_counts"] == {}
        assert summary["top_flags"] == {}

    def test_aggregates_status_counts(self):
        # Healthy readings
        for _ in range(3):
            save_reading(_healthy_reading_result())

        # A poor reading (empty result)
        save_reading({})

        summary = get_quality_summary()
        assert summary["total_reviewed"] == 4
        assert summary["status_counts"]["healthy"] == 3
        assert summary["status_counts"]["poor"] == 1

    def test_top_flags(self):
        # Create several readings with known flags
        for _ in range(3):
            save_reading({})  # will produce missing_systems, missing_combined, missing_daily

        summary = get_quality_summary()
        # Each empty reading produces missing_combined and missing_daily
        assert "missing_combined" in summary["top_flags"]
        assert "missing_daily" in summary["top_flags"]

    def test_by_type_breakdown(self):
        save_reading(_healthy_reading_result())
        save_compatibility(_healthy_compat_result())
        save_reading({})  # poor

        summary = get_quality_summary()
        assert summary["by_type"]["reading"]["healthy"] == 1
        assert summary["by_type"]["reading"]["poor"] == 1
        assert summary["by_type"]["compatibility"]["healthy"] == 1

    def test_type_filter(self):
        save_reading(_healthy_reading_result())
        save_compatibility(_healthy_compat_result())

        summary = get_quality_summary(session_type="reading")
        assert summary["total_reviewed"] == 1

    def test_limit(self):
        for _ in range(10):
            save_reading(_healthy_reading_result())

        summary = get_quality_summary(limit=5)
        assert summary["total_reviewed"] == 5


# ── get_analytics ─────────────────────────────────────────────────


class TestGetAnalytics:
    def test_empty(self):
        result = get_analytics()
        assert result["total_events"] == 0
        assert result["event_counts"] == {}
        assert result["section_views"] == {}
        assert result["recent"] == []
        assert result["period_hours"] is None

    def test_counts_events(self):
        log_event("page_view")
        log_event("page_view")
        log_event("button_click")

        result = get_analytics()
        assert result["total_events"] == 3
        assert result["event_counts"]["page_view"] == 2
        assert result["event_counts"]["button_click"] == 1

    def test_section_views(self):
        log_event("section_view", data={"section": "oracle"})
        log_event("section_view", data={"section": "oracle"})
        log_event("section_view", data={"section": "home"})

        result = get_analytics()
        assert result["section_views"]["oracle"] == 2
        assert result["section_views"]["home"] == 1

    def test_recent_events_ordering(self):
        log_event("first")
        log_event("second")
        log_event("third")

        result = get_analytics()
        # Recent should be most recent first (reversed)
        assert result["recent"][0]["event"] == "third"
        assert result["recent"][-1]["event"] == "first"

    def test_limit_recent(self):
        for i in range(10):
            log_event(f"event_{i}")

        result = get_analytics(limit=3)
        assert len(result["recent"]) == 3

    def test_hours_filter_no_filter(self):
        """Without hours filter, all events are returned."""
        log_event("test_event")
        result = get_analytics()
        assert result["total_events"] == 1
        assert result["period_hours"] is None

    def test_hours_filter_works(self):
        """get_analytics with hours parameter filters events by time window."""
        log_event("test_event")
        result = get_analytics(hours=24)
        assert result["total_events"] >= 1
        assert result["period_hours"] == 24


# ── Internal helpers ──────────────────────────────────────────────


class TestInternalHelpers:
    def test_extract_text_string(self):
        assert admin._extract_text("hello") == "hello"

    def test_extract_text_dict(self):
        result = admin._extract_text({"a": "hello", "b": "world"})
        assert "hello" in result
        assert "world" in result

    def test_extract_text_list(self):
        result = admin._extract_text(["hello", "world"])
        assert "hello" in result
        assert "world" in result

    def test_extract_text_nested(self):
        result = admin._extract_text({"a": {"b": ["deep", "text"]}})
        assert "deep" in result
        assert "text" in result

    def test_extract_text_non_string(self):
        assert admin._extract_text(42) == ""
        assert admin._extract_text(None) == ""

    def test_count_fallback_phrases(self):
        text = "the stars suggest you should trust the process and feel cosmic energy"
        count = admin._count_fallback_phrases(text)
        assert count == 3

    def test_count_fallback_case_insensitive(self):
        text = "The Stars Suggest COSMIC ENERGY"
        count = admin._count_fallback_phrases(text)
        assert count == 2

    def test_ngrams(self):
        grams = admin._ngrams("the quick brown fox jumps", n=4)
        assert len(grams) == 2
        assert grams[0] == ("the", "quick", "brown", "fox")
        assert grams[1] == ("quick", "brown", "fox", "jumps")

    def test_ngrams_short_text(self):
        assert admin._ngrams("one two three", n=4) == []

    def test_detect_repetition_true(self):
        texts = [
            "the quick brown fox jumps over the lazy dog",
            "the quick brown fox jumps again today",
            "once more the quick brown fox appears",
        ]
        assert admin._detect_repetition(texts, n=4, threshold=3) is True

    def test_detect_repetition_false(self):
        texts = ["alpha beta gamma delta", "epsilon zeta eta theta"]
        assert admin._detect_repetition(texts, n=4, threshold=3) is False

    def test_detect_truncation_true(self):
        assert admin._detect_truncation("some text that ends...") is True
        assert admin._detect_truncation("trailing dots...   ") is True

    def test_detect_truncation_false(self):
        assert admin._detect_truncation("normal sentence.") is False
        assert admin._detect_truncation("") is False

    def test_status_from_flags(self):
        assert admin._status_from_flags([]) == "healthy"
        assert admin._status_from_flags(["a"]) == "review"
        assert admin._status_from_flags(["a", "b"]) == "review"
        assert admin._status_from_flags(["a", "b", "c"]) == "poor"
        assert admin._status_from_flags(["a", "b", "c", "d"]) == "poor"
