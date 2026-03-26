"""Gematria adapter — constrained symbolic-language logic.

Uses a single standardised method (Hebrew/Latin standard values) and maps
resulting root numbers to a curated archetypal dictionary.

Key inputs:
  - Text root → primary symbolic signature
  - Ordinal root → secondary symbolic layer (alternate counting system)
  - Bridge root → combined text + birth signature
  - Current gate → yearly timing gate
  - Root alignment (text root == current gate → coherence boost)
  - Word-level roots → convergence/divergence of phrase components
  - Root correspondence themes → per-layer thematic evidence
  - Source type → provenance context (hebrew name / full name / location)

Best for: wording-sensitive questions, identity, meaning/pattern questions,
secondary symbolic reinforcement.
"""

from __future__ import annotations

from typing import Any

from ..schemas import ClassifiedIntent, EvidenceItem
from .base import (
    BaseAdapter,
    get_highlight_value,
    get_table_rows,
    option_polarities,
    polarity_to_stance,
)

# ── Root number → archetypal polarity ─────────────────────────────
# Positive = outward/action, Negative = inward/rest

ROOT_POLARITY: dict[int, float] = {
    1:  0.7,   # origin, will, initiative
    2: -0.4,   # bonding, balance, patience
    3:  0.5,   # expression, communication
    4: -0.5,   # structure, order, routine
    5:  0.6,   # change, transition, threshold
    6: -0.3,   # harmony, care
    7: -0.7,   # study, privacy, spiritual
    8:  0.6,   # power, material traction
    9:  0.1,   # completion, compassion
    11: 0.2,   # intuition, sensitivity
    22: 0.7,   # master building
    33:-0.2,   # service, guidance
}

ROOT_THEME: dict[int, str] = {
    1: "initiative and self-direction",
    2: "partnership and patience",
    3: "expression and visibility",
    4: "structure and discipline",
    5: "change and movement",
    6: "harmony and care",
    7: "reflection and withdrawal",
    8: "power and execution",
    9: "completion and release",
    11: "intuition and awareness",
    22: "ambitious construction",
    33: "service and teaching",
}

# ── Root number → domain strengths ────────────────────────────────
ROOT_DOMAIN: dict[int, dict[str, float]] = {
    1:  {"career": 0.8, "mood": 0.6, "health": 0.5},
    2:  {"love": 0.8, "mood": 0.6},
    3:  {"mood": 0.7, "career": 0.6, "love": 0.5},
    4:  {"career": 0.7, "health": 0.6, "wealth": 0.5},
    5:  {"career": 0.6, "health": 0.5, "mood": 0.5},
    6:  {"love": 0.8, "health": 0.6, "mood": 0.5},
    7:  {"mood": 0.9, "health": 0.5},
    8:  {"wealth": 0.9, "career": 0.8},
    9:  {"mood": 0.7, "love": 0.5, "health": 0.5},
    11: {"mood": 0.8, "love": 0.5},
    22: {"career": 0.9, "wealth": 0.7},
    33: {"mood": 0.7, "love": 0.6, "health": 0.5},
}

# ── Root pair harmony / dissonance ────────────────────────────────
HARMONIC_ROOTS: set[frozenset] = {
    frozenset({1, 5}), frozenset({1, 9}), frozenset({2, 6}), frozenset({3, 9}),
    frozenset({4, 8}), frozenset({6, 9}), frozenset({3, 5}), frozenset({7, 11}),
}
DISSONANT_ROOTS: set[frozenset] = {
    frozenset({1, 4}), frozenset({1, 8}), frozenset({2, 5}), frozenset({4, 5}),
    frozenset({7, 8}), frozenset({3, 4}), frozenset({6, 7}),
}

# ── Hebrew letter correspondences for root numbers 1-9 ────────────
ROOT_LETTER: dict[int, str] = {
    1: "Aleph", 2: "Beth", 3: "Gimel", 4: "Daleth", 5: "He",
    6: "Vav", 7: "Zayin", 8: "Cheth", 9: "Teth",
}

# ── Hebrew letter polarity (from Kabbalistic path correspondences) ─
_LETTER_POLARITY: dict[str, float] = {
    "Aleph":  0.3,
    "Beth":  -0.2,
    "Gimel":  0.4,
    "Daleth": 0.0,
    "He":     0.3,
    "Vav":    0.1,
    "Zayin": -0.3,
    "Cheth": -0.4,
    "Teth":  -0.2,
}

# ── Upgrade 72: Master number intensity multipliers ───────────────
MASTER_INTENSITY: dict[int, float] = {
    11: 1.4,
    22: 1.5,
    33: 1.3,
}

# ── Upgrade 72: Master number domain associations ─────────────────
_MASTER_DOMAIN: dict[int, set[str]] = {
    11: {"mood", "love"},
    22: {"career", "wealth"},
    33: {"mood", "love", "health"},
}

# ── Upgrade 73: Hebrew letter path depth meanings ─────────────────
LETTER_PATH_MEANING: dict[int, str] = {
    1: "Aleph — the breath of creation, path between Keter and Chokmah, pure potential and divine will",
    2: "Beth — the house of wisdom, path between Keter and Binah, container of understanding",
    3: "Gimel — the camel crossing the desert, path between Keter and Tiferet, aspiration and movement toward beauty",
    4: "Daleth — the door of manifestation, path between Chokmah and Binah, threshold between thought and form",
    5: "He — the window of spirit, path between Chokmah and Tiferet, revelation and divine sight",
    6: "Vav — the nail that joins, path between Chokmah and Chesed, connection and continuity",
    7: "Zayin — the sword of discernment, path between Binah and Tiferet, cutting truth from illusion",
    8: "Cheth — the fence of protection, path between Binah and Gevurah, boundary and sacred enclosure",
    9: "Teth — the serpent of transformation, path between Chesed and Gevurah, hidden power and transmutation",
}

# ── Upgrade 73: Letter path domain associations ───────────────────
_LETTER_PATH_DOMAIN: dict[int, set[str]] = {
    1: {"mood", "career"},
    2: {"mood", "love"},
    3: {"career", "mood"},
    4: {"career", "wealth"},
    5: {"mood", "health"},
    6: {"love", "mood"},
    7: {"mood", "health"},
    8: {"health", "career"},
    9: {"health", "wealth"},
}


def _safe_int(val: Any) -> int | None:
    try:
        return int(str(val).strip())
    except (ValueError, TypeError):
        return None


def _root_domain_strength(root: int | None, domains: list[str]) -> float:
    """Return the maximum domain-strength weight for this root against the
    question's domain tags.  Returns 0.0 when there is no match."""
    if root is None or not domains:
        return 0.0
    domain_map = ROOT_DOMAIN.get(root, {})
    return max((domain_map.get(d, 0.0) for d in domains), default=0.0)


def _harmony_delta(root_a: int | None, root_b: int | None) -> float:
    """Return +0.25 for harmonic pair, -0.20 for dissonant pair, else 0.0."""
    if root_a is None or root_b is None or root_a == root_b:
        return 0.0
    pair = frozenset({root_a, root_b})
    if pair in HARMONIC_ROOTS:
        return 0.25
    if pair in DISSONANT_ROOTS:
        return -0.20
    return 0.0


def _extract_word_roots(system_data: dict[str, Any]) -> list[int]:
    """Pull reduced root values from the Word totals table (column index 2)."""
    roots: list[int] = []
    for row in get_table_rows(system_data, "word totals"):
        if len(row) >= 3:
            val = _safe_int(row[2])
            if val is not None:
                roots.append(val)
    return roots


def _extract_root_corr_themes(system_data: dict[str, Any]) -> list[tuple[str, int | None, str]]:
    """Return (layer_label, root, theme) tuples from Root correspondences table."""
    results: list[tuple[str, int | None, str]] = []
    for row in get_table_rows(system_data, "root correspondences"):
        if len(row) >= 4:
            layer = str(row[0])
            root = _safe_int(row[2])
            theme = str(row[3])
            if theme:
                results.append((layer, root, theme))
    return results


# ── Upgrade 71: Root progression analysis helper ──────────────────

def _reduce_root(val: int) -> int:
    """Reduce a root to single digit (1-9) for progression comparison,
    preserving master numbers for other uses but reducing here."""
    if val <= 0:
        return val
    while val > 9:
        val = sum(int(d) for d in str(val))
    return val


def _root_progression(text_root: int | None, ordinal_root: int | None,
                      bridge_root: int | None) -> str | None:
    """Classify the text→ordinal→bridge root progression.
    Returns 'ascending', 'descending', 'stable', or None."""
    if text_root is None or ordinal_root is None or bridge_root is None:
        return None
    a = _reduce_root(text_root)
    b = _reduce_root(ordinal_root)
    c = _reduce_root(bridge_root)
    if a < b and b < c:
        return "ascending"
    if a > b and b > c:
        return "descending"
    if abs(a - b) <= 1 and abs(b - c) <= 1:
        return "stable"
    return None


# ── Upgrade 75: Positional word root weighting helper ─────────────

def _positional_word_weights(word_roots: list[int]) -> list[tuple[int, float]]:
    """Return (root, weight_multiplier) for each word root based on position.
    First word: ×1.3, middle words: ×1.0, last word: ×0.8."""
    if not word_roots:
        return []
    n = len(word_roots)
    result: list[tuple[int, float]] = []
    for i, root in enumerate(word_roots):
        if i == 0:
            result.append((root, 1.3))
        elif i == n - 1 and n > 1:
            result.append((root, 0.8))
        else:
            result.append((root, 1.0))
    return result


# ── Upgrade 76: Compound root resonance helper ────────────────────

def _check_compound_resonance(text_root: int | None, ordinal_root: int | None,
                               bridge_root: int | None) -> bool:
    """Return True when text_root == (ordinal_root + bridge_root) % 9,
    using 9 when the modulo result is 0."""
    if text_root is None or ordinal_root is None or bridge_root is None:
        return False
    target = (ordinal_root + bridge_root) % 9
    if target == 0:
        target = 9
    return _reduce_root(text_root) == target


# ── Upgrade 79: Letter frequency resonance helper ─────────────────

# Map letters to their Hebrew letter correspondences (simplified Latin→Hebrew)
_LETTER_TO_HEBREW: dict[str, str] = {
    "a": "Aleph", "b": "Beth", "c": "Gimel", "d": "Daleth", "e": "He",
    "f": "Vav", "g": "Zayin", "h": "Cheth", "i": "Teth", "j": "Aleph",
    "k": "Beth", "l": "Gimel", "m": "Daleth", "n": "He", "o": "Vav",
    "p": "Zayin", "q": "Cheth", "r": "Teth", "s": "Aleph", "t": "Beth",
    "u": "Gimel", "v": "Daleth", "w": "He", "x": "Vav", "y": "Zayin",
    "z": "Cheth",
}


def _letter_frequency_resonance(name_text: str) -> list[tuple[str, int, float]]:
    """Count Hebrew letter correspondences in the name text.
    Returns list of (letter_name, count, polarity) for letters with 3+ occurrences."""
    if not name_text:
        return []
    from collections import Counter
    hebrew_counts: Counter[str] = Counter()
    for ch in name_text.lower():
        hebrew = _LETTER_TO_HEBREW.get(ch)
        if hebrew:
            hebrew_counts[hebrew] += 1
    results: list[tuple[str, int, float]] = []
    for letter, count in hebrew_counts.items():
        if count >= 3:
            pol = _LETTER_POLARITY.get(letter, 0.0)
            results.append((letter, count, pol))
    return results


# ── Upgrade 80: Correspondence layer agreement helper ─────────────

def _count_theme_agreement(corr_themes: list[tuple[str, int | None, str]]) -> int:
    """Count how many correspondence layers share similar theme keywords.
    Returns the max number of layers that agree on at least one keyword."""
    if len(corr_themes) < 2:
        return 0
    # Extract keywords from each layer's theme
    from collections import Counter
    keyword_layers: Counter[str] = Counter()
    for _layer, _root, theme in corr_themes:
        words = set(theme.lower().split())
        # Count each keyword once per layer (not per occurrence)
        for w in words:
            if len(w) > 3:  # skip short words
                keyword_layers[w] += 1
    if not keyword_layers:
        return 0
    return keyword_layers.most_common(1)[0][1]


class GematriaAdapter(BaseAdapter):
    system_id = "gematria"
    system_name = "Gematria"
    confidence_scale = 0.80

    def _extract_evidence(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
    ) -> list[EvidenceItem]:
        items: list[EvidenceItem] = []
        domains = intent.domain_tags or []

        # Text root
        text_root_val = get_highlight_value(system_data, "text root")
        text_root = _safe_int(text_root_val)
        if text_root_val is not None:
            theme = ROOT_THEME.get(text_root, "") if text_root else ""
            # Domain-specific evidence labeling: boost weight when root domain
            # matches the question domain
            domain_strength = _root_domain_strength(text_root, domains)
            base_weight = 0.85 + (domain_strength * 0.10)
            letter = ROOT_LETTER.get(text_root, "") if text_root else ""
            label_parts = [theme] if theme else []
            if letter:
                label_parts.append(f"letter {letter}")
            value_str = (
                f"{text_root_val} — {', '.join(label_parts)}"
                if label_parts else str(text_root_val)
            )
            items.append(EvidenceItem(
                feature="Text root",
                value=value_str,
                weight=round(min(base_weight, 1.0), 2),
            ))

        # Ordinal root — second symbolic layer
        ordinal_root_val = get_highlight_value(system_data, "ordinal root")
        ordinal_root = _safe_int(ordinal_root_val)
        if ordinal_root_val is not None:
            theme = ROOT_THEME.get(ordinal_root, "") if ordinal_root else ""
            domain_strength = _root_domain_strength(ordinal_root, domains)
            base_weight = 0.70 + (domain_strength * 0.08)
            value_str = (
                f"{ordinal_root_val} — {theme}" if theme else str(ordinal_root_val)
            )
            items.append(EvidenceItem(
                feature="Ordinal root",
                value=value_str,
                weight=round(min(base_weight, 1.0), 2),
            ))

        # Bridge root
        bridge_val = get_highlight_value(system_data, "bridge root")
        bridge_root = _safe_int(bridge_val)
        if bridge_val is not None:
            theme = ROOT_THEME.get(bridge_root, "") if bridge_root else ""
            items.append(EvidenceItem(
                feature="Bridge root",
                value=f"{bridge_val} — {theme}" if theme else str(bridge_val),
                weight=0.75,
            ))

        # Current gate
        gate_val = get_highlight_value(system_data, "current gate")
        current_gate = _safe_int(gate_val)
        if gate_val is not None:
            theme = ROOT_THEME.get(current_gate, "") if current_gate else ""
            items.append(EvidenceItem(
                feature="Current gate",
                value=f"{gate_val} — {theme}" if theme else str(gate_val),
                weight=0.7,
            ))

        # Text total (raw number)
        total_val = get_highlight_value(system_data, "text total")
        if total_val is not None:
            items.append(EvidenceItem(feature="Text total", value=str(total_val), weight=0.4))

        # Root alignment (text root == current gate)
        if text_root is not None and current_gate is not None and text_root == current_gate:
            items.append(EvidenceItem(
                feature="Root-gate alignment",
                value=f"Text root {text_root} matches current gate {current_gate}",
                weight=0.9,
            ))

        # Root pair harmony indicator (text root ↔ current gate)
        harmony_delta = _harmony_delta(text_root, current_gate)
        if harmony_delta != 0.0:
            relation = "harmonic" if harmony_delta > 0 else "dissonant"
            items.append(EvidenceItem(
                feature="Root-gate harmony",
                value=f"Roots {text_root} and {current_gate} are {relation}",
                weight=0.65 if harmony_delta > 0 else 0.55,
            ))

        # Birth root
        birth_val = get_highlight_value(system_data, "birth root")
        if birth_val is not None:
            items.append(EvidenceItem(feature="Birth root", value=str(birth_val), weight=0.5))

        # Source type context
        source_type_val = get_highlight_value(system_data, "source type")
        if source_type_val is not None:
            items.append(EvidenceItem(
                feature="Source type",
                value=str(source_type_val),
                weight=0.35,
            ))

        # Root correspondence themes (up to 3 most relevant)
        corr_themes = _extract_root_corr_themes(system_data)
        added_themes = 0
        for layer, root, theme in corr_themes:
            if added_themes >= 3:
                break
            if not theme:
                continue
            domain_strength = _root_domain_strength(root, domains)
            theme_weight = 0.50 + (domain_strength * 0.15)
            items.append(EvidenceItem(
                feature=f"Root theme — {layer}",
                value=theme,
                weight=round(min(theme_weight, 0.80), 2),
            ))
            added_themes += 1

        # Word-level root analysis — convergence vs divergence
        word_roots = _extract_word_roots(system_data)
        if len(word_roots) >= 2:
            unique_roots = set(word_roots)
            if len(unique_roots) == 1:
                items.append(EvidenceItem(
                    feature="Word-root convergence",
                    value=f"All words share root {word_roots[0]} — coherent symbolic signature",
                    weight=0.75,
                ))
            else:
                root_list = ", ".join(str(r) for r in sorted(unique_roots))
                items.append(EvidenceItem(
                    feature="Word-root divergence",
                    value=f"Words carry mixed roots ({root_list}) — layered or ambiguous signature",
                    weight=0.45,
                ))

        # Hebrew letter correspondence for text root
        if text_root is not None and text_root in ROOT_LETTER:
            letter = ROOT_LETTER[text_root]
            items.append(EvidenceItem(
                feature="Hebrew letter",
                value=f"{letter} (root {text_root})",
                weight=0.50,
            ))

        # ── Upgrade 71: Root progression analysis ─────────────────
        progression = _root_progression(text_root, ordinal_root, bridge_root)
        if progression is not None:
            prog_labels = {
                "ascending": "Ascending root progression — momentum toward action",
                "descending": "Descending root progression — contraction signal toward caution",
                "stable": "Stable root progression — grounding signal",
            }
            items.append(EvidenceItem(
                feature="Root progression",
                value=prog_labels.get(progression, progression),
                weight=0.55,
            ))

        # ── Upgrade 72: Master number amplification ───────────────
        for root_val, root_label in [(text_root, "Text"), (bridge_root, "Bridge")]:
            if root_val is not None and root_val in MASTER_INTENSITY:
                intensity = MASTER_INTENSITY[root_val]
                master_theme = ROOT_THEME.get(root_val, "master vibration")
                # Check domain overlap
                master_domains = _MASTER_DOMAIN.get(root_val, set())
                domain_overlap = bool(master_domains & set(domains))
                desc = f"Master {root_val} ({master_theme}) — intensity ×{intensity}"
                if domain_overlap:
                    desc += " — domain resonance active"
                items.append(EvidenceItem(
                    feature=f"{root_label} master vibration",
                    value=desc,
                    weight=0.80,
                ))

        # ── Upgrade 73: Hebrew letter path depth ─────────────────
        if text_root is not None:
            reduced_text = _reduce_root(text_root) if text_root > 9 else text_root
            if reduced_text in LETTER_PATH_MEANING:
                path_desc = LETTER_PATH_MEANING[reduced_text]
                path_domains = _LETTER_PATH_DOMAIN.get(reduced_text, set())
                domain_match = bool(path_domains & set(domains))
                path_weight = 0.60 if domain_match else 0.35
                items.append(EvidenceItem(
                    feature="Hebrew letter path",
                    value=path_desc,
                    weight=path_weight,
                ))

        # ── Upgrade 74: Root threshold moment ─────────────────────
        if text_root is not None and current_gate is not None:
            reduced_text_r = _reduce_root(text_root) if text_root > 9 else text_root
            reduced_gate = _reduce_root(current_gate) if current_gate > 9 else current_gate
            if abs(reduced_text_r - reduced_gate) == 1:
                if reduced_text_r < reduced_gate:
                    threshold_desc = "Gate approaching — building energy toward threshold"
                else:
                    threshold_desc = "Gate receding — energy passing through threshold"
                items.append(EvidenceItem(
                    feature="Root threshold moment",
                    value=threshold_desc,
                    weight=0.50,
                ))

        # ── Upgrade 76: Compound root resonance ───────────────────
        if _check_compound_resonance(text_root, ordinal_root, bridge_root):
            items.append(EvidenceItem(
                feature="Compound root resonance",
                value=f"Text root {text_root} = (ordinal {ordinal_root} + bridge {bridge_root}) mod 9 — mathematical harmony",
                weight=0.75,
            ))

        # ── Upgrade 78: Temporal root shift ───────────────────────
        if bridge_root is not None and current_gate is not None:
            reduced_bridge = _reduce_root(bridge_root) if bridge_root > 9 else bridge_root
            reduced_gate_t = _reduce_root(current_gate) if current_gate > 9 else current_gate
            if reduced_bridge == reduced_gate_t:
                items.append(EvidenceItem(
                    feature="Temporal root shift",
                    value=f"Birth root {bridge_root} matches current gate {current_gate} — stable identity period",
                    weight=0.50,
                ))
            else:
                gate_theme = ROOT_THEME.get(current_gate, "transition")
                items.append(EvidenceItem(
                    feature="Temporal root shift",
                    value=f"Birth root {bridge_root} differs from gate {current_gate} — evolution period ({gate_theme})",
                    weight=0.50,
                ))

        # ── Upgrade 79: Letter frequency resonance ────────────────
        source_type_text = get_highlight_value(system_data, "source type") or ""
        name_text = get_highlight_value(system_data, "text total") or ""
        # Try to extract the analyzed name/text from source context
        freq_results = _letter_frequency_resonance(
            str(get_highlight_value(system_data, "text") or source_type_text or name_text)
        )
        for letter_name, count, pol in freq_results[:2]:  # Cap at 2 frequency items
            amp_pol = pol * 1.5
            direction = "amplifying action" if amp_pol > 0 else "amplifying restraint" if amp_pol < 0 else "neutral resonance"
            items.append(EvidenceItem(
                feature="Letter frequency resonance",
                value=f"{letter_name} appears {count}× — {direction}",
                weight=0.55,
            ))

        # ── Upgrade 80: Correspondence layer agreement ────────────
        agreement_count = _count_theme_agreement(corr_themes)
        if agreement_count >= 3:
            items.append(EvidenceItem(
                feature="Correspondence convergence",
                value=f"{agreement_count} layers share thematic keywords — strong symbolic agreement",
                weight=0.65,
            ))

        return items[:18]

    def _compute_stance(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
        evidence: list[EvidenceItem],
    ) -> dict[str, float]:
        options = intent.options or ["favorable", "cautious"]
        polarities = option_polarities(options)
        domains = intent.domain_tags or []

        action_score = 0.0
        total_weight = 0.0

        # ── Text root ─────────────────────────────────────────────
        text_root = _safe_int(get_highlight_value(system_data, "text root"))
        if text_root is not None and text_root in ROOT_POLARITY:
            # Domain-specific amplification: if this root's strongest domain
            # matches the question, increase its weight
            domain_strength = _root_domain_strength(text_root, domains)
            w = 1.5 + (domain_strength * 0.5)
            # Upgrade 77: Root domain intensity scaling — scale polarity by
            # domain strength rather than using flat polarity
            effective_polarity = ROOT_POLARITY[text_root]
            if domain_strength > 0:
                effective_polarity = ROOT_POLARITY[text_root] * domain_strength
            action_score += effective_polarity * w
            total_weight += w

        # ── Ordinal root — parallel layer, lower weight ────────────
        ordinal_root = _safe_int(get_highlight_value(system_data, "ordinal root"))
        if ordinal_root is not None and ordinal_root in ROOT_POLARITY:
            domain_strength = _root_domain_strength(ordinal_root, domains)
            w = 0.7 + (domain_strength * 0.3)
            # Upgrade 77: Root domain intensity scaling
            effective_ord_pol = ROOT_POLARITY[ordinal_root]
            if domain_strength > 0:
                effective_ord_pol = ROOT_POLARITY[ordinal_root] * domain_strength
            action_score += effective_ord_pol * w
            total_weight += w

        # ── Bridge root ───────────────────────────────────────────
        bridge_root = _safe_int(get_highlight_value(system_data, "bridge root"))
        if bridge_root is not None and bridge_root in ROOT_POLARITY:
            action_score += ROOT_POLARITY[bridge_root] * 1.0
            total_weight += 1.0

        # ── Current gate ──────────────────────────────────────────
        current_gate = _safe_int(get_highlight_value(system_data, "current gate"))
        if current_gate is not None and current_gate in ROOT_POLARITY:
            w = 1.5 if intent.time_horizon != "general" else 0.8
            action_score += ROOT_POLARITY[current_gate] * w
            total_weight += w

        # ── Alignment bonus ───────────────────────────────────────
        # When text root matches current gate, amplify confidence in direction
        if text_root is not None and current_gate is not None and text_root == current_gate:
            if action_score > 0:
                action_score += 0.3
            else:
                action_score -= 0.3
            total_weight += 0.5

        # ── Root pair harmony bonus/penalty ───────────────────────
        # text root ↔ current gate
        tr_cg_delta = _harmony_delta(text_root, current_gate)
        if tr_cg_delta != 0.0:
            # Harmony amplifies direction, dissonance creates drag
            if action_score > 0:
                action_score += tr_cg_delta * 0.4
            else:
                action_score -= tr_cg_delta * 0.4
            total_weight += 0.3

        # bridge root ↔ text root
        tr_br_delta = _harmony_delta(text_root, bridge_root)
        if tr_br_delta != 0.0:
            if action_score > 0:
                action_score += tr_br_delta * 0.2
            else:
                action_score -= tr_br_delta * 0.2
            total_weight += 0.2

        # ── Hebrew letter polarity (cross-reference) ──────────────
        if text_root is not None and text_root in ROOT_LETTER:
            letter = ROOT_LETTER[text_root]
            letter_pol = _LETTER_POLARITY.get(letter, 0.0)
            action_score += letter_pol * 0.4
            total_weight += 0.4

        # ── Word root convergence / divergence (Upgrade 75: positional weighting) ──
        word_roots = _extract_word_roots(system_data)
        if len(word_roots) >= 2:
            unique_roots = set(word_roots)
            if len(unique_roots) == 1:
                # All words agree on root — coherence boost in established direction
                # Upgrade 75: apply positional weighting to the convergence score
                pos_weights = _positional_word_weights(word_roots)
                avg_pos_w = sum(pw for _, pw in pos_weights) / len(pos_weights) if pos_weights else 1.0
                boost = 0.25 * avg_pos_w
                if action_score > 0:
                    action_score += boost
                else:
                    action_score -= boost
                total_weight += 0.4
            elif len(unique_roots) >= 3:
                # High divergence — widen uncertainty by pulling toward neutral
                # Upgrade 75: weight divergence by positional importance
                pos_weights = _positional_word_weights(word_roots)
                # Check if first word (strongest imprint) root differs from majority
                if pos_weights:
                    first_root = pos_weights[0][0]
                    first_w = pos_weights[0][1]
                    if first_root in ROOT_POLARITY:
                        action_score += ROOT_POLARITY[first_root] * 0.1 * first_w
                action_score *= 0.85
                total_weight += 0.3

        # ── Upgrade 71: Root progression stance signal ─────────────
        progression = _root_progression(text_root, ordinal_root, bridge_root)
        if progression == "ascending":
            action_score += 0.08
            total_weight += 0.3
        elif progression == "descending":
            action_score -= 0.06
            total_weight += 0.3
        elif progression == "stable":
            # Grounding — reinforce existing direction
            if action_score > 0:
                action_score += 0.04
            else:
                action_score -= 0.04
            total_weight += 0.2

        # ── Upgrade 72: Master number amplification in stance ──────
        for root_val in [text_root, bridge_root]:
            if root_val is not None and root_val in MASTER_INTENSITY:
                intensity = MASTER_INTENSITY[root_val]
                if root_val in ROOT_POLARITY:
                    # Amplify polarity weight by master intensity factor
                    master_pol = ROOT_POLARITY[root_val] * intensity
                    action_score += master_pol * 0.3
                    total_weight += 0.3
                # Domain overlap bonus
                master_domains = _MASTER_DOMAIN.get(root_val, set())
                if master_domains & set(domains):
                    action_score += 0.10
                    total_weight += 0.2

        # ── Upgrade 74: Root threshold moment stance signal ────────
        if text_root is not None and current_gate is not None:
            reduced_t = _reduce_root(text_root) if text_root > 9 else text_root
            reduced_g = _reduce_root(current_gate) if current_gate > 9 else current_gate
            if abs(reduced_t - reduced_g) == 1:
                if reduced_t < reduced_g:
                    # Gate approaching — building energy
                    action_score += 0.06
                else:
                    # Gate receding — energy passing
                    action_score -= 0.04
                total_weight += 0.3

        # ── Upgrade 76: Compound root resonance stance signal ──────
        if _check_compound_resonance(text_root, ordinal_root, bridge_root):
            # Mathematical harmony — boost leading direction
            if action_score > 0:
                action_score += 0.12
            else:
                action_score -= 0.12
            total_weight += 0.4

        # ── Upgrade 78: Temporal root shift stance signal ──────────
        if bridge_root is not None and current_gate is not None:
            reduced_br = _reduce_root(bridge_root) if bridge_root > 9 else bridge_root
            reduced_cg = _reduce_root(current_gate) if current_gate > 9 else current_gate
            if reduced_br == reduced_cg:
                # Stable identity period — boost leading option
                if action_score > 0:
                    action_score += 0.06
                else:
                    action_score -= 0.06
                total_weight += 0.3
            else:
                # Evolution/transition period — adjust based on gate polarity
                if current_gate in ROOT_POLARITY:
                    gate_pol = ROOT_POLARITY[current_gate]
                    action_score += gate_pol * 0.04
                    total_weight += 0.2

        # ── Upgrade 79: Letter frequency resonance stance signal ───
        source_text = str(get_highlight_value(system_data, "text") or
                         get_highlight_value(system_data, "source type") or "")
        freq_hits = _letter_frequency_resonance(source_text)
        for _letter_name, _count, pol in freq_hits[:2]:
            amplified_pol = pol * 1.5
            action_score += amplified_pol * 0.2
            total_weight += 0.2

        # ── Upgrade 80: Correspondence layer agreement stance signal ─
        corr_themes = _extract_root_corr_themes(system_data)
        agreement_count = _count_theme_agreement(corr_themes)
        if agreement_count >= 3:
            # Strong convergence — boost leading option
            if action_score > 0:
                action_score += 0.15
            else:
                action_score -= 0.15
            total_weight += 0.4

        raw = action_score / total_weight if total_weight > 0 else 0.0
        return polarity_to_stance(options, raw)

    def _compute_confidence(
        self,
        system_data: dict[str, Any],
        evidence: list[EvidenceItem],
        time_horizon: str = "general",
    ) -> float:
        """Gematria-specific confidence with upgrade bonuses."""
        base = super()._compute_confidence(system_data, evidence, time_horizon)

        text_root = _safe_int(get_highlight_value(system_data, "text root"))
        ordinal_root = _safe_int(get_highlight_value(system_data, "ordinal root"))
        bridge_root = _safe_int(get_highlight_value(system_data, "bridge root"))

        # Upgrade 71: Stable root progression → confidence +0.04
        progression = _root_progression(text_root, ordinal_root, bridge_root)
        if progression == "stable":
            base = min(base + 0.04, 1.0)

        # Upgrade 76: Compound root resonance → confidence +0.05
        if _check_compound_resonance(text_root, ordinal_root, bridge_root):
            base = min(base + 0.05, 1.0)

        return round(min(base, 1.0), 2)
