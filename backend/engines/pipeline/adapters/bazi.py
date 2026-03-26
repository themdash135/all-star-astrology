"""BaZi (Four Pillars) adapter — rich element-balance and Ten God logic.

Uses:
  - Day Master element and strength (strong/weak)
  - Element balance (Wood/Fire/Earth/Metal/Water percentages)
  - Favorable vs unfavorable elements → mapped to question options
  - Current day/hour pillar element → today's energy quality
  - Ten God relationships of current pillars (day, year, month)
  - Symbolic stars → polarity and domain influence
  - Branch interactions (combination/clash/harm/destruction)
  - Current luck period (Da Yun) ten god and element
  - Element productive/destructive cycle analysis
  - Na Yin (melody) of day pillar
  - Hidden stems (Cang Gan) extraction
  - Ten God interaction matrix
  - Natal vs current pillar clash detection
  - Seasonal strength modulation
  - Branch combination transformation

Element → action mapping:
  Fire  = action, intensity, drive      (+yang)
  Wood  = growth, initiative, movement  (+yang)
  Earth = stability, patience, grounding (neutral)
  Metal = discipline, structure, cutting (-yin)
  Water = rest, wisdom, flow            (-yin)
"""

from __future__ import annotations

from typing import Any

from ..schemas import ClassifiedIntent, EvidenceItem
from .base import (
    BaseAdapter,
    get_highlight_value,
    option_polarities,
)

# ── Element → action polarity ─────────────────────────────────────
# positive = action/yang, negative = rest/yin

ELEMENT_ACTION: dict[str, float] = {
    "Fire":  0.8,
    "Wood":  0.5,
    "Earth": 0.0,
    "Metal": -0.3,
    "Water": -0.7,
}

# ── Option text → BaZi element mapping ────────────────────────────
# Keywords in option text that map to elements

OPTION_ELEMENT_KEYWORDS: dict[str, str] = {
    # Rest / Water
    "sleep": "Water", "rest": "Water", "relax": "Water", "calm": "Water",
    "meditate": "Water", "home": "Water", "early": "Water", "withdraw": "Water",
    # Action / Fire
    "late": "Fire", "out": "Fire", "party": "Fire", "exercise": "Fire",
    "push": "Fire", "act": "Fire", "fight": "Fire", "compete": "Fire",
    # Growth / Wood
    "start": "Wood", "begin": "Wood", "launch": "Wood", "grow": "Wood",
    "new": "Wood", "create": "Wood", "build": "Wood",
    # Discipline / Metal
    "cut": "Metal", "discipline": "Metal", "structure": "Metal",
    "organize": "Metal", "quit": "Metal", "end": "Metal",
    # Stability / Earth
    "keep": "Earth", "maintain": "Earth", "stay": "Earth", "wait": "Earth",
    "steady": "Earth", "save": "Earth", "hold": "Earth",
}

# ── Ten God domain meanings ────────────────────────────────────────
# Each Ten God relationship has specific life-area associations and a
# general polarity (positive = favourable, negative = challenging).

TEN_GOD_DOMAIN: dict[str, dict] = {
    "Direct Wealth":   {"domains": {"wealth": 0.9, "love": 0.6, "career": 0.5},  "polarity": 0.3},
    "Indirect Wealth": {"domains": {"wealth": 0.8, "career": 0.6, "love": 0.4},  "polarity": 0.5},
    "Direct Officer":  {"domains": {"career": 0.9, "health": 0.4},               "polarity": -0.2},
    "Indirect Officer":{"domains": {"career": 0.8, "mood": 0.5, "health": 0.4},  "polarity": -0.4},
    "Rob Wealth":      {"domains": {"love": 0.6, "wealth": 0.5, "career": 0.4},  "polarity": 0.6},
    "Friend":          {"domains": {"love": 0.5, "mood": 0.6, "career": 0.4},    "polarity": 0.3},
    "Hurting Officer": {"domains": {"mood": 0.7, "love": 0.6, "career": 0.4},    "polarity": 0.5},
    "Eating God":      {"domains": {"health": 0.7, "mood": 0.6, "love": 0.5},    "polarity": 0.2},
    "Direct Resource": {"domains": {"mood": 0.7, "health": 0.6, "career": 0.5},  "polarity": -0.3},
    "Indirect Resource":{"domains": {"mood": 0.8, "career": 0.5, "health": 0.4}, "polarity": -0.5},
}

# ── Symbolic star effects ──────────────────────────────────────────

SYMBOLIC_STAR_EFFECT: dict[str, dict] = {
    "Nobleman Star":   {"polarity": 0.5,  "domains": {"career": 0.8, "mood": 0.6},  "meaning": "powerful helpers appear"},
    "Peach Blossom":   {"polarity": 0.3,  "domains": {"love": 0.9, "mood": 0.6},    "meaning": "romance and social charm activated"},
    "Academic Star":   {"polarity": 0.2,  "domains": {"career": 0.7, "mood": 0.5},  "meaning": "learning and intellectual growth favored"},
    "Traveling Horse": {"polarity": 0.6,  "domains": {"career": 0.7, "mood": 0.5},  "meaning": "movement, travel, and change"},
    "Sky Happiness":   {"polarity": 0.4,  "domains": {"love": 0.7, "mood": 0.8},    "meaning": "celebrations and joyful events"},
    "Lonely Star":     {"polarity": -0.5, "domains": {"love": 0.7, "mood": 0.8},    "meaning": "solitude and independence emphasized"},
    "Void Star":       {"polarity": -0.4, "domains": {"mood": 0.7, "health": 0.5},  "meaning": "spiritual seeking, material emptiness"},
    "Disaster Star":   {"polarity": -0.6, "domains": {"health": 0.8, "mood": 0.6},  "meaning": "caution with health and safety"},
    "Fortune Star":    {"polarity": 0.5,  "domains": {"wealth": 0.8, "career": 0.6},"meaning": "lucky financial breaks"},
    "Authority Star":  {"polarity": 0.2,  "domains": {"career": 0.9, "mood": 0.4},  "meaning": "leadership and official power"},
}

# ── Branch interaction effects ─────────────────────────────────────

BRANCH_INTERACTION_EFFECT: dict[str, dict] = {
    "combination":  {"polarity": 0.4,  "meaning": "harmony and union"},
    "clash":        {"polarity": -0.5, "meaning": "conflict and disruption"},
    "harm":         {"polarity": -0.3, "meaning": "hidden damage and betrayal"},
    "destruction":  {"polarity": -0.4, "meaning": "dissolution and loss"},
}

# ── Element productive / destructive cycle ────────────────────────

ELEMENT_PRODUCES: dict[str, str] = {
    "Wood": "Fire", "Fire": "Earth", "Earth": "Metal",
    "Metal": "Water", "Water": "Wood",
}
ELEMENT_DESTROYS: dict[str, str] = {
    "Wood": "Earth", "Earth": "Water", "Water": "Fire",
    "Fire": "Metal", "Metal": "Wood",
}

# ── Na Yin category → element extraction ─────────────────────────
# The Na Yin string always starts with the element name, e.g.
# "Metal in the Sea" → Metal, "Fire of the Sky" → Fire, etc.

def _na_yin_element(na_yin: str) -> str | None:
    """Extract the base element from a Na Yin label."""
    for elem in ("Wood", "Fire", "Earth", "Metal", "Water"):
        if na_yin.startswith(elem):
            return elem
    return None


def _option_element(option_text: str) -> str | None:
    """Determine the primary element an option maps to."""
    words = option_text.lower().split()
    for word in words:
        if word in OPTION_ELEMENT_KEYWORDS:
            return OPTION_ELEMENT_KEYWORDS[word]
    return None


# ── Upgrade 31: Hidden Stems (Cang Gan) ─────────────────────────
# Earthly Branches contain hidden Heavenly Stems (main, middle, residual).

HIDDEN_STEMS: dict[str, list[str]] = {
    "Zi": ["Gui"],                     # Rat: Water
    "Chou": ["Ji", "Gui", "Xin"],     # Ox: Earth, Water, Metal
    "Yin": ["Jia", "Bing", "Wu"],     # Tiger: Wood, Fire, Earth
    "Mao": ["Yi"],                     # Rabbit: Wood
    "Chen": ["Wu", "Yi", "Gui"],      # Dragon: Earth, Wood, Water
    "Si": ["Bing", "Wu", "Geng"],     # Snake: Fire, Earth, Metal
    "Wu": ["Ding", "Ji"],             # Horse: Fire, Earth
    "Wei": ["Ji", "Ding", "Yi"],      # Goat: Earth, Fire, Wood
    "Shen": ["Geng", "Ren", "Wu"],   # Monkey: Metal, Water, Earth
    "You": ["Xin"],                    # Rooster: Metal
    "Xu": ["Wu", "Xin", "Ding"],     # Dog: Earth, Metal, Fire
    "Hai": ["Ren", "Jia"],           # Pig: Water, Wood
}

STEM_ELEMENT: dict[str, str] = {
    "Jia": "Wood", "Yi": "Wood", "Bing": "Fire", "Ding": "Fire",
    "Wu": "Earth", "Ji": "Earth", "Geng": "Metal", "Xin": "Metal",
    "Ren": "Water", "Gui": "Water",
}

# ── Upgrade 32: Day Master strength amplification ────────────────
# Proportional amplification based on DM strength + element pairing.

DM_STRENGTH_AMPLIFIER: dict[tuple[bool, str], float] = {
    (True, "Fire"): 0.15, (True, "Wood"): 0.12, (True, "Earth"): 0.06,
    (True, "Metal"): 0.04, (True, "Water"): 0.03,
    (False, "Water"): 0.12, (False, "Metal"): 0.10, (False, "Earth"): 0.06,
    (False, "Fire"): 0.03, (False, "Wood"): 0.04,
}

# ── Upgrade 33: Ten God interaction matrix ───────────────────────
# Compound effects when two Ten Gods appear together in current pillars.

TEN_GOD_INTERACTION: dict[frozenset, dict] = {
    frozenset({"Direct Wealth", "Rob Wealth"}): {"polarity": -0.15, "meaning": "wealth competition"},
    frozenset({"Direct Officer", "Hurting Officer"}): {"polarity": -0.20, "meaning": "authority conflict"},
    frozenset({"Direct Wealth", "Direct Resource"}): {"polarity": 0.10, "meaning": "wealth through knowledge"},
    frozenset({"Eating God", "Direct Wealth"}): {"polarity": 0.15, "meaning": "talent creates wealth"},
    frozenset({"Friend", "Direct Wealth"}): {"polarity": 0.08, "meaning": "peer support for gains"},
    frozenset({"Indirect Officer", "Direct Resource"}): {"polarity": -0.10, "meaning": "pressure with support"},
    frozenset({"Rob Wealth", "Hurting Officer"}): {"polarity": 0.12, "meaning": "competitive creativity"},
    frozenset({"Direct Officer", "Direct Resource"}): {"polarity": 0.05, "meaning": "structured growth"},
}

# ── Upgrade 34: Natal vs current pillar clash detection ──────────

BRANCH_CLASHES: set[frozenset] = {
    frozenset({"Zi", "Wu"}), frozenset({"Chou", "Wei"}),
    frozenset({"Yin", "Shen"}), frozenset({"Mao", "You"}),
    frozenset({"Chen", "Xu"}), frozenset({"Si", "Hai"}),
}

# ── Upgrade 35: Seasonal strength modulation ─────────────────────

SEASON_STRENGTH: dict[str, dict[str, float]] = {
    "Wood":  {"spring": 0.15, "summer": 0.05, "autumn": -0.10, "winter": 0.08},
    "Fire":  {"spring": 0.08, "summer": 0.15, "autumn": -0.05, "winter": -0.12},
    "Earth": {"spring": -0.05, "summer": 0.08, "autumn": 0.05, "winter": -0.05},
    "Metal": {"spring": -0.10, "summer": -0.08, "autumn": 0.15, "winter": 0.05},
    "Water": {"spring": 0.05, "summer": -0.12, "autumn": 0.08, "winter": 0.15},
}

BRANCH_TO_SEASON: dict[str, str] = {
    "Yin": "spring", "Mao": "spring",
    "Si": "summer", "Wu": "summer",
    "Shen": "autumn", "You": "autumn",
    "Hai": "winter", "Zi": "winter",
    # Transitional months map to the preceding season
    "Chou": "winter", "Chen": "spring",
    "Wei": "summer", "Xu": "autumn",
}

# ── Upgrade 40: Branch combination transformation ────────────────

BRANCH_COMBINATION_RESULT: dict[frozenset, str] = {
    frozenset({"Zi", "Chou"}): "Earth",
    frozenset({"Yin", "Hai"}): "Wood",
    frozenset({"Mao", "Xu"}): "Fire",
    frozenset({"Chen", "You"}): "Metal",
    frozenset({"Si", "Shen"}): "Water",
    frozenset({"Wu", "Wei"}): "Fire",
}


class BaZiAdapter(BaseAdapter):
    system_id = "bazi"
    system_name = "BaZi (Four Pillars)"
    confidence_scale = 1.0

    def _extract_evidence(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
    ) -> list[EvidenceItem]:
        items: list[EvidenceItem] = []

        # ── Core natal highlights ─────────────────────────────────

        # Day Master
        dm_val = get_highlight_value(system_data, "day master")
        if dm_val:
            items.append(EvidenceItem(feature="Day Master", value=dm_val, weight=0.9))

        # Day Master strength
        strength_val = get_highlight_value(system_data, "strength")
        if strength_val:
            items.append(EvidenceItem(feature="Day Master strength", value=strength_val, weight=0.85))

        # Favorable elements
        fav_val = get_highlight_value(system_data, "favorable elements")
        if fav_val:
            items.append(EvidenceItem(feature="Favorable elements", value=fav_val, weight=0.9))

        # Unfavorable elements
        unfav_val = get_highlight_value(system_data, "unfavorable elements")
        if unfav_val:
            items.append(EvidenceItem(feature="Unfavorable elements", value=unfav_val, weight=0.8))

        # Dominant element
        dom_val = get_highlight_value(system_data, "dominant element")
        if dom_val:
            items.append(EvidenceItem(feature="Dominant element", value=dom_val, weight=0.6))

        # Weakest element
        weak_val = get_highlight_value(system_data, "weakest element")
        if weak_val:
            items.append(EvidenceItem(feature="Weakest element", value=weak_val, weight=0.5))

        # ── Element balance percentages ───────────────────────────

        balance = system_data.get("element_balance", {})
        percentages = balance.get("percentages", {})
        if percentages:
            pct_parts = [f"{elem} {pct}%" for elem, pct in percentages.items() if pct > 0]
            if pct_parts:
                items.append(EvidenceItem(
                    feature="Element balance",
                    value=", ".join(pct_parts),
                    weight=0.65,
                ))

        # ── Current day pillar (enriched) ─────────────────────────

        current_pillars = system_data.get("current_pillars", {})
        day_pillar = current_pillars.get("day", {})
        if day_pillar:
            elem = day_pillar.get("stem_element", "")
            name = day_pillar.get("name", "")
            ten_god = day_pillar.get("ten_god", "")
            na_yin = day_pillar.get("na_yin", "")
            tg_info = TEN_GOD_DOMAIN.get(ten_god, {})
            tg_domains = tg_info.get("domains", {})
            # Build a rich label: element, ten god, and any matching domains
            domain_hint = ""
            if tg_domains and intent.domain_tags:
                matched = [d for d in intent.domain_tags if d in tg_domains]
                if matched:
                    domain_hint = f", {matched[0]} influence {tg_domains[matched[0]]:.0%}"
            if elem:
                items.append(EvidenceItem(
                    feature="Current day pillar",
                    value=f"{name} ({elem}, {ten_god}{domain_hint})",
                    weight=0.8 if intent.time_horizon in ("today", "tomorrow") else 0.5,
                ))
            # Na Yin of the current day pillar
            if na_yin:
                items.append(EvidenceItem(
                    feature="Day pillar Na Yin",
                    value=na_yin,
                    weight=0.55 if intent.time_horizon in ("today", "tomorrow") else 0.35,
                ))

        # ── Year and month pillar ten gods (career/love context) ──

        year_pillar = current_pillars.get("year", {})
        if year_pillar:
            tg = year_pillar.get("ten_god", "")
            elem = year_pillar.get("stem_element", "")
            name = year_pillar.get("name", "")
            if tg or elem:
                items.append(EvidenceItem(
                    feature="Current year pillar",
                    value=f"{name} ({elem}, {tg})" if tg else f"{name} ({elem})",
                    weight=0.45,
                ))

        month_pillar = current_pillars.get("month", {})
        if month_pillar:
            tg = month_pillar.get("ten_god", "")
            elem = month_pillar.get("stem_element", "")
            name = month_pillar.get("name", "")
            if tg or elem:
                items.append(EvidenceItem(
                    feature="Current month pillar",
                    value=f"{name} ({elem}, {tg})" if tg else f"{name} ({elem})",
                    weight=0.55,
                ))

        # ── Current hour pillar (especially for "tonight") ────────

        hour_pillar = current_pillars.get("hour", {})
        if hour_pillar and intent.time_horizon in ("today", "tomorrow"):
            elem = hour_pillar.get("stem_element", "")
            if elem:
                items.append(EvidenceItem(
                    feature="Current hour pillar",
                    value=f"{hour_pillar.get('name', '')} ({elem})",
                    weight=0.65,
                ))

        # ── Symbolic stars ────────────────────────────────────────

        symbolic_stars = system_data.get("symbolic_stars", [])
        for star in symbolic_stars:
            star_name = star.get("name", "")
            found_in = star.get("found_in", "")
            effect = SYMBOLIC_STAR_EFFECT.get(star_name)
            if effect:
                is_positive = star.get("positive", True)
                polarity_label = "active" if is_positive else "challenging"
                items.append(EvidenceItem(
                    feature=f"Symbolic star: {star_name}",
                    value=f"{effect['meaning']} (found in {found_in} pillar, {polarity_label})",
                    weight=0.7 if is_positive else 0.65,
                ))

        # ── Branch interactions ───────────────────────────────────

        branch_interactions = system_data.get("branch_interactions", [])
        for interaction in branch_interactions:
            itype = interaction.get("type", "")
            label = interaction.get("label", itype.title())
            pillars = interaction.get("pillars", "")
            branches = interaction.get("branches", "")
            effect = BRANCH_INTERACTION_EFFECT.get(itype)
            if effect:
                is_positive = interaction.get("positive", itype == "combination")
                items.append(EvidenceItem(
                    feature=f"Branch {label}: {pillars}",
                    value=f"{branches} — {effect['meaning']}",
                    weight=0.6 if is_positive else 0.65,
                ))

        # ── Current luck period (Da Yun) ──────────────────────────

        current_luck = system_data.get("current_luck_period")
        if current_luck:
            lp_tg = current_luck.get("ten_god", "")
            lp_elem = current_luck.get("stem_element", "")
            lp_animal = current_luck.get("animal", "")
            start_age = current_luck.get("start_age", "?")
            end_age = current_luck.get("end_age", "?")
            lp_label_parts = [p for p in [lp_elem, lp_animal] if p]
            lp_label = " / ".join(lp_label_parts) if lp_label_parts else "unknown"
            items.append(EvidenceItem(
                feature="Current luck period (Da Yun)",
                value=f"{lp_label}, Ten God: {lp_tg} (age {start_age}–{end_age})",
                weight=0.75,
            ))

        # ── Upgrade 31: Hidden Stems (Cang Gan) evidence ─────────
        # Extract hidden stems from the day pillar's branch and note
        # any that match favorable elements.
        strength_data = system_data.get("day_master_strength", {})
        favorable = set(strength_data.get("favorable", []))
        unfavorable = set(strength_data.get("unfavorable", []))

        day_branch = day_pillar.get("branch", "") if day_pillar else ""
        if day_branch:
            hidden = HIDDEN_STEMS.get(day_branch, [])
            for stem in hidden:
                stem_elem = STEM_ELEMENT.get(stem, "")
                if stem_elem and stem_elem in favorable:
                    items.append(EvidenceItem(
                        feature="Hidden stem (Cang Gan)",
                        value=f"{stem} ({stem_elem}) in Day branch supports favorable element",
                        weight=0.6,
                    ))
                elif stem_elem and stem_elem in unfavorable:
                    items.append(EvidenceItem(
                        feature="Hidden stem (Cang Gan)",
                        value=f"{stem} ({stem_elem}) in Day branch carries unfavorable element",
                        weight=0.55,
                    ))

        # ── Upgrade 33: Ten God interaction evidence ─────────────
        # Detect compound effects from Ten God pairs across pillars.
        pillar_ten_gods: list[str] = []
        for pkey in ("day", "month", "year"):
            p = current_pillars.get(pkey, {})
            tg = p.get("ten_god", "")
            if tg:
                pillar_ten_gods.append(tg)

        if len(pillar_ten_gods) >= 2:
            seen_pairs: set[frozenset] = set()
            for i in range(len(pillar_ten_gods)):
                for j in range(i + 1, len(pillar_ten_gods)):
                    pair = frozenset({pillar_ten_gods[i], pillar_ten_gods[j]})
                    if pair in seen_pairs:
                        continue
                    seen_pairs.add(pair)
                    interaction_info = TEN_GOD_INTERACTION.get(pair)
                    if interaction_info:
                        pol_label = "favorable" if interaction_info["polarity"] > 0 else "challenging"
                        items.append(EvidenceItem(
                            feature="Ten God interaction",
                            value=f"{' + '.join(sorted(pair))}: {interaction_info['meaning']} ({pol_label})",
                            weight=0.7,
                        ))

        # ── Upgrade 34: Natal vs current pillar clash evidence ───
        natal_pillars = system_data.get("natal_pillars", {})
        natal_day_branch = natal_pillars.get("day", {}).get("branch", "") if natal_pillars else ""
        if natal_day_branch:
            for pkey in ("day", "month", "year"):
                current_branch = current_pillars.get(pkey, {}).get("branch", "")
                if current_branch and frozenset({natal_day_branch, current_branch}) in BRANCH_CLASHES:
                    items.append(EvidenceItem(
                        feature=f"Natal-current clash ({pkey})",
                        value=f"Natal Day {natal_day_branch} clashes with current {pkey.title()} {current_branch} — caution advised",
                        weight=0.75,
                    ))

        # ── Upgrade 36: Na Yin cycle compatibility evidence ──────
        dm_element = strength_data.get("day_master_element", "")
        day_na_yin = day_pillar.get("na_yin", "") if day_pillar else ""
        if day_na_yin and dm_element:
            na_yin_elem = _na_yin_element(day_na_yin)
            if na_yin_elem:
                if ELEMENT_PRODUCES.get(na_yin_elem) == dm_element:
                    items.append(EvidenceItem(
                        feature="Na Yin cycle",
                        value=f"{day_na_yin} ({na_yin_elem}) produces Day Master {dm_element} — supportive",
                        weight=0.55,
                    ))
                elif ELEMENT_DESTROYS.get(na_yin_elem) == dm_element:
                    items.append(EvidenceItem(
                        feature="Na Yin cycle",
                        value=f"{day_na_yin} ({na_yin_elem}) destroys Day Master {dm_element} — draining",
                        weight=0.55,
                    ))
                elif na_yin_elem == dm_element:
                    items.append(EvidenceItem(
                        feature="Na Yin cycle",
                        value=f"{day_na_yin} ({na_yin_elem}) matches Day Master {dm_element} — reinforcing",
                        weight=0.5,
                    ))

        # ── Upgrade 38: Element balance extreme evidence ─────────
        if percentages:
            for elem_name, pct in percentages.items():
                if pct > 40:
                    items.append(EvidenceItem(
                        feature="Element extreme",
                        value=f"{elem_name} dominates at {pct}%",
                        weight=0.6,
                    ))
                elif pct == 0:
                    items.append(EvidenceItem(
                        feature="Element extreme",
                        value=f"{elem_name} completely absent",
                        weight=0.55,
                    ))

        # ── Upgrade 40: Branch combination transformation evidence
        for interaction in branch_interactions:
            itype = interaction.get("type", "")
            if itype == "combination":
                branches_str = interaction.get("branches", "")
                # Parse branches from the interaction data
                branch_parts = [b.strip() for b in branches_str.split("-")] if branches_str else []
                if len(branch_parts) == 2:
                    combo_key = frozenset(set(branch_parts))
                    result_elem = BRANCH_COMBINATION_RESULT.get(combo_key)
                    if result_elem:
                        items.append(EvidenceItem(
                            feature="Branch combination transform",
                            value=f"{branches_str} combines into {result_elem}",
                            weight=0.6,
                        ))

        return items[:20]

    def _compute_stance(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
        evidence: list[EvidenceItem],
    ) -> dict[str, float]:
        options = intent.options or ["favorable", "cautious"]

        # Get favorable/unfavorable elements
        strength_data = system_data.get("day_master_strength", {})
        favorable = set(strength_data.get("favorable", []))
        unfavorable = set(strength_data.get("unfavorable", []))
        is_strong = strength_data.get("strong", True)
        dm_element = strength_data.get("day_master_element", "")

        # Get current pillars
        current_pillars = system_data.get("current_pillars", {})
        day_elem = current_pillars.get("day", {}).get("stem_element", "")
        hour_elem = current_pillars.get("hour", {}).get("stem_element", "")
        day_ten_god = current_pillars.get("day", {}).get("ten_god", "")
        day_na_yin = current_pillars.get("day", {}).get("na_yin", "")

        # Element balance percentages
        balance = system_data.get("element_balance", {})
        percentages = balance.get("percentages", {})

        # Symbolic stars
        symbolic_stars = system_data.get("symbolic_stars", [])

        # Branch interactions
        branch_interactions = system_data.get("branch_interactions", [])

        # Current luck period
        current_luck = system_data.get("current_luck_period") or {}
        luck_elem = current_luck.get("stem_element", "")
        luck_ten_god = current_luck.get("ten_god", "")

        # Domain tags from question
        domain_tags = set(intent.domain_tags or [])

        # ── Upgrade 35: Determine current season from month branch ─
        month_branch = current_pillars.get("month", {}).get("branch", "")
        current_season = BRANCH_TO_SEASON.get(month_branch, "")

        # ── Collect pillar ten gods for interaction checks ─────────
        pillar_ten_gods: list[str] = []
        for pkey in ("day", "month", "year"):
            p = current_pillars.get(pkey, {})
            tg = p.get("ten_god", "")
            if tg:
                pillar_ten_gods.append(tg)

        # ── Score each option ──────────────────────────────────────
        option_scores: dict[str, float] = {}
        for opt in options:
            score = 0.5  # start neutral
            opt_elem = _option_element(opt)

            # ── 1. Favorable / unfavorable element alignment ──────
            if opt_elem:
                if opt_elem in favorable:
                    score += 0.20
                elif opt_elem in unfavorable:
                    score -= 0.20

                # Does today's day element support this option's element?
                if day_elem:
                    day_action = ELEMENT_ACTION.get(day_elem, 0)
                    opt_action = ELEMENT_ACTION.get(opt_elem, 0)
                    alignment = 1 - abs(day_action - opt_action) / 2
                    score += (alignment - 0.5) * 0.15

                # Does the hour element support it?
                if hour_elem and intent.time_horizon in ("today", "tomorrow"):
                    hour_action = ELEMENT_ACTION.get(hour_elem, 0)
                    opt_action = ELEMENT_ACTION.get(opt_elem, 0)
                    alignment = 1 - abs(hour_action - opt_action) / 2
                    score += (alignment - 0.5) * 0.10

            # ── 2. Day Master strength logic (Upgrade 32: proportional) ──
            polarity = option_polarities(options)
            opt_pol = polarity.get(opt, 0)

            # Upgrade 32: Replace simple +0.08 with proportional amplifier
            dm_amp_key = (is_strong, dm_element)
            dm_amp_val = DM_STRENGTH_AMPLIFIER.get(dm_amp_key, 0.0)
            if dm_amp_val > 0:
                if is_strong and opt_pol > 0:
                    # Strong DM amplifies action options
                    score += dm_amp_val
                elif is_strong and opt_pol <= 0:
                    pass  # strong DM does not penalise rest, just no boost
                elif not is_strong and opt_pol < 0:
                    # Weak DM amplifies rest options
                    score += dm_amp_val
                elif not is_strong and opt_pol >= 0:
                    pass  # weak DM does not penalise action, just no boost

            # ── 3. Ten God domain-specific scoring (current day) ──
            if day_ten_god and domain_tags:
                tg_info = TEN_GOD_DOMAIN.get(day_ten_god, {})
                tg_domains = tg_info.get("domains", {})
                tg_polarity = tg_info.get("polarity", 0.0)
                # Sum domain relevance for this question
                domain_relevance = sum(
                    tg_domains.get(d, 0.0) for d in domain_tags
                ) / max(len(domain_tags), 1)
                if domain_relevance > 0:
                    # Positive ten god polarity → favours action/active option
                    # Negative ten god polarity → favours rest/cautious option
                    pol_contribution = tg_polarity * domain_relevance * 0.12
                    if opt_pol >= 0:
                        score += pol_contribution
                    else:
                        score -= pol_contribution

            # ── 4. Ten God of current luck period ─────────────────
            if luck_ten_god and domain_tags:
                lp_tg_info = TEN_GOD_DOMAIN.get(luck_ten_god, {})
                lp_domains = lp_tg_info.get("domains", {})
                lp_polarity = lp_tg_info.get("polarity", 0.0)
                lp_relevance = sum(
                    lp_domains.get(d, 0.0) for d in domain_tags
                ) / max(len(domain_tags), 1)
                if lp_relevance > 0:
                    lp_contribution = lp_polarity * lp_relevance * 0.10
                    if opt_pol >= 0:
                        score += lp_contribution
                    else:
                        score -= lp_contribution

            # ── 5. Element cycle analysis ─────────────────────────
            # Does the current day element produce or destroy the Day Master?
            if day_elem and dm_element:
                if ELEMENT_PRODUCES.get(day_elem) == dm_element:
                    # Day feeds Day Master → supportive day → slight action lean
                    score += 0.05 if opt_pol >= 0 else -0.03
                elif ELEMENT_DESTROYS.get(day_elem) == dm_element:
                    # Day attacks Day Master → draining day → cautious lean
                    score -= 0.05 if opt_pol >= 0 else -0.03
                elif ELEMENT_DESTROYS.get(dm_element) == day_elem:
                    # Day Master controls day element → powerful day for DM
                    score += 0.04 if opt_pol >= 0 else -0.02

            # Does the luck period element support the day master?
            if luck_elem and dm_element:
                if ELEMENT_PRODUCES.get(luck_elem) == dm_element:
                    score += 0.04 if opt_pol >= 0 else -0.02
                elif ELEMENT_DESTROYS.get(luck_elem) == dm_element:
                    score -= 0.04 if opt_pol >= 0 else -0.02

            # ── 6. Na Yin element influence ───────────────────────
            if day_na_yin:
                na_yin_elem = _na_yin_element(day_na_yin)
                if na_yin_elem:
                    na_action = ELEMENT_ACTION.get(na_yin_elem, 0.0)
                    if opt_pol >= 0:
                        # Active option aligns with yang Na Yin elements
                        score += na_action * 0.05
                    else:
                        # Rest option aligns with yin Na Yin elements
                        score -= na_action * 0.05

            # ── 7. Symbolic star polarity (domain-weighted) ───────
            for star in symbolic_stars:
                star_name = star.get("name", "")
                effect = SYMBOLIC_STAR_EFFECT.get(star_name)
                if not effect:
                    continue
                star_polarity = effect["polarity"]
                star_domains = effect.get("domains", {})
                # Check whether this star's domains overlap the question
                domain_weight = sum(
                    star_domains.get(d, 0.0) for d in domain_tags
                ) / max(len(domain_tags), 1)
                if domain_weight > 0:
                    contribution = star_polarity * domain_weight * 0.08
                    if opt_pol >= 0:
                        score += contribution
                    else:
                        score -= contribution

            # ── 8. Branch interaction polarity ────────────────────
            for interaction in branch_interactions:
                itype = interaction.get("type", "")
                effect = BRANCH_INTERACTION_EFFECT.get(itype)
                if not effect:
                    continue
                bi_polarity = effect["polarity"]
                # Interactions involving the Day pillar are more relevant
                pillars_str = interaction.get("pillars", "")
                weight_mult = 0.10 if "Day" in pillars_str else 0.06
                contribution = bi_polarity * weight_mult
                if opt_pol >= 0:
                    score += contribution
                else:
                    score -= contribution

            # ── 9. Element balance: strong vs deficient mapping ───
            if percentages and domain_tags and opt_elem:
                opt_elem_pct = percentages.get(opt_elem, 0)
                # Option's element above 30% = plentiful; below 10% = scarce
                if opt_elem_pct > 30 and opt_elem in favorable:
                    score += 0.05
                elif opt_elem_pct < 10 and opt_elem in unfavorable:
                    score -= 0.04

            # ── Upgrade 31: Hidden Stems stance modifier ─────────
            # Count hidden stems across current pillars that match
            # favorable vs unfavorable elements.
            hidden_fav_count = 0
            hidden_unfav_count = 0
            for pkey in ("day", "month", "year", "hour"):
                p_branch = current_pillars.get(pkey, {}).get("branch", "")
                if p_branch:
                    for stem in HIDDEN_STEMS.get(p_branch, []):
                        stem_elem = STEM_ELEMENT.get(stem, "")
                        if stem_elem in favorable:
                            hidden_fav_count += 1
                        elif stem_elem in unfavorable:
                            hidden_unfav_count += 1
            hidden_net = (hidden_fav_count - hidden_unfav_count) * 0.06
            if opt_pol >= 0:
                score += hidden_net
            else:
                score -= hidden_net

            # ── Upgrade 34: Natal vs current pillar clash penalty ─
            natal_pillars = system_data.get("natal_pillars", {})
            natal_day_branch = natal_pillars.get("day", {}).get("branch", "") if natal_pillars else ""
            if natal_day_branch:
                current_day_branch = current_pillars.get("day", {}).get("branch", "")
                if current_day_branch and frozenset({natal_day_branch, current_day_branch}) in BRANCH_CLASHES:
                    # Natal-current day clash → penalise action options
                    if opt_pol > 0:
                        score -= 0.12
                    elif opt_pol < 0:
                        score += 0.06  # cautious option gets a mild boost

            # ── Upgrade 35: Seasonal strength modulation ──────────
            if dm_element and current_season:
                seasonal_mod = SEASON_STRENGTH.get(dm_element, {}).get(current_season, 0.0)
                if opt_pol >= 0:
                    score += seasonal_mod
                else:
                    score -= seasonal_mod

            # ── Upgrade 36: Na Yin cycle compatibility stance ─────
            if day_na_yin and dm_element:
                na_yin_elem_cycle = _na_yin_element(day_na_yin)
                if na_yin_elem_cycle:
                    if ELEMENT_PRODUCES.get(na_yin_elem_cycle) == dm_element:
                        # Na Yin produces DM → action boost
                        if opt_pol >= 0:
                            score += 0.06
                    elif ELEMENT_DESTROYS.get(na_yin_elem_cycle) == dm_element:
                        # Na Yin destroys DM → caution
                        if opt_pol >= 0:
                            score -= 0.06
                        else:
                            score += 0.03
                    elif na_yin_elem_cycle == dm_element:
                        # Same element → mild reinforcement
                        if opt_pol >= 0:
                            score += 0.04

            # ── Upgrade 38: Element balance extremes ──────────────
            if percentages and opt_elem:
                for elem_name, pct in percentages.items():
                    if pct > 40 and elem_name == opt_elem:
                        # Overwhelming presence supports that direction
                        score += 0.10
                    elif pct == 0 and elem_name == opt_elem:
                        # Complete absence works against it
                        score -= 0.08

            option_scores[opt] = max(0.1, min(0.9, score))

        # ── Upgrade 3: Domain-specific amplification ─────────────
        # When BaZi placements strongly match the domain, push the
        # leading option further from 0.5.
        amp = 0.0

        # Strong Day Master + Fire/Wood + career/health → amplify action option
        if is_strong and dm_element in ("Fire", "Wood") and domain_tags & {"career", "health"}:
            amp += 0.08
        elif not is_strong and dm_element in ("Water", "Metal") and domain_tags & {"mood", "love"}:
            amp += 0.06

        # Peach Blossom star + love question → strong boost
        for star in symbolic_stars:
            star_name = star.get("name", "")
            if star_name == "Peach Blossom" and "love" in domain_tags:
                amp += 0.12
            elif star_name == "Nobleman Star" and "career" in domain_tags:
                amp += 0.10
            elif star_name == "Fortune Star" and "wealth" in domain_tags:
                amp += 0.10
            elif star_name == "Disaster Star" and "health" in domain_tags:
                amp -= 0.12
            elif star_name == "Lonely Star" and "love" in domain_tags:
                amp -= 0.10

        # Day Master element is favorable + current day element supports
        if day_elem and day_elem in favorable:
            amp += 0.06
        elif day_elem and day_elem in unfavorable:
            amp -= 0.06

        if amp != 0.0:
            # Apply amplification to the leading option
            lead_opt = max(option_scores, key=option_scores.get)
            trail_opt = min(option_scores, key=option_scores.get)
            option_scores[lead_opt] = max(0.1, min(0.9, option_scores[lead_opt] + amp))
            option_scores[trail_opt] = max(0.1, min(0.9, option_scores[trail_opt] - amp))

        # ── Upgrade 33: Ten God interaction matrix stance ─────────
        # Check all pairs of pillar ten gods against the interaction
        # matrix and apply the polarity as a stance modifier.
        if len(pillar_ten_gods) >= 2:
            seen_pairs: set[frozenset] = set()
            for i in range(len(pillar_ten_gods)):
                for j in range(i + 1, len(pillar_ten_gods)):
                    pair = frozenset({pillar_ten_gods[i], pillar_ten_gods[j]})
                    if pair in seen_pairs:
                        continue
                    seen_pairs.add(pair)
                    interaction_info = TEN_GOD_INTERACTION.get(pair)
                    if interaction_info:
                        tg_int_pol = interaction_info["polarity"]
                        lead_opt = max(option_scores, key=option_scores.get)
                        trail_opt = min(option_scores, key=option_scores.get)
                        if tg_int_pol > 0:
                            option_scores[lead_opt] = max(0.1, min(0.9, option_scores[lead_opt] + tg_int_pol))
                        else:
                            option_scores[lead_opt] = max(0.1, min(0.9, option_scores[lead_opt] + tg_int_pol))
                            option_scores[trail_opt] = max(0.1, min(0.9, option_scores[trail_opt] - tg_int_pol))

        # ── Upgrade 37: Ten God + Symbolic Star synergy ──────────
        # When a symbolic star's domain aligns with the active day Ten
        # God's domain, amplify both effects with a synergy bonus.
        if day_ten_god and domain_tags:
            day_tg_info = TEN_GOD_DOMAIN.get(day_ten_god, {})
            day_tg_domains = day_tg_info.get("domains", {})
            for dtag in domain_tags:
                tg_domain_weight = day_tg_domains.get(dtag, 0.0)
                if tg_domain_weight >= 0.6:
                    # Check if any symbolic star also covers this domain
                    for star in symbolic_stars:
                        star_name = star.get("name", "")
                        star_effect = SYMBOLIC_STAR_EFFECT.get(star_name)
                        if not star_effect:
                            continue
                        star_domain_weight = star_effect.get("domains", {}).get(dtag, 0.0)
                        if star_domain_weight >= 0.6:
                            # Synergy detected — boost leading option
                            lead_opt = max(option_scores, key=option_scores.get)
                            option_scores[lead_opt] = max(0.1, min(0.9, option_scores[lead_opt] + 0.08))
                            break  # one synergy bonus per domain tag
                    break  # only apply once across all domain tags

        # ── Upgrade 39: Luck period + Day pillar Ten God compound ─
        # When the Da Yun's Ten God and the current day's Ten God share
        # the same polarity direction, their combined effect is amplified.
        if luck_ten_god and day_ten_god:
            luck_tg_info = TEN_GOD_DOMAIN.get(luck_ten_god, {})
            day_tg_info_stance = TEN_GOD_DOMAIN.get(day_ten_god, {})
            luck_pol = luck_tg_info.get("polarity", 0.0)
            day_pol = day_tg_info_stance.get("polarity", 0.0)

            lead_opt = max(option_scores, key=option_scores.get)
            trail_opt = min(option_scores, key=option_scores.get)

            if luck_pol > 0 and day_pol > 0:
                # Both positive → compound boost to action option
                option_scores[lead_opt] = max(0.1, min(0.9, option_scores[lead_opt] + 0.10))
            elif luck_pol < 0 and day_pol < 0:
                # Both negative → compound boost to cautious option
                option_scores[trail_opt] = max(0.1, min(0.9, option_scores[trail_opt] + 0.08))
            elif (luck_pol > 0 and day_pol < 0) or (luck_pol < 0 and day_pol > 0):
                # Opposite directions → tension, pull toward neutral
                gap = abs(option_scores[lead_opt] - option_scores[trail_opt])
                if gap > 0.10:
                    option_scores[lead_opt] = max(0.1, min(0.9, option_scores[lead_opt] - 0.05))
                    option_scores[trail_opt] = max(0.1, min(0.9, option_scores[trail_opt] + 0.05))

        # ── Upgrade 40: Branch combination transformation stance ──
        # When a combination interaction is detected, check if the
        # resulting element is favorable or unfavorable.
        for interaction in branch_interactions:
            itype = interaction.get("type", "")
            if itype == "combination":
                branches_str = interaction.get("branches", "")
                branch_parts = [b.strip() for b in branches_str.split("-")] if branches_str else []
                if len(branch_parts) == 2:
                    combo_key = frozenset(set(branch_parts))
                    result_elem = BRANCH_COMBINATION_RESULT.get(combo_key)
                    if result_elem:
                        lead_opt = max(option_scores, key=option_scores.get)
                        trail_opt = min(option_scores, key=option_scores.get)
                        if result_elem in favorable:
                            option_scores[lead_opt] = max(0.1, min(0.9, option_scores[lead_opt] + 0.08))
                        elif result_elem in unfavorable:
                            option_scores[lead_opt] = max(0.1, min(0.9, option_scores[lead_opt] - 0.06))
                            option_scores[trail_opt] = max(0.1, min(0.9, option_scores[trail_opt] + 0.06))

        # Normalise to sum=1
        total = sum(option_scores.values())
        if total > 0:
            return {k: round(v / total, 3) for k, v in option_scores.items()}
        return {opt: round(1.0 / len(options), 3) for opt in options}
