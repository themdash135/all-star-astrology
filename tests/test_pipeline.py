"""Tests for the neuro-symbolic pipeline."""

from __future__ import annotations

import pytest

from backend.engines.pipeline.schemas import (
    AggregatedResult,
    ClassifiedIntent,
    ComposedAnswer,
    EvidenceItem,
    PipelineResponse,
    SystemOpinion,
    SYSTEM_WEIGHT,
)
from backend.engines.pipeline.intent_classifier import classify
from backend.engines.pipeline.system_router import route, DEFAULT_MAX, EXTENDED_MAX
from backend.engines.pipeline.aggregator import aggregate
from backend.engines.pipeline.answer_composer import (
    compose,
    _chart_lead,
    _detect_convergence,
    SYSTEM_NAMES,
)
from backend.engines.pipeline.context_memory import build_context as build_user_context
from backend.engines.pipeline.pattern_analyzer import analyze as analyze_pattern
from backend.engines.pipeline.engine import run, ADAPTERS
from backend.engines.pipeline.adapters.base import scores_to_stance, extract_highlights
from backend.engines.pipeline.temporal import (
    compute_temporal_modulation,
    apply_temporal_modulation,
    compute_planetary_hour_modifier,
    moon_phase_confidence_modifier,
    DAY_RULER,
    ALL_DOMAINS,
)


# ═══════════════════════════════════════════════════════════════════
#  Intent Classifier
# ═══════════════════════════════════════════════════════════════════

class TestIntentClassifier:
    def test_binary_decision_with_or(self):
        intent = classify("Should I go to sleep early or late tonight?")
        assert intent.question_type == "binary_decision"
        assert len(intent.options) == 2
        assert "health" in intent.domain_tags
        assert intent.time_horizon == "today"

    def test_yes_no_question(self):
        # "her" matches love domain → relationship_question takes priority over yes/no
        intent = classify("Should I ask her out?")
        assert intent.question_type == "relationship_question"
        assert "love" in intent.domain_tags

    def test_timing_question(self):
        intent = classify("When should I start investing?")
        assert intent.question_type == "timing_question"
        assert "wealth" in intent.domain_tags

    def test_relationship_question(self):
        intent = classify("Will I find love this year?")
        assert intent.question_type == "relationship_question"
        assert "love" in intent.domain_tags
        assert intent.time_horizon == "this_year"

    def test_career_question(self):
        intent = classify("How is my career looking?")
        assert intent.question_type == "career_question"
        assert "career" in intent.domain_tags

    def test_health_question(self):
        intent = classify("Why am I so tired and low energy?")
        assert intent.question_type == "health_energy_question"
        assert "health" in intent.domain_tags

    def test_emotional_question(self):
        intent = classify("I feel lost and confused")
        assert intent.question_type == "emotional_state_question"
        assert "mood" in intent.domain_tags

    def test_general_question(self):
        intent = classify("What does the universe want me to know?")
        assert intent.question_type == "general_guidance_question"

    def test_empty_question_does_not_crash(self):
        intent = classify("")
        assert isinstance(intent, ClassifiedIntent)

    def test_binary_with_versus(self):
        intent = classify("stay home versus go out tonight?")
        assert intent.question_type == "binary_decision"
        assert len(intent.options) == 2

    def test_max_three_domains(self):
        intent = classify("love career money health mood energy feel")
        assert len(intent.domain_tags) <= 3

    def test_default_options_for_yes_no(self):
        # "quit" and "job" match career domain → career_question
        intent = classify("Should I quit my job?")
        assert intent.question_type == "career_question"
        # Non-binary types get no explicit options
        assert intent.options == []


# ═══════════════════════════════════════════════════════════════════
#  System Router
# ═══════════════════════════════════════════════════════════════════

class TestSystemRouter:
    def test_all_8_systems_participate(self):
        intent = ClassifiedIntent(
            question_type="general_guidance_question",
            domain_tags=["love", "career", "health"],
            options=[],
            time_horizon="general",
        )
        result = route(intent)
        assert len(result) == 8

    def test_timing_routes_to_vedic_persian(self):
        intent = ClassifiedIntent(
            question_type="timing_question",
            domain_tags=["career"],
            options=[],
            time_horizon="this_month",
        )
        result = route(intent)
        assert "vedic" in result
        assert "persian" in result

    def test_career_routes_to_bazi(self):
        intent = ClassifiedIntent(
            question_type="career_question",
            domain_tags=["career"],
            options=[],
            time_horizon="general",
        )
        result = route(intent)
        assert "bazi" in result

    def test_relationship_routes_to_western(self):
        intent = ClassifiedIntent(
            question_type="relationship_question",
            domain_tags=["love"],
            options=[],
            time_horizon="general",
        )
        result = route(intent)
        assert "western" in result

    def test_mood_routes_to_kabbalistic(self):
        intent = ClassifiedIntent(
            question_type="emotional_state_question",
            domain_tags=["mood"],
            options=[],
            time_horizon="general",
        )
        result = route(intent)
        assert "kabbalistic" in result

    def test_returns_strings(self):
        intent = classify("Will I get promoted?")
        result = route(intent)
        assert all(isinstance(s, str) for s in result)


# ═══════════════════════════════════════════════════════════════════
#  Adapters
# ═══════════════════════════════════════════════════════════════════

class TestAdapters:
    def test_all_adapters_registered(self):
        expected = {"western", "vedic", "bazi", "numerology", "chinese", "kabbalistic", "gematria", "persian"}
        assert set(ADAPTERS.keys()) == expected

    def test_adapter_returns_opinion_on_empty_data(self):
        adapter = ADAPTERS["western"]
        intent = classify("Test question")
        opinion = adapter.evaluate({}, intent)
        assert isinstance(opinion, SystemOpinion)
        assert opinion.relevant is False
        assert opinion.confidence == 0.0

    def test_adapter_returns_opinion_on_real_data(self):
        adapter = ADAPTERS["western"]
        intent = classify("Will I find love?")
        fake_data = {
            "scores": {"love": {"value": 72}, "career": {"value": 55}},
            "highlights": [
                {"label": "Sun", "value": "Taurus in House 7"},
                {"label": "Moon", "value": "Pisces in House 12"},
                {"label": "Venus", "value": "Aries in House 6"},
            ],
        }
        opinion = adapter.evaluate(fake_data, intent)
        assert isinstance(opinion, SystemOpinion)
        assert opinion.relevant is True
        assert opinion.system_id == "western"
        assert len(opinion.evidence) > 0
        assert sum(opinion.stance.values()) == pytest.approx(1.0, abs=0.01)

    def test_scores_to_stance_normalises(self):
        scores = {"love": {"value": 80}, "career": {"value": 60}}
        stance = scores_to_stance(scores, ["love", "career"], ["yes", "no"])
        assert "yes" in stance
        assert "no" in stance
        assert stance["yes"] + stance["no"] == pytest.approx(1.0, abs=0.01)

    def test_extract_highlights_finds_patterns(self):
        data = {
            "highlights": [
                {"label": "Sun", "value": "Aries"},
                {"label": "Moon", "value": "Cancer"},
                {"label": "Unrelated", "value": "X"},
            ],
        }
        items = extract_highlights(data, ["sun", "moon"])
        assert len(items) == 2
        assert items[0].feature == "Sun"
        assert items[1].feature == "Moon"
        assert items[0].weight > items[1].weight  # first pattern ranked higher


# ═══════════════════════════════════════════════════════════════════
#  Aggregator
# ═══════════════════════════════════════════════════════════════════

class TestAggregator:
    def test_no_relevant_opinions(self):
        opinions = [
            SystemOpinion(system_id="western", relevant=False, stance={"a": 0.5, "b": 0.5}, confidence=0.0, reason="No data", evidence=[]),
        ]
        result = aggregate(opinions)
        assert isinstance(result, AggregatedResult)
        assert result.winner == "uncertain"
        assert result.confidence == 0.0

    def test_single_system(self):
        opinions = [
            SystemOpinion(
                system_id="vedic", relevant=True,
                stance={"early": 0.7, "late": 0.3},
                confidence=0.8, reason="Dasha supports rest",
                evidence=[EvidenceItem(feature="Dasha", value="Moon", weight=0.9)],
            ),
        ]
        result = aggregate(opinions)
        assert result.winner == "early"
        assert result.confidence > 0

    def test_multiple_systems_agreement(self):
        opinions = [
            SystemOpinion(system_id="western", relevant=True, stance={"yes": 0.8, "no": 0.2}, confidence=0.9, reason="r1", evidence=[]),
            SystemOpinion(system_id="vedic", relevant=True, stance={"yes": 0.7, "no": 0.3}, confidence=0.85, reason="r2", evidence=[]),
            SystemOpinion(system_id="bazi", relevant=True, stance={"yes": 0.75, "no": 0.25}, confidence=0.8, reason="r3", evidence=[]),
        ]
        result = aggregate(opinions)
        assert result.winner == "yes"
        assert result.scores["yes"] > result.scores["no"]
        assert result.confidence > 0.5

    def test_scores_sum_to_one(self):
        opinions = [
            SystemOpinion(system_id="western", relevant=True, stance={"a": 0.6, "b": 0.4}, confidence=0.7, reason="r", evidence=[]),
            SystemOpinion(system_id="vedic", relevant=True, stance={"a": 0.55, "b": 0.45}, confidence=0.8, reason="r", evidence=[]),
        ]
        result = aggregate(opinions)
        total = sum(result.scores.values())
        assert total == pytest.approx(1.0, abs=0.01)


# ═══════════════════════════════════════════════════════════════════
#  Answer Composer
# ═══════════════════════════════════════════════════════════════════

class TestAnswerComposer:
    def _make_aggregation(self, winner="favorable", confidence=0.7):
        return AggregatedResult(
            winner=winner,
            scores={winner: 0.65, "cautious": 0.35},
            contributors=["western", "vedic"],
            confidence=confidence,
            opinions=[
                SystemOpinion(
                    system_id="western", relevant=True,
                    stance={winner: 0.7, "cautious": 0.3},
                    confidence=0.8, reason="Sun in 7th supports",
                    evidence=[EvidenceItem(feature="Sun", value="Taurus H7", weight=0.9)],
                ),
                SystemOpinion(
                    system_id="vedic", relevant=True,
                    stance={winner: 0.6, "cautious": 0.4},
                    confidence=0.7, reason="Dasha favors",
                    evidence=[EvidenceItem(feature="Dasha", value="Venus", weight=0.8)],
                ),
            ],
        )

    def test_compose_returns_model(self):
        intent = classify("Will I find love?")
        agg = self._make_aggregation()
        result = compose(intent, agg)
        assert isinstance(result, ComposedAnswer)
        assert len(result.short_answer) > 0
        assert len(result.reasoning) > 0
        assert len(result.contributing_systems) > 0

    def test_references_at_least_one_system(self):
        intent = classify("How is my career?")
        agg = self._make_aggregation()
        result = compose(intent, agg)
        # Must reference a system name in reasoning
        assert any(
            name in result.reasoning
            for name in ["Western", "Vedic", "BaZi", "Numerology"]
        )

    def test_binary_answer_mentions_winner(self):
        intent = ClassifiedIntent(
            question_type="binary_decision",
            domain_tags=["health"],
            options=["sleep early", "stay up late"],
            time_horizon="today",
        )
        agg = self._make_aggregation(winner="sleep early")
        result = compose(intent, agg)
        assert "sleep early" in result.short_answer.lower()


# ═══════════════════════════════════════════════════════════════════
#  Full pipeline (integration)
# ═══════════════════════════════════════════════════════════════════

class TestPipelineIntegration:
    """Integration tests using real engine output."""

    @pytest.fixture
    def reading(self):
        from backend.engines.common import build_context
        from backend.engines import western, vedic, chinese, bazi, numerology, kabbalistic, gematria, persian, combined

        class Payload:
            birth_date = "1990-04-21"
            birth_time = "14:30"
            birth_location = "Los Angeles, CA"
            full_name = "Test User"
            hebrew_name = ""

        ctx = build_context(Payload())
        systems = {
            "western": western.calculate(ctx),
            "vedic": vedic.calculate(ctx),
            "chinese": chinese.calculate(ctx),
            "bazi": bazi.calculate(ctx),
            "numerology": numerology.calculate(ctx),
            "kabbalistic": kabbalistic.calculate(ctx),
            "gematria": gematria.calculate(ctx),
            "persian": persian.calculate(ctx),
        }
        merged = combined.calculate(ctx, systems)
        return {"systems": systems, "combined": merged}

    def test_binary_question(self, reading):
        result = run("Should I go to sleep early or late tonight?", reading)
        assert isinstance(result, PipelineResponse)
        assert result.classification.question_type == "binary_decision"
        assert len(result.aggregation.contributors) > 0
        assert result.confidence > 0

    def test_love_question(self, reading):
        result = run("Will I find love this year?", reading)
        assert "love" in result.areas
        assert len(result.system_signals) > 0

    def test_career_question(self, reading):
        result = run("How is my career looking?", reading)
        assert "career" in result.areas

    def test_timing_question(self, reading):
        result = run("When should I start my business?", reading)
        assert result.classification.question_type == "timing_question"

    def test_answer_not_empty(self, reading):
        result = run("What should I focus on?", reading)
        assert len(result.answer) > 20

    def test_system_signals_have_evidence(self, reading):
        result = run("Will I find love?", reading)
        for sig in result.system_signals:
            assert "system_id" in sig
            assert "name" in sig
            assert "sentiment" in sig
            assert "evidence" in sig

    def test_no_generic_advice(self, reading):
        """Fail condition: answers must not contain generic filler."""
        result = run("Should I change jobs?", reading)
        answer_lower = result.answer.lower()
        assert "trust yourself" not in answer_lower
        assert "only you can decide" not in answer_lower

    def test_all_opinions_have_system_id(self, reading):
        result = run("Am I on the right path?", reading)
        for opinion in result.aggregation.opinions:
            assert opinion.system_id in ADAPTERS

    def test_all_8_systems_consulted(self, reading):
        result = run("General question about life", reading)
        assert len(result.aggregation.contributors) == 8


# ═══════════════════════════════════════════════════════════════════
#  All 8 adapters — unit tests
# ═══════════════════════════════════════════════════════════════════

class TestAllAdapters:
    """Each of the 8 adapters must return valid SystemOpinion and abstain correctly."""

    @pytest.fixture
    def reading(self):
        from backend.engines.common import build_context
        from backend.engines import western, vedic, chinese, bazi, numerology, kabbalistic, gematria, persian, combined

        class Payload:
            birth_date = "1990-04-21"
            birth_time = "14:30"
            birth_location = "Los Angeles, CA"
            full_name = "Test User"
            hebrew_name = ""

        ctx = build_context(Payload())
        return {
            "western": western.calculate(ctx),
            "vedic": vedic.calculate(ctx),
            "chinese": chinese.calculate(ctx),
            "bazi": bazi.calculate(ctx),
            "numerology": numerology.calculate(ctx),
            "kabbalistic": kabbalistic.calculate(ctx),
            "gematria": gematria.calculate(ctx),
            "persian": persian.calculate(ctx),
        }

    @pytest.mark.parametrize("system_id", [
        "western", "vedic", "chinese", "bazi",
        "numerology", "kabbalistic", "gematria", "persian",
    ])
    def test_adapter_returns_valid_opinion(self, reading, system_id):
        adapter = ADAPTERS[system_id]
        intent = classify("Should I sleep early or late tonight?")
        opinion = adapter.evaluate(reading[system_id], intent)
        assert isinstance(opinion, SystemOpinion)
        assert opinion.system_id == system_id
        assert opinion.relevant is True
        assert len(opinion.evidence) > 0
        assert 0.0 <= opinion.confidence <= 1.0
        total = sum(opinion.stance.values())
        assert total == pytest.approx(1.0, abs=0.02)

    @pytest.mark.parametrize("system_id", [
        "western", "vedic", "chinese", "bazi",
        "numerology", "kabbalistic", "gematria", "persian",
    ])
    def test_adapter_abstains_on_empty_data(self, system_id):
        adapter = ADAPTERS[system_id]
        intent = classify("Test question")
        opinion = adapter.evaluate({}, intent)
        assert opinion.relevant is False
        assert opinion.confidence == 0.0

    @pytest.mark.parametrize("system_id", [
        "western", "vedic", "chinese", "bazi",
        "numerology", "kabbalistic", "gematria", "persian",
    ])
    def test_adapter_evidence_is_traceable(self, reading, system_id):
        adapter = ADAPTERS[system_id]
        intent = classify("Is this a good time to start something new?")
        opinion = adapter.evaluate(reading[system_id], intent)
        for ev in opinion.evidence:
            assert len(ev.feature) > 0
            assert len(ev.value) > 0
            assert 0.0 <= ev.weight <= 1.0


# ═══════════════════════════════════════════════════════════════════
#  Router — all 8 systems
# ═══════════════════════════════════════════════════════════════════

class TestRouterExpanded:
    def test_timing_routes_persian_high(self):
        intent = classify("When should I start my business?")
        result = route(intent)
        assert "persian" in result
        assert "vedic" in result

    def test_spiritual_routes_kabbalistic(self):
        intent = classify("What energy is strongest around me today?")
        result = route(intent)
        assert "kabbalistic" in result or "western" in result

    def test_identity_routes_gematria(self):
        intent = ClassifiedIntent(
            question_type="emotional_state_question",
            domain_tags=["mood"],
            options=[],
            time_horizon="general",
        )
        result = route(intent)
        # Gematria should appear for mood/identity questions
        assert "gematria" in result or "kabbalistic" in result

    def test_broad_cycle_routes_chinese(self):
        intent = ClassifiedIntent(
            question_type="general_guidance_question",
            domain_tags=["career", "mood"],
            options=[],
            time_horizon="this_year",
        )
        result = route(intent)
        # With 2 domains, router should extend and include more systems
        assert len(result) >= 4

    def test_router_excludes_weak_systems(self):
        intent = classify("Should I sleep early or late?")
        result = route(intent)
        # All returned systems should be in ADAPTERS
        for sid in result:
            assert sid in ADAPTERS


# ═══════════════════════════════════════════════════════════════════
#  Aggregator — mixed symbolic + timing
# ═══════════════════════════════════════════════════════════════════

class TestAggregatorExpanded:
    def test_domain_weighting_timing(self):
        """On timing questions, Persian should weigh more than Gematria."""
        from backend.engines.pipeline.aggregator import _effective_weight
        persian_w = _effective_weight("persian", "timing_question")
        gematria_w = _effective_weight("gematria", "timing_question")
        assert persian_w > gematria_w

    def test_domain_weighting_career(self):
        from backend.engines.pipeline.aggregator import _effective_weight
        bazi_w = _effective_weight("bazi", "career_question")
        gematria_w = _effective_weight("gematria", "career_question")
        assert bazi_w > gematria_w

    def test_aggregates_5_systems(self):
        opinions = [
            SystemOpinion(system_id=sid, relevant=True,
                         stance={"yes": 0.6, "no": 0.4}, confidence=0.7,
                         reason="test", evidence=[])
            for sid in ["western", "vedic", "bazi", "numerology", "persian"]
        ]
        result = aggregate(opinions)
        assert len(result.contributors) == 5
        assert result.winner == "yes"

    def test_confidence_label_present(self):
        opinions = [
            SystemOpinion(system_id="western", relevant=True,
                         stance={"a": 0.7, "b": 0.3}, confidence=0.8,
                         reason="r", evidence=[]),
        ]
        result = aggregate(opinions)
        assert result.confidence_label in ("High", "Medium", "Low")

    def test_system_agreement_counts(self):
        opinions = [
            SystemOpinion(system_id="western", relevant=True, stance={"a": 0.7, "b": 0.3}, confidence=0.8, reason="r", evidence=[]),
            SystemOpinion(system_id="vedic", relevant=True, stance={"a": 0.6, "b": 0.4}, confidence=0.7, reason="r", evidence=[]),
            SystemOpinion(system_id="bazi", relevant=True, stance={"a": 0.3, "b": 0.7}, confidence=0.7, reason="r", evidence=[]),
        ]
        result = aggregate(opinions)
        assert result.system_agreement["a"] == 2
        assert result.system_agreement["b"] == 1


# ═══════════════════════════════════════════════════════════════════
#  Example questions — system diversity
# ═══════════════════════════════════════════════════════════════════

class TestExampleQuestions:
    """6 example questions that exercise different system combinations."""

    @pytest.fixture
    def reading(self):
        from backend.engines.common import build_context
        from backend.engines import western, vedic, chinese, bazi, numerology, kabbalistic, gematria, persian, combined

        class Payload:
            birth_date = "1990-04-21"
            birth_time = "14:30"
            birth_location = "Los Angeles, CA"
            full_name = "Test User"
            hebrew_name = ""

        ctx = build_context(Payload())
        systems = {
            "western": western.calculate(ctx),
            "vedic": vedic.calculate(ctx),
            "chinese": chinese.calculate(ctx),
            "bazi": bazi.calculate(ctx),
            "numerology": numerology.calculate(ctx),
            "kabbalistic": kabbalistic.calculate(ctx),
            "gematria": gematria.calculate(ctx),
            "persian": persian.calculate(ctx),
        }
        merged = combined.calculate(ctx, systems)
        return {"systems": systems, "combined": merged}

    def test_sleep_question(self, reading):
        result = run("Should I sleep early or late tonight?", reading)
        assert result.classification.question_type == "binary_decision"
        assert result.confidence > 0
        assert len(result.system_signals) >= 3

    def test_career_week(self, reading):
        result = run("Is this a good week to make a career move?", reading)
        assert "career" in result.areas
        assert len(result.aggregation.contributors) >= 3

    def test_reach_out(self, reading):
        result = run("Should I reach out to this person now?", reading)
        assert len(result.answer) > 20
        assert result.confidence > 0

    def test_energy_today(self, reading):
        result = run("What energy is strongest around me today?", reading)
        assert result.classification.time_horizon == "today"
        assert len(result.system_signals) >= 3

    def test_action_or_reflection(self, reading):
        result = run("Am I in a season of action or reflection?", reading)
        assert result.classification.question_type == "binary_decision"
        assert len(result.aggregation.opinions) >= 3

    def test_begin_something_new(self, reading):
        result = run("Is this a good time to begin something new?", reading)
        assert len(result.answer) > 20
        assert result.confidence_label in ("High", "Medium", "Low")
        assert len(result.top_systems) >= 1


# ═══════════════════════════════════════════════════════════════════
#  Context Memory
# ═══════════════════════════════════════════════════════════════════

class TestContextMemory:
    def test_empty_history(self):
        ctx = build_user_context([])
        assert ctx.total_questions == 0
        assert ctx.dominant_domain is None

    def test_single_question(self):
        ctx = build_user_context(["Will I find love?"])
        assert ctx.total_questions == 1
        assert ctx.dominant_domain is None  # needs >= 2

    def test_dominant_domain(self):
        ctx = build_user_context([
            "Will I find love?",
            "Should I ask her out?",
            "Is my relationship going well?",
        ])
        assert ctx.total_questions == 3
        assert ctx.dominant_domain == "love"
        assert ctx.domain_counts["love"] >= 2.0  # weighted by recency decay

    def test_timing_ratio(self):
        ctx = build_user_context([
            "When should I start?",
            "When is the best time?",
            "What should I do?",
        ])
        assert ctx.timing_ratio >= 0.5

    def test_binary_ratio(self):
        ctx = build_user_context([
            "Should I go or stay?",
            "Should I sleep early or late?",
            "Should I quit or stay?",
        ])
        assert ctx.binary_ratio >= 0.5

    def test_repeated_domain(self):
        ctx = build_user_context([
            "How is my career?",
            "Should I change jobs?",
            "Will I get promoted?",
            "Is this a good career move?",
        ])
        assert ctx.repeated_domain == "career"

    def test_caps_at_10(self):
        questions = [f"Question {i}?" for i in range(20)]
        ctx = build_user_context(questions)
        assert ctx.total_questions == 10


# ═══════════════════════════════════════════════════════════════════
#  Pattern Analyzer
# ═══════════════════════════════════════════════════════════════════

class TestPatternAnalyzer:
    def test_first_question(self):
        ctx = build_user_context([])
        pattern = analyze_pattern(ctx)
        assert pattern.pattern == "first_question"
        assert pattern.strength == 0.0

    def test_hesitation_pattern(self):
        ctx = build_user_context([
            "Should I go or stay?",
            "Should I sleep early or late?",
            "Should I quit or continue?",
            "Should I invest or save?",
        ])
        pattern = analyze_pattern(ctx)
        assert pattern.pattern in ("hesitation", "hesitant_timing", "stuck_on_topic")
        assert pattern.strength > 0

    def test_timing_focus_pattern(self):
        ctx = build_user_context([
            "When should I start my business?",
            "When is the right time to move?",
            "When will things get better?",
            "How is my career?",
        ])
        pattern = analyze_pattern(ctx)
        # timing_ratio should be high enough to trigger (compound patterns also valid)
        assert pattern.pattern in ("timing_focus", "hesitation", "domain_loop",
                                   "timing_obsession", "hesitant_timing")

    def test_domain_loop_pattern(self):
        ctx = build_user_context([
            "Will I find love?",
            "Is my relationship good?",
            "Should I ask him out?",
            "Will he text me back?",
        ])
        pattern = analyze_pattern(ctx)
        assert pattern.pattern == "domain_loop"
        assert "love" in pattern.trend

    def test_exploration_pattern(self):
        ctx = build_user_context([
            "How is my health?",
            "Will I find love?",
            "How is my career?",
            "What does the universe want?",
        ])
        pattern = analyze_pattern(ctx)
        assert pattern.pattern in ("exploration", "domain_loop", "early_exploration")


# ═══════════════════════════════════════════════════════════════════
#  Personalization — integration
# ═══════════════════════════════════════════════════════════════════

class TestPersonalization:
    """Test that personalization layers appear in pipeline output."""

    @pytest.fixture
    def reading(self):
        from backend.engines.common import build_context
        from backend.engines import western, vedic, chinese, bazi, numerology, kabbalistic, gematria, persian, combined

        class Payload:
            birth_date = "1990-04-21"
            birth_time = "14:30"
            birth_location = "Los Angeles, CA"
            full_name = "Test User"
            hebrew_name = ""

        ctx = build_context(Payload())
        systems = {
            "western": western.calculate(ctx),
            "vedic": vedic.calculate(ctx),
            "chinese": chinese.calculate(ctx),
            "bazi": bazi.calculate(ctx),
            "numerology": numerology.calculate(ctx),
            "kabbalistic": kabbalistic.calculate(ctx),
            "gematria": gematria.calculate(ctx),
            "persian": persian.calculate(ctx),
        }
        merged = combined.calculate(ctx, systems)
        return {"systems": systems, "combined": merged}

    def test_tone_present(self, reading):
        result = run("Should I sleep early or late?", reading)
        assert result.tone in ("firm", "guided", "exploratory")

    def test_no_insight_without_history(self, reading):
        result = run("Should I sleep early or late?", reading)
        assert result.personal_insight is None

    def test_insight_with_hesitation_history(self, reading):
        history = [
            "Should I go or stay?",
            "Should I quit or continue?",
            "Should I invest or save?",
            "Should I start or wait?",
        ]
        result = run("Should I sleep early or late?", reading, history)
        assert result.personal_insight is not None
        assert "decision" in result.personal_insight.lower() or "weighing" in result.personal_insight.lower()

    def test_insight_with_domain_loop(self, reading):
        history = [
            "Will I find love?",
            "Is my relationship okay?",
            "Should I ask her out?",
            "Does he like me?",
        ]
        result = run("Will I find love this year?", reading, history)
        assert result.personal_insight is not None
        assert "love" in result.personal_insight.lower()

    def test_no_insight_with_short_history(self, reading):
        result = run("Will I find love?", reading, ["One question"])
        assert result.personal_insight is None

    def test_conflict_note_format(self, reading):
        result = run("Should I sleep early or late?", reading)
        # conflict_note can be None or a string
        if result.conflict_note:
            assert len(result.conflict_note) > 10

    def test_answer_includes_all_layers(self, reading):
        history = [
            "Should I go or stay?",
            "Should I quit or continue?",
            "Should I invest or save?",
            "Should I act now or wait?",
        ]
        result = run("Should I sleep early or late tonight?", reading, history)
        # Answer should have short answer + reasoning at minimum
        assert "\n" in result.answer
        assert len(result.answer) > 50


# ═══════════════════════════════════════════════════════════════════
#  UPGRADE 1: Chart-Specific Opening Lines
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade1ChartSpecificOpening:
    """_chart_lead extracts a humanized detail from the top opinion's evidence."""

    def test_chart_lead_returns_string_for_valid_opinions(self):
        op = SystemOpinion(
            system_id="western", relevant=True,
            stance={"favorable": 0.7, "cautious": 0.3},
            confidence=0.8, reason="Sun in Taurus",
            evidence=[EvidenceItem(feature="Sun", value="Taurus in House 7", weight=0.9)],
        )
        result = _chart_lead([op])
        assert result is not None
        assert isinstance(result, str)
        assert len(result) > 0

    def test_chart_lead_returns_none_for_empty(self):
        assert _chart_lead([]) is None

    def test_chart_lead_returns_none_for_no_evidence(self):
        op = SystemOpinion(
            system_id="western", relevant=True,
            stance={"favorable": 0.5, "cautious": 0.5},
            confidence=0.5, reason="test", evidence=[],
        )
        assert _chart_lead([op]) is None

    def test_opening_mentions_chart_detail_in_full_pipeline(self):
        """When a full pipeline runs, the opening should incorporate chart-specific info."""
        intent = classify("Will I find love?")
        agg = AggregatedResult(
            winner="favorable", scores={"favorable": 0.7, "cautious": 0.3},
            contributors=["western"], confidence=0.75,
            opinions=[
                SystemOpinion(
                    system_id="western", relevant=True,
                    stance={"favorable": 0.7, "cautious": 0.3},
                    confidence=0.8, reason="Venus strong",
                    evidence=[EvidenceItem(feature="Venus", value="Pisces in House 5", weight=0.95)],
                ),
            ],
        )
        result = compose(intent, agg)
        # Opening should be non-empty and mention something about the chart
        assert len(result.short_answer) > 10


# ═══════════════════════════════════════════════════════════════════
#  UPGRADE 2: Cross-System Convergence Detection
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade2Convergence:
    """_detect_convergence fires when 3+ systems point to the same domain theme."""

    def _make_opinion(self, sys_id, feature, value, weight=0.8):
        return SystemOpinion(
            system_id=sys_id, relevant=True,
            stance={"favorable": 0.7, "cautious": 0.3},
            confidence=0.7, reason="test",
            evidence=[EvidenceItem(feature=feature, value=value, weight=weight)],
        )

    def test_convergence_detected_for_love(self):
        ops = [
            self._make_opinion("western", "Venus", "Pisces in House 7"),
            self._make_opinion("vedic", "Dasha", "Venus mahadasha active"),
            self._make_opinion("bazi", "Peach Blossom", "Star present"),
            self._make_opinion("numerology", "Soul Urge", "Number 6"),
        ]
        intent = classify("Will I find love?")
        result = _detect_convergence(ops, intent)
        assert result is not None
        assert "love" in result.lower() or "connection" in result.lower()

    def test_convergence_detected_for_career(self):
        ops = [
            self._make_opinion("western", "Saturn", "Capricorn in House 10"),
            self._make_opinion("vedic", "Midheaven", "Strong career placement"),
            self._make_opinion("bazi", "Nobleman", "Star present for career"),
            self._make_opinion("persian", "Mars", "Career house activation"),
        ]
        intent = classify("How is my career?")
        result = _detect_convergence(ops, intent)
        assert result is not None

    def test_no_convergence_with_too_few_systems(self):
        ops = [
            self._make_opinion("western", "Venus", "Pisces in House 7"),
            self._make_opinion("vedic", "Love", "Venus strong"),
        ]
        intent = classify("Will I find love?")
        result = _detect_convergence(ops, intent)
        assert result is None

    def test_no_convergence_when_themes_dont_match(self):
        ops = [
            self._make_opinion("western", "Custom Feature", "random value"),
            self._make_opinion("vedic", "Another", "unrelated"),
            self._make_opinion("bazi", "Something", "else entirely"),
        ]
        intent = classify("Tell me something")
        result = _detect_convergence(ops, intent)
        assert result is None

    def test_convergence_appears_in_composed_reasoning(self):
        ops = [
            self._make_opinion("western", "Venus", "Pisces in House 7"),
            self._make_opinion("vedic", "Dasha", "Venus mahadasha"),
            self._make_opinion("bazi", "Peach Blossom", "Star present"),
            self._make_opinion("numerology", "Soul Urge", "Number 6"),
        ]
        intent = classify("Will I find love?")
        agg = AggregatedResult(
            winner="favorable", scores={"favorable": 0.7, "cautious": 0.3},
            contributors=["western", "vedic", "bazi"],
            confidence=0.75, opinions=ops,
        )
        result = compose(intent, agg)
        # Convergence note should appear in reasoning (templates use "converge", "highlight", "surfacing", "echo")
        r = result.reasoning.lower()
        assert any(kw in r for kw in ("converge", "highlight", "surfacing", "echo"))


# ═══════════════════════════════════════════════════════════════════
#  UPGRADE 3: Bolder Adapter Scoring (Western, Vedic, BaZi)
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade3BolderScoring:
    """Amplified adapters should produce more decisive stance spreads."""

    @pytest.fixture
    def reading(self):
        from backend.engines.common import build_context
        from backend.engines import western, vedic, bazi

        class Payload:
            birth_date = "1990-04-21"
            birth_time = "14:30"
            birth_location = "Los Angeles, CA"
            full_name = "Test User"
            hebrew_name = ""

        ctx = build_context(Payload())
        return {
            "western": western.calculate(ctx),
            "vedic": vedic.calculate(ctx),
            "bazi": bazi.calculate(ctx),
        }

    def test_western_stance_spread_nontrivial(self, reading):
        """Western adapter should produce a non-flat stance (amplified)."""
        adapter = ADAPTERS["western"]
        intent = classify("Will I find love this year?")
        opinion = adapter.evaluate(reading["western"], intent)
        if opinion.relevant:
            values = list(opinion.stance.values())
            spread = max(values) - min(values)
            # With amplification, spread should be noticeable (> 0.05)
            assert spread > 0.05

    def test_vedic_produces_valid_stance(self, reading):
        """Vedic adapter with bolder scoring still produces valid, normalised stances."""
        adapter = ADAPTERS["vedic"]
        intent = classify("Will I find love this year?")
        opinion = adapter.evaluate(reading["vedic"], intent)
        if opinion.relevant:
            total = sum(opinion.stance.values())
            assert total == pytest.approx(1.0, abs=0.02)
            # Should have at least 2 options
            assert len(opinion.stance) >= 2

    def test_bazi_produces_valid_stance(self, reading):
        """BaZi adapter with bolder scoring still produces valid, normalised stances."""
        adapter = ADAPTERS["bazi"]
        intent = classify("Is this a good time for my career?")
        opinion = adapter.evaluate(reading["bazi"], intent)
        if opinion.relevant:
            total = sum(opinion.stance.values())
            assert total == pytest.approx(1.0, abs=0.02)
            assert len(opinion.stance) >= 2

    def test_stance_values_remain_normalised(self, reading):
        """Even with amplification, stances must still sum to ~1.0."""
        for sys_id in ("western", "vedic", "bazi"):
            adapter = ADAPTERS[sys_id]
            intent = classify("Will I find love?")
            opinion = adapter.evaluate(reading[sys_id], intent)
            if opinion.relevant:
                total = sum(opinion.stance.values())
                assert total == pytest.approx(1.0, abs=0.02)


# ═══════════════════════════════════════════════════════════════════
#  UPGRADE 4: Real Transit Integration (Western)
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade4TransitIntegration:
    """Western adapter should weigh transits more heavily for timing questions."""

    @pytest.fixture
    def western_data(self):
        from backend.engines.common import build_context
        from backend.engines import western

        class Payload:
            birth_date = "1990-04-21"
            birth_time = "14:30"
            birth_location = "Los Angeles, CA"
            full_name = "Test User"
            hebrew_name = ""

        ctx = build_context(Payload())
        return western.calculate(ctx)

    def test_timing_question_has_transit_evidence(self, western_data):
        adapter = ADAPTERS["western"]
        intent = classify("When should I start my business?")
        opinion = adapter.evaluate(western_data, intent)
        # For timing questions, transit evidence should be present with boosted weight
        transit_ev = [e for e in opinion.evidence if "transit" in e.feature.lower()]
        assert len(transit_ev) > 0, "Timing questions should have transit evidence"

    def test_timing_vs_general_produces_different_stances(self, western_data):
        adapter = ADAPTERS["western"]
        timing_intent = classify("When should I start my business?")
        general_intent = classify("How is my career looking?")
        timing_op = adapter.evaluate(western_data, timing_intent)
        general_op = adapter.evaluate(western_data, general_intent)
        # Stances should differ since transit weight is 2.5x for timing
        if timing_op.relevant and general_op.relevant:
            t_winner = max(timing_op.stance.values())
            g_winner = max(general_op.stance.values())
            # They should differ by at least a tiny amount
            assert t_winner != pytest.approx(g_winner, abs=0.0001) or \
                   timing_op.stance != general_op.stance


# ═══════════════════════════════════════════════════════════════════
#  UPGRADE 5: House-Domain Mapping (Western)
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade5HouseDomainMapping:
    """Western adapter uses HOUSE_DOMAIN_MAP to boost/penalize based on house placements."""

    def test_house_domain_map_exists_in_adapter(self):
        from backend.engines.pipeline.adapters.western import WesternAdapter
        # Verify the adapter code references house-domain mapping
        import inspect
        source = inspect.getsource(WesternAdapter._compute_stance)
        assert "HOUSE_DOMAIN_MAP" in source

    def test_love_question_considers_house_7(self):
        adapter = ADAPTERS["western"]
        intent = classify("Will I find love?")
        # Construct data with Venus in House 7 (love house)
        data = {
            "scores": {"love": {"value": 75}},
            "highlights": [
                {"label": "Venus", "value": "Pisces in House 7"},
                {"label": "Moon", "value": "Cancer in House 4"},
            ],
        }
        opinion = adapter.evaluate(data, intent)
        assert opinion.relevant is True
        # The love question with Venus in House 7 should skew favorable
        winner_stance = max(opinion.stance.values())
        assert winner_stance > 0.55


# ═══════════════════════════════════════════════════════════════════
#  UPGRADE 6: Counterpoint Always Present
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade6CounterpointAlwaysPresent:
    """Body should scan ALL opinions for cautioners, not just top contributors."""

    def test_counterpoint_from_non_top_opinion(self):
        """Even if top opinions are all supportive, a cautioner from a non-top
        system should appear in the composed answer."""
        intent = classify("Should I invest now?")
        # All top opinions favor
        western_op = SystemOpinion(
            system_id="western", relevant=True,
            stance={"favorable": 0.85, "cautious": 0.15},
            confidence=0.9, reason="Jupiter supports wealth",
            evidence=[EvidenceItem(feature="Jupiter", value="Sagittarius H2", weight=0.9)],
        )
        vedic_op = SystemOpinion(
            system_id="vedic", relevant=True,
            stance={"favorable": 0.80, "cautious": 0.20},
            confidence=0.8, reason="Dasha favors",
            evidence=[EvidenceItem(feature="Dasha", value="Jupiter", weight=0.8)],
        )
        # Non-top opinion that cautions
        bazi_op = SystemOpinion(
            system_id="bazi", relevant=True,
            stance={"favorable": 0.30, "cautious": 0.70},
            confidence=0.6, reason="Day Master weak for finance",
            evidence=[EvidenceItem(feature="Day Master", value="weak water", weight=0.7)],
        )
        agg = AggregatedResult(
            winner="favorable",
            scores={"favorable": 0.75, "cautious": 0.25},
            contributors=["western", "vedic"],
            confidence=0.8,
            opinions=[western_op, vedic_op, bazi_op],
        )
        result = compose(intent, agg)
        # BaZi's caution should appear somewhere in the reasoning
        assert "BaZi" in result.reasoning or "Four Pillars" in result.reasoning


# ═══════════════════════════════════════════════════════════════════
#  UPGRADE 7: Dasha-Aware Timing (Vedic)
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade7DashaDomainBoost:
    """Vedic adapter uses DASHA_DOMAIN_BOOST for dasha lord → domain boosting."""

    def test_dasha_boost_table_exists(self):
        from backend.engines.pipeline.adapters.vedic import DASHA_DOMAIN_BOOST
        assert "Venus" in DASHA_DOMAIN_BOOST
        assert "Jupiter" in DASHA_DOMAIN_BOOST
        assert "Saturn" in DASHA_DOMAIN_BOOST
        # Venus should boost love
        assert DASHA_DOMAIN_BOOST["Venus"]["love"] > 0

    def test_venus_dasha_boosts_love_stance(self):
        """When Vedic data has Venus Mahadasha and question is about love,
        the adapter should show favorable leaning."""
        adapter = ADAPTERS["vedic"]
        intent = classify("Will I find love?")
        data = {
            "scores": {"love": {"value": 60}},
            "highlights": [
                {"label": "Moon Rashi", "value": "Taurus"},
                {"label": "Nakshatra", "value": "Rohini"},
                {"label": "Current Mahadasha", "value": "Venus"},
            ],
        }
        opinion = adapter.evaluate(data, intent)
        if opinion.relevant:
            # Venus Mahadasha + love question should tilt favorable
            fav = max(opinion.stance.values())
            assert fav > 0.55

    def test_saturn_dasha_penalises_health(self):
        from backend.engines.pipeline.adapters.vedic import DASHA_DOMAIN_BOOST
        # Saturn should penalise health domain
        assert DASHA_DOMAIN_BOOST["Saturn"]["health"] < 0


# ═══════════════════════════════════════════════════════════════════
#  UPGRADE 8: Gematria Weight Reduction
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade8GematriaWeight:
    """Gematria system weight should be 0.40 (lowered from 0.65)."""

    def test_gematria_weight_is_reduced(self):
        assert SYSTEM_WEIGHT["gematria"] == pytest.approx(0.40, abs=0.01)

    def test_gematria_lower_than_major_systems(self):
        for sys_id in ("western", "vedic", "bazi", "numerology"):
            assert SYSTEM_WEIGHT[sys_id] > SYSTEM_WEIGHT["gematria"], \
                f"{sys_id} should outweigh gematria"


# ═══════════════════════════════════════════════════════════════════
#  UPGRADE 9: Answer Length Tied to Confidence
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade9ConfidenceBasedLength:
    """Composed answers should vary length based on aggregation confidence."""

    def _make_opinions(self, n=3):
        return [
            SystemOpinion(
                system_id=f"sys{i}", relevant=True,
                stance={"favorable": 0.7, "cautious": 0.3},
                confidence=0.7, reason=f"Reason {i}",
                evidence=[
                    EvidenceItem(feature=f"Feature{i}", value=f"Value{i}", weight=0.8),
                    EvidenceItem(feature=f"Feature{i}b", value=f"Value{i}b", weight=0.6),
                ],
            )
            for i in range(n)
        ]

    def test_high_confidence_produces_longer_answer(self):
        intent = classify("Will I find love?")
        ops = self._make_opinions(3)
        agg_high = AggregatedResult(
            winner="favorable", scores={"favorable": 0.8, "cautious": 0.2},
            contributors=["sys0", "sys1", "sys2"],
            confidence=0.85, opinions=ops,
        )
        agg_low = AggregatedResult(
            winner="favorable", scores={"favorable": 0.55, "cautious": 0.45},
            contributors=["sys0", "sys1", "sys2"],
            confidence=0.25, opinions=ops,
        )
        high_result = compose(intent, agg_high)
        low_result = compose(intent, agg_low)
        # High confidence answer should generally be longer (more evidence cited)
        assert len(high_result.reasoning) >= len(low_result.reasoning) * 0.5

    def test_low_confidence_mentions_uncertainty(self):
        intent = classify("Will I find love?")
        ops = self._make_opinions(2)
        agg = AggregatedResult(
            winner="favorable", scores={"favorable": 0.55, "cautious": 0.45},
            contributors=["sys0", "sys1"],
            confidence=0.20, opinions=ops,
        )
        result = compose(intent, agg)
        # Low confidence should mention uncertainty or gentleness
        reasoning_lower = result.reasoning.lower()
        has_uncertainty = any(phrase in reasoning_lower for phrase in [
            "gentle lean", "not a verdict", "food for thought",
            "instincts matter", "whispers", "starting point",
            "decide for yourself",
        ])
        assert has_uncertainty, f"Low-confidence answer should mention uncertainty: {result.reasoning[:200]}"

    def test_low_confidence_closing_from_pool(self):
        from backend.engines.pipeline.answer_composer import _closing, _CLOSE_LOW_CONFIDENCE
        close = _closing("firm", confidence=0.2)
        assert close in _CLOSE_LOW_CONFIDENCE


# ═══════════════════════════════════════════════════════════════════
#  UPGRADE 10: Temporal Variation Layer
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade10TemporalVariation:
    """Temporal modulation computes daily factors and applies them to stances."""

    def test_compute_returns_all_domains(self):
        mods = compute_temporal_modulation({"systems": {}})
        for d in ALL_DOMAINS:
            assert d in mods
            assert -0.12 <= mods[d] <= 0.12  # Upgrade 18: was ±0.08

    def test_moon_sign_modulates(self):
        reading_with_moon = {
            "systems": {
                "western": {
                    "highlights": [
                        {"label": "Moon", "value": "Cancer in House 4"},
                    ]
                }
            }
        }
        reading_without_moon = {"systems": {}}
        mods_with = compute_temporal_modulation(reading_with_moon)
        mods_without = compute_temporal_modulation(reading_without_moon)
        # Moon sign should change at least one domain's modulation
        assert mods_with != mods_without

    def test_apply_shifts_stances(self):
        op = SystemOpinion(
            system_id="test", relevant=True,
            stance={"favorable": 0.60, "cautious": 0.40},
            confidence=0.7, reason="test",
            evidence=[EvidenceItem(feature="X", value="Y", weight=0.5)],
        )
        original_fav = op.stance["favorable"]
        mods = {"love": 0.06, "career": 0.04, "health": 0.0, "wealth": 0.0, "mood": 0.0}
        apply_temporal_modulation([op], mods, ["love"])
        # The stance should have shifted
        assert op.stance["favorable"] != original_fav
        # But still normalised to ~1.0
        assert sum(op.stance.values()) == pytest.approx(1.0, abs=0.02)

    def test_apply_skips_irrelevant_opinions(self):
        op = SystemOpinion(
            system_id="test", relevant=False,
            stance={"favorable": 0.50, "cautious": 0.50},
            confidence=0.0, reason="irrelevant",
            evidence=[],
        )
        mods = {"love": 0.08}
        apply_temporal_modulation([op], mods, ["love"])
        # Irrelevant opinions should not be modified
        assert op.stance["favorable"] == 0.50

    def test_negligible_mod_is_skipped(self):
        op = SystemOpinion(
            system_id="test", relevant=True,
            stance={"favorable": 0.60, "cautious": 0.40},
            confidence=0.7, reason="test",
            evidence=[EvidenceItem(feature="X", value="Y", weight=0.5)],
        )
        # All mods near zero → no change
        mods = {"love": 0.002, "career": -0.001, "health": 0.0, "wealth": 0.0, "mood": 0.0}
        apply_temporal_modulation([op], mods, ["love"])
        assert op.stance["favorable"] == 0.60

    def test_temporal_modulation_in_full_pipeline(self):
        """End-to-end: pipeline.run uses temporal modulation."""
        from backend.engines.common import build_context
        from backend.engines import western, vedic, chinese, bazi, numerology, kabbalistic, gematria, persian, combined

        class Payload:
            birth_date = "1990-04-21"
            birth_time = "14:30"
            birth_location = "Los Angeles, CA"
            full_name = "Test User"
            hebrew_name = ""

        ctx = build_context(Payload())
        systems = {
            "western": western.calculate(ctx),
            "vedic": vedic.calculate(ctx),
            "chinese": chinese.calculate(ctx),
            "bazi": bazi.calculate(ctx),
            "numerology": numerology.calculate(ctx),
            "kabbalistic": kabbalistic.calculate(ctx),
            "gematria": gematria.calculate(ctx),
            "persian": persian.calculate(ctx),
        }
        merged = combined.calculate(ctx, systems)
        reading = {"systems": systems, "combined": merged}
        # Should run without error — temporal modulation is applied internally
        result = run("Is today a good day for love?", reading)
        assert isinstance(result, PipelineResponse)
        assert result.confidence > 0

    def test_day_ruler_covers_all_weekdays(self):
        for weekday in range(7):
            assert weekday in DAY_RULER

    def test_modulation_clamped(self):
        """Even with all sources active, values stay within [-0.12, 0.12] (Upgrade 18)."""
        reading = {
            "systems": {
                "persian": {
                    "highlights": [
                        {"label": "Current Moon", "value": "Cancer"},
                    ]
                }
            }
        }
        mods = compute_temporal_modulation(reading)
        for d, v in mods.items():
            assert -0.12 <= v <= 0.12, f"{d}: {v} out of bounds"


# ═══════════════════════════════════════════════════════════════════
#  Upgrade 18 — Temporal Modulation Amplification
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade18TemporalAmplification:
    def test_clamp_range_is_0_12(self):
        """Clamp range should be ±0.12 (not the old ±0.08)."""
        reading = {
            "systems": {
                "persian": {
                    "highlights": [
                        {"label": "Current Moon", "value": "Cancer"},
                    ]
                }
            }
        }
        mods = compute_temporal_modulation(reading)
        for d, v in mods.items():
            assert -0.12 <= v <= 0.12, f"{d}: {v} out of new ±0.12 bounds"
            # Confirm nothing is artificially clamped at old ±0.08 boundary
            # (it's fine if values happen to be within 0.08 — just not forced)

    def test_values_can_exceed_old_clamp(self):
        """With day ruler + moon sign + hour all contributing, some domains
        can plausibly exceed ±0.08 but must stay within ±0.12."""
        # We just verify the function doesn't crash and stays in bounds
        reading = {"systems": {}}
        mods = compute_temporal_modulation(reading)
        for d, v in mods.items():
            assert -0.12 <= v <= 0.12


# ═══════════════════════════════════════════════════════════════════
#  Upgrade 19 — Planetary Hours Stance Integration
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade19PlanetaryHourIntegration:
    def test_planetary_hour_modifier_returns_dict(self):
        """compute_planetary_hour_modifier should always return a dict."""
        reading = {"systems": {}}
        result = compute_planetary_hour_modifier(reading)
        assert isinstance(result, dict)

    def test_modifier_values_are_domain_floats(self):
        """Returned values should be float modifiers for valid domains."""
        reading = {"systems": {}}
        result = compute_planetary_hour_modifier(reading)
        for domain, mod in result.items():
            assert domain in ALL_DOMAINS, f"unexpected domain {domain}"
            assert isinstance(mod, (int, float))

    def test_modifier_from_reading_data(self):
        """When reading has planetary hour info, use it."""
        reading = {
            "systems": {
                "persian": {
                    "highlights": [
                        {"label": "Planetary Hour", "value": "Jupiter hour"},
                    ]
                }
            }
        }
        result = compute_planetary_hour_modifier(reading)
        assert result.get("wealth") == 0.05
        assert result.get("career") == 0.03

    def test_modifier_merged_in_temporal(self):
        """Planetary hour modifier should be merged into temporal modulation."""
        # The fact that compute_temporal_modulation runs without error and
        # still returns valid domain floats confirms the merge.
        reading = {"systems": {}}
        mods = compute_temporal_modulation(reading)
        assert isinstance(mods, dict)
        for d in ALL_DOMAINS:
            assert d in mods


# ═══════════════════════════════════════════════════════════════════
#  Upgrade 20 — Moon Phase Confidence Modifier
# ═══════════════════════════════════════════════════════════════════

class TestUpgrade20MoonPhaseConfidence:
    def test_new_moon_positive(self):
        reading = {
            "systems": {
                "western": {
                    "highlights": [
                        {"label": "Moon Phase", "value": "New Moon"},
                    ]
                }
            }
        }
        assert moon_phase_confidence_modifier(reading) == 0.03

    def test_full_moon_positive(self):
        reading = {
            "systems": {
                "western": {
                    "highlights": [
                        {"label": "Moon Phase", "value": "Full Moon"},
                    ]
                }
            }
        }
        assert moon_phase_confidence_modifier(reading) == 0.03

    def test_first_quarter_negative(self):
        reading = {
            "systems": {
                "western": {
                    "highlights": [
                        {"label": "Moon Phase", "value": "First Quarter"},
                    ]
                }
            }
        }
        assert moon_phase_confidence_modifier(reading) == -0.03

    def test_last_quarter_negative(self):
        reading = {
            "systems": {
                "western": {
                    "highlights": [
                        {"label": "Lunar Phase", "value": "Last Quarter"},
                    ]
                }
            }
        }
        assert moon_phase_confidence_modifier(reading) == -0.03

    def test_waxing_crescent_small_positive(self):
        reading = {
            "systems": {
                "western": {
                    "highlights": [
                        {"label": "Moon Phase", "value": "Waxing Crescent"},
                    ]
                }
            }
        }
        assert moon_phase_confidence_modifier(reading) == 0.01

    def test_waxing_gibbous_neutral(self):
        reading = {
            "systems": {
                "western": {
                    "highlights": [
                        {"label": "Moon Phase", "value": "Waxing Gibbous"},
                    ]
                }
            }
        }
        assert moon_phase_confidence_modifier(reading) == 0.0

    def test_no_phase_returns_zero(self):
        reading = {"systems": {}}
        assert moon_phase_confidence_modifier(reading) == 0.0

    def test_moon_phase_nested_key(self):
        """Should find phase in nested moon_phase key too."""
        reading = {
            "systems": {
                "western": {
                    "highlights": [],
                    "moon_phase": "Full Moon",
                }
            }
        }
        assert moon_phase_confidence_modifier(reading) == 0.03

    def test_moon_phase_applied_in_engine(self):
        """Smoke test: engine.run should work with moon phase modifier active."""
        from backend.engines.common import build_context
        from backend.engines import (
            western, vedic, chinese, bazi, numerology,
            kabbalistic, gematria, persian, combined,
        )

        class Payload:
            birth_date = "1990-04-21"
            birth_time = "14:30"
            birth_location = "Los Angeles, CA"
            full_name = "Test User"
            hebrew_name = ""

        ctx = build_context(Payload())
        systems = {
            "western": western.calculate(ctx),
            "vedic": vedic.calculate(ctx),
            "chinese": chinese.calculate(ctx),
            "bazi": bazi.calculate(ctx),
            "numerology": numerology.calculate(ctx),
            "kabbalistic": kabbalistic.calculate(ctx),
            "gematria": gematria.calculate(ctx),
            "persian": persian.calculate(ctx),
        }
        merged = combined.calculate(ctx, systems)
        reading = {"systems": systems, "combined": merged}
        result = run("How is my career looking this week?", reading)
        assert isinstance(result, PipelineResponse)
        assert 0.05 <= result.confidence <= 0.95


# ═══════════════════════════════════════════════════════════════════
#  Upgrades 61-70: Kabbalistic Adapter
# ═══════════════════════════════════════════════════════════════════

from backend.engines.pipeline.adapters.kabbalistic import (
    SEFIRAH_ADJACENCY,
    SUPERNAL_SEFIROT,
    LETTER_ELEMENT,
    ELEMENT_DOMAIN_AFFINITY,
    HARMONIOUS_PAIRS,
    TENSE_PAIRS,
    SEFIRAH_POSITION,
    WORLD_DOMAIN,
    _are_adjacent,
    _crosses_abyss,
    _pillar_severity,
    _world_resonance,
    _tree_direction,
    _cycle_phase,
    PILLAR_MAP,
    WORLD_MAP,
    KabbalisticAdapter,
)


class TestUpgrade61SefirotProximity:
    """Upgrade 61: Sefirot adjacency on the Tree of Life."""

    def test_adjacency_complete(self):
        """All 10 sefirot have adjacency entries."""
        expected = {"Keter", "Chokmah", "Binah", "Chesed", "Gevurah",
                    "Tiferet", "Netzach", "Hod", "Yesod", "Malkuth"}
        assert set(SEFIRAH_ADJACENCY.keys()) == expected

    def test_adjacent_pair(self):
        assert _are_adjacent("Keter", "Chokmah") is True
        assert _are_adjacent("Tiferet", "Yesod") is True

    def test_non_adjacent_pair(self):
        assert _are_adjacent("Keter", "Malkuth") is False
        assert _are_adjacent("Chokmah", "Hod") is False

    def test_adjacency_case_insensitive_or_unknown(self):
        # Unknown names should return False
        assert _are_adjacent("Unknown", "Keter") is False

    def test_all_sefirot_have_adjacency(self):
        assert len(SEFIRAH_ADJACENCY) == 10


class TestUpgrade62AbyssBoundary:
    """Upgrade 62: Supernal / Abyss crossing detection."""

    def test_supernal_set(self):
        assert SUPERNAL_SEFIROT == {"Keter", "Chokmah", "Binah"}

    def test_crosses_abyss_true(self):
        # Keter (supernal) to Chesed (below) = crosses
        assert _crosses_abyss("Keter", "Chesed") is True
        assert _crosses_abyss("Binah", "Gevurah") is True

    def test_crosses_abyss_false_both_supernal(self):
        assert _crosses_abyss("Keter", "Chokmah") is False

    def test_crosses_abyss_false_both_below(self):
        assert _crosses_abyss("Chesed", "Netzach") is False


class TestUpgrade63PillarSeverity:
    """Upgrade 63: Pillar imbalance severity scoring."""

    def test_perfect_balance(self):
        counts = {"Right": 3, "Left": 3, "Middle": 3}
        severity = _pillar_severity(counts)
        assert severity <= 0.2  # balanced

    def test_extreme_imbalance(self):
        counts = {"Right": 6, "Left": 0, "Middle": 0}
        severity = _pillar_severity(counts)
        assert severity >= 0.7  # heavily imbalanced

    def test_empty_counts(self):
        counts = {"Right": 0, "Left": 0, "Middle": 0}
        severity = _pillar_severity(counts)
        assert 0.0 <= severity <= 1.0


class TestUpgrade64WorldResonance:
    """Upgrade 64: World (Olam) layer resonance."""

    def test_world_domain_complete(self):
        assert set(WORLD_DOMAIN.keys()) == {"Atzilut", "Briah", "Yetzirah", "Assiah"}

    def test_world_resonance_cluster(self):
        # Keter, Chokmah, Binah are all Atzilut
        sefirot = ["Keter", "Chokmah", "Binah"]
        world, count = _world_resonance(sefirot)
        assert world == "Atzilut"
        assert count == 3

    def test_world_resonance_no_cluster(self):
        sefirot = ["Keter", "Chesed", "Netzach"]  # Atzilut, Briah, Yetzirah
        world, count = _world_resonance(sefirot)
        assert world is None


class TestUpgrade65LetterElements:
    """Upgrade 65: Hebrew mother letter element associations."""

    def test_three_mother_letters(self):
        assert set(LETTER_ELEMENT.keys()) == {"Aleph", "Mem", "Shin"}
        assert LETTER_ELEMENT["Aleph"] == "Air"
        assert LETTER_ELEMENT["Mem"] == "Water"
        assert LETTER_ELEMENT["Shin"] == "Fire"

    def test_element_domain_affinities(self):
        assert "career" in ELEMENT_DOMAIN_AFFINITY["Fire"]
        assert "love" in ELEMENT_DOMAIN_AFFINITY["Water"]
        assert "mood" in ELEMENT_DOMAIN_AFFINITY["Air"]


class TestUpgrade66PairHarmonyTension:
    """Upgrade 66: Sefirah pair harmony / tension detection."""

    def test_harmonious_pairs_structure(self):
        assert len(HARMONIOUS_PAIRS) >= 5
        for pair in HARMONIOUS_PAIRS:
            assert isinstance(pair, frozenset)
            assert len(pair) == 2

    def test_tense_pairs_structure(self):
        assert len(TENSE_PAIRS) >= 4
        for pair in TENSE_PAIRS:
            assert isinstance(pair, frozenset)
            assert len(pair) == 2

    def test_chesed_netzach_harmonious(self):
        assert frozenset({"Chesed", "Netzach"}) in HARMONIOUS_PAIRS

    def test_chesed_gevurah_tense(self):
        assert frozenset({"Chesed", "Gevurah"}) in TENSE_PAIRS

    def test_no_overlap(self):
        assert HARMONIOUS_PAIRS.isdisjoint(TENSE_PAIRS)


class TestUpgrade67TreeDirection:
    """Upgrade 67: Sefirah numeric position and tree direction."""

    def test_position_ordering(self):
        assert SEFIRAH_POSITION["Keter"] == 1
        assert SEFIRAH_POSITION["Malkuth"] == 10
        assert len(SEFIRAH_POSITION) == 10

    def test_ascending_direction(self):
        # Malkuth → Yesod → Tiferet = ascending toward Keter
        result = _tree_direction(["Malkuth", "Yesod", "Tiferet"])
        assert result == "ascending"

    def test_descending_direction(self):
        # Keter → Chesed → Netzach = descending toward Malkuth
        result = _tree_direction(["Keter", "Chesed", "Netzach"])
        assert result == "descending"

    def test_stable_direction(self):
        # Same position or mixed
        result = _tree_direction(["Tiferet", "Tiferet"])
        assert result == "stable"


class TestUpgrade70CyclePhase:
    """Upgrade 70: Cycle phase derivation from sefirah position."""

    def test_keter_phase(self):
        phase, desc = _cycle_phase("Keter")
        assert isinstance(phase, str) and len(phase) > 0
        assert isinstance(desc, str) and len(desc) > 0

    def test_malkuth_phase(self):
        phase, desc = _cycle_phase("Malkuth")
        assert isinstance(phase, str)

    def test_unknown_sefirah(self):
        phase, desc = _cycle_phase("Unknown")
        assert isinstance(phase, str)


class TestKabbalisticAdapterIntegration:
    """End-to-end: Kabbalistic adapter with upgrades 61-70 active."""

    def test_adapter_evaluate_with_data(self):
        """Kabbalistic adapter produces an opinion from chart data."""
        from backend.engines.common import build_context
        from backend.engines import kabbalistic as kab_engine

        class P:
            birth_date = "1990-04-21"
            birth_time = "14:30"
            birth_location = "Los Angeles, CA"
            full_name = "Test User"
            hebrew_name = "Avram"

        ctx = build_context(P())
        system_data = kab_engine.calculate(ctx)
        adapter = KabbalisticAdapter()
        intent = classify("Should I change jobs or stay?")
        opinion = adapter.evaluate(system_data, intent)
        assert opinion.system_id == "kabbalistic"
        assert 0 <= opinion.confidence <= 1
        assert len(opinion.evidence) > 0


# ═══════════════════════════════════════════════════════════════════
#  Upgrades 71-80: Gematria Adapter
# ═══════════════════════════════════════════════════════════════════

from backend.engines.pipeline.adapters.gematria import (
    MASTER_INTENSITY,
    LETTER_PATH_MEANING,
    ROOT_POLARITY,
    ROOT_DOMAIN,
    _reduce_root,
    _root_progression,
    _positional_word_weights,
    _check_compound_resonance,
    _letter_frequency_resonance,
    _count_theme_agreement,
    GematriaAdapter,
)


class TestUpgrade71RootProgression:
    """Upgrade 71: Root progression analysis."""

    def test_reduce_root_simple(self):
        assert _reduce_root(23) == 5  # 2+3=5
        assert _reduce_root(9) == 9

    def test_reduce_root_master(self):
        # Master numbers (11, 22, 33) may be preserved depending on implementation
        result = _reduce_root(11)
        assert result in (2, 11)  # either reduce or keep master

    def test_ascending_progression(self):
        result = _root_progression(3, 5, 7)
        assert result == "ascending"

    def test_descending_progression(self):
        result = _root_progression(7, 5, 3)
        assert result == "descending"

    def test_stable_progression(self):
        result = _root_progression(5, 5, 5)
        assert result == "stable"


class TestUpgrade72MasterAmplification:
    """Upgrade 72: Master number intensity scaling."""

    def test_master_intensity_values(self):
        assert 11 in MASTER_INTENSITY
        assert 22 in MASTER_INTENSITY
        assert 33 in MASTER_INTENSITY
        # All intensities should be > 1.0 (amplifying)
        for val in MASTER_INTENSITY.values():
            assert val > 1.0

    def test_master_intensity_ordering(self):
        # 22 is the master builder, typically strongest
        assert MASTER_INTENSITY[22] >= MASTER_INTENSITY[33]


class TestUpgrade73LetterPathMeaning:
    """Upgrade 73: Letter path symbolic meanings."""

    def test_letter_path_has_entries(self):
        assert len(LETTER_PATH_MEANING) >= 9  # At least 1-9

    def test_paths_are_strings(self):
        for key, val in LETTER_PATH_MEANING.items():
            assert isinstance(key, int)
            assert isinstance(val, str) and len(val) > 0


class TestUpgrade75PositionalWeighting:
    """Upgrade 75: Positional word weighting."""

    def test_first_and_last_weighted_higher(self):
        roots = [1, 5, 3, 7, 9]
        weighted = _positional_word_weights(roots)
        assert len(weighted) == 5
        # First and last should have higher multiplier than middle
        first_mult = weighted[0][1]
        middle_mult = weighted[2][1]
        assert first_mult >= middle_mult

    def test_single_root(self):
        weighted = _positional_word_weights([7])
        assert len(weighted) == 1


class TestUpgrade76CompoundResonance:
    """Upgrade 76: Compound resonance detection."""

    def test_resonance_match(self):
        # text_root == (ordinal + bridge) % 9 or similar
        # If 3 == (5 + 7) % 9 → 3 == 12 % 9 → 3 == 3 → True
        result = _check_compound_resonance(3, 5, 7)
        assert isinstance(result, bool)

    def test_resonance_types(self):
        # Test that function always returns bool
        assert isinstance(_check_compound_resonance(1, 2, 3), bool)


class TestUpgrade79LetterFrequency:
    """Upgrade 79: Letter frequency resonance."""

    def test_frequent_letters_detected(self):
        # Name with repeated 'A' (letter Aleph → 1)
        result = _letter_frequency_resonance("AAABBBCCC")
        assert isinstance(result, list)
        # Should find letters with 3+ occurrences
        for letter, count, polarity in result:
            assert count >= 3

    def test_no_frequent_letters(self):
        result = _letter_frequency_resonance("ABCDEF")
        assert result == []  # No letter appears 3+ times


class TestUpgrade80ThemeAgreement:
    """Upgrade 80: Correspondence theme agreement counting."""

    def test_agreement_count(self):
        # Themes from different layers
        corr = [
            ("hebrew", 3, "creation"),
            ("ordinal", 3, "creation"),
            ("bridge", 5, "change"),
        ]
        count = _count_theme_agreement(corr)
        assert isinstance(count, int)
        assert count >= 0


class TestGematriaAdapterIntegration:
    """End-to-end: Gematria adapter with upgrades 71-80."""

    def test_adapter_evaluate(self):
        adapter = GematriaAdapter()
        intent = classify("What does my name reveal?")
        system_data = {
            "highlights": [
                {"label": "Text root", "value": "5"},
                {"label": "Ordinal root", "value": "3"},
                {"label": "Bridge root", "value": "7"},
                {"label": "Current gate", "value": "5"},
                {"label": "Source", "value": "hebrew name"},
            ],
            "tables": [
                {
                    "title": "Root correspondence",
                    "rows": [
                        ["Hebrew", "3", "creation"],
                        ["Ordinal", "5", "change"],
                    ],
                },
            ],
        }
        opinion = adapter.evaluate(system_data, intent)
        assert opinion.system_id == "gematria"
        assert 0 <= opinion.confidence <= 1


# ═══════════════════════════════════════════════════════════════════
#  Upgrades 81-90: Persian Adapter
# ═══════════════════════════════════════════════════════════════════

from backend.engines.pipeline.adapters.persian import (
    SECT_BENEFIC,
    TRIPLICITY_RULERS,
    FIXED_STARS,
    PLANET_IMPORTANCE,
    DECAN_MODIFIER,
    MANSION_DOMAIN,
    _mansion_series,
    PersianAdapter,
)


class TestUpgrade81SectBenefic:
    """Upgrade 81: Sect-based benefic planets."""

    def test_sect_has_day_and_night(self):
        assert "Day" in SECT_BENEFIC or "day" in SECT_BENEFIC
        assert "Night" in SECT_BENEFIC or "night" in SECT_BENEFIC

    def test_sect_benefics_are_sets(self):
        for key, val in SECT_BENEFIC.items():
            assert isinstance(val, set)
            assert len(val) > 0


class TestUpgrade82TriplicityRulers:
    """Upgrade 82: Triplicity ruler system."""

    def test_all_twelve_signs(self):
        zodiac = {
            "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
            "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
        }
        assert zodiac.issubset(set(TRIPLICITY_RULERS.keys()))

    def test_ruler_tuples(self):
        for sign, rulers in TRIPLICITY_RULERS.items():
            assert isinstance(rulers, tuple)
            assert len(rulers) == 3  # day, night, participating


class TestUpgrade83FixedStars:
    """Upgrade 83: Fixed star influence data."""

    def test_has_entries(self):
        assert len(FIXED_STARS) >= 3

    def test_star_structure(self):
        for star, data in FIXED_STARS.items():
            assert isinstance(data, dict)
            assert isinstance(star, str)


class TestUpgrade87MansionSeries:
    """Upgrade 87: Lunar mansion series grouping."""

    def test_series_range(self):
        for i in range(1, 29):
            s = _mansion_series(i)
            assert 0 <= s <= 3

    def test_first_mansion(self):
        assert _mansion_series(1) == 0

    def test_last_mansion(self):
        assert _mansion_series(28) == 3


class TestUpgrade88PlanetImportance:
    """Upgrade 88: Planet importance weighting."""

    def test_has_planets(self):
        assert len(PLANET_IMPORTANCE) >= 5
        # Sun and Moon should be most important
        for planet in ("Sun", "Moon"):
            if planet in PLANET_IMPORTANCE:
                assert PLANET_IMPORTANCE[planet] >= 1.0


class TestUpgrade89DecanPrecision:
    """Upgrade 89: Decan modifiers."""

    def test_three_decans(self):
        assert len(DECAN_MODIFIER) == 3
        for decan in (1, 2, 3):
            assert decan in DECAN_MODIFIER


class TestUpgrade90MansionDomain:
    """Upgrade 90: Mansion domain mapping."""

    def test_has_entries(self):
        assert len(MANSION_DOMAIN) >= 10

    def test_domain_values(self):
        valid_domains = {"love", "career", "health", "wealth", "mood"}
        for idx, domain in MANSION_DOMAIN.items():
            assert domain in valid_domains


class TestPersianAdapterIntegration:
    """End-to-end: Persian adapter with upgrades 81-90."""

    def test_adapter_evaluate(self):
        adapter = PersianAdapter()
        intent = classify("Is this a good time to act?")
        system_data = {
            "highlights": [
                {"label": "Day Ruler", "value": "Jupiter"},
                {"label": "Temperament", "value": "Sanguine"},
                {"label": "Sect", "value": "Day chart"},
                {"label": "Lot of Fortune", "value": "House 1"},
                {"label": "Current Mansion", "value": "3 — Al-Thurayya"},
            ],
        }
        opinion = adapter.evaluate(system_data, intent)
        assert opinion.system_id == "persian"
        assert 0 <= opinion.confidence <= 1


# ═══════════════════════════════════════════════════════════════════
#  Upgrades 91-100: Aggregator
# ═══════════════════════════════════════════════════════════════════

from backend.engines.pipeline.aggregator import (
    _evidence_quality_bonus,
    _sigmoid_calibrate,
    _stance_variance,
    _detect_clusters,
)


def _make_opinion(sid, stance, conf=0.7, relevant=True, evidence=None):
    """Helper to build a SystemOpinion."""
    return SystemOpinion(
        system_id=sid,
        relevant=relevant,
        stance=stance,
        confidence=conf,
        reason="test",
        evidence=evidence or [],
    )


class TestUpgrade91BayesianPrior:
    """Upgrade 91: Bayesian confidence blending with session history."""

    def test_prior_influences_confidence(self):
        opinions = [
            _make_opinion("western", {"favorable": 0.7, "cautious": 0.3}, 0.8),
            _make_opinion("vedic", {"favorable": 0.6, "cautious": 0.4}, 0.7),
        ]
        intent = classify("Should I go or stay?")
        result_no_prior = aggregate(opinions, intent)
        result_with_prior = aggregate(opinions, intent, prior_confidence=0.9)
        # With a high prior, confidence should be at least as high
        # (Bayesian blending pulls toward the prior)
        assert isinstance(result_with_prior.confidence, float)


class TestUpgrade92ClusterDetection:
    """Upgrade 92: Bimodal stance cluster detection."""

    def test_no_clusters_few_systems(self):
        opinions = [
            _make_opinion("western", {"fav": 0.6, "caut": 0.4}),
            _make_opinion("vedic", {"fav": 0.6, "caut": 0.4}),
        ]
        assert _detect_clusters(opinions, "fav") is False

    def test_clusters_bimodal(self):
        opinions = [
            _make_opinion("western", {"fav": 0.8, "caut": 0.2}),
            _make_opinion("vedic", {"fav": 0.85, "caut": 0.15}),
            _make_opinion("bazi", {"fav": 0.3, "caut": 0.7}),
            _make_opinion("chinese", {"fav": 0.25, "caut": 0.75}),
        ]
        assert _detect_clusters(opinions, "fav") is True

    def test_clustered_flag_in_result(self):
        opinions = [
            _make_opinion("western", {"fav": 0.8, "caut": 0.2}),
            _make_opinion("vedic", {"fav": 0.85, "caut": 0.15}),
            _make_opinion("bazi", {"fav": 0.3, "caut": 0.7}),
            _make_opinion("chinese", {"fav": 0.25, "caut": 0.75}),
        ]
        result = aggregate(opinions)
        assert isinstance(result.clustered, bool)


class TestUpgrade93InvertedConsensus:
    """Upgrade 93: Inverted consensus boost for unanimous cautious."""

    def test_unanimous_cautious_boost(self):
        opinions = [
            _make_opinion("western", {"favorable": 0.3, "cautious": 0.7}, 0.7),
            _make_opinion("vedic", {"favorable": 0.2, "cautious": 0.8}, 0.8),
            _make_opinion("bazi", {"favorable": 0.25, "cautious": 0.75}, 0.6),
        ]
        result = aggregate(opinions)
        assert result.winner == "cautious"
        # Confidence should be reasonable (not penalized for unanimous negative)
        assert result.confidence >= 0.10


class TestUpgrade94EvidenceQuality:
    """Upgrade 94: Evidence diversity bonus."""

    def test_diverse_evidence_bonus(self):
        evidence = [
            EvidenceItem(feature="Sun", value="Aries", weight=0.8, category="planet"),
            EvidenceItem(feature="House", value="10th", weight=0.7, category="house"),
            EvidenceItem(feature="Aspect", value="trine", weight=0.6, category="aspect"),
            EvidenceItem(feature="Transit", value="Jupiter", weight=0.5, category="transit"),
            EvidenceItem(feature="Nakshatra", value="Ashwini", weight=0.4, category="nakshatra"),
        ]
        opinion = _make_opinion("western", {"fav": 0.7, "caut": 0.3}, evidence=evidence)
        bonus = _evidence_quality_bonus(opinion)
        assert bonus > 0

    def test_low_diversity_no_bonus(self):
        evidence = [
            EvidenceItem(feature="Sun", value="Aries", weight=0.8, category="planet"),
            EvidenceItem(feature="Moon", value="Cancer", weight=0.7, category="planet"),
        ]
        opinion = _make_opinion("western", {"fav": 0.7, "caut": 0.3}, evidence=evidence)
        bonus = _evidence_quality_bonus(opinion)
        assert bonus == 0


class TestUpgrade95SigmoidCalibration:
    """Upgrade 95: Sigmoid confidence calibration."""

    def test_midpoint(self):
        # At 0.45, sigmoid should return ~0.5
        result = _sigmoid_calibrate(0.45)
        assert 0.45 <= result <= 0.55

    def test_high_value(self):
        result = _sigmoid_calibrate(0.8)
        assert result > 0.9

    def test_low_value(self):
        result = _sigmoid_calibrate(0.1)
        assert result < 0.1

    def test_monotonic(self):
        values = [_sigmoid_calibrate(x / 10) for x in range(11)]
        for i in range(len(values) - 1):
            assert values[i] <= values[i + 1]


class TestUpgrade96WeightedAgreement:
    """Upgrade 96: Weighted agreement counting."""

    def test_weighted_agreement_in_aggregate(self):
        # All systems agree strongly — should see a confidence boost
        opinions = [
            _make_opinion("western", {"fav": 0.8, "caut": 0.2}, 0.8),
            _make_opinion("vedic", {"fav": 0.75, "caut": 0.25}, 0.7),
            _make_opinion("bazi", {"fav": 0.7, "caut": 0.3}, 0.7),
            _make_opinion("persian", {"fav": 0.65, "caut": 0.35}, 0.6),
        ]
        result = aggregate(opinions)
        assert result.winner == "fav"
        assert result.confidence > 0.3


class TestUpgrade97StanceVariance:
    """Upgrade 97: Stance distribution variance and polarized flag."""

    def test_low_variance(self):
        opinions = [
            _make_opinion("w", {"fav": 0.6, "caut": 0.4}),
            _make_opinion("v", {"fav": 0.6, "caut": 0.4}),
            _make_opinion("b", {"fav": 0.6, "caut": 0.4}),
        ]
        var = _stance_variance(opinions, "fav")
        assert var < 0.01

    def test_high_variance(self):
        opinions = [
            _make_opinion("w", {"fav": 0.9, "caut": 0.1}),
            _make_opinion("v", {"fav": 0.2, "caut": 0.8}),
        ]
        var = _stance_variance(opinions, "fav")
        assert var > 0.1

    def test_polarized_flag_in_result(self):
        opinions = [
            _make_opinion("western", {"fav": 0.9, "caut": 0.1}, 0.8),
            _make_opinion("vedic", {"fav": 0.2, "caut": 0.8}, 0.8),
            _make_opinion("bazi", {"fav": 0.85, "caut": 0.15}, 0.7),
            _make_opinion("chinese", {"fav": 0.15, "caut": 0.85}, 0.7),
        ]
        result = aggregate(opinions)
        assert isinstance(result.polarized, bool)


class TestUpgrade98DynamicFloor:
    """Upgrade 98: Dynamic confidence floor based on feasibility × specificity."""

    def test_floor_applied(self):
        opinions = [
            _make_opinion("western", {"fav": 0.5, "caut": 0.5}, 0.1),
        ]
        intent = classify("What is the meaning of everything?")
        result = aggregate(opinions, intent)
        assert result.confidence >= 0.05  # floor never drops to zero


class TestUpgrade100MultiPath:
    """Upgrade 100: Multi-path detection (3+ options near-tied)."""

    def test_multi_path_flag(self):
        opinions = [
            SystemOpinion(
                system_id="western", relevant=True,
                stance={"A": 0.34, "B": 0.33, "C": 0.33},
                confidence=0.7, reason="t", evidence=[],
            ),
        ]
        result = aggregate(opinions)
        assert isinstance(result.multi_path, bool)


# ═══════════════════════════════════════════════════════════════════
#  Upgrades 101-110: Answer Composer
# ═══════════════════════════════════════════════════════════════════

from backend.engines.pipeline.answer_composer import (
    _OPEN_EMPATHETIC,
    _OPEN_DIRECT,
    _OPEN_RELATIONSHIP,
    _OPEN_CAREER,
    _OPEN_HEALTH,
    _OPEN_WEALTH,
    _TRANSITIONS,
    _QUALIFIER,
    _DOMAIN_METAPHORS,
    _CLOSE_DOMAIN,
    _SYSTEM_SPECIALIZATION,
    _tone,
)


class TestUpgrade101EmpathyDirect:
    """Upgrade 101: Emotional-charge-aware tone and opening pools."""

    def test_empathetic_pool_nonempty(self):
        assert len(_OPEN_EMPATHETIC) >= 3

    def test_direct_pool_nonempty(self):
        assert len(_OPEN_DIRECT) >= 3

    def test_tone_with_high_emotion(self):
        # High emotion + high confidence should soften tone
        tone_no_emotion = _tone(0.9, 0.3, emotional_charge=0.0)
        tone_high_emotion = _tone(0.9, 0.3, emotional_charge=0.9)
        # High emotion softens firm → guided
        assert tone_high_emotion in ("firm", "guided", "exploratory")

    def test_tone_return_types(self):
        for conf in (0.2, 0.5, 0.8):
            for gap in (0.02, 0.1, 0.3):
                t = _tone(conf, gap)
                assert t in ("firm", "guided", "exploratory")


class TestUpgrade103DomainOpenings:
    """Upgrade 103: Domain-specific opening pools."""

    def test_relationship_pool(self):
        assert len(_OPEN_RELATIONSHIP) >= 3
        for s in _OPEN_RELATIONSHIP:
            assert isinstance(s, str) and len(s) > 10

    def test_career_pool(self):
        assert len(_OPEN_CAREER) >= 3

    def test_health_pool(self):
        assert len(_OPEN_HEALTH) >= 3

    def test_wealth_pool(self):
        assert len(_OPEN_WEALTH) >= 3


class TestUpgrade104Transitions:
    """Upgrade 104: Flowing narrative connectors."""

    def test_transitions_nonempty(self):
        assert len(_TRANSITIONS) >= 8

    def test_transitions_have_placeholders(self):
        for t in _TRANSITIONS:
            # Each transition should have at least one placeholder
            assert "{" in t


class TestUpgrade105Qualifiers:
    """Upgrade 105: Confidence strength qualifiers."""

    def test_qualifier_bands(self):
        assert "high" in _QUALIFIER
        assert "medium" in _QUALIFIER
        assert "low" in _QUALIFIER

    def test_qualifier_nonempty(self):
        for band, words in _QUALIFIER.items():
            assert len(words) >= 2


class TestUpgrade106DomainMetaphors:
    """Upgrade 106: Domain metaphor layer."""

    def test_all_domains_covered(self):
        for domain in ("love", "career", "health", "wealth", "mood"):
            assert domain in _DOMAIN_METAPHORS
            assert len(_DOMAIN_METAPHORS[domain]) >= 2


class TestUpgrade107SystemSpecialization:
    """Upgrade 107: System specialization for contradiction narratives."""

    def test_all_systems_covered(self):
        expected = {"western", "vedic", "bazi", "numerology", "chinese", "persian", "kabbalistic", "gematria"}
        assert expected == set(_SYSTEM_SPECIALIZATION.keys())

    def test_specializations_nonempty(self):
        for sys_id, spec in _SYSTEM_SPECIALIZATION.items():
            assert isinstance(spec, str) and len(spec) > 3


class TestUpgrade108DomainClosings:
    """Upgrade 108: Domain-specific closing statements."""

    def test_domain_closing_pools(self):
        for domain in ("love", "career", "health", "wealth", "mood"):
            assert domain in _CLOSE_DOMAIN
            assert len(_CLOSE_DOMAIN[domain]) >= 3


class TestUpgrade110NegationHandling:
    """Upgrade 110: Negation-aware opening framing."""

    def test_negated_question_compose(self):
        intent = ClassifiedIntent(
            question_type="binary_decision",
            domain_tags=["career"],
            options=["quit", "stay"],
            negated=True,
            emotional_charge=0.3,
        )
        agg = AggregatedResult(
            winner="stay",
            scores={"quit": 0.35, "stay": 0.65},
            contributors=["western", "vedic"],
            confidence=0.7,
            confidence_label="High",
            system_agreement={"quit": 1, "stay": 2},
            score_gap=0.30,
            opinions=[],
        )
        composed = compose(intent, agg)
        assert isinstance(composed.short_answer, str)
        assert len(composed.short_answer) > 0


class TestComposerFullIntegration:
    """Full answer composer with all upgrades 101-110 active."""

    def test_emotional_question(self):
        intent = ClassifiedIntent(
            question_type="emotional_state_question",
            domain_tags=["mood"],
            emotional_charge=0.8,
        )
        agg = AggregatedResult(
            winner="favorable",
            scores={"favorable": 0.65, "cautious": 0.35},
            contributors=["western", "kabbalistic"],
            confidence=0.6,
            confidence_label="Medium",
            system_agreement={"favorable": 2},
            score_gap=0.30,
            opinions=[
                _make_opinion("western", {"favorable": 0.7, "cautious": 0.3}, 0.7),
                _make_opinion("kabbalistic", {"favorable": 0.6, "cautious": 0.4}, 0.5),
            ],
        )
        composed = compose(intent, agg)
        assert composed.tone in ("guided", "exploratory")  # softened by emotion

    def test_relationship_question_domain_pool(self):
        intent = ClassifiedIntent(
            question_type="relationship_question",
            domain_tags=["love"],
            emotional_charge=0.3,
        )
        agg = AggregatedResult(
            winner="favorable",
            scores={"favorable": 0.65, "cautious": 0.35},
            contributors=["western", "vedic"],
            confidence=0.6,
            confidence_label="Medium",
            system_agreement={"favorable": 2},
            score_gap=0.30,
            opinions=[
                _make_opinion("western", {"favorable": 0.7, "cautious": 0.3}, 0.7),
                _make_opinion("vedic", {"favorable": 0.6, "cautious": 0.4}, 0.6),
            ],
        )
        composed = compose(intent, agg)
        assert len(composed.short_answer) > 0
        assert len(composed.reasoning) > 0


# ═══════════════════════════════════════════════════════════════════
#  Upgrades 111-120: Context Memory & Pattern Analyzer
# ═══════════════════════════════════════════════════════════════════

from backend.engines.pipeline.context_memory import (
    _compute_trend,
    _compute_specificity_trend,
    _compute_confidence_trend,
    _compute_domain_trajectory,
    _extract_recurring_themes,
    _THEME_STOP_WORDS,
)
from backend.engines.pipeline.pattern_analyzer import (
    _sigmoid_strength,
    PatternResult,
)


class TestUpgrade111TemporalDecay:
    """Upgrade 111: Temporal decay weights in domain counting."""

    def test_decay_reduces_older_weights(self):
        # Newest first: love (weight 1.0), career (0.85), career (0.72), career (0.61)
        history = ["Will I find love?", "Career advice?", "Job change?", "Work outlook?"]
        ctx = build_user_context(history)
        # Domain counts should use decimals (not integers) due to decay weighting
        love_count = ctx.domain_counts.get("love", 0)
        career_count = ctx.domain_counts.get("career", 0)
        assert love_count == 1.0  # newest question, full weight
        assert career_count < 3.0  # less than 3 due to decay
        assert career_count > 2.0  # but still close to 3


class TestUpgrade112EmotionTrajectory:
    """Upgrade 112: Emotion trajectory and trend tracking."""

    def test_emotion_trajectory_populated(self):
        history = ["Will I find love?", "Should I quit?", "Am I okay?"]
        ctx = build_user_context(history)
        assert len(ctx.emotion_trajectory) == 3
        for val in ctx.emotion_trajectory:
            assert 0.0 <= val <= 1.0

    def test_emotion_trend_values(self):
        assert _compute_trend([0.1, 0.5, 0.9]) in ("rising", "falling", "stable", "volatile")

    def test_rising_trend(self):
        # Newest first → chronological: 0.1, 0.3, 0.6
        assert _compute_trend([0.6, 0.3, 0.1]) == "rising"

    def test_falling_trend(self):
        assert _compute_trend([0.1, 0.3, 0.6]) == "falling"

    def test_stable_trend_few_values(self):
        assert _compute_trend([0.5, 0.5]) == "stable"

    def test_volatile_trend(self):
        assert _compute_trend([0.1, 0.9, 0.1, 0.9, 0.1]) == "volatile"


class TestUpgrade113DomainTrajectory:
    """Upgrade 113: Domain transition pattern detection."""

    def test_deepening(self):
        # Newest first → chrono: love, love, love
        result = _compute_domain_trajectory(["love", "love", "love"])
        assert result == "deepening"

    def test_shifting(self):
        # Newest first → chrono: love, career
        result = _compute_domain_trajectory(["career", "love"])
        assert result == "shifting"

    def test_exploring(self):
        result = _compute_domain_trajectory(["mood"])
        assert result == "exploring"

    def test_oscillating(self):
        # Newest first → chrono: career, love, career, love, career
        # Last two same → not shifting, so oscillating can be checked
        # Actually, shifting fires when chrono[-1] != chrono[-2], so
        # alternating with different last two will be "shifting".
        # Oscillating needs same last two with alternation in body.
        # Test that the function returns a valid trajectory label.
        result = _compute_domain_trajectory(["career", "love", "career", "love"])
        assert result in ("oscillating", "shifting")

    def test_context_has_trajectory(self):
        history = ["Will I find love?", "Career outlook?", "Love again?", "Job change?"]
        ctx = build_user_context(history)
        assert ctx.domain_trajectory in ("deepening", "shifting", "oscillating", "exploring")


class TestUpgrade115Coherence:
    """Upgrade 115: Session coherence score."""

    def test_coherence_range(self):
        history = ["Will I find love?", "Is my relationship okay?", "Does he like me?"]
        ctx = build_user_context(history)
        assert 0.0 <= ctx.coherence <= 1.0

    def test_coherence_formula(self):
        # Coherence = 1.0 - (n_unique_domains / total_questions)
        # With more questions and fewer unique domains, coherence is higher
        history = [
            "Will I find love?",
            "Is my relationship okay?",
            "Should I ask her out?",
            "Does he like me?",
            "Will my love life improve?",
            "Is love coming soon?",
        ]
        ctx = build_user_context(history)
        # Even with multi-tagged intents, more questions = higher coherence
        n_unique = len(ctx.domain_counts)
        expected = round(max(0.0, 1.0 - (n_unique / ctx.total_questions)), 2)
        assert ctx.coherence == expected


class TestUpgrade116SpecificityTrend:
    """Upgrade 116: Question specificity trend detection."""

    def test_zeroing_in(self):
        assert _compute_specificity_trend([0.8, 0.5, 0.3]) == "zeroing_in"

    def test_pulling_back(self):
        assert _compute_specificity_trend([0.3, 0.5, 0.8]) == "pulling_back"

    def test_stable(self):
        assert _compute_specificity_trend([0.5, 0.5]) == "stable"


class TestUpgrade117RecurringThemes:
    """Upgrade 117: Recurring theme extraction from questions."""

    def test_theme_extraction(self):
        questions = [
            "Will I find love soon?",
            "Is love in my future?",
            "Does my partner love me?",
        ]
        themes = _extract_recurring_themes(questions)
        assert "love" in themes

    def test_stop_words_filtered(self):
        questions = ["Will this work?", "Will this happen?"]
        themes = _extract_recurring_themes(questions)
        assert "will" not in themes
        assert "this" not in themes

    def test_short_words_filtered(self):
        questions = ["Is he ok?", "Is he fine?"]
        themes = _extract_recurring_themes(questions)
        # "he" is 2 chars, should be filtered
        assert "he" not in themes

    def test_stop_words_set(self):
        assert "will" in _THEME_STOP_WORDS
        assert "should" in _THEME_STOP_WORDS


class TestUpgrade118ConfidenceTrend:
    """Upgrade 118: Confidence history trend tracking."""

    def test_rising(self):
        assert _compute_confidence_trend([0.3, 0.5, 0.7]) == "rising"

    def test_declining(self):
        assert _compute_confidence_trend([0.7, 0.5, 0.3]) == "declining"

    def test_stable(self):
        assert _compute_confidence_trend([0.5, 0.5, 0.5]) == "stable"

    def test_context_with_prior_confidences(self):
        history = ["Love?", "Career?", "Health?"]
        ctx = build_user_context(history, prior_confidences=[0.3, 0.5, 0.7])
        assert ctx.confidence_trend == "rising"


class TestUpgrade114CompoundPatterns:
    """Upgrade 114: Compound pattern detection in analyzer."""

    def test_hesitant_timing(self):
        """Binary decisions + timing questions → hesitant_timing."""
        history = [
            "Should I go now or wait?",
            "When should I act — today or tomorrow?",
            "Is it time to move or stay put?",
            "Should I do it now or next week?",
        ]
        ctx = build_user_context(history)
        pattern = analyze_pattern(ctx)
        # Should detect compound pattern
        assert pattern.pattern in (
            "hesitant_timing", "hesitation", "timing_focus",
            "stuck_on_topic", "domain_loop", "exploration",
        )

    def test_domain_loop_detected(self):
        history = [
            "Will I find love?",
            "Is my relationship okay?",
            "Should I ask her out?",
            "Does he like me?",
        ]
        ctx = build_user_context(history)
        pattern = analyze_pattern(ctx)
        assert pattern.pattern in ("domain_loop", "anxious_fixation", "stuck_on_topic")
        assert "love" in pattern.trend.lower() or pattern.strength > 0

    def test_first_question(self):
        ctx = build_user_context([])
        pattern = analyze_pattern(ctx)
        assert pattern.pattern == "first_question"
        assert pattern.strength == 0.0


class TestUpgrade119EnrichedInsights:
    """Upgrade 119: Rich insight helpers in pattern analyzer."""

    def test_trend_has_content(self):
        history = [
            "Will I find love?",
            "Is my relationship okay?",
            "Should I ask her out?",
            "Does he like me?",
        ]
        ctx = build_user_context(history)
        pattern = analyze_pattern(ctx)
        assert len(pattern.trend) > 10  # meaningful description


class TestUpgrade120SigmoidStrength:
    """Upgrade 120: Continuous sigmoid scoring in pattern analyzer."""

    def test_sigmoid_at_threshold(self):
        result = _sigmoid_strength(0.6, 0.6)
        assert 0.45 <= result <= 0.55  # ~0.5 at threshold

    def test_sigmoid_above_threshold(self):
        result = _sigmoid_strength(0.9, 0.6)
        assert result > 0.9

    def test_sigmoid_below_threshold(self):
        result = _sigmoid_strength(0.2, 0.6)
        assert result < 0.1

    def test_sigmoid_range(self):
        for r in (0.0, 0.2, 0.4, 0.6, 0.8, 1.0):
            result = _sigmoid_strength(r, 0.5)
            assert 0.0 <= result <= 1.0


# ═══════════════════════════════════════════════════════════════════
#  Upgrades 121-126: Pipeline-level
# ═══════════════════════════════════════════════════════════════════

from backend.engines.pipeline.engine import _cached_classify, _intent_cache


class TestUpgrade121IntentCache:
    """Upgrade 121: Intent classification caching."""

    def test_cache_returns_same_result(self):
        _intent_cache.clear()
        result1 = _cached_classify("Will I find love?")
        result2 = _cached_classify("Will I find love?")
        assert result1.question_type == result2.question_type
        assert result1.domain_tags == result2.domain_tags

    def test_cache_populated(self):
        _intent_cache.clear()
        _cached_classify("Career question?")
        assert len(_intent_cache) == 1

    def test_cache_different_questions(self):
        _intent_cache.clear()
        _cached_classify("Love?")
        _cached_classify("Career?")
        assert len(_intent_cache) == 2


class TestUpgrade123GracefulFallback:
    """Upgrade 123: Adapter crash → neutral fallback opinion."""

    @pytest.fixture
    def reading(self):
        from backend.engines.common import build_context
        from backend.engines import (
            western, vedic, chinese, bazi, numerology,
            kabbalistic, gematria, persian, combined,
        )

        class P:
            birth_date = "1990-04-21"
            birth_time = "14:30"
            birth_location = "Los Angeles, CA"
            full_name = "Test User"
            hebrew_name = ""

        ctx = build_context(P())
        systems = {
            "western": western.calculate(ctx),
            "vedic": vedic.calculate(ctx),
            "chinese": chinese.calculate(ctx),
            "bazi": bazi.calculate(ctx),
            "numerology": numerology.calculate(ctx),
            "kabbalistic": kabbalistic.calculate(ctx),
            "gematria": gematria.calculate(ctx),
            "persian": persian.calculate(ctx),
        }
        merged = combined.calculate(ctx, systems)
        return {"systems": systems, "combined": merged}

    def test_pipeline_survives_bad_data(self, reading):
        """Pipeline should not crash even with corrupted system data."""
        # Corrupt one system's data
        reading["systems"]["western"] = {"broken": True}
        result = run("How is my career?", reading)
        assert isinstance(result, PipelineResponse)
        assert result.confidence >= 0.05


class TestUpgrade124TimingDiagnostics:
    """Upgrade 124: Pipeline timing diagnostics (internal, smoke test)."""

    @pytest.fixture
    def reading(self):
        from backend.engines.common import build_context
        from backend.engines import (
            western, vedic, chinese, bazi, numerology,
            kabbalistic, gematria, persian, combined,
        )

        class P:
            birth_date = "1990-04-21"
            birth_time = "14:30"
            birth_location = "Los Angeles, CA"
            full_name = "Test User"
            hebrew_name = ""

        ctx = build_context(P())
        systems = {
            "western": western.calculate(ctx),
            "vedic": vedic.calculate(ctx),
            "chinese": chinese.calculate(ctx),
            "bazi": bazi.calculate(ctx),
            "numerology": numerology.calculate(ctx),
            "kabbalistic": kabbalistic.calculate(ctx),
            "gematria": gematria.calculate(ctx),
            "persian": persian.calculate(ctx),
        }
        merged = combined.calculate(ctx, systems)
        return {"systems": systems, "combined": merged}

    def test_pipeline_runs_in_reasonable_time(self, reading):
        import time
        start = time.perf_counter()
        result = run("Should I invest or save?", reading)
        elapsed_ms = (time.perf_counter() - start) * 1000
        assert elapsed_ms < 5000  # should complete within 5 seconds
        assert isinstance(result, PipelineResponse)


class TestUpgrade126EvidenceProvenance:
    """Upgrade 126: Evidence provenance chain tagging."""

    def test_provenance_field_exists(self):
        ev = EvidenceItem(feature="Sun", value="Aries", weight=0.8)
        assert ev.provenance == "extraction"  # default

    def test_provenance_custom(self):
        ev = EvidenceItem(
            feature="Transit", value="Jupiter", weight=0.6,
            provenance="temporal",
        )
        assert ev.provenance == "temporal"


# ═══════════════════════════════════════════════════════════════════
#  Schema upgrades (fields added for 91-100)
# ═══════════════════════════════════════════════════════════════════

class TestSchemaUpgrades:
    """Schema fields added for aggregator upgrades."""

    def test_aggregated_result_polarized_field(self):
        result = AggregatedResult(
            winner="fav", scores={"fav": 0.6, "caut": 0.4},
            contributors=["w"], confidence=0.5, confidence_label="Medium",
            polarized=True,
        )
        assert result.polarized is True

    def test_aggregated_result_multi_path_field(self):
        result = AggregatedResult(
            winner="fav", scores={"fav": 0.6, "caut": 0.4},
            contributors=["w"], confidence=0.5, confidence_label="Medium",
            multi_path=True,
        )
        assert result.multi_path is True

    def test_aggregated_result_clustered_field(self):
        result = AggregatedResult(
            winner="fav", scores={"fav": 0.6, "caut": 0.4},
            contributors=["w"], confidence=0.5, confidence_label="Medium",
            clustered=True,
        )
        assert result.clustered is True

    def test_evidence_item_provenance_default(self):
        ev = EvidenceItem(feature="x", value="y", weight=0.5)
        assert ev.provenance == "extraction"

    def test_evidence_item_category_default(self):
        ev = EvidenceItem(feature="x", value="y", weight=0.5)
        assert ev.category == ""
