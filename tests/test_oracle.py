"""Tests for the oracle engine."""

from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from backend.engines.oracle import classify_question, compose_response, extract_chart_data
from backend.main import AskRequest, ask_stars


class TestClassifyQuestion:
    def test_yes_no_should(self):
        assert classify_question("Should I take the job?") == {
            "type": "yes_no",
            "areas": ["career"],
        }

    def test_yes_no_will(self):
        assert classify_question("Will I find love?") == {
            "type": "yes_no",
            "areas": ["love"],
        }

    def test_open_tell_me(self):
        result = classify_question("Tell me about my career")
        assert result["type"] == "open"
        assert "career" in result["areas"]

    def test_timing_when(self):
        result = classify_question("When will I get a promotion?")
        assert result["type"] == "timing"
        assert "career" in result["areas"]

    def test_no_keywords_defaults_to_mood_career(self):
        result = classify_question("What does the future hold?")
        assert result["type"] == "open"
        assert set(result["areas"]) == {"mood", "career"}

    def test_multiple_areas(self):
        result = classify_question("How will my love life and money be?")
        assert "love" in result["areas"]
        assert "wealth" in result["areas"]


class TestExtractChartData:
    def test_extracts_western_highlights(self):
        reading = {
            "systems": {
                "western": {
                    "highlights": [
                        {"label": "Sun sign", "value": "Gemini"},
                        {"label": "Moon sign", "value": "Pisces"},
                        {"label": "Rising sign", "value": "Libra"},
                    ]
                },
                "chinese": {
                    "highlights": [
                        {"label": "Animal sign", "value": "Earth Goat"},
                    ]
                },
                "bazi": {
                    "highlights": [
                        {"label": "Day Master", "value": "Water (Gui)"},
                    ]
                },
                "numerology": {
                    "highlights": [
                        {"label": "Life Path", "value": "5"},
                    ]
                },
                "vedic": {
                    "highlights": [
                        {"label": "Nakshatra", "value": "Rohini"},
                    ]
                },
            }
        }
        chart = extract_chart_data(reading)
        assert chart["sun"] == "Gemini"
        assert chart["moon"] == "Pisces"
        assert chart["rising"] == "Libra"
        assert chart["chinese"] == "Earth Goat"
        assert chart["day_master"] == "Water (Gui)"
        assert chart["life_path"] == "5"
        assert chart["nakshatra"] == "Rohini"

    def test_missing_systems_returns_empty(self):
        chart = extract_chart_data({})
        assert chart["sun"] is None
        assert chart["moon"] is None


class TestComposeResponse:
    SAMPLE_READING = {
        "systems": {
            "western": {
                "highlights": [
                    {"label": "Sun sign", "value": "Gemini"},
                    {"label": "Moon sign", "value": "Pisces"},
                ]
            },
            "chinese": {"highlights": [{"label": "Animal sign", "value": "Earth Goat"}]},
            "bazi": {"highlights": [{"label": "Day Master", "value": "Water (Gui)"}]},
            "numerology": {"highlights": [{"label": "Life Path", "value": "5"}]},
            "vedic": {"highlights": [{"label": "Nakshatra", "value": "Rohini"}]},
        },
        "combined": {
            "probabilities": {
                "love": {
                    "value": 72,
                    "sentiment": "positive",
                    "confidence": 75,
                    "agreeing_systems": ["Western", "Vedic", "BaZi", "Chinese", "Numerology", "Persian"],
                },
                "career": {
                    "value": 45,
                    "sentiment": "mixed",
                    "confidence": 50,
                    "agreeing_systems": ["Western", "Vedic", "BaZi", "Kabbalistic"],
                },
                "health": {
                    "value": 38,
                    "sentiment": "challenging",
                    "confidence": 62,
                    "agreeing_systems": ["Western", "Vedic", "BaZi", "Chinese", "Numerology"],
                },
            }
        },
    }

    def test_returns_string(self):
        result = compose_response("Should I text him?", self.SAMPLE_READING)
        assert isinstance(result["answer"], str)
        assert len(result["answer"]) > 50

    def test_returns_areas(self):
        result = compose_response("Should I text him?", self.SAMPLE_READING)
        assert "love" in result["areas"]

    def test_includes_chart_reference(self):
        result = compose_response("Tell me about my love life", self.SAMPLE_READING)
        answer = result["answer"]
        has_ref = any(term in answer for term in ["Gemini", "Pisces", "Goat", "Water", "Rohini"])
        assert has_ref, f"No chart reference found in: {answer}"

    def test_uses_mystical_framing(self):
        result = compose_response("Will I find love?", self.SAMPLE_READING)
        answer = result["answer"].lower()
        assert "72%" not in answer
        assert "probability" not in answer

    def test_returns_evidence(self):
        result = compose_response("Should I take the job?", self.SAMPLE_READING)
        assert "evidence" in result
        assert isinstance(result["evidence"], list)

    def test_empty_reading_still_responds(self):
        result = compose_response("Will things get better?", {})
        assert isinstance(result["answer"], str)
        assert len(result["answer"]) > 30

    def test_different_questions_get_different_answers(self):
        r1 = compose_response("Should I take the job?", self.SAMPLE_READING)
        r2 = compose_response("Will I find love?", self.SAMPLE_READING)
        assert r1["answer"] != r2["answer"]


class TestAskEndpoint:
    def test_ask_returns_200(self):
        data = ask_stars(AskRequest(**{
            "question": "Will I find love?",
            "reading_data": TestComposeResponse.SAMPLE_READING,
        }))
        assert "answer" in data
        assert "areas" in data
        assert "evidence" in data

    def test_ask_empty_question_still_works(self):
        data = ask_stars(AskRequest(**{
            "question": "hmm",
            "reading_data": {},
        }))
        assert len(data["answer"]) > 20
