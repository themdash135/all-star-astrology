"""Tests for the oracle engine."""

from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from backend.engines.oracle import classify_question, compose_response, extract_chart_data
from backend.main import AskRequest, ask_stars


class TestClassifyQuestion:
    def test_career_question(self):
        result = classify_question("Should I take the job?")
        assert result["type"] == "career_question"
        assert "career" in result["domains"]

    def test_relationship_question(self):
        result = classify_question("Will I find love?")
        assert result["type"] == "relationship_question"
        assert "love" in result["domains"]

    def test_career_domain_detected(self):
        result = classify_question("Tell me about my career")
        assert result["type"] == "career_question"
        assert "career" in result["domains"]

    def test_timing_question(self):
        result = classify_question("When will I get a promotion?")
        assert result["type"] == "timing_question"
        assert "career" in result["domains"]

    def test_general_guidance_defaults(self):
        result = classify_question("What does the future hold?")
        assert result["type"] == "general_guidance_question"
        assert set(result["domains"]) == {"mood", "career"}

    def test_multiple_domains(self):
        result = classify_question("How will my love life and money be?")
        assert "love" in result["domains"]
        assert "wealth" in result["domains"]

    def test_binary_decision(self):
        result = classify_question("Should I sleep early or late tonight?")
        assert result["type"] == "binary_decision"
        assert len(result["options"]) == 2

    def test_health_energy_question(self):
        result = classify_question("Why am I so tired all the time?")
        assert result["type"] == "health_energy_question"
        assert "health" in result["domains"]

    def test_emotional_state_question(self):
        result = classify_question("Why do I feel so lost?")
        assert result["type"] == "emotional_state_question"
        assert "mood" in result["domains"]


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


def _make_scores(love=60, career=55, health=50, wealth=50, mood=55):
    return {
        "love": {"value": love, "label": "test"},
        "career": {"value": career, "label": "test"},
        "health": {"value": health, "label": "test"},
        "wealth": {"value": wealth, "label": "test"},
        "mood": {"value": mood, "label": "test"},
    }


SAMPLE_READING = {
    "systems": {
        "western": {
            "highlights": [
                {"label": "Sun sign", "value": "Gemini"},
                {"label": "Moon sign", "value": "Pisces"},
            ],
            "scores": _make_scores(love=72, career=45, health=38),
        },
        "vedic": {
            "highlights": [{"label": "Nakshatra", "value": "Rohini"}],
            "scores": _make_scores(love=68, career=50, health=42),
        },
        "chinese": {
            "highlights": [{"label": "Animal sign", "value": "Earth Goat"}],
            "scores": _make_scores(love=65, career=48, health=44),
        },
        "bazi": {
            "highlights": [{"label": "Day Master", "value": "Water (Gui)"}],
            "scores": _make_scores(love=70, career=42, health=35),
        },
        "numerology": {
            "highlights": [{"label": "Life Path", "value": "5"}],
            "scores": _make_scores(love=60, career=55, health=50),
        },
        "kabbalistic": {
            "highlights": [],
            "scores": _make_scores(love=55, career=50, health=48),
        },
        "gematria": {
            "highlights": [],
            "scores": _make_scores(love=50, career=50, health=50),
        },
        "persian": {
            "highlights": [],
            "scores": _make_scores(love=66, career=47, health=40),
        },
    },
    "combined": {
        "probabilities": {
            "love": {
                "value": 72,
                "sentiment": "positive",
                "confidence": 75,
                "agreeing_systems": ["Western", "Vedic", "BaZi", "Chinese", "Numerology", "Persian"],
                "leaders": [{"name": "Western", "value": 72}],
                "laggards": [{"name": "Gematria", "value": 50}],
            },
            "career": {
                "value": 45,
                "sentiment": "mixed",
                "confidence": 50,
                "agreeing_systems": ["Western", "Vedic", "BaZi", "Kabbalistic"],
                "leaders": [{"name": "Numerology", "value": 55}],
                "laggards": [{"name": "BaZi", "value": 42}],
            },
            "health": {
                "value": 38,
                "sentiment": "challenging",
                "confidence": 62,
                "agreeing_systems": ["Western", "Vedic", "BaZi", "Chinese", "Numerology"],
                "leaders": [{"name": "Numerology", "value": 50}],
                "laggards": [{"name": "BaZi", "value": 35}],
            },
        }
    },
}


class TestComposeResponse:
    def test_returns_string(self):
        result = compose_response("Should I text him?", SAMPLE_READING)
        assert isinstance(result["answer"], str)
        assert len(result["answer"]) > 50

    def test_returns_areas(self):
        result = compose_response("Should I text him?", SAMPLE_READING)
        assert "love" in result["areas"]

    def test_includes_chart_reference(self):
        result = compose_response("Tell me about my love life", SAMPLE_READING)
        answer = result["answer"]
        has_ref = any(term in answer for term in ["Gemini", "Pisces", "Goat", "Water", "Rohini", "Life Path"])
        assert has_ref, f"No chart reference found in: {answer}"

    def test_no_raw_percentages_in_answer(self):
        result = compose_response("Will I find love?", SAMPLE_READING)
        answer = result["answer"]
        assert "probability" not in answer.lower()

    def test_returns_evidence(self):
        result = compose_response("Should I take the job?", SAMPLE_READING)
        assert "evidence" in result
        assert isinstance(result["evidence"], list)

    def test_returns_system_signals(self):
        result = compose_response("Should I take the job?", SAMPLE_READING)
        assert "system_signals" in result
        signals = result["system_signals"]
        assert len(signals) > 0
        assert "name" in signals[0]
        assert "sentiment" in signals[0]
        assert "reason" in signals[0]

    def test_returns_classification(self):
        result = compose_response("Should I sleep early or late?", SAMPLE_READING)
        assert "classification" in result
        assert result["classification"]["type"] == "binary_decision"

    def test_returns_aggregation(self):
        result = compose_response("Will things improve?", SAMPLE_READING)
        assert "aggregation" in result
        assert "direction" in result["aggregation"]
        assert "strength" in result["aggregation"]

    def test_empty_reading_still_responds(self):
        result = compose_response("Will things get better?", {})
        assert isinstance(result["answer"], str)
        assert len(result["answer"]) > 30

    def test_different_questions_get_different_answers(self):
        r1 = compose_response("Should I take the job?", SAMPLE_READING)
        r2 = compose_response("Will I find love?", SAMPLE_READING)
        assert r1["answer"] != r2["answer"]

    def test_binary_decision_picks_winner(self):
        result = compose_response("Should I sleep early or late tonight?", SAMPLE_READING)
        aggregation = result["aggregation"]
        if aggregation.get("options_result"):
            assert "winner" in aggregation["options_result"]


class TestAskEndpoint:
    def test_ask_returns_200(self):
        data = ask_stars(AskRequest(**{
            "question": "Will I find love?",
            "reading_data": SAMPLE_READING,
        }))
        assert "answer" in data
        assert "areas" in data
        assert "evidence" in data
        assert "system_signals" in data

    def test_ask_empty_question_still_works(self):
        data = ask_stars(AskRequest(**{
            "question": "hmm",
            "reading_data": {},
        }))
        assert len(data["answer"]) > 20
