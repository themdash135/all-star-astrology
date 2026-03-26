"""Numerology adapter — real number-cycle logic.

Uses:
  - Personal Day number → strongest short-term influence
  - Personal Month → medium-term context
  - Personal Year → background theme
  - Life Path → permanent disposition
  - Birthday number → innate talent (permanent)
  - Attitude number → approach to life (permanent)
  - Expression number → how you express in the world (career weight, name only)
  - Soul Urge number → inner desires (love/mood weight, name only)
  - Personality number → how others see you (career/love weight, name only)
  - Universal Year → global timing backdrop (from Current cycles table)
  - Maturity number → long-range integration (from Core numbers table)
  - Number meanings to determine action vs rest orientation

Number → polarity:
  1 = initiative, action               (+yang)
  2 = cooperation, patience             (-yin)
  3 = expression, social energy         (+yang)
  4 = structure, routine, rest          (-yin)
  5 = change, adventure, movement       (+yang)
  6 = home, nurturing, care             (-yin)
  7 = solitude, reflection, withdrawal  (-yin)
  8 = power, achievement, execution     (+yang)
  9 = completion, release, generosity   (neutral+)
  11 = intuition, heightened awareness  (neutral+)
  22 = master building, action at scale (+yang)
"""

from __future__ import annotations

from collections import Counter
from typing import Any

from ..schemas import ClassifiedIntent, EvidenceItem
from .base import (
    BaseAdapter,
    get_highlight_value,
    get_table_rows,
    option_polarities,
    polarity_to_stance,
)

# ── Number → action polarity ─────────────────────────────────────
# positive = action/yang, negative = rest/yin

NUMBER_POLARITY: dict[int, float] = {
    1:  0.7,   # initiative, new beginnings
    2: -0.5,   # patience, diplomacy, waiting
    3:  0.5,   # expression, social, outward
    4: -0.6,   # structure, routine, stay in
    5:  0.8,   # change, freedom, go for it
    6: -0.4,   # home, care, nurture
    7: -0.8,   # reflection, withdrawal, rest
    8:  0.6,   # power, execution, push
    9:  0.2,   # completion, letting go
    11: 0.1,   # intuition, heightened but inward
    22: 0.7,   # master builder, big action
    33:-0.2,   # service, teaching, gentle
}

# ── Number meanings (for evidence descriptions) ──────────────────

NUMBER_MEANING: dict[int, str] = {
    1: "initiative and new action",
    2: "patience and cooperation",
    3: "expression and social energy",
    4: "structure and routine",
    5: "change and movement",
    6: "home and nurturing",
    7: "reflection and withdrawal",
    8: "power and execution",
    9: "completion and release",
    11: "intuition and awareness",
    22: "ambitious building",
    33: "service and guidance",
}

# ── Domain-specific number meanings ──────────────────────────────
# Each number carries different implications depending on which life
# domain the question touches.

NUMBER_DOMAIN: dict[int, dict[str, str]] = {
    1:  {"love": "independence in love",       "career": "leadership opportunity",    "health": "strong vitality",         "wealth": "self-made success",       "mood": "assertive confidence"},
    2:  {"love": "deep partnership",            "career": "teamwork and diplomacy",    "health": "sensitivity to stress",   "wealth": "shared resources",        "mood": "emotional harmony"},
    3:  {"love": "playful romance",             "career": "creative expression",       "health": "social healing",          "wealth": "multiple income streams", "mood": "joyful optimism"},
    4:  {"love": "stable commitment",           "career": "structured progress",       "health": "routine-based wellness",  "wealth": "steady building",         "mood": "grounded discipline"},
    5:  {"love": "exciting attractions",        "career": "career change energy",      "health": "restless energy",         "wealth": "speculative gains",       "mood": "freedom-seeking"},
    6:  {"love": "nurturing devotion",          "career": "service-oriented work",     "health": "healing energy",          "wealth": "family prosperity",       "mood": "domestic harmony"},
    7:  {"love": "soul connection",             "career": "specialist expertise",      "health": "mental health focus",     "wealth": "hidden opportunities",    "mood": "introspective depth"},
    8:  {"love": "power couple energy",         "career": "executive authority",       "health": "physical stamina",        "wealth": "material abundance",      "mood": "ambitious drive"},
    9:  {"love": "universal compassion",        "career": "humanitarian calling",      "health": "completion and release",  "wealth": "generous flow",           "mood": "philosophical wisdom"},
    11: {"love": "intuitive bonding",           "career": "visionary leadership",      "health": "nervous sensitivity",     "wealth": "inspired abundance",      "mood": "heightened awareness"},
    22: {"love": "building together",           "career": "large-scale achievement",   "health": "endurance-based",         "wealth": "empire building",         "mood": "purposeful determination"},
    33: {"love": "selfless devotion",           "career": "spiritual teaching",        "health": "healer archetype",        "wealth": "giving creates receiving", "mood": "compassionate service"},
}

# ── Number harmony / dissonance pairs ────────────────────────────
# When two cycles share a harmonic pair the reading is more coherent;
# dissonant pairs introduce tension that lowers confidence slightly.

HARMONIC_PAIRS: set[frozenset] = {
    frozenset({1, 5}), frozenset({1, 9}), frozenset({2, 6}), frozenset({2, 4}),
    frozenset({3, 5}), frozenset({3, 9}), frozenset({4, 8}), frozenset({6, 9}),
    frozenset({7, 11}), frozenset({8, 22}),
}

DISSONANT_PAIRS: set[frozenset] = {
    frozenset({1, 4}), frozenset({1, 8}), frozenset({2, 5}), frozenset({3, 4}),
    frozenset({4, 5}), frozenset({7, 8}), frozenset({6, 7}),
}

# ── Upgrade 51: Master Number special handling ───────────────────
MASTER_NUMBER_BOOST: dict[int, dict] = {
    11: {"intensity": 1.4, "domains": {"mood", "love"}, "meaning": "heightened intuition and spiritual connection"},
    22: {"intensity": 1.5, "domains": {"career", "wealth"}, "meaning": "master builder energy — large-scale manifestation"},
    33: {"intensity": 1.3, "domains": {"mood", "health"}, "meaning": "master teacher — compassionate service"},
}

# ── Upgrade 52: Karmic Debt number detection ─────────────────────
KARMIC_DEBT: dict[int, dict] = {
    13: {"reduces_to": 4, "meaning": "laziness in past life — need for hard work", "polarity_mod": -0.10},
    14: {"reduces_to": 5, "meaning": "abuse of freedom — need for temperance", "polarity_mod": -0.08},
    16: {"reduces_to": 7, "meaning": "ego destruction — need for humility", "polarity_mod": -0.12},
    19: {"reduces_to": 1, "meaning": "self-centeredness — need for cooperation", "polarity_mod": -0.06},
}

# ── Upgrade 54: Personal Year cycle position ─────────────────────
YEAR_CYCLE_PHASE: dict[int, dict] = {
    1: {"phase": "beginning", "action_mod": 0.15, "meaning": "new cycle — bold action favored"},
    2: {"phase": "building", "action_mod": -0.05, "meaning": "patience and partnerships"},
    3: {"phase": "expression", "action_mod": 0.10, "meaning": "creative expansion"},
    4: {"phase": "foundation", "action_mod": -0.10, "meaning": "hard work and discipline"},
    5: {"phase": "change", "action_mod": 0.20, "meaning": "freedom and transformation"},
    6: {"phase": "responsibility", "action_mod": -0.08, "meaning": "home and duty"},
    7: {"phase": "reflection", "action_mod": -0.15, "meaning": "inner work and analysis"},
    8: {"phase": "harvest", "action_mod": 0.12, "meaning": "achievement and rewards"},
    9: {"phase": "completion", "action_mod": 0.05, "meaning": "release and preparation"},
}

# ── Upgrade 60: Cycle transition detection ───────────────────────
CYCLE_TRANSITION: dict[int, dict] = {
    9: {"modifier": -0.08, "meaning": "cycle ending — release and letting go, not new starts"},
    1: {"modifier": 0.12, "meaning": "cycle beginning — fresh starts strongly favored"},
}


def _safe_int(val: Any) -> int | None:
    """Extract integer from highlight value like '4' or '7 / 7'."""
    s = str(val).strip()
    # Handle "15 / 6" format — take the reduced form (last segment)
    if "/" in s:
        s = s.split("/")[-1].strip()
    try:
        return int(s)
    except (ValueError, TypeError):
        return None


def _safe_int_unreduced(val: Any) -> int | None:
    """Extract the unreduced (raw) integer from a highlight value like '15 / 6'.

    Returns the first segment before '/' if present, otherwise the whole value.
    Used for Karmic Debt detection where the pre-reduction sum matters.
    """
    s = str(val).strip()
    if "/" in s:
        s = s.split("/")[0].strip()
    try:
        return int(s)
    except (ValueError, TypeError):
        return None


def _domain_label(num: int, domain_tags: list[str]) -> str:
    """Return the most relevant domain-specific meaning for a number.

    If the question touches a recognised domain, return that domain's
    description.  Otherwise fall back to the generic NUMBER_MEANING.
    """
    domain_map = NUMBER_DOMAIN.get(num, {})
    for domain in domain_tags:
        if domain in domain_map:
            return domain_map[domain]
    return NUMBER_MEANING.get(num, "")


def _harmony_note(num_a: int | None, num_b: int | None) -> str | None:
    """Return a brief harmony/dissonance descriptor for two numbers, or None."""
    if num_a is None or num_b is None:
        return None
    pair = frozenset({num_a, num_b})
    if pair in HARMONIC_PAIRS:
        return "harmonic alignment"
    if pair in DISSONANT_PAIRS:
        return "tension requiring balance"
    return None


def _table_row_value(rows: list[list], label: str) -> int | None:
    """Find a table row by label (case-insensitive) and return its numeric value."""
    label_lower = label.lower()
    for row in rows:
        if row and label_lower in str(row[0]).lower():
            # Row format: [label, value, theme] — value is col 1
            if len(row) > 1:
                return _safe_int(row[1])
    return None


# ── Upgrade 58: Universal Day computation ────────────────────────

def _compute_universal_day(system_data: dict) -> int | None:
    """Extract or compute the universal day number."""
    cycle_rows = get_table_rows(system_data, "current cycles")
    ud = _table_row_value(cycle_rows, "universal day")
    return ud


class NumerologyAdapter(BaseAdapter):
    system_id = "numerology"
    system_name = "Numerology"
    confidence_scale = 0.90

    def _extract_evidence(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
    ) -> list[EvidenceItem]:
        items: list[EvidenceItem] = []
        domain_tags = intent.domain_tags or []

        # ── Core cycle numbers ────────────────────────────────────

        # Personal Day — strongest for "today/tonight" questions
        pd_val = get_highlight_value(system_data, "personal day")
        pd_num: int | None = None
        if pd_val is not None:
            pd_num = _safe_int(pd_val)
            meaning = _domain_label(pd_num, domain_tags) if pd_num else ""
            weight = 0.95 if intent.time_horizon in ("today", "tomorrow") else 0.5
            items.append(EvidenceItem(
                feature="Personal Day",
                value=f"{pd_val} — {meaning}" if meaning else str(pd_val),
                weight=weight,
            ))

        # Personal Month
        pm_val = get_highlight_value(system_data, "personal month")
        pm_num: int | None = None
        if pm_val is not None:
            pm_num = _safe_int(pm_val)
            meaning = _domain_label(pm_num, domain_tags) if pm_num else ""
            weight = 0.7 if intent.time_horizon in ("this_month",) else 0.5
            items.append(EvidenceItem(
                feature="Personal Month",
                value=f"{pm_val} — {meaning}" if meaning else str(pm_val),
                weight=weight,
            ))

        # Personal Year
        py_val = get_highlight_value(system_data, "personal year")
        py_num: int | None = None
        if py_val is not None:
            py_num = _safe_int(py_val)
            meaning = _domain_label(py_num, domain_tags) if py_num else ""
            weight = 0.6 if intent.time_horizon in ("this_year",) else 0.4
            items.append(EvidenceItem(
                feature="Personal Year",
                value=f"{py_val} — {meaning}" if meaning else str(py_val),
                weight=weight,
            ))

        # Personal Day / Personal Year harmony indicator
        harmony_note = _harmony_note(pd_num, py_num)
        if harmony_note:
            items.append(EvidenceItem(
                feature="Day–Year Harmony",
                value=f"Day {pd_num} + Year {py_num}: {harmony_note}",
                weight=0.45,
            ))

        # Life Path — permanent influence
        lp_val = get_highlight_value(system_data, "life path")
        lp_num: int | None = None
        if lp_val is not None:
            lp_num = _safe_int(lp_val)
            meaning = _domain_label(lp_num, domain_tags) if lp_num else ""
            items.append(EvidenceItem(
                feature="Life Path",
                value=f"{lp_val} — {meaning}" if meaning else str(lp_val),
                weight=0.6,
            ))

        # ── Birthday number — innate talent (permanent) ───────────
        bday_val = get_highlight_value(system_data, "birthday")
        if bday_val is not None:
            bday_num = _safe_int(bday_val)
            meaning = _domain_label(bday_num, domain_tags) if bday_num else ""
            items.append(EvidenceItem(
                feature="Birthday",
                value=f"{bday_val} — {meaning}" if meaning else str(bday_val),
                weight=0.5,
            ))

        # ── Attitude number — approach to life (permanent) ────────
        att_val = get_highlight_value(system_data, "attitude")
        if att_val is not None:
            att_num = _safe_int(att_val)
            meaning = _domain_label(att_num, domain_tags) if att_num else ""
            items.append(EvidenceItem(
                feature="Attitude",
                value=f"{att_val} — {meaning}" if meaning else str(att_val),
                weight=0.45,
            ))

        # ── Name-based numbers (only present when name was provided) ─

        # Expression — how you express in the world (career weight)
        expr_val = get_highlight_value(system_data, "expression")
        if expr_val is not None:
            expr_num = _safe_int(expr_val)
            domain_meaning = (
                NUMBER_DOMAIN.get(expr_num, {}).get("career", "")
                if expr_num else ""
            )
            meaning = f"career: {domain_meaning}" if domain_meaning else (
                NUMBER_MEANING.get(expr_num, "") if expr_num else ""
            )
            # Boost weight for career/wealth domain questions
            career_relevant = any(d in domain_tags for d in ("career", "wealth"))
            weight = 0.65 if career_relevant else 0.45
            items.append(EvidenceItem(
                feature="Expression",
                value=f"{expr_val} — {meaning}" if meaning else str(expr_val),
                weight=weight,
            ))

        # Soul Urge — inner desires (love/mood weight)
        su_val = get_highlight_value(system_data, "soul urge")
        if su_val is not None:
            su_num = _safe_int(su_val)
            # Choose the domain meaning most relevant to this question
            if su_num:
                dom_map = NUMBER_DOMAIN.get(su_num, {})
                if "love" in domain_tags and "love" in dom_map:
                    meaning = f"love: {dom_map['love']}"
                elif "mood" in domain_tags and "mood" in dom_map:
                    meaning = f"mood: {dom_map['mood']}"
                else:
                    meaning = NUMBER_MEANING.get(su_num, "")
            else:
                meaning = ""
            love_mood_relevant = any(d in domain_tags for d in ("love", "mood"))
            weight = 0.65 if love_mood_relevant else 0.40
            items.append(EvidenceItem(
                feature="Soul Urge",
                value=f"{su_val} — {meaning}" if meaning else str(su_val),
                weight=weight,
            ))

        # Personality — how others see you (career/love weight)
        pers_val = get_highlight_value(system_data, "personality")
        if pers_val is not None:
            pers_num = _safe_int(pers_val)
            if pers_num:
                dom_map = NUMBER_DOMAIN.get(pers_num, {})
                if "career" in domain_tags and "career" in dom_map:
                    meaning = f"career: {dom_map['career']}"
                elif "love" in domain_tags and "love" in dom_map:
                    meaning = f"love: {dom_map['love']}"
                else:
                    meaning = NUMBER_MEANING.get(pers_num, "")
            else:
                meaning = ""
            social_relevant = any(d in domain_tags for d in ("career", "love"))
            weight = 0.55 if social_relevant else 0.35
            items.append(EvidenceItem(
                feature="Personality",
                value=f"{pers_val} — {meaning}" if meaning else str(pers_val),
                weight=weight,
            ))

        # ── Universal Year — background timing from table ─────────
        cycle_rows = get_table_rows(system_data, "current cycles")
        uy_num = _table_row_value(cycle_rows, "universal year")
        if uy_num is not None:
            meaning = _domain_label(uy_num, domain_tags)
            items.append(EvidenceItem(
                feature="Universal Year",
                value=f"{uy_num} — {meaning}" if meaning else str(uy_num),
                weight=0.30,
            ))

        # ── Active Pinnacle ────────────────────────────────────────
        pin_val = get_highlight_value(system_data, "active pinnacle")
        pin_num: int | None = None
        if pin_val is not None:
            pin_num = _safe_int(pin_val)
            items.append(EvidenceItem(feature="Active Pinnacle", value=str(pin_val), weight=0.4))

        # ── Active Challenge ───────────────────────────────────────
        ch_val = get_highlight_value(system_data, "active challenge")
        ch_num: int | None = None
        if ch_val is not None:
            ch_num = _safe_int(ch_val)
            items.append(EvidenceItem(feature="Active Challenge", value=str(ch_val), weight=0.35))

        # ── Upgrade 51: Master Number evidence ───────────────────
        # Scan all active cycle positions for master numbers and add
        # special evidence when found.
        _cycle_nums_for_master = {
            "Personal Day": pd_num,
            "Personal Month": pm_num,
            "Personal Year": py_num,
        }
        for pos_label, pos_num in _cycle_nums_for_master.items():
            if pos_num is not None and pos_num in MASTER_NUMBER_BOOST:
                info = MASTER_NUMBER_BOOST[pos_num]
                items.append(EvidenceItem(
                    feature=f"Master Number {pos_num}",
                    value=f"{pos_label} carries {info['meaning']}",
                    weight=0.80,
                ))

        # ── Upgrade 52: Karmic Debt evidence ─────────────────────
        # Check unreduced values of highlights for karmic debt numbers.
        _karmic_sources = [
            ("Birthday", bday_val if bday_val is not None else None),
            ("Expression", expr_val if expr_val is not None else None),
            ("Soul Urge", su_val if su_val is not None else None),
            ("Personality", pers_val if pers_val is not None else None),
        ]
        for source_label, source_val in _karmic_sources:
            if source_val is not None:
                raw_num = _safe_int_unreduced(source_val)
                if raw_num is not None and raw_num in KARMIC_DEBT:
                    debt = KARMIC_DEBT[raw_num]
                    items.append(EvidenceItem(
                        feature=f"Karmic Debt {raw_num}",
                        value=f"{source_label}: {debt['meaning']}",
                        weight=0.60,
                    ))

        # ── Upgrade 53: Pinnacle-Challenge interaction evidence ──
        if pin_num is not None and ch_num is not None:
            pc_note = _harmony_note(pin_num, ch_num)
            if pc_note == "harmonic alignment":
                items.append(EvidenceItem(
                    feature="Pinnacle–Challenge Harmony",
                    value=f"Pinnacle {pin_num} + Challenge {ch_num}: harmonic alignment — structured growth",
                    weight=0.55,
                ))
            elif pc_note == "tension requiring balance":
                items.append(EvidenceItem(
                    feature="Pinnacle–Challenge Tension",
                    value=f"Pinnacle {pin_num} + Challenge {ch_num}: tension between pinnacle and challenge requires conscious balance",
                    weight=0.50,
                ))

        # ── Upgrade 54: Personal Year cycle position evidence ────
        if py_num is not None and py_num in YEAR_CYCLE_PHASE:
            phase_info = YEAR_CYCLE_PHASE[py_num]
            items.append(EvidenceItem(
                feature="Year Cycle Phase",
                value=f"Year {py_num} — {phase_info['phase']} phase: {phase_info['meaning']}",
                weight=0.55,
            ))

        # ── Upgrade 55: Pinnacle period domain matching evidence ─
        if pin_num is not None:
            pin_domains = NUMBER_DOMAIN.get(pin_num, {})
            for dtag in domain_tags:
                if dtag in pin_domains:
                    items.append(EvidenceItem(
                        feature="Pinnacle Domain Match",
                        value=f"Pinnacle {pin_num} activates {dtag}: {pin_domains[dtag]}",
                        weight=0.50,
                    ))
                    break  # one domain match is enough

        # ── Upgrade 56: Challenge number as warning signal ───────
        if ch_num is not None:
            ch_domains = NUMBER_DOMAIN.get(ch_num, {})
            for dtag in domain_tags:
                if dtag in ch_domains:
                    items.append(EvidenceItem(
                        feature="Challenge Domain Warning",
                        value=f"Challenge {ch_num} in {dtag}: growth area — {ch_domains[dtag]}",
                        weight=0.50,
                    ))
                    break  # one domain match is enough

        # ── Upgrade 57: Maturity number integration evidence ─────
        core_rows = get_table_rows(system_data, "core numbers")
        maturity_num = _table_row_value(core_rows, "maturity")
        if maturity_num is not None:
            mat_meaning = _domain_label(maturity_num, domain_tags)
            long_term = intent.time_horizon in ("this_year", "general")
            mat_weight = 0.55 if long_term else 0.30
            items.append(EvidenceItem(
                feature="Maturity Number",
                value=f"{maturity_num} — {mat_meaning}" if mat_meaning else str(maturity_num),
                weight=mat_weight,
            ))

        # ── Upgrade 58: Universal Day influence evidence ─────────
        ud_num = _compute_universal_day(system_data)
        if ud_num is not None:
            ud_meaning = _domain_label(ud_num, domain_tags)
            short_term = intent.time_horizon in ("today", "tomorrow")
            ud_weight = 0.45 if short_term else 0.25
            items.append(EvidenceItem(
                feature="Universal Day",
                value=f"{ud_num} — {ud_meaning}" if ud_meaning else str(ud_num),
                weight=ud_weight,
            ))

        # ── Upgrade 59: Number repetition pattern (Echo) evidence ─
        all_active = [
            n for n in [pd_num, pm_num, py_num, lp_num, pin_num, ch_num]
            if n is not None
        ]
        # Also include name-based numbers if available
        for _nval in [expr_val, su_val, pers_val]:
            if _nval is not None:
                _nn = _safe_int(_nval)
                if _nn is not None:
                    all_active.append(_nn)
        num_counts = Counter(all_active)
        for echo_num, echo_count in num_counts.items():
            if echo_count >= 3:
                echo_meaning = NUMBER_MEANING.get(echo_num, "recurring influence")
                items.append(EvidenceItem(
                    feature=f"Number {echo_num} Echo",
                    value=f"Number {echo_num} echoes across {echo_count} positions — powerful recurring theme of {echo_meaning}",
                    weight=0.85,
                ))

        # ── Upgrade 60: Cycle transition detection evidence ──────
        if py_num is not None and py_num in CYCLE_TRANSITION:
            trans = CYCLE_TRANSITION[py_num]
            items.append(EvidenceItem(
                feature="Cycle Transition",
                value=f"Personal Year {py_num}: {trans['meaning']}",
                weight=0.60,
            ))
        # Cusp energy: Year 9 + Day 1  or  Year 1 + Day 9
        if py_num is not None and pd_num is not None:
            if (py_num == 9 and pd_num == 1) or (py_num == 1 and pd_num == 9):
                items.append(EvidenceItem(
                    feature="Cusp Energy",
                    value="Old and new cycles overlap — transitional energy favoring emergence",
                    weight=0.55,
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
        domain_tags = intent.domain_tags or []

        # ── Base cycle weights ─────────────────────────────────────
        cycle_weights: dict[str, float] = {
            "personal day":   3.0 if intent.time_horizon in ("today", "tomorrow") else 1.0,
            "personal month": 2.0 if intent.time_horizon == "this_month" else 0.8,
            "personal year":  2.0 if intent.time_horizon == "this_year" else 0.6,
            "life path":      1.0,  # always relevant as background
        }

        action_score = 0.0
        total_weight = 0.0

        active_nums: list[int] = []  # collect cycle numbers for harmony check

        for cycle_key, w in cycle_weights.items():
            raw_val = get_highlight_value(system_data, cycle_key)
            if raw_val is not None:
                num = _safe_int(raw_val)
                if num is not None and num in NUMBER_POLARITY:
                    # Domain-specific polarity boost:
                    # for some domains certain numbers gain extra weight
                    domain_boost = _domain_polarity_modifier(num, domain_tags)
                    effective_w = w * (1.0 + domain_boost)

                    # ── Upgrade 51: Master Number stance boost ───────
                    # When a master number appears in a cycle position,
                    # multiply its polarity weight by the intensity factor.
                    master_info = MASTER_NUMBER_BOOST.get(num)
                    if master_info is not None:
                        effective_w *= master_info["intensity"]
                        # Domain overlap amplification
                        if domain_tags and master_info["domains"] & set(domain_tags):
                            action_score += 0.08

                    action_score += NUMBER_POLARITY[num] * effective_w
                    total_weight += effective_w
                    active_nums.append(num)

        # ── Birthday number — permanent innate talent ──────────────
        bday_val = get_highlight_value(system_data, "birthday")
        if bday_val is not None:
            bday_num = _safe_int(bday_val)
            if bday_num is not None and bday_num in NUMBER_POLARITY:
                domain_boost = _domain_polarity_modifier(bday_num, domain_tags)
                w = 0.6 * (1.0 + domain_boost)
                action_score += NUMBER_POLARITY[bday_num] * w
                total_weight += w
                active_nums.append(bday_num)

        # ── Name numbers — contextual domain influence ─────────────

        # Expression drives career/wealth outcomes
        expr_val = get_highlight_value(system_data, "expression")
        if expr_val is not None:
            expr_num = _safe_int(expr_val)
            if expr_num is not None and expr_num in NUMBER_POLARITY:
                career_weight = 0.8 if any(d in domain_tags for d in ("career", "wealth")) else 0.3
                domain_boost = _domain_polarity_modifier(expr_num, domain_tags)
                w = career_weight * (1.0 + domain_boost)
                action_score += NUMBER_POLARITY[expr_num] * w
                total_weight += w

        # Soul Urge drives love/mood outcomes
        su_val = get_highlight_value(system_data, "soul urge")
        if su_val is not None:
            su_num = _safe_int(su_val)
            if su_num is not None and su_num in NUMBER_POLARITY:
                love_weight = 0.8 if any(d in domain_tags for d in ("love", "mood")) else 0.3
                domain_boost = _domain_polarity_modifier(su_num, domain_tags)
                w = love_weight * (1.0 + domain_boost)
                action_score += NUMBER_POLARITY[su_num] * w
                total_weight += w

        # ── Harmony bonus / dissonance penalty ────────────────────
        harmony_adjustment = _compute_harmony_adjustment(active_nums)
        # Harmony makes the raw signal more decisive; dissonance pulls toward 0
        if total_weight > 0:
            action_score += harmony_adjustment * 0.15

        # ── Universal Year — mild background nudge ─────────────────
        cycle_rows = get_table_rows(system_data, "current cycles")
        uy_num = _table_row_value(cycle_rows, "universal year")
        if uy_num is not None and uy_num in NUMBER_POLARITY:
            w = 0.25
            action_score += NUMBER_POLARITY[uy_num] * w
            total_weight += w

        # ── Upgrade 52: Karmic Debt stance modifier ──────────────
        # Check unreduced values for karmic debt numbers and apply
        # their cautionary polarity modifier.
        _karmic_highlight_keys = ["birthday", "expression", "soul urge", "personality"]
        for hk in _karmic_highlight_keys:
            hv = get_highlight_value(system_data, hk)
            if hv is not None:
                raw_num = _safe_int_unreduced(hv)
                if raw_num is not None and raw_num in KARMIC_DEBT:
                    debt = KARMIC_DEBT[raw_num]
                    action_score += debt["polarity_mod"]
                    # Karmic debt always adds a small weight toward caution
                    total_weight += 0.3

        # ── Upgrade 53: Pinnacle-Challenge interaction stance ────
        pin_val = get_highlight_value(system_data, "active pinnacle")
        ch_val = get_highlight_value(system_data, "active challenge")
        pin_num = _safe_int(pin_val) if pin_val is not None else None
        ch_num = _safe_int(ch_val) if ch_val is not None else None
        if pin_num is not None and ch_num is not None:
            pc_note = _harmony_note(pin_num, ch_num)
            if pc_note == "harmonic alignment":
                action_score += 0.06
            elif pc_note == "tension requiring balance":
                action_score -= 0.04

        # ── Upgrade 54: Personal Year cycle position stance ──────
        py_val = get_highlight_value(system_data, "personal year")
        py_num = _safe_int(py_val) if py_val is not None else None
        if py_num is not None and py_num in YEAR_CYCLE_PHASE:
            phase_info = YEAR_CYCLE_PHASE[py_num]
            w_phase = 0.8
            action_score += phase_info["action_mod"] * w_phase
            total_weight += w_phase

        # ── Upgrade 55: Pinnacle period domain matching stance ───
        if pin_num is not None:
            pin_dom_map = NUMBER_DOMAIN.get(pin_num, {})
            for dtag in domain_tags:
                if dtag in pin_dom_map:
                    # Check domain weight threshold (>= 0.6 from evidence)
                    pin_ev_weight = 0.0
                    for ev in evidence:
                        if "pinnacle" in ev.feature.lower() and dtag in ev.value.lower():
                            pin_ev_weight = ev.weight
                            break
                    if pin_ev_weight >= 0.6 or any(
                        d in pin_dom_map for d in domain_tags
                    ):
                        pin_polarity = NUMBER_POLARITY.get(pin_num, 0.0)
                        action_score += pin_polarity * 0.5
                        total_weight += 0.5
                    break

        # ── Upgrade 56: Challenge number as warning signal stance ─
        if ch_num is not None:
            ch_dom_map = NUMBER_DOMAIN.get(ch_num, {})
            for dtag in domain_tags:
                if dtag in ch_dom_map:
                    # Challenge domain overlap — cautionary signal
                    action_score -= 0.08
                    total_weight += 0.3
                    break

        # ── Upgrade 57: Maturity number integration stance ───────
        core_rows = get_table_rows(system_data, "core numbers")
        maturity_num = _table_row_value(core_rows, "maturity")
        if maturity_num is not None and maturity_num in NUMBER_POLARITY:
            long_term = intent.time_horizon in ("this_year", "general")
            mat_w = 0.5 if long_term else 0.15
            action_score += NUMBER_POLARITY[maturity_num] * mat_w
            total_weight += mat_w

        # ── Upgrade 58: Universal Day influence stance ───────────
        ud_num = _compute_universal_day(system_data)
        if ud_num is not None and ud_num in NUMBER_POLARITY:
            short_term = intent.time_horizon in ("today", "tomorrow")
            ud_w = 0.4 if short_term else 0.1
            action_score += NUMBER_POLARITY[ud_num] * ud_w
            total_weight += ud_w

        # ── Upgrade 59: Number repetition pattern (Echo) stance ──
        # Collect all active numbers from positions.
        pd_val_r = get_highlight_value(system_data, "personal day")
        pm_val_r = get_highlight_value(system_data, "personal month")
        py_val_r = get_highlight_value(system_data, "personal year")
        lp_val_r = get_highlight_value(system_data, "life path")
        all_nums_for_echo: list[int] = []
        for rv in [pd_val_r, pm_val_r, py_val_r, lp_val_r, pin_val, ch_val]:
            if rv is not None:
                nn = _safe_int(rv)
                if nn is not None:
                    all_nums_for_echo.append(nn)
        for nk in ["expression", "soul urge", "personality"]:
            nv = get_highlight_value(system_data, nk)
            if nv is not None:
                nn = _safe_int(nv)
                if nn is not None:
                    all_nums_for_echo.append(nn)
        echo_counts = Counter(all_nums_for_echo)
        for echo_num, echo_count in echo_counts.items():
            if echo_count >= 3 and echo_num in NUMBER_POLARITY:
                # Amplify that number's polarity by x1.5 + decisiveness bonus
                action_score += NUMBER_POLARITY[echo_num] * 1.5
                action_score += 0.10  # decisiveness bonus
                total_weight += 1.5

        # ── Upgrade 60: Cycle transition detection stance ────────
        if py_num is not None and py_num in CYCLE_TRANSITION:
            trans = CYCLE_TRANSITION[py_num]
            action_score += trans["modifier"]
            total_weight += 0.4

        # Cusp energy: Year 9 + Day 1  or  Year 1 + Day 9
        pd_num_r = _safe_int(pd_val_r) if pd_val_r is not None else None
        if py_num is not None and pd_num_r is not None:
            if (py_num == 9 and pd_num_r == 1) or (py_num == 1 and pd_num_r == 9):
                action_score += 0.05  # new energy wins slightly
                total_weight += 0.2

        raw = action_score / total_weight if total_weight > 0 else 0.0
        return polarity_to_stance(options, raw)


# ── Module-level helpers (kept outside the class to stay testable) ─

def _domain_polarity_modifier(num: int, domain_tags: list[str]) -> float:
    """Return a fractional weight boost (0.0 – 0.3) when a number's domain
    meaning is strongly relevant to the question's domain tags.

    Numbers that are domain archetypes for a queried area get a small boost
    so the stance shifts more decisively when the numerology is clearly on-topic.
    """
    # Archetype pairs: (number, primary_domain) → boost
    ARCHETYPES: dict[tuple[int, str], float] = {
        (8, "career"): 0.25, (1, "career"): 0.20, (22, "career"): 0.25,
        (8, "wealth"): 0.20, (4, "wealth"): 0.15, (22, "wealth"): 0.20,
        (2, "love"):   0.20, (6, "love"):   0.20, (9, "love"):   0.15,
        (11, "love"):  0.15,
        (7, "mood"):   0.20, (11, "mood"):  0.20, (2, "mood"):   0.15,
        (6, "health"): 0.20, (4, "health"): 0.15,
    }
    boost = 0.0
    for domain in domain_tags:
        boost = max(boost, ARCHETYPES.get((num, domain), 0.0))
    return boost


def _compute_harmony_adjustment(nums: list[int]) -> float:
    """Return a net harmony score across all pairs of active cycle numbers.

    +1 per harmonic pair, -1 per dissonant pair.  Normalised to [-1, +1].
    """
    if len(nums) < 2:
        return 0.0
    net = 0
    pairs = 0
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            pair = frozenset({nums[i], nums[j]})
            pairs += 1
            if pair in HARMONIC_PAIRS:
                net += 1
            elif pair in DISSONANT_PAIRS:
                net -= 1
    return net / pairs if pairs > 0 else 0.0
