"""Mandatory data contracts for the neuro-symbolic pipeline.

Every component communicates through these schemas.  No free-form dicts
cross service boundaries — only validated Pydantic models.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


QuestionType = Literal[
    "binary_decision",
    "timing_question",
    "relationship_question",
    "career_question",
    "health_energy_question",
    "emotional_state_question",
    "general_guidance_question",
]


# ── Shared constants ──────────────────────────────────────────────

SYSTEM_WEIGHT: dict[str, float] = {
    "western":     1.0,
    "vedic":       1.0,
    "bazi":        1.0,
    "numerology":  0.8,
    "chinese":     0.8,
    "persian":     0.85,
    "kabbalistic": 0.7,
    "gematria":    0.40,
}


# ── Intent Classifier output ──────────────────────────────────────

class ClassifiedIntent(BaseModel):
    """Structured representation of the user's question."""

    question_type: QuestionType = Field(
        ...,
        description="Classified question type",
    )
    domain_tags: list[str] = Field(
        ...,
        description="Life-area tags: love, career, health, wealth, mood",
    )
    options: list[str] = Field(
        default_factory=list,
        description="For binary_decision: the two parsed option labels",
    )
    time_horizon: str = Field(
        default="general",
        description="Temporal scope: today, tomorrow, this_week, this_month, this_year, general",
    )
    emotional_charge: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Emotional intensity of the question (0.0 calm - 1.0 distressed)",
    )
    # ── Upgrade 1: Question feasibility ──────────────────────────────
    feasibility: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="How answerable the question is (0.0 = unanswerable, 1.0 = fully answerable)",
    )
    # ── Upgrade 2: Question specificity ──────────────────────────────
    specificity: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="How specific/precise the question is (0.0 = vague, 1.0 = very specific)",
    )
    # ── Upgrade 6: Negation detection ────────────────────────────────
    negated: bool = Field(
        default=False,
        description="Whether the question contains negation that inverts expected polarity",
    )
    semantic_group: str | None = Field(
        default=None,
        description="Semantic cluster label for equivalent question phrasings",
    )
    decision_style: Literal["binary", "multi_option", "open"] = Field(
        default="open",
        description="Whether the question presents 2 options, 3+ options, or no explicit option set",
    )
    goal_intent: str = Field(
        default="",
        description="Best-effort extraction of the user's practical goal beneath the wording of the question",
    )
    entities: dict[str, list[str]] = Field(
        default_factory=dict,
        description="Named or structured entities extracted from the question",
    )
    contradictions: list[str] = Field(
        default_factory=list,
        description="Detected conflicting or self-negating signals in the phrasing",
    )
    feasibility_reasons: list[str] = Field(
        default_factory=list,
        description="Why the question scored low or high on answerability",
    )
    time_window: dict[str, Any] = Field(
        default_factory=dict,
        description="Structured temporal window inferred from the question",
    )


# ── Evidence item ─────────────────────────────────────────────────

class EvidenceItem(BaseModel):
    """A single traceable feature that contributed to a system's stance."""

    feature: str = Field(..., description="Name of the astrological feature")
    value: str = Field(..., description="Computed value or placement")
    weight: float = Field(..., ge=0.0, le=1.0, description="Importance 0-1")
    # ── Upgrade 14: Aspect orb integration ───────────────────────────
    orb: float | None = Field(
        default=None,
        ge=0.0,
        description="Aspect orb in degrees, if applicable — tighter = stronger",
    )
    # ── Upgrade 16: Evidence category tagging ────────────────────────
    category: str = Field(
        default="",
        description="Evidence category: planet, house, sign, aspect, transit, number, element, star, nakshatra, dasha, sefirah, mansion, root, pillar, animal, yoga, tithi, temperament",
    )
    # ── Upgrade 126: Evidence provenance chain ─────────────────────
    provenance: str = Field(
        default="extraction",
        description="Which pipeline stage produced this evidence: extraction, stance, temporal, interaction",
    )
    freshness: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="How temporally fresh/relevant the evidence is for the current question horizon",
    )
    semantic_key: str = Field(
        default="",
        description="Canonical semantic key used for cross-system evidence deduplication",
    )
    source_kind: str = Field(
        default="",
        description="High-level source bucket: natal, transit, temporal, cyclical, symbolic, fallback",
    )
    source_path: str = Field(
        default="",
        description="Best-effort reference to the raw source path within the system payload",
    )


# ── System Opinion (MANDATORY per-system output) ─────────────────

class SystemOpinion(BaseModel):
    """Every system adapter MUST return exactly this shape.

    stance keys correspond to ClassifiedIntent.options for binary questions,
    or ``["favorable", "cautious"]`` for non-binary questions.
    """

    system_id: str
    relevant: bool
    stance: dict[str, float] = Field(
        ...,
        description="Score per option, values 0-1, should sum to ~1.0",
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
    reason: str = Field(..., description="Short explanation grounded in evidence")
    evidence: list[EvidenceItem] = Field(default_factory=list)
    # ── Upgrade 17: Stance explanation ───────────────────────────────
    stance_explanation: str = Field(
        default="",
        description="Plain-English explanation of why the system voted this way",
    )
    degraded: bool = Field(
        default=False,
        description="True when the system returned a degraded fallback opinion instead of a full evaluation",
    )
    health_score: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Runtime health of the adapter at the time this opinion was produced",
    )
    cache_hit: bool = Field(
        default=False,
        description="True when the opinion came from the adapter evaluation cache",
    )
    strongest_support: str = Field(
        default="",
        description="Best single supporting signal summarized for UI display",
    )
    strongest_caution: str = Field(
        default="",
        description="Best single cautionary signal summarized for UI display",
    )


# ── Aggregator output ─────────────────────────────────────────────

class AggregatedResult(BaseModel):
    """Combined decision from all consulted systems."""

    winner: str = Field(..., description="Winning option key")
    scores: dict[str, float] = Field(
        ...,
        description="Final normalised score per option",
    )
    contributors: list[str] = Field(
        ...,
        description="system_ids that contributed, ordered by influence",
    )
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall confidence")
    confidence_label: str = Field(
        default="Medium",
        description="High / Medium / Low",
    )
    system_agreement: dict[str, int] = Field(
        default_factory=dict,
        description="Count of systems favoring each option",
    )
    score_gap: float = Field(
        default=0.0,
        description="Gap between top two option scores (0-1)",
    )
    near_split: bool = Field(
        default=False,
        description="True when the decision is nearly split across systems",
    )
    polarized: bool = Field(
        default=False,
        description="True when system stances are bimodally distributed",
    )
    multi_path: bool = Field(
        default=False,
        description="True when 3+ options are within 0.05 of each other",
    )
    clustered: bool = Field(
        default=False,
        description="True when systems form distinct agreement clusters",
    )
    epistemic_confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="How strongly the evidence supports the answer, separate from advice strength",
    )
    advice_strength: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="How strong the recommended lean is, separate from epistemic confidence",
    )
    abstained: bool = Field(
        default=False,
        description="True when the pipeline judged the signal too weak or mixed for a clean verdict",
    )
    weak_signal_override: bool = Field(
        default=False,
        description="True when strong systems were protected from being drowned out by many weak ones",
    )
    pairwise_agreement: dict[str, dict[str, float]] = Field(
        default_factory=dict,
        description="Pairwise agreement matrix across relevant systems",
    )
    evidence_graph: dict[str, Any] = Field(
        default_factory=dict,
        description="Lightweight causal graph linking systems, evidence, domains, and winner",
    )
    opinions: list[SystemOpinion] = Field(
        default_factory=list,
        description="Full system opinions for transparency / UI breakdown",
    )


# ── Answer Composer output ────────────────────────────────────────

class ComposedAnswer(BaseModel):
    """Final user-facing response with full traceability."""

    short_answer: str = Field(..., description="1-2 sentence direct answer")
    reasoning: str = Field(..., description="Why, referencing systems and evidence")
    personal_insight: str | None = Field(
        default=None,
        description="Pattern-based personal observation, or None",
    )
    conflict_note: str | None = Field(
        default=None,
        description="Brief explanation when systems disagree, or None",
    )
    tone: str = Field(
        default="guided",
        description="firm / guided / exploratory",
    )
    contributing_systems: list[str] = Field(
        ...,
        description="Human-readable system names that contributed",
    )
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    response_mode: str = Field(
        default="reflective",
        description="reflective / direct / technical",
    )
    short_rationale: str = Field(
        default="",
        description="Short explanation of the answer in one compact paragraph or sentence",
    )
    deep_rationale: str = Field(
        default="",
        description="Expanded rationale that can be shown in advanced UI views",
    )
    confidence_boosters: list[str] = Field(
        default_factory=list,
        description="Additional details the user could provide to improve confidence",
    )


# ── Full pipeline response (returned by engine.py) ───────────────

class PipelineResponse(BaseModel):
    """Complete pipeline output for the API layer."""

    answer: str = Field(..., description="User-facing answer text")
    areas: list[str] = Field(..., description="Matched life-area domains")
    classification: ClassifiedIntent
    aggregation: AggregatedResult
    system_signals: list[dict] = Field(
        default_factory=list,
        description="Per-system breakdown for UI cards",
    )
    confidence: float = Field(..., ge=0.0, le=1.0)
    confidence_label: str = Field(default="Medium")
    tone: str = Field(default="guided", description="firm / guided / exploratory")
    personal_insight: str | None = Field(default=None)
    conflict_note: str | None = Field(default=None)
    system_agreement: dict[str, int] = Field(
        default_factory=dict,
        description="Count of systems per option",
    )
    top_systems: list[dict] = Field(
        default_factory=list,
        description="Top 1-3 systems with name + reason",
    )
    trace_id: str = Field(default="", description="Per-run trace id for telemetry and debugging")
    response_mode: str = Field(default="reflective", description="reflective / direct / technical")
    epistemic_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    advice_strength: float = Field(default=0.0, ge=0.0, le=1.0)
    abstained: bool = Field(default=False)
    short_rationale: str = Field(default="")
    deep_rationale: str = Field(default="")
    confidence_boosters: list[str] = Field(
        default_factory=list,
        description="Additional detail that would most improve the next answer",
    )
    advisories: list[str] = Field(
        default_factory=list,
        description="Machine-readable warnings about disagreement, ambiguity, or degraded systems",
    )
    diagnostics: dict[str, Any] = Field(
        default_factory=dict,
        description="Structured telemetry bundle for timings, routing, temporal modifiers, and degraded systems",
    )
