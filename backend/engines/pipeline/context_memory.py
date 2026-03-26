"""Context memory — lightweight per-request model for question history.

Accepts a list of past questions (up to 10), classifies them, and produces
a ``UserContext`` summarising dominant domains, recent themes, and question
frequency patterns.

This module is stateless — the frontend passes question_history in the
request body and this module distils it into actionable context.
"""

from __future__ import annotations

import re
from collections import Counter

from pydantic import BaseModel, Field

from .intent_classifier import classify


# ── Upgrade 117: Stop words for recurring-theme extraction ───────
_THEME_STOP_WORDS: set[str] = {
    "will", "should", "about", "would", "could", "what", "when", "does",
    "have", "this", "that", "with", "from", "they", "them", "your",
    "been", "there", "their", "some", "into", "more", "than",
}


class UserContext(BaseModel):
    """Distilled context from the user's recent question history."""

    total_questions: int = Field(default=0)
    dominant_domain: str | None = Field(
        default=None,
        description="Most frequently asked domain, or None if < 2 questions",
    )
    domain_counts: dict[str, float] = Field(default_factory=dict)
    recent_types: list[str] = Field(
        default_factory=list,
        description="Question types of last 5 questions (newest first)",
    )
    timing_ratio: float = Field(
        default=0.0,
        description="Fraction of past questions that are timing-related",
    )
    binary_ratio: float = Field(
        default=0.0,
        description="Fraction of past questions that are binary decisions",
    )
    repeated_domain: str | None = Field(
        default=None,
        description="Domain asked >= 3 times in history (sign of focus)",
    )

    # ── Upgrade 112: Emotion trajectory tracking ─────────────────
    emotion_trajectory: list[float] = Field(
        default_factory=list,
        description="Emotional charge values from each question (newest first)",
    )
    emotion_trend: str = Field(
        default="stable",
        description="Emotion direction: rising, falling, stable, volatile",
    )

    # ── Upgrade 113: Domain transition detection ─────────────────
    domain_trajectory: str = Field(
        default="exploring",
        description="Domain pattern: deepening, shifting, oscillating, exploring",
    )

    # ── Upgrade 115: Session coherence score ─────────────────────
    coherence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="1.0 = all same domain; low = scattered questions",
    )

    # ── Upgrade 116: Question specificity trend ──────────────────
    specificity_trend: str = Field(
        default="stable",
        description="Specificity direction: zeroing_in, pulling_back, stable",
    )

    # ── Upgrade 117: Recurring theme extraction ──────────────────
    recurring_themes: list[str] = Field(
        default_factory=list,
        description="Words (len>=4) that appear 2+ times across all questions",
    )

    # ── Upgrade 118: Confidence history trend ────────────────────
    confidence_trend: str = Field(
        default="stable",
        description="Confidence direction: rising, declining, stable",
    )
    confidence_history: list[float] = Field(
        default_factory=list,
        description="Structured prior answer confidences in chronological order",
    )
    recurring_entities: list[str] = Field(
        default_factory=list,
        description="Entities that recur across recent questions",
    )
    entity_counts: dict[str, int] = Field(
        default_factory=dict,
        description="Flattened counts of extracted entities across recent questions",
    )
    recent_goal_intents: list[str] = Field(
        default_factory=list,
        description="Most recent practical goal intents extracted from prior questions",
    )


# ── Helpers ──────────────────────────────────────────────────────

def _compute_trend(values: list[float]) -> str:
    """Shared rising / falling / volatile / stable logic.

    Parameters
    ----------
    values : list[float]
        Ordered newest-first (index 0 = most recent).  We reverse to
        chronological order for the comparison.
    """
    if len(values) < 3:
        return "stable"

    chronological = list(reversed(values[:10]))  # oldest → newest
    last3 = chronological[-3:]

    # Check rising: each successive value strictly greater
    if all(last3[i + 1] > last3[i] for i in range(2)):
        return "rising"

    # Check falling: each successive value strictly less
    if all(last3[i + 1] < last3[i] for i in range(2)):
        return "falling"

    # Volatile: large spread across all values
    if max(chronological) - min(chronological) > 0.4:
        return "volatile"

    return "stable"


def _compute_specificity_trend(values: list[float]) -> str:
    """Like _compute_trend but uses zeroing_in / pulling_back labels."""
    if len(values) < 3:
        return "stable"

    chronological = list(reversed(values[:10]))
    last3 = chronological[-3:]

    if all(last3[i + 1] > last3[i] for i in range(2)):
        return "zeroing_in"
    if all(last3[i + 1] < last3[i] for i in range(2)):
        return "pulling_back"
    return "stable"


def _compute_confidence_trend(values: list[float]) -> str:
    """Like _compute_trend but uses rising / declining / stable labels."""
    if len(values) < 3:
        return "stable"

    last3 = values[-3:]  # already chronological (appended in order)

    if all(last3[i + 1] > last3[i] for i in range(2)):
        return "rising"
    if all(last3[i + 1] < last3[i] for i in range(2)):
        return "declining"
    return "stable"


def _compute_domain_trajectory(domain_sequence: list[str]) -> str:
    """Detect domain transition pattern from the domain sequence.

    domain_sequence is newest-first; we reverse to chronological.
    """
    if len(domain_sequence) < 2:
        return "exploring"

    chrono = list(reversed(domain_sequence))

    # Deepening: same domain 3+ times in a row (at the tail)
    if len(chrono) >= 3 and chrono[-1] == chrono[-2] == chrono[-3]:
        return "deepening"

    # Shifting: the most recent domain differs from the previous
    if chrono[-1] != chrono[-2]:
        return "shifting"

    # Oscillating: alternating between exactly 2 domains
    unique = set(chrono)
    if len(unique) == 2 and len(chrono) >= 4:
        # Check if they alternate
        is_alternating = all(chrono[i] != chrono[i + 1] for i in range(len(chrono) - 1))
        if is_alternating:
            return "oscillating"

    return "exploring"


def _extract_recurring_themes(questions: list[str]) -> list[str]:
    """Extract words (len>=4, not stop words) appearing 2+ times."""
    word_counter: Counter[str] = Counter()
    for q in questions:
        # Normalize and tokenize
        normalized = re.sub(r"[^a-z0-9\s]", " ", q.lower()).strip()
        words = set(normalized.split())  # dedupe within single question
        for w in words:
            if len(w) >= 4 and w not in _THEME_STOP_WORDS:
                word_counter[w] += 1

    return [word for word, count in word_counter.most_common() if count >= 2]


def _extract_entity_counts(entity_payloads: list[dict[str, list[str]]]) -> dict[str, int]:
    counter: Counter[str] = Counter()
    for payload in entity_payloads:
        for values in payload.values():
            for value in values:
                counter[value.lower()] += 1
    return dict(counter)


def build_context(
    question_history: list[str],
    prior_confidences: list[float] | None = None,
) -> UserContext:
    """Classify past questions and summarise into UserContext.

    Parameters
    ----------
    question_history : list[str]
        Up to 10 most recent questions (newest first).
        Empty list is fine — returns an empty context.
    prior_confidences : list[float] | None
        Optional list of confidence values from prior pipeline runs
        (chronological order, oldest first).
    """
    history = question_history[:10]  # cap
    if not history:
        return UserContext()

    # ── Upgrade 111: Temporal decay weights ──────────────────────
    weights = [0.85 ** i for i in range(len(history))]

    domain_counter: Counter[str] = Counter()
    weighted_domain_counter: dict[str, float] = {}
    type_list: list[str] = []
    timing_count = 0
    binary_count = 0

    # ── Upgrade 112: Emotion trajectory ──────────────────────────
    emotion_charges: list[float] = []

    # ── Upgrade 113: Domain sequence (for trajectory) ────────────
    domain_sequence: list[str] = []  # newest-first, primary domain per question

    # ── Upgrade 116: Specificity values ──────────────────────────
    specificity_values: list[float] = []
    entity_payloads: list[dict[str, list[str]]] = []
    recent_goal_intents: list[str] = []

    for idx, q in enumerate(history):
        w = weights[idx]
        intent = classify(q)
        type_list.append(intent.question_type)

        # Track emotion charges (newest first)
        emotion_charges.append(intent.emotional_charge)

        # Track specificity (newest first)
        specificity_values.append(intent.specificity)
        entity_payloads.append(intent.entities)
        if intent.goal_intent:
            recent_goal_intents.append(intent.goal_intent)

        # Primary domain for domain trajectory
        if intent.domain_tags:
            domain_sequence.append(intent.domain_tags[0])

        for d in intent.domain_tags:
            domain_counter[d] += 1
            # Upgrade 111: weighted counts
            weighted_domain_counter[d] = weighted_domain_counter.get(d, 0.0) + w

        if intent.question_type == "timing_question":
            timing_count += 1
        if intent.question_type == "binary_decision":
            binary_count += 1

    total = len(history)

    # Use weighted domain counts for dominant domain selection
    dominant = None
    if weighted_domain_counter:
        dominant = max(weighted_domain_counter, key=weighted_domain_counter.get)

    # Repeated domain still uses raw counts (threshold is integer-based)
    repeated = None
    for domain, count in domain_counter.items():
        if count >= 3:
            repeated = domain
            break

    # ── Upgrade 115: Session coherence ───────────────────────────
    n_unique_domains = len(weighted_domain_counter)
    coherence = round(max(0.0, 1.0 - (n_unique_domains / max(total, 1))), 2)

    # ── Upgrade 112: Emotion trend ───────────────────────────────
    emotion_trend = _compute_trend(emotion_charges)

    # ── Upgrade 113: Domain trajectory ───────────────────────────
    domain_trajectory = _compute_domain_trajectory(domain_sequence)

    # ── Upgrade 116: Specificity trend ───────────────────────────
    specificity_trend = _compute_specificity_trend(specificity_values)

    # ── Upgrade 117: Recurring themes ────────────────────────────
    recurring_themes = _extract_recurring_themes(history)

    # ── Upgrade 118: Confidence trend ────────────────────────────
    confidence_trend = _compute_confidence_trend(prior_confidences or [])
    entity_counts = _extract_entity_counts(entity_payloads)
    recurring_entities = [entity for entity, count in entity_counts.items() if count >= 2]

    # Round weighted domain counts for clean output
    rounded_domain_counts = {
        d: round(v, 2) for d, v in weighted_domain_counter.items()
    }

    return UserContext(
        total_questions=total,
        dominant_domain=dominant if total >= 2 else None,
        domain_counts=rounded_domain_counts,
        recent_types=type_list[:5],
        timing_ratio=round(timing_count / total, 2) if total else 0.0,
        binary_ratio=round(binary_count / total, 2) if total else 0.0,
        repeated_domain=repeated,
        emotion_trajectory=emotion_charges,
        emotion_trend=emotion_trend,
        domain_trajectory=domain_trajectory,
        coherence=coherence,
        specificity_trend=specificity_trend,
        recurring_themes=recurring_themes,
        confidence_trend=confidence_trend,
        confidence_history=list(prior_confidences or []),
        recurring_entities=recurring_entities,
        entity_counts=entity_counts,
        recent_goal_intents=recent_goal_intents[:5],
    )
