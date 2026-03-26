"""Base adapter interface that every system adapter must implement.

Adapters wrap the existing engine output (from ``engine.calculate(context)``)
and convert it into the mandatory ``SystemOpinion`` contract.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
import re
from typing import Any, NamedTuple

from ..schemas import ClassifiedIntent, EvidenceItem, SystemOpinion


# ═══════════════════════════════════════════════════════════════════
#  Upgrade 11: Signal accumulation helpers
# ═══════════════════════════════════════════════════════════════════

class Signal(NamedTuple):
    """A single named signal for multi-signal stance blending."""
    name: str
    value: float   # -1 (strongly negative) to +1 (strongly positive)
    weight: float   # importance weight, typically 0-1


def blend_signals(signals: list[Signal]) -> float:
    """Return a weighted average of signal values.

    Adapters can optionally use this instead of manual accumulation
    when combining multiple astrological indicators into a single score.

    Returns 0.0 when the signal list is empty or total weight is zero.
    """
    if not signals:
        return 0.0
    total_weight = sum(s.weight for s in signals)
    if total_weight == 0:
        return 0.0
    return sum(s.value * s.weight for s in signals) / total_weight


# ═══════════════════════════════════════════════════════════════════
#  Upgrade 14: Aspect orb weight decay
# ═══════════════════════════════════════════════════════════════════

def orb_weight_decay(orb: float | None) -> float:
    """Return a multiplier that decays with aspect orb distance.

    Tighter orbs (closer to exact) are stronger:
        0° → 1.0, 2° → 0.85, 4° → 0.70, 6° → 0.55, 8°+ → 0.40.
    If orb is None (not an aspect), returns 1.0 (no decay).
    """
    if orb is None:
        return 1.0
    if orb <= 0:
        return 1.0
    if orb <= 2:
        return round(1.0 - orb * 0.075, 2)    # 0→1.0, 2→0.85
    if orb <= 4:
        return round(0.85 - (orb - 2) * 0.075, 2)  # 2→0.85, 4→0.70
    if orb <= 6:
        return round(0.70 - (orb - 4) * 0.075, 2)  # 4→0.70, 6→0.55
    if orb < 8:
        return round(0.55 - (orb - 6) * 0.075, 2)  # 6→0.55, 8→0.40
    return 0.40


# ═══════════════════════════════════════════════════════════════════
#  Option polarity analysis
# ═══════════════════════════════════════════════════════════════════

# Keywords that indicate an active / yang / outward option
_ACTIVE_KW = {
    "late", "out", "go", "start", "begin", "act", "move", "change", "new",
    "risk", "adventure", "pursue", "push", "ask", "launch", "apply",
    "travel", "exercise", "party", "socialize", "invest", "spend",
    "accept", "advance", "bold", "build", "challenge", "commit", "confront",
    "create", "dare", "embrace", "engage", "expand", "explore", "fight",
    "forge", "grab", "grow", "hustle", "initiate", "join", "jump", "leap",
    "open", "seize", "shift", "strike", "switch", "try", "venture", "yes",
}

# Keywords that indicate a passive / yin / inward option
_REST_KW = {
    "early", "home", "stay", "wait", "rest", "sleep", "pause", "delay",
    "hold", "keep", "conserve", "calm", "save", "slow", "quiet",
    "meditate", "reflect", "cancel", "decline", "withdraw",
    "avoid", "careful", "cautious", "defer", "endure", "guard",
    "hibernate", "linger", "maintain", "pass", "patience", "postpone",
    "preserve", "protect", "refuse", "relax", "remain", "resist",
    "retreat", "settle", "shelter", "sit", "steady", "still", "tolerate",
    "weather", "yield",
}


def option_polarity(text: str) -> float:
    """Score an option's polarity: -1.0 (rest/yin) → +1.0 (action/yang).

    Returns 0.0 if the option is neutral or ambiguous.
    """
    words = set(text.lower().split())
    active = len(words & _ACTIVE_KW)
    passive = len(words & _REST_KW)
    total = active + passive
    if total == 0:
        return 0.0
    return round((active - passive) / total, 2)


def option_polarities(options: list[str]) -> dict[str, float]:
    """Return polarity for each option.  Keys = option text."""
    return {opt: option_polarity(opt) for opt in options}


# ═══════════════════════════════════════════════════════════════════
#  Highlight / table extraction helpers
# ═══════════════════════════════════════════════════════════════════

def extract_highlights(
    system_data: dict[str, Any],
    patterns: list[str],
) -> list[EvidenceItem]:
    """Pull matching highlights from a system's output as evidence items."""
    items: list[EvidenceItem] = []
    highlights = system_data.get("highlights", [])
    for h in highlights:
        label = str(h.get("label", "")).lower()
        for i, pattern in enumerate(patterns):
            if pattern in label:
                weight = max(0.9 - i * 0.1, 0.3)
                items.append(EvidenceItem(
                    feature=h.get("label", pattern),
                    value=str(h.get("value", "")),
                    weight=round(weight, 2),
                ))
                break
    return items


def get_highlight_value(system_data: dict[str, Any], pattern: str) -> str | None:
    """Return the value of the first highlight matching ``pattern`` (case-insensitive)."""
    for h in system_data.get("highlights", []):
        if pattern in str(h.get("label", "")).lower():
            return str(h.get("value", ""))
    return None


def get_table_rows(system_data: dict[str, Any], title_fragment: str) -> list[list]:
    """Return rows from the first table whose title contains ``title_fragment``."""
    for tbl in system_data.get("tables", []):
        if title_fragment in tbl.get("title", "").lower():
            return tbl.get("rows", [])
    return []


def scores_to_stance(
    scores: dict[str, dict[str, Any]],
    domains: list[str],
    options: list[str],
) -> dict[str, float]:
    """Fallback: convert domain scores (0-100) into normalised stance (0-1)."""
    if not domains or not scores:
        return {opt: 0.5 for opt in options}

    total = 0.0
    count = 0
    for domain in domains:
        score_info = scores.get(domain, {})
        raw = score_info.get("value", 50) if isinstance(score_info, dict) else 50
        total += raw
        count += 1

    avg = total / count if count else 50.0
    normalised = avg / 100.0

    if len(options) >= 2:
        return {options[0]: round(normalised, 3), options[1]: round(1 - normalised, 3)}
    return {"favorable": round(normalised, 3), "cautious": round(1 - normalised, 3)}


# ═══════════════════════════════════════════════════════════════════
#  Stance arithmetic helpers
# ═══════════════════════════════════════════════════════════════════

def make_stance(options: list[str], score_a: float) -> dict[str, float]:
    """Build a normalised two-option stance from a 0-1 score for option A."""
    score_a = max(0.0, min(1.0, score_a))
    if len(options) >= 2:
        return {options[0]: round(score_a, 3), options[1]: round(1 - score_a, 3)}
    return {"favorable": round(score_a, 3), "cautious": round(1 - score_a, 3)}


def polarity_to_stance(
    options: list[str],
    raw_action_score: float,
) -> dict[str, float]:
    """Map a raw action score (-1..+1) to a stance dict using option polarities.

    Compares each option's keyword polarity to the system's action lean.
    Falls back to ``make_stance`` when both options are polarity-neutral.

    Parameters
    ----------
    options : list[str]
        The two option labels from the classified intent.
    raw_action_score : float
        System's action lean, roughly -1 (rest) to +1 (action).
    """
    normalised = max(0.15, min(0.85, (raw_action_score + 1) / 2))

    if len(options) < 2:
        return make_stance(options, normalised)

    pols = option_polarities(options)
    pol_a = pols.get(options[0], 0.0)
    pol_b = pols.get(options[1], 0.0)

    if pol_a == 0 and pol_b == 0:
        return make_stance(options, normalised)

    action_lean = (raw_action_score + 1) / 2  # 0-1
    score_a = 1 - abs(action_lean - (pol_a + 1) / 2)
    score_b = 1 - abs(action_lean - (pol_b + 1) / 2)
    total = score_a + score_b
    if total > 0:
        return {options[0]: round(score_a / total, 3), options[1]: round(score_b / total, 3)}

    return make_stance(options, normalised)


# ── Dynamic evidence weighting (improvement #6) ──────────────────

# Features that are especially relevant per domain
DOMAIN_FEATURE_BOOST: dict[str, set[str]] = {
    "love": {
        "venus", "moon", "peach", "relationship", "7th", "house 7",
        "5th", "house 5", "libra", "taurus", "nakshatra", "secret friend",
        "harmony", "romance", "attraction", "netzach", "soul urge",
        "compatibility", "marriage", "partner", "tithi", "sanguine",
        "rob wealth", "hurting officer", "combination",
    },
    "career": {
        "saturn", "midheaven", "10th", "house 10", "day master", "career",
        "capricorn", "6th", "house 6", "mars", "direct wealth",
        "indirect wealth", "direct officer", "indirect officer",
        "expression", "pinnacle", "nobleman", "professional",
        "choleric", "lot of spirit", "gevurah", "hod",
    },
    "health": {
        "mars", "ascendant", "6th", "house 6", "health", "vitality",
        "moon phase", "1st", "house 1", "sun", "energy", "temperament",
        "phlegmatic", "choleric", "melancholic", "humor", "biorhythm",
        "pluto", "8th", "house 8", "strength", "weak", "strong",
    },
    "wealth": {
        "jupiter", "fortune", "2nd", "house 2", "8th", "wealth",
        "house 8", "lot of fortune", "direct wealth", "indirect wealth",
        "taurus", "scorpio", "abundance", "prosperity", "financial",
        "chesed", "personal year", "dragon", "rat",
    },
    "mood": {
        "moon", "neptune", "12th", "sefirah", "phase", "yoga",
        "personal day", "pisces", "cancer", "4th", "house 4",
        "soul", "keter", "tiferet", "yesod", "water",
        "text root", "bridge root", "nakshatra", "emotional",
        "waning", "waxing", "retrograde", "meditation",
    },
}


def _adjust_evidence_weights(
    evidence: list[EvidenceItem],
    intent: ClassifiedIntent,
) -> list[EvidenceItem]:
    """Boost evidence items that match the question's domain, reduce others."""
    if not evidence or not intent.domain_tags:
        return evidence

    # Collect all relevant keywords for this question's domains
    boost_keywords: set[str] = set()
    for domain in intent.domain_tags:
        boost_keywords |= DOMAIN_FEATURE_BOOST.get(domain, set())

    adjusted: list[EvidenceItem] = []
    for ev in evidence:
        feature_lower = ev.feature.lower() + " " + ev.value.lower()
        match_count = sum(1 for kw in boost_keywords if kw in feature_lower)
        if match_count >= 2:
            new_weight = min(ev.weight + 0.15, 1.0)
        elif match_count == 1:
            new_weight = min(ev.weight + 0.08, 1.0)
        else:
            new_weight = max(ev.weight - 0.05, 0.1)
        adjusted.append(EvidenceItem(
            feature=ev.feature,
            value=ev.value,
            weight=round(new_weight, 2),
            orb=ev.orb,
            category=ev.category,
            provenance=ev.provenance,
            freshness=ev.freshness,
            semantic_key=ev.semantic_key,
            source_kind=ev.source_kind,
            source_path=ev.source_path,
        ))
    return adjusted


# ── Upgrade 16: Evidence category tagging ─────────────────────────

# Ordered list of (category, keywords) — first match wins for each evidence item.
_CATEGORY_RULES: list[tuple[str, set[str]]] = [
    ("aspect", {"aspect", "conjunction", "opposition", "square", "trine", "sextile"}),
    ("transit", {"transit", "gochara"}),
    ("dasha", {"dasha", "mahadasha", "antardasha"}),
    ("nakshatra", {"nakshatra"}),
    ("yoga", {"yoga"}),
    ("tithi", {"tithi", "paksha"}),
    ("house", {"house", "midheaven", "ascendant", "lagna"}),
    ("sign", {
        "sign", "zodiac", "aries", "taurus", "gemini", "cancer", "leo",
        "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
    }),
    ("planet", {
        "venus", "mars", "jupiter", "saturn", "mercury", "sun", "moon",
        "pluto", "neptune", "uranus",
    }),
    ("number", {
        "personal day", "personal month", "personal year", "life path",
        "expression", "soul urge", "personality", "birthday", "attitude",
    }),
    ("element", {"element", "fire", "water", "earth", "air", "wood", "metal"}),
    ("star", {"star", "nobleman", "peach", "academic", "fortune", "disaster"}),
    ("sefirah", {
        "sefirah", "sefirot", "pillar", "keter", "chesed", "gevurah",
        "tiferet", "netzach", "hod", "yesod", "malkuth",
    }),
    ("mansion", {"mansion", "lunar mansion"}),
    ("root", {"root", "gematria", "hebrew"}),
    ("pillar", {"pillar", "day master", "ten god", "na yin"}),
    ("animal", {
        "animal", "rat", "ox", "tiger", "rabbit", "dragon", "snake",
        "horse", "goat", "monkey", "rooster", "dog", "pig",
    }),
    ("temperament", {
        "temperament", "humor", "choleric", "sanguine", "melancholic", "phlegmatic",
    }),
]


def _categorize_evidence(evidence: list[EvidenceItem]) -> list[EvidenceItem]:
    """Auto-tag each evidence item's ``category`` field based on feature name keywords.

    Items that already have a non-empty category are left unchanged.
    """
    tagged: list[EvidenceItem] = []
    for ev in evidence:
        if ev.category:
            tagged.append(ev)
            continue
        feature_lower = ev.feature.lower()
        matched_cat = ""
        for cat, keywords in _CATEGORY_RULES:
            if any(kw in feature_lower for kw in keywords):
                matched_cat = cat
                break
        tagged.append(EvidenceItem(
            feature=ev.feature,
            value=ev.value,
            weight=ev.weight,
            orb=ev.orb,
            category=matched_cat,
            provenance=ev.provenance,
            freshness=ev.freshness,
            semantic_key=ev.semantic_key,
            source_kind=ev.source_kind,
            source_path=ev.source_path,
        ))
    return tagged


_SOURCE_KIND_BY_CATEGORY: dict[str, str] = {
    "aspect": "natal",
    "transit": "transit",
    "dasha": "temporal",
    "nakshatra": "natal",
    "yoga": "temporal",
    "tithi": "temporal",
    "house": "natal",
    "sign": "natal",
    "planet": "natal",
    "number": "cyclical",
    "element": "natal",
    "star": "symbolic",
    "sefirah": "symbolic",
    "mansion": "temporal",
    "root": "symbolic",
    "pillar": "natal",
    "animal": "cyclical",
    "temperament": "symbolic",
}

_SHORT_WINDOW_SOURCE_FRESHNESS: dict[str, float] = {
    "transit": 0.95,
    "temporal": 0.9,
    "cyclical": 0.78,
    "natal": 0.58,
    "symbolic": 0.48,
    "fallback": 0.4,
}

_LONG_WINDOW_SOURCE_FRESHNESS: dict[str, float] = {
    "transit": 0.55,
    "temporal": 0.5,
    "cyclical": 0.7,
    "natal": 0.88,
    "symbolic": 0.68,
    "fallback": 0.45,
}

_SEMANTIC_STOP_WORDS = {
    "the", "and", "your", "current", "today", "this", "that", "with", "from",
    "house", "sign", "planet", "score", "value",
}


def _semantic_key(feature: str, value: str, category: str) -> str:
    combined = f"{category} {feature} {value}".lower()
    tokens = [
        token
        for token in re.findall(r"[a-z0-9]+", combined)
        if token not in _SEMANTIC_STOP_WORDS and len(token) >= 3
    ]
    return " ".join(tokens[:8])


def _freshness_for(source_kind: str, time_horizon: str) -> float:
    if time_horizon in {"today", "tomorrow", "this_week"}:
        return _SHORT_WINDOW_SOURCE_FRESHNESS.get(source_kind, 0.4)
    return _LONG_WINDOW_SOURCE_FRESHNESS.get(source_kind, 0.45)


def _enrich_evidence_metadata(
    evidence: list[EvidenceItem],
    intent: ClassifiedIntent,
    system_id: str,
) -> list[EvidenceItem]:
    enriched: list[EvidenceItem] = []
    for ev in evidence:
        category = ev.category or ""
        source_kind = ev.source_kind or _SOURCE_KIND_BY_CATEGORY.get(category, "fallback")
        semantic_key = ev.semantic_key or _semantic_key(ev.feature, ev.value, category)
        freshness = ev.freshness if ev.freshness != 0.5 else _freshness_for(source_kind, intent.time_horizon)
        enriched.append(
            EvidenceItem(
                feature=ev.feature,
                value=ev.value,
                weight=ev.weight,
                orb=ev.orb,
                category=category,
                provenance=ev.provenance or f"adapter:{system_id}",
                freshness=round(freshness, 2),
                semantic_key=semantic_key,
                source_kind=source_kind,
                source_path=ev.source_path or f"systems.{system_id}.{category or 'uncategorized'}",
            )
        )
    return enriched


# ═══════════════════════════════════════════════════════════════════
#  Base adapter
# ═══════════════════════════════════════════════════════════════════

STANCE_CAP: dict[str, float] = {
    "gematria": 0.78,
    "kabbalistic": 0.80,
    "numerology": 0.82,
}


class BaseAdapter(ABC):
    """Abstract base for all system adapters."""

    contract_version: str = "2.0"
    system_id: str = ""
    system_name: str = ""
    confidence_scale: float = 1.0

    @abstractmethod
    def _extract_evidence(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
    ) -> list[EvidenceItem]:
        """Pull traceable features from the system's calculated output."""

    @abstractmethod
    def _compute_stance(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
        evidence: list[EvidenceItem],
    ) -> dict[str, float]:
        """Return scores per option (keys match intent.options), values 0-1, sum ~1."""

    # ── Upgrade 12: Question-aware feature weighting ────────────────

    def _domain_relevance_weight(
        self,
        feature: str,
        value: str,
        domain_tags: list[str],
    ) -> float:
        """Return a multiplier (0.5–1.5) based on how relevant a feature is to the question domains.

        Uses the existing ``DOMAIN_FEATURE_BOOST`` dict for matching.
        2+ keyword matches → 1.3×, 1 match → 1.1×, 0 matches → 0.7×.
        """
        if not domain_tags:
            return 1.0
        boost_keywords: set[str] = set()
        for domain in domain_tags:
            boost_keywords |= DOMAIN_FEATURE_BOOST.get(domain, set())
        if not boost_keywords:
            return 1.0
        combined = feature.lower() + " " + value.lower()
        match_count = sum(1 for kw in boost_keywords if kw in combined)
        if match_count >= 2:
            return 1.3
        if match_count == 1:
            return 1.1
        return 0.7

    def _compute_confidence(
        self,
        system_data: dict[str, Any],
        evidence: list[EvidenceItem],
        time_horizon: str = "general",
    ) -> float:
        """Confidence based on evidence quality.  Override for system-specific logic."""
        if not evidence:
            return 0.0
        avg_weight = sum(e.weight for e in evidence) / len(evidence)
        coverage = min(len(evidence) / 8.0, 1.0)
        base = min(avg_weight * 0.6 + coverage * 0.4, 1.0)

        # Evidence diversity bonus (Upgrade 3)
        _CATEGORY_KW = {
            "planet", "house", "sign", "aspect", "transit", "number",
            "element", "star", "nakshatra", "dasha", "sefirah", "mansion",
            "root", "pillar", "animal", "yoga", "tithi", "temperament",
        }
        found_categories: set[str] = set()
        for ev in evidence:
            combined = ev.feature.lower() + " " + ev.value.lower()
            for cat in _CATEGORY_KW:
                if cat in combined:
                    found_categories.add(cat)
        if len(found_categories) >= 4:
            base = min(base + 0.08, 1.0)
        elif len(found_categories) >= 3:
            base = min(base + 0.05, 1.0)

        # Time horizon scaling (Upgrade 2)
        if time_horizon in ("today", "tomorrow"):
            base *= 1.15
        elif time_horizon == "this_week":
            base *= 1.05
        elif time_horizon in ("this_month", "this_year", "general"):
            base *= 0.90

        # ── Upgrade 13: Time-horizon cycle bias ──────────────────────
        # For short-term questions, boost transiting/daily evidence.
        # For long-term questions, boost natal/permanent evidence.
        _SHORT_CATEGORIES = {"transit", "dasha", "tithi", "yoga"}
        _LONG_CATEGORIES = {"planet", "house", "sign", "number", "sefirah", "root", "pillar", "animal"}
        short_term = time_horizon in ("today", "tomorrow", "this_week")
        long_term = time_horizon in ("this_year", "general")
        if short_term or long_term:
            cycle_bonus = 0.0
            cycle_count = 0
            for ev in evidence:
                cat = ev.category.lower() if ev.category else ""
                if short_term and cat in _SHORT_CATEGORIES:
                    cycle_bonus += 0.02
                    cycle_count += 1
                elif long_term and cat in _LONG_CATEGORIES:
                    cycle_bonus += 0.02
                    cycle_count += 1
            # Cap the cycle bias bonus at +0.08
            base = min(base + min(cycle_bonus, 0.08), 1.0)

        return round(min(base, 1.0), 2)

    def _build_reason(
        self,
        stance: dict[str, float],
        evidence: list[EvidenceItem],
        intent: ClassifiedIntent,
    ) -> str:
        """Build a short reason from the top evidence items."""
        if not evidence:
            return f"{self.system_name} had insufficient data for this question."

        top = sorted(evidence, key=lambda e: e.weight, reverse=True)[:3]
        parts = [f"{e.feature} ({e.value})" for e in top]
        winner = max(stance, key=stance.get)  # type: ignore[arg-type]
        return f"{self.system_name} leans {winner} based on {', '.join(parts)}."

    def _multi_option_counterfactual_stance(
        self,
        intent: ClassifiedIntent,
        evidence: list[EvidenceItem],
        stance: dict[str, float],
    ) -> dict[str, float]:
        """Fallback stance builder for 3+ explicit options.

        Existing adapters are mostly two-way. When a question presents more
        than two options, project each option against the adapter's action/rest
        bias and evidence overlap rather than dropping the extra choices.
        """
        options = intent.options
        if len(options) <= 2:
            return stance

        evidence_text = " ".join(f"{ev.feature} {ev.value}".lower() for ev in evidence)
        base_action = stance.get("favorable")
        if base_action is None:
            values = list(stance.values())
            base_action = values[0] if values else 0.5

        scores: dict[str, float] = {}
        for option in options:
            polarity = option_polarity(option)
            overlap = sum(1 for token in option.lower().split() if token in evidence_text)
            score = 0.5 + ((base_action - 0.5) * polarity) + min(overlap * 0.05, 0.15)
            scores[option] = max(0.05, min(1.0, round(score, 3)))

        total = sum(scores.values())
        if total <= 0:
            return {option: round(1 / len(options), 3) for option in options}
        return {option: round(value / total, 3) for option, value in scores.items()}

    # ── Upgrade 17: Stance explanation builder ────────────────────────

    def _build_stance_explanation(
        self,
        stance: dict[str, float],
        evidence: list[EvidenceItem],
        intent: ClassifiedIntent,
    ) -> str:
        """Produce a 1-sentence plain-English explanation of the system's vote.

        Format: "{SystemName} {leans_word} {winner} because {top_reason}".
        Example: "Vedic Astrology leans favorable because your Venus Mahadasha activates love."
        """
        if not evidence:
            return f"{self.system_name} has no strong signal for this question."

        winner = max(stance, key=stance.get)  # type: ignore[arg-type]
        winner_score = stance.get(winner, 0.5)

        # Choose intensity word based on stance strength
        if winner_score >= 0.75:
            leans_word = "strongly favors"
        elif winner_score >= 0.60:
            leans_word = "leans"
        else:
            leans_word = "slightly leans"

        # Pick the single most influential evidence item as the reason
        top_ev = max(evidence, key=lambda e: e.weight)
        top_reason = f"your {top_ev.feature} is {top_ev.value}"

        return f"{self.system_name} {leans_word} {winner} because {top_reason}."

    def evaluate(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
    ) -> SystemOpinion:
        """Run the full adapter pipeline → SystemOpinion."""
        if not system_data or not system_data.get("scores"):
            return SystemOpinion(
                system_id=self.system_id,
                relevant=False,
                stance={opt: 0.5 for opt in (intent.options or ["favorable", "cautious"])},
                confidence=0.0,
                reason=f"No data available from {self.system_name}.",
                evidence=[],
            )

        evidence = self._extract_evidence(system_data, intent)
        # Dynamic evidence weighting (improvement #6): boost evidence
        # that matches the question's domain, reduce irrelevant evidence.
        evidence = _adjust_evidence_weights(evidence, intent)

        # Upgrade 16: Auto-tag evidence categories based on feature keywords.
        evidence = _categorize_evidence(evidence)
        evidence = _enrich_evidence_metadata(evidence, intent, self.system_id)

        stance = self._compute_stance(system_data, intent, evidence)
        if len(intent.options) > 2:
            stance = self._multi_option_counterfactual_stance(intent, evidence, stance)

        # Stance normalization guard (Upgrade 4): clamp minor systems
        if self.system_id in STANCE_CAP:
            cap = STANCE_CAP[self.system_id]
            clamped = {k: min(v, cap) for k, v in stance.items()}
            total = sum(clamped.values())
            if total > 0:
                stance = {k: round(v / total, 3) for k, v in clamped.items()}

        # Upgrade 15: Overconfidence detection — extreme stances (>0.95) usually
        # indicate missing data or a single dominant signal rather than genuine
        # certainty.  Penalise the adapter's confidence to reflect this.
        overconfidence_penalty = 0.0
        if any(v > 0.95 for v in stance.values()):
            overconfidence_penalty = 0.15

        confidence = self._compute_confidence(
            system_data, evidence, time_horizon=intent.time_horizon,
        )
        # Adapter-specific confidence scaling (Upgrade 7)
        confidence = min(confidence * self.confidence_scale, 1.0)
        # Apply overconfidence penalty (Upgrade 15)
        confidence = max(confidence - overconfidence_penalty, 0.0)

        # Fallback: if adapter logic produced no evidence (e.g. highlights
        # missing from cached/partial reading) but scores exist, use domain
        # scores as a baseline so the system still contributes.
        if not evidence and system_data.get("scores"):
            options = intent.options or ["favorable", "cautious"]
            stance = scores_to_stance(
                system_data["scores"], intent.domain_tags, options,
            )
            # Build minimal evidence from domain scores
            for domain in intent.domain_tags[:2]:
                score_info = system_data["scores"].get(domain, {})
                val = score_info.get("value", 50) if isinstance(score_info, dict) else 50
                lbl = score_info.get("label", "") if isinstance(score_info, dict) else ""
                evidence.append(EvidenceItem(
                    feature=f"{domain.title()} score",
                    value=f"{val:.0f}% ({lbl})" if lbl else f"{val:.0f}%",
                    weight=0.5,
                ))
            confidence = 0.35  # lower confidence for score-only fallback

        reason = self._build_reason(stance, evidence, intent)

        # Upgrade 17: Build plain-English stance explanation
        stance_explanation = self._build_stance_explanation(stance, evidence, intent)
        strongest_support = evidence[0].feature if evidence else ""
        strongest_caution = evidence[-1].feature if len(evidence) >= 2 else ""

        return SystemOpinion(
            system_id=self.system_id,
            relevant=len(evidence) > 0,
            stance=stance,
            confidence=confidence,
            reason=reason,
            evidence=evidence,
            stance_explanation=stance_explanation,
            strongest_support=strongest_support,
            strongest_caution=strongest_caution,
        )
