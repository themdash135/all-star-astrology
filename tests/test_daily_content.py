"""Tests for the Daily Content Engine Phase A."""

from __future__ import annotations

from datetime import date, datetime, time, timezone
from zoneinfo import ZoneInfo

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from backend.engines import daily
import backend.main as main


def _system(name: str, scores: dict[str, float], highlights: list[dict[str, str]] | None = None) -> dict:
    return {
        "id": name.lower(),
        "name": name,
        "headline": name,
        "summary": [],
        "highlights": highlights or [],
        "scores": {area: {"value": value, "label": "ok"} for area, value in scores.items()},
    }


SAMPLE_CONTEXT = {
    "birth_date": date(1990, 4, 21),
    "birth_time": time(14, 30),
    "birth_location": "New York, NY",
    "full_name": "Jane Doe",
    "hebrew_name": "",
    "location": {"name": "New York, NY", "latitude": 40.7128, "longitude": -74.0060, "timezone": "America/New_York"},
    "timezone": "America/New_York",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "birth_local": datetime(1990, 4, 21, 14, 30, tzinfo=ZoneInfo("America/New_York")),
    "birth_utc": datetime(1990, 4, 21, 18, 30, tzinfo=timezone.utc),
    "jd_ut": 0.0,
    "now_local": datetime(2026, 3, 12, 9, 15, tzinfo=ZoneInfo("America/New_York")),
    "now_utc": datetime(2026, 3, 12, 13, 15, tzinfo=timezone.utc),
    "current_jd_ut": 0.0,
    "age_years": 35.9,
}

SAMPLE_SYSTEMS = {
    "western": _system(
        "Western",
        {"love": 78, "career": 58, "health": 44, "wealth": 51, "mood": 62},
        highlights=[
            {"label": "Sun sign", "value": "Gemini"},
            {"label": "Moon sign", "value": "Pisces"},
            {"label": "Rising sign", "value": "Libra"},
        ],
    ),
    "vedic": _system(
        "Vedic",
        {"love": 71, "career": 56, "health": 40, "wealth": 49, "mood": 57},
        highlights=[{"label": "Nakshatra", "value": "Rohini"}],
    ),
    "chinese": _system(
        "Chinese",
        {"love": 68, "career": 52, "health": 47, "wealth": 54, "mood": 55},
        highlights=[{"label": "Animal sign", "value": "Earth Horse"}],
    ),
    "bazi": _system(
        "BaZi",
        {"love": 74, "career": 59, "health": 42, "wealth": 53, "mood": 54},
        highlights=[{"label": "Day Master", "value": "Water (Gui)"}],
    ),
    "numerology": _system(
        "Numerology",
        {"love": 66, "career": 50, "health": 46, "wealth": 55, "mood": 58},
        highlights=[{"label": "Life Path", "value": "5"}],
    ),
    "kabbalistic": _system(
        "Kabbalistic",
        {"love": 63, "career": 48, "health": 45, "wealth": 50, "mood": 56},
    ),
    "gematria": _system(
        "Gematria",
        {"love": 60, "career": 47, "health": 43, "wealth": 52, "mood": 53},
    ),
    "persian": _system(
        "Persian",
        {"love": 69, "career": 54, "health": 41, "wealth": 57, "mood": 59},
    ),
}

SAMPLE_COMBINED = {
    "probabilities": {
        "love": {
            "value": 71.8,
            "sentiment": "positive",
            "confidence": 62.5,
            "agreeing_systems": ["Western", "Vedic", "BaZi", "Chinese", "Numerology"],
            "leaders": [{"name": "Western", "value": 78}, {"name": "BaZi", "value": 74}, {"name": "Vedic", "value": 71}],
            "laggards": [{"name": "Gematria", "value": 60}],
        },
        "career": {
            "value": 54.1,
            "sentiment": "mixed",
            "confidence": 37.5,
            "agreeing_systems": ["Western", "Vedic", "BaZi"],
            "leaders": [{"name": "BaZi", "value": 59}, {"name": "Western", "value": 58}, {"name": "Vedic", "value": 56}],
            "laggards": [{"name": "Gematria", "value": 47}],
        },
        "health": {
            "value": 43.0,
            "sentiment": "challenging",
            "confidence": 62.5,
            "agreeing_systems": ["Western", "Vedic", "BaZi", "Gematria", "Persian"],
            "leaders": [{"name": "Chinese", "value": 47}, {"name": "Numerology", "value": 46}, {"name": "Kabbalistic", "value": 45}],
            "laggards": [{"name": "Vedic", "value": 40}],
        },
        "wealth": {
            "value": 52.6,
            "sentiment": "mixed",
            "confidence": 50.0,
            "agreeing_systems": ["Western", "Chinese", "BaZi", "Persian"],
            "leaders": [{"name": "Persian", "value": 57}, {"name": "Numerology", "value": 55}, {"name": "Chinese", "value": 54}],
            "laggards": [{"name": "Vedic", "value": 49}],
        },
        "mood": {
            "value": 56.8,
            "sentiment": "mixed",
            "confidence": 50.0,
            "agreeing_systems": ["Western", "Numerology", "Persian", "Vedic"],
            "leaders": [{"name": "Western", "value": 62}, {"name": "Persian", "value": 59}, {"name": "Numerology", "value": 58}],
            "laggards": [{"name": "Gematria", "value": 53}],
        },
    }
}


def test_daily_content_returns_expected_shape():
    result = daily.calculate(SAMPLE_CONTEXT, SAMPLE_SYSTEMS, SAMPLE_COMBINED)

    assert result["id"] == "daily"
    assert result["date"] == "2026-03-12"
    assert result["date_label"] == "Thursday, March 12"
    assert result["focus"]["area"] == "love"
    assert result["caution"]["area"] == "health"
    assert len(result["dos"]) == 3
    assert len(result["donts"]) == 3


def test_daily_content_weaves_chart_anchor_into_message():
    result = daily.calculate(SAMPLE_CONTEXT, SAMPLE_SYSTEMS, SAMPLE_COMBINED)

    assert "Gemini" in result["message"]
    assert "5 of 8 systems" in result["message"]
    assert "Health is the place to handle gently." in result["message"]


def test_reading_endpoint_includes_daily_block(monkeypatch):
    monkeypatch.setattr(main, "build_context", lambda payload: SAMPLE_CONTEXT)
    monkeypatch.setattr(main.western, "calculate", lambda context: SAMPLE_SYSTEMS["western"])
    monkeypatch.setattr(main.vedic, "calculate", lambda context: SAMPLE_SYSTEMS["vedic"])
    monkeypatch.setattr(main.chinese, "calculate", lambda context: SAMPLE_SYSTEMS["chinese"])
    monkeypatch.setattr(main.bazi, "calculate", lambda context: SAMPLE_SYSTEMS["bazi"])
    monkeypatch.setattr(main.numerology, "calculate", lambda context: SAMPLE_SYSTEMS["numerology"])
    monkeypatch.setattr(main.kabbalistic, "calculate", lambda context: SAMPLE_SYSTEMS["kabbalistic"])
    monkeypatch.setattr(main.gematria, "calculate", lambda context: SAMPLE_SYSTEMS["gematria"])
    monkeypatch.setattr(main.persian, "calculate", lambda context: SAMPLE_SYSTEMS["persian"])
    monkeypatch.setattr(main.combined, "calculate", lambda context, systems: SAMPLE_COMBINED)

    payload = main.reading(
        main.ReadingRequest(
            birth_date="1990-04-21",
            birth_time="14:30",
            birth_location="New York, NY",
            full_name="Jane Doe",
            hebrew_name="",
        )
    )

    assert "daily" in payload
    assert payload["daily"]["focus"]["area"] == "love"
    assert payload["daily"]["caution"]["area"] == "health"
