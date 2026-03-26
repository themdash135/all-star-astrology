"""Pattern analyzer — detects behavioural patterns from question history.

Patterns detected:
  - hesitation    → user keeps asking binary decisions without acting
  - timing_focus  → user frequently asks "when" questions
  - domain_loop   → user circles back to the same domain repeatedly
  - exploration   → diverse domains, no repetition (healthy)
  - first_question→ no history yet

Compound patterns (Upgrade 114):
  - hesitant_timing   → hesitation + timing_focus
  - anxious_fixation  → domain_loop + high emotional_charge
  - early_exploration  → exploration + low total_questions
  - timing_obsession  → timing_focus + domain_loop
  - stuck_on_topic    → hesitation + domain_loop
"""

from __future__ import annotations

import math

from pydantic import BaseModel, Field

from .context_memory import UserContext


class PatternResult(BaseModel):
    """Output of the pattern analyzer."""

    pattern: str = Field(
        ...,
        description="Detected behavioural pattern (simple or compound)",
    )
    trend: str = Field(
        ...,
        description="Human-readable 1-sentence trend description",
    )
    strength: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="How strong the pattern signal is (0 = weak, 1 = strong)",
    )


# ── Upgrade 120: Continuous sigmoid scoring ──────────────────────

def _sigmoid_strength(ratio: float, threshold: float) -> float:
    """Continuous sigmoid gate replacing hard threshold cutoffs.

    At ratio == threshold, returns 0.5.
    At ratio << threshold, approaches 0.0.
    At ratio >> threshold, approaches 1.0.
    """
    return round(1.0 / (1.0 + math.exp(-10.0 * (ratio - threshold))), 2)


# ── Upgrade 119: Rich insight helpers ────────────────────────────

def _enrich_domain_trend(base: str, domain: str, ctx: UserContext) -> str:
    """Enrich a domain-related trend string with recurring themes."""
    themes = ctx.recurring_themes if ctx.recurring_themes else []
    # Find a theme related to this domain (not the domain name itself)
    relevant = [t for t in themes if t != domain]
    if relevant:
        theme_word = relevant[0]
        return f"Your questions keep circling back to your {theme_word} situation"
    return base


def _enrich_hesitation_trend(ctx: UserContext) -> str:
    """Enrich hesitation trend with recurring themes if available."""
    themes = ctx.recurring_themes if ctx.recurring_themes else []
    if themes:
        theme_word = themes[0]
        return f"You've been weighing decisions about {theme_word} — your either/or questions suggest careful deliberation."
    return "You've been asking a lot of either/or questions — this suggests you're weighing decisions carefully."


def _enrich_timing_trend(ctx: UserContext) -> str:
    """Enrich timing trend with recurring themes if available."""
    themes = ctx.recurring_themes if ctx.recurring_themes else []
    if themes:
        theme_word = themes[0]
        return f"You're seeking the right moment for {theme_word} — your system is focused on timing rather than direction."
    return "You've been focused on timing — your system is seeking the right moment rather than the right direction."


def _enrich_exploration_trend(ctx: UserContext) -> str:
    """Enrich exploration trend with recurring themes if available."""
    themes = ctx.recurring_themes if ctx.recurring_themes else []
    if themes:
        theme_word = themes[0]
        return f"You're exploring multiple life areas with {theme_word} as a thread — a sign of broad awareness."
    return "You're exploring multiple life areas — a sign of broad awareness rather than fixation."


def analyze(ctx: UserContext) -> PatternResult:
    """Detect the dominant behavioural pattern from user context."""
    if ctx.total_questions == 0:
        return PatternResult(
            pattern="first_question",
            trend="This is your first question — no patterns yet.",
            strength=0.0,
        )

    # ── Upgrade 120: Continuous strengths for base signals ───────
    binary_strength = _sigmoid_strength(ctx.binary_ratio, 0.6)
    timing_strength = _sigmoid_strength(ctx.timing_ratio, 0.4)

    has_repeated = ctx.repeated_domain is not None
    domain = ctx.repeated_domain or ctx.dominant_domain or ""
    domain_count = ctx.domain_counts.get(domain, 0)
    domain_strength = round(min(domain_count / max(ctx.total_questions, 1), 1.0), 2) if has_repeated else 0.0

    n_domains = len(ctx.domain_counts)
    exploration_strength = round(min(n_domains / 5, 1.0), 2) if n_domains >= 3 else 0.0

    # Average emotional charge across trajectory
    avg_emotion = (
        sum(ctx.emotion_trajectory) / len(ctx.emotion_trajectory)
        if ctx.emotion_trajectory
        else 0.0
    )

    # ── Upgrade 114: Compound patterns (checked FIRST) ───────────

    # hesitant_timing: hesitation + timing_focus
    if binary_strength > 0.3 and timing_strength > 0.3 and ctx.total_questions >= 3:
        combined = round((binary_strength + timing_strength) / 2, 2)
        themes = ctx.recurring_themes
        if themes:
            trend = f"You're weighing timing decisions carefully around {themes[0]}."
        else:
            trend = "You're weighing timing decisions carefully."
        return PatternResult(
            pattern="hesitant_timing",
            trend=trend,
            strength=combined,
        )

    # anxious_fixation: domain_loop + high emotional charge
    if has_repeated and avg_emotion >= 0.4:
        combined = round((domain_strength + avg_emotion) / 2, 2)
        trend = _enrich_domain_trend(
            f"You seem anxiously fixated on {domain}.",
            domain,
            ctx,
        )
        if trend == f"You seem anxiously fixated on {domain}.":
            trend = f"You're anxiously fixated on {domain}."
        return PatternResult(
            pattern="anxious_fixation",
            trend=trend,
            strength=combined,
        )

    # timing_obsession: timing_focus + domain_loop
    if timing_strength > 0.3 and has_repeated:
        combined = round((timing_strength + domain_strength) / 2, 2)
        themes = ctx.recurring_themes
        if themes:
            trend = f"You're fixated on when to act on {domain}, especially regarding {themes[0]}."
        else:
            trend = f"You're fixated on when to act on {domain}."
        return PatternResult(
            pattern="timing_obsession",
            trend=trend,
            strength=combined,
        )

    # stuck_on_topic: hesitation + domain_loop
    if binary_strength > 0.3 and has_repeated:
        combined = round((binary_strength + domain_strength) / 2, 2)
        trend = _enrich_domain_trend(
            f"You seem stuck on {domain} decisions.",
            domain,
            ctx,
        )
        if trend == f"You seem stuck on {domain} decisions.":
            trend = f"You're stuck on {domain} decisions."
        return PatternResult(
            pattern="stuck_on_topic",
            trend=trend,
            strength=combined,
        )

    # early_exploration: exploration + low total_questions (and no stronger signal)
    if (exploration_strength > 0.0 and ctx.total_questions <= 4
            and binary_strength < 0.5 and timing_strength < 0.5
            and not has_repeated):
        trend = "You're just getting started — exploring broadly."
        themes = ctx.recurring_themes
        if themes:
            trend = f"You're just getting started — exploring broadly with interest in {themes[0]}."
        return PatternResult(
            pattern="early_exploration",
            trend=trend,
            strength=round(exploration_strength * 0.7, 2),
        )

    # ── Simple patterns (with continuous sigmoid strengths) ──────

    # Hesitation: lots of binary decisions
    if binary_strength >= 0.5 and ctx.total_questions >= 3:
        return PatternResult(
            pattern="hesitation",
            trend=_enrich_hesitation_trend(ctx),
            strength=binary_strength,
        )

    # Timing focus: lots of "when" questions
    if timing_strength >= 0.5 and ctx.total_questions >= 3:
        return PatternResult(
            pattern="timing_focus",
            trend=_enrich_timing_trend(ctx),
            strength=timing_strength,
        )

    # Domain loop: same domain keeps coming back
    if has_repeated:
        trend = _enrich_domain_trend(
            f"Your questions keep returning to {domain} — this area is clearly active for you right now.",
            domain,
            ctx,
        )
        return PatternResult(
            pattern="domain_loop",
            trend=trend,
            strength=domain_strength,
        )

    # Exploration: diverse, healthy pattern
    if n_domains >= 3 and ctx.total_questions >= 3:
        return PatternResult(
            pattern="exploration",
            trend=_enrich_exploration_trend(ctx),
            strength=exploration_strength,
        )

    # Default: mild exploration
    return PatternResult(
        pattern="exploration",
        trend="Your question pattern is open and varied.",
        strength=0.3,
    )
