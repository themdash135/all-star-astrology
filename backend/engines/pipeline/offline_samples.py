"""Representative offline reading/case fixtures for smoke and replay tooling."""

from __future__ import annotations

from typing import Any


def _score_block(love: int, career: int, health: int, wealth: int, mood: int) -> dict[str, dict[str, Any]]:
    values = {"love": love, "career": career, "health": health, "wealth": wealth, "mood": mood}

    def _label(value: int) -> str:
        if value >= 70:
            return "Strong alignment"
        if value >= 58:
            return "Supportive alignment"
        if value >= 42:
            return "Mixed alignment"
        return "Weaker alignment"

    return {area: {"value": value, "label": _label(value)} for area, value in values.items()}


def sample_reading() -> dict[str, Any]:
    return {
        "systems": {
            "western": {
                "name": "Western Astrology",
                "scores": _score_block(66, 82, 55, 61, 58),
                "highlights": [
                    {"label": "Midheaven", "value": "Capricorn in House 10"},
                    {"label": "Venus", "value": "Pisces in House 7"},
                    {"label": "Moon sign", "value": "Cancer in House 4"},
                    {"label": "Transit Jupiter", "value": "Jupiter trine Midheaven"},
                    {"label": "Moon phase", "value": "Waxing Crescent"},
                ],
                "tables": [],
            },
            "vedic": {
                "name": "Vedic Astrology",
                "scores": _score_block(62, 79, 57, 60, 54),
                "highlights": [
                    {"label": "Moon Nakshatra", "value": "Rohini"},
                    {"label": "Mahadasha", "value": "Mercury"},
                    {"label": "Antardasha", "value": "Venus"},
                    {"label": "Lagna lord", "value": "in House 10"},
                    {"label": "Tithi", "value": "Shukla Paksha"},
                ],
                "tables": [],
            },
            "bazi": {
                "name": "BaZi (Four Pillars)",
                "scores": _score_block(52, 84, 59, 74, 50),
                "highlights": [
                    {"label": "Day Master", "value": "Yang Wood"},
                    {"label": "Strength", "value": "Strong"},
                    {"label": "Favorable element", "value": "Water"},
                    {"label": "Direct Officer", "value": "Active in month pillar"},
                ],
                "tables": [],
            },
            "numerology": {
                "name": "Numerology",
                "scores": _score_block(58, 69, 51, 63, 71),
                "highlights": [
                    {"label": "Life Path", "value": "8 - executive focus"},
                    {"label": "Personal Year", "value": "1 - initiation"},
                    {"label": "Personal Month", "value": "5 - movement"},
                ],
                "tables": [],
            },
            "chinese": {
                "name": "Chinese Zodiac",
                "scores": _score_block(60, 67, 49, 64, 55),
                "highlights": [
                    {"label": "Year animal", "value": "Horse"},
                    {"label": "Current year animal", "value": "Snake"},
                    {"label": "Year relation", "value": "supportive alliance"},
                ],
                "tables": [],
            },
            "kabbalistic": {
                "name": "Kabbalistic",
                "scores": _score_block(55, 52, 47, 45, 77),
                "highlights": [
                    {"label": "Soul Sefirah", "value": "Tiferet"},
                    {"label": "Path theme", "value": "integration and balance"},
                    {"label": "Name sefirah", "value": "Hod"},
                ],
                "tables": [],
            },
            "gematria": {
                "name": "Gematria",
                "scores": _score_block(49, 51, 44, 48, 59),
                "highlights": [
                    {"label": "Bridge root", "value": "27 - disciplined growth"},
                    {"label": "Ordinal root", "value": "9 - completion"},
                    {"label": "Source type", "value": "full name"},
                ],
                "tables": [],
            },
            "persian": {
                "name": "Persian Astrology",
                "scores": _score_block(57, 76, 61, 68, 56),
                "highlights": [
                    {"label": "Triplicity rulers", "value": "2 strong rulers"},
                    {"label": "Current Moon", "value": "Taurus"},
                    {"label": "Current Sun", "value": "Aries"},
                    {"label": "Planetary hour", "value": "Mercury"},
                    {"label": "Moon phase", "value": "Waxing Crescent"},
                ],
                "tables": [],
            },
        }
    }


def sample_cases() -> list[dict[str, Any]]:
    return [
        {
            "label": "career_multi_option_technical",
            "question": "Should I take the remote role, stay at my current job, or start freelancing next month?",
            "history": ["Should I leave my current job?", "Will the remote role be good for my career?"],
            "prior_confidences": [0.62, 0.58],
            "profile": "balanced",
            "response_mode": "technical",
        },
        {
            "label": "relationship_followup_direct",
            "question": "What about next week instead?",
            "history": ["Should I ask her out this weekend?"],
            "prior_confidences": [0.51],
            "profile": "exploratory",
            "response_mode": "direct",
        },
        {
            "label": "vague_mood_conservative",
            "question": "What is my purpose in life right now?",
            "history": ["Why do I feel stuck lately?", "Should I quit everything?"],
            "prior_confidences": [0.22, 0.31],
            "profile": "conservative",
            "response_mode": "reflective",
        },
    ]
