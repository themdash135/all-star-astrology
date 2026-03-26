"""System Router — selects the most relevant systems for a question.

Selects 4 by default, up to 6 when multiple domains or high affinity
warrants broader consultation.  Weak systems are excluded.

Domain routing (from spec):
  timing           → Vedic, Persian, Western
  health/energy    → Vedic, Western, BaZi, Numerology, Persian
  career/structure → BaZi, Western, Vedic, Numerology, Kabbalistic
  love/relation    → Western, Chinese, Vedic, Numerology
  spiritual/ident  → Kabbalistic, Gematria, Numerology, Western
  symbolic/wording → Gematria, Kabbalistic, Numerology
  broad life cycle → Chinese, BaZi, Numerology, Vedic
"""

from __future__ import annotations

from .schemas import ClassifiedIntent, SYSTEM_WEIGHT
from .runtime_config import RuntimeConfig


# ── Question-type → system affinity (position-weighted) ───────────

TYPE_AFFINITY: dict[str, list[str]] = {
    "timing_question":           ["persian", "vedic", "western", "bazi", "chinese"],
    "binary_decision":           ["western", "vedic", "bazi", "numerology", "persian"],
    "relationship_question":     ["western", "chinese", "vedic", "numerology", "persian"],
    "career_question":           ["bazi", "western", "numerology", "vedic", "kabbalistic"],
    "health_energy_question":    ["vedic", "bazi", "western", "persian", "numerology"],
    "emotional_state_question":  ["western", "kabbalistic", "vedic", "numerology", "gematria"],
    "general_guidance_question": ["western", "vedic", "bazi", "numerology", "chinese"],
}

# ── Domain → system affinity (ranked) ────────────────────────────

DOMAIN_AFFINITY: dict[str, list[str]] = {
    "love":   ["western", "chinese", "vedic", "numerology", "persian"],
    "career": ["bazi", "western", "numerology", "vedic", "kabbalistic"],
    "health": ["vedic", "bazi", "western", "persian", "numerology"],
    "wealth": ["bazi", "numerology", "persian", "western", "kabbalistic"],
    "mood":   ["western", "kabbalistic", "vedic", "numerology", "gematria"],
}

DEFAULT_MAX = 4
EXTENDED_MAX = 6
MINIMUM_SCORE = 2.0  # systems below this threshold are excluded


def route(
    intent: ClassifiedIntent,
    prior_confidences: list[float] | None = None,
    runtime_config: RuntimeConfig | None = None,
) -> list[str]:
    """Return system ids ordered by relevance.

    Returns 4 by default.  Extends to 5-6 when:
      - multiple domains are present (≥2), or
      - the 5th/6th system scores above 70% of the 4th system's score.

    Parameters
    ----------
    intent : ClassifiedIntent
        The classified question intent.
    prior_confidences : list[float] | None
        Optional list of confidence scores from the user's recent answers.
        When the last 3 are all below 0.40, alternative systems are boosted
        (Upgrade 9).
    """
    scores: dict[str, float] = {sid: 0.0 for sid in SYSTEM_WEIGHT}

    # Type affinity — earlier position = higher score
    type_list = TYPE_AFFINITY.get(intent.question_type, TYPE_AFFINITY["general_guidance_question"])
    for rank, sid in enumerate(type_list):
        scores[sid] += (5 - rank) * 2.0  # 10, 8, 6, 4, 2

    # Domain affinity — sum across all domain tags
    for domain in intent.domain_tags:
        domain_list = DOMAIN_AFFINITY.get(domain, [])
        for rank, sid in enumerate(domain_list):
            scores[sid] += (5 - rank) * 1.0  # 5, 4, 3, 2, 1

    # Apply base weight multiplier
    for sid in scores:
        scores[sid] *= SYSTEM_WEIGHT.get(sid, 0.5)

    # Upgrade 15: Time-sensitive routing — ensure persian and vedic are
    # always included (and ranked high) for short-horizon questions.
    SHORT_HORIZONS = {"today", "tomorrow", "this_week"}
    if intent.time_horizon in SHORT_HORIZONS:
        for timing_sid in ("persian", "vedic"):
            # Guarantee they rank near the top by boosting their score
            # to at least match the current best score minus a small margin.
            if scores[timing_sid] < max(scores.values()) - 1.0:
                scores[timing_sid] = max(scores.values()) - 1.0

    # ── Upgrade 7: Emotional charge routing ────────────────────────
    # High emotional charge → boost grounding systems (Kabbalistic, Vedic)
    # so distressed users receive spiritually anchored guidance.
    if intent.emotional_charge > 0.70:
        scores["kabbalistic"] += 3.0
        scores["vedic"] += 2.0

    # ── Upgrade 8: Feasibility-aware routing ───────────────────────
    # Vague / unfeasible questions → boost symbolic systems that handle
    # open-ended interpretation well.
    if intent.feasibility < 0.4:
        scores["kabbalistic"] += 2.0
        scores["gematria"] += 1.5
        scores["numerology"] += 1.0

    # ── Upgrade 9: Confidence-aware re-routing ─────────────────────
    # When the last 3 answers were all low confidence, the current mix
    # isn't resonating — shift toward alternative systems.
    if prior_confidences is not None and len(prior_confidences) >= 3:
        last_three = prior_confidences[-3:]
        if all(c < 0.40 for c in last_three):
            scores["chinese"] += 1.5
            scores["persian"] += 1.5
            scores["kabbalistic"] += 1.0

    # ── Upgrade 10: Question-specificity routing ───────────────────
    # Highly specific questions benefit from timing-oriented systems;
    # abstract/vague questions benefit from identity/symbolic systems.
    if intent.specificity > 0.70:
        scores["persian"] += 1.5
        scores["vedic"] += 1.0
    elif intent.specificity < 0.30:
        scores["kabbalistic"] += 2.0
        scores["numerology"] += 1.5
        scores["gematria"] += 1.0

    # Multi-option choices benefit from wider consultation.
    if intent.decision_style == "multi_option":
        scores["western"] += 1.0
        scores["bazi"] += 1.0
        scores["numerology"] += 0.75
        scores["persian"] += 0.75

    # Contradictory phrasing gets a slight boost toward systems that tend to
    # contextualize ambiguity rather than over-answer it.
    if intent.contradictions:
        scores["kabbalistic"] += 1.0
        scores["gematria"] += 0.5
        scores["western"] += 0.5

    # Explicit time entities strengthen timing systems even when the
    # question type was not classified as a timing question.
    if intent.entities.get("time"):
        scores["persian"] += 0.75
        scores["vedic"] += 0.5

    if runtime_config is not None:
        if runtime_config.profile == "conservative":
            scores["vedic"] += 0.75
            scores["western"] += 0.5
            scores["gematria"] -= 0.5
        elif runtime_config.profile == "exploratory":
            scores["kabbalistic"] += 0.75
            scores["gematria"] += 0.75
            scores["chinese"] += 0.5

    # Sort descending — all 8 systems participate, ranked by relevance.
    # The router no longer excludes systems.  Weak systems will naturally
    # produce low-confidence opinions that the aggregator down-weights.
    ranked = sorted(scores.items(), key=lambda pair: pair[1], reverse=True)

    return [sid for sid, _ in ranked]
