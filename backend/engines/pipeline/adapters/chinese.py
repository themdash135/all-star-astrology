"""Chinese Zodiac adapter — real cycle-based logic.

Uses:
  - Birth year animal + element → base archetype
  - Month animal → career / public influence layer
  - Hour animal → inner self / hidden desires layer
  - Current year animal → harmony / clash / trine / neutral
  - Polarity alignment (yin/yang match)
  - Peach blossom activation → social/romantic signal
  - Current day animal → short-term energy
  - Secret friend → deep bonding / love signal
  - San He (Three Harmonies) trines → deep compatibility
  - Liu He (Six Harmonies) pairs → bonding compatibility
  - Six Clashes → direct opposition / caution
  - Element production/destruction cycles → flow or tension
  - Full 12-animal compatibility table → numeric delta scoring

High-level cyclical system.  Does not pretend to ultra-fine precision.
Best for: broad life questions, social/harmony, yearly themes, support vs resistance.
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

# ── Animal archetype polarity ─────────────────────────────────────
# Positive = outgoing / action / yang.  Negative = introspective / rest / yin.

ANIMAL_POLARITY: dict[str, float] = {
    "Rat":     0.3,    # adaptive, alert
    "Ox":     -0.4,    # steady, patient
    "Tiger":   0.7,    # bold, action-oriented
    "Rabbit": -0.3,    # gentle, diplomatic
    "Dragon":  0.8,    # commanding, ambitious
    "Snake":  -0.2,    # strategic, subtle
    "Horse":   0.6,    # energetic, mobile
    "Goat":   -0.5,    # sensitive, peace-seeking
    "Monkey":  0.5,    # inventive, flexible
    "Rooster": 0.2,    # precise, structured
    "Dog":    -0.1,    # loyal, protective
    "Pig":    -0.3,    # warm, comfort-seeking
}

# ── Element polarity (Chinese five-element) ───────────────────────

ELEMENT_ENERGY: dict[str, float] = {
    "Wood":  0.4,   # growth
    "Fire":  0.8,   # intensity
    "Earth": 0.0,   # stability
    "Metal":-0.3,   # contraction
    "Water":-0.6,   # rest/flow
}

# ── Relation types from compatibility table ───────────────────────

RELATION_PUSH: dict[str, float] = {
    "Trine ally":     0.5,   # strong harmony → supports action
    "Secret friend":  0.4,
    "Compatible":     0.3,
    "Ally":           0.3,
    "Neutral":        0.0,
    "No special tie": 0.0,
    "Mild tension":  -0.2,
    "Harm":          -0.4,
    "Clash":         -0.6,   # strong friction → urges caution
}

# ── San He (Three Harmonies) — animals in the same trine ─────────
# Share deep compatibility; together they reinforce a common element quality.

SAN_HE: dict[frozenset[str], dict[str, str]] = {
    frozenset({"Rat", "Dragon", "Monkey"}): {
        "element": "Water",
        "quality": "ambitious action",
    },
    frozenset({"Ox", "Snake", "Rooster"}): {
        "element": "Metal",
        "quality": "disciplined strategy",
    },
    frozenset({"Tiger", "Horse", "Dog"}): {
        "element": "Fire",
        "quality": "bold passion",
    },
    frozenset({"Rabbit", "Goat", "Pig"}): {
        "element": "Wood",
        "quality": "gentle cooperation",
    },
}

# ── Liu He (Six Harmonies) — secret bonding pairs ─────────────────

LIU_HE: dict[frozenset[str], str] = {
    frozenset({"Rat", "Ox"}):       "earth bonding",
    frozenset({"Tiger", "Pig"}):    "wood bonding",
    frozenset({"Rabbit", "Dog"}):   "fire bonding",
    frozenset({"Dragon", "Rooster"}): "metal bonding",
    frozenset({"Snake", "Monkey"}): "water bonding",
    frozenset({"Horse", "Goat"}):   "fire/earth bonding",
}

# ── Six Clashes — directly opposing animal pairs ──────────────────

SIX_CLASHES: set[frozenset[str]] = {
    frozenset({"Rat", "Horse"}),
    frozenset({"Ox", "Goat"}),
    frozenset({"Tiger", "Monkey"}),
    frozenset({"Rabbit", "Rooster"}),
    frozenset({"Dragon", "Dog"}),
    frozenset({"Snake", "Pig"}),
}

# ── Element production / destruction cycles ───────────────────────

ELEMENT_PRODUCES: dict[str, str] = {
    "Wood":  "Fire",
    "Fire":  "Earth",
    "Earth": "Metal",
    "Metal": "Water",
    "Water": "Wood",
}

ELEMENT_DESTROYS: dict[str, str] = {
    "Wood":  "Earth",
    "Earth": "Water",
    "Water": "Fire",
    "Fire":  "Metal",
    "Metal": "Wood",
}

# ── Animal domain strengths ───────────────────────────────────────
# Month animal → career/public influence; Hour animal → inner self/hidden desires.

ANIMAL_DOMAIN: dict[str, dict[str, float]] = {
    "Rat":     {"wealth": 0.8, "career": 0.7},
    "Ox":      {"career": 0.8, "health": 0.6},
    "Tiger":   {"career": 0.7, "mood": 0.6},
    "Rabbit":  {"love": 0.8, "mood": 0.7},
    "Dragon":  {"career": 0.9, "wealth": 0.7},
    "Snake":   {"wealth": 0.7, "mood": 0.6},
    "Horse":   {"career": 0.7, "love": 0.6},
    "Goat":    {"love": 0.7, "mood": 0.8},
    "Monkey":  {"career": 0.8, "wealth": 0.6},
    "Rooster": {"career": 0.7, "health": 0.6},
    "Dog":     {"love": 0.7, "mood": 0.7},
    "Pig":     {"love": 0.6, "wealth": 0.7},
}

# ── Upgrade 41: Animal hidden element ────────────────────────────

ANIMAL_HIDDEN_ELEMENT: dict[str, str] = {
    "Rat": "Water", "Ox": "Earth", "Tiger": "Wood", "Rabbit": "Wood",
    "Dragon": "Earth", "Snake": "Fire", "Horse": "Fire", "Goat": "Earth",
    "Monkey": "Metal", "Rooster": "Metal", "Dog": "Earth", "Pig": "Water",
}

# ── Upgrade 43: Seasonal animal strength ─────────────────────────

ANIMAL_SEASON: dict[str, str] = {
    "Tiger": "spring", "Rabbit": "spring", "Dragon": "spring",
    "Snake": "summer", "Horse": "summer", "Goat": "summer",
    "Monkey": "autumn", "Rooster": "autumn", "Dog": "autumn",
    "Pig": "winter", "Rat": "winter", "Ox": "winter",
}

CURRENT_SEASON_MAP: dict[str, str] = {
    "Tiger": "spring", "Rabbit": "spring", "Dragon": "spring",
    "Snake": "summer", "Horse": "summer", "Goat": "summer",
    "Monkey": "autumn", "Rooster": "autumn", "Dog": "autumn",
    "Pig": "winter", "Rat": "winter", "Ox": "winter",
}

OPPOSITE_SEASON: dict[str, str] = {
    "spring": "autumn",
    "summer": "winter",
    "autumn": "spring",
    "winter": "summer",
}

# ── Upgrade 44: Self-punishment detection ────────────────────────

SELF_PUNISHMENT: set[str] = {"Dragon", "Horse", "Rooster", "Pig"}

# ── Upgrade 45: Three Penalties (San Xing) ───────────────────────

THREE_PENALTIES: list[dict] = [
    {"animals": frozenset({"Tiger", "Snake", "Monkey"}), "name": "Ungrateful Penalty", "polarity": -0.35},
    {"animals": frozenset({"Ox", "Goat", "Dog"}), "name": "Uncivilized Penalty", "polarity": -0.30},
    {"animals": frozenset({"Rabbit"}), "name": "Self Penalty (Rabbit)", "polarity": -0.20},
]

# ── Upgrade 46: Peach Blossom activation timing ─────────────────

PEACH_BLOSSOM_ANIMAL: dict[str, str] = {
    "Rat": "Rooster", "Dragon": "Rooster", "Monkey": "Rooster",
    "Tiger": "Rabbit", "Horse": "Rabbit", "Dog": "Rabbit",
    "Ox": "Horse", "Snake": "Horse", "Rooster": "Horse",
    "Rabbit": "Rat", "Goat": "Rat", "Pig": "Rat",
}

# ── Upgrade 47: Nobleman Star (Gui Ren) ─────────────────────────

NOBLEMAN_ANIMAL: dict[str, list[str]] = {
    "Rat": ["Ox", "Goat"], "Ox": ["Rat", "Monkey"],
    "Tiger": ["Pig", "Rooster"], "Rabbit": ["Dog", "Dragon"],
    "Dragon": ["Rabbit", "Snake"], "Snake": ["Dragon", "Tiger"],
    "Horse": ["Pig", "Goat"], "Goat": ["Horse", "Rat"],
    "Monkey": ["Ox", "Pig"], "Rooster": ["Tiger", "Horse"],
    "Dog": ["Rabbit", "Pig"], "Pig": ["Tiger", "Dog"],
}

# ── Upgrade 48: Traveling Horse (Yi Ma) ─────────────────────────

TRAVELING_HORSE: dict[str, str] = {
    "Rat": "Tiger", "Ox": "Pig", "Tiger": "Monkey", "Rabbit": "Snake",
    "Dragon": "Tiger", "Snake": "Pig", "Horse": "Monkey", "Goat": "Snake",
    "Monkey": "Tiger", "Rooster": "Pig", "Dog": "Monkey", "Pig": "Snake",
}

# ── Upgrade 49: Void/Empty branch (Kong Wang) ───────────────────

VOID_BRANCHES: dict[str, set[str]] = {
    "Rat": {"Horse", "Goat"}, "Ox": {"Monkey", "Rooster"},
    "Tiger": {"Dog", "Pig"}, "Rabbit": {"Rat", "Ox"},
    "Dragon": {"Tiger", "Rabbit"}, "Snake": {"Dragon", "Snake"},
    "Horse": {"Horse", "Goat"}, "Goat": {"Monkey", "Rooster"},
    "Monkey": {"Dog", "Pig"}, "Rooster": {"Rat", "Ox"},
    "Dog": {"Tiger", "Rabbit"}, "Pig": {"Dragon", "Snake"},
}


# ── Helpers ───────────────────────────────────────────────────────

def _extract_animal(value: str | None) -> str | None:
    """Extract animal name from values like 'Wood Ox' or 'Fire Snake'."""
    if not value:
        return None
    for animal in ANIMAL_POLARITY:
        if animal in value:
            return animal
    return None


def _extract_element(value: str | None) -> str | None:
    if not value:
        return None
    for elem in ELEMENT_ENERGY:
        if elem in value:
            return elem
    return None


def _find_relation(system_data: dict[str, Any], current_animal: str) -> str:
    """Look up the relation between natal and current year animal."""
    rows = get_table_rows(system_data, "compatibility")
    for row in rows:
        if len(row) >= 2 and str(row[0]).strip() == current_animal:
            return str(row[1]).strip()
    return "Neutral"


def _find_delta(system_data: dict[str, Any], animal: str) -> float | None:
    """Return numeric delta from the compatibility table for a given animal (column 3)."""
    rows = get_table_rows(system_data, "compatibility")
    for row in rows:
        if len(row) >= 3 and str(row[0]).strip() == animal:
            try:
                return float(row[2])
            except (ValueError, TypeError):
                return None
    return None


def _san_he_group(animal: str) -> dict[str, str] | None:
    """Return San He metadata if the animal belongs to any trine."""
    for members, meta in SAN_HE.items():
        if animal in members:
            return {"members": sorted(members), **meta}
    return None


def _liu_he_partner(animal: str, other: str) -> str | None:
    """Return Liu He bonding description if these two animals form a pair."""
    pair = frozenset({animal, other})
    return LIU_HE.get(pair)


def _is_clash(animal_a: str, animal_b: str) -> bool:
    """Return True if the two animals are in a Six Clash relationship."""
    return frozenset({animal_a, animal_b}) in SIX_CLASHES


def _element_cycle_effect(natal_elem: str, current_elem: str) -> float:
    """
    Return a polarity nudge based on production/destruction between elements.

    Natal produces current → natal energy flows into current year = mild support (+0.25).
    Current produces natal → current year feeds natal = strong support (+0.35).
    Natal destroys current → natal dominates current = mild tension (−0.20).
    Current destroys natal → current year weakens natal = strong tension (−0.35).
    Same element → resonance (+0.15).
    Otherwise neutral (0.0).
    """
    if natal_elem == current_elem:
        return 0.15
    if ELEMENT_PRODUCES.get(natal_elem) == current_elem:
        return 0.25
    if ELEMENT_PRODUCES.get(current_elem) == natal_elem:
        return 0.35
    if ELEMENT_DESTROYS.get(natal_elem) == current_elem:
        return -0.20
    if ELEMENT_DESTROYS.get(current_elem) == natal_elem:
        return -0.35
    return 0.0


def _domain_weight(animal: str, domain_key: str, default: float) -> float:
    """Return a domain-boosted weight for evidence items."""
    return ANIMAL_DOMAIN.get(animal, {}).get(domain_key, default)


# ── Upgrade 41 helper: hidden element clash check ────────────────

def _hidden_elements_clash(elem_a: str | None, elem_b: str | None) -> float:
    """Return harmony/clash signal between two hidden elements.

    +0.15 if same element (harmony).
    -0.15 if destruction cycle (clash).
     0.0 otherwise.
    """
    if not elem_a or not elem_b:
        return 0.0
    if elem_a == elem_b:
        return 0.15
    if ELEMENT_DESTROYS.get(elem_a) == elem_b or ELEMENT_DESTROYS.get(elem_b) == elem_a:
        return -0.15
    return 0.0


# ── Upgrade 45 helper: collect penalty matches ───────────────────

def _find_penalties(animals: set[str]) -> list[dict]:
    """Return list of triggered Three Penalties given a set of animals."""
    triggered = []
    for penalty in THREE_PENALTIES:
        overlap = animals & penalty["animals"]
        if len(penalty["animals"]) == 1:
            # Self-Penalty (Rabbit): needs the animal to appear — counts if present
            if overlap:
                triggered.append(penalty)
        elif len(overlap) >= 2:
            triggered.append(penalty)
    return triggered


class ChineseAdapter(BaseAdapter):
    system_id = "chinese"
    system_name = "Chinese Zodiac"
    confidence_scale = 0.95

    def _extract_evidence(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
    ) -> list[EvidenceItem]:
        items: list[EvidenceItem] = []

        domain_tags = intent.domain_tags or []
        is_career = "career" in domain_tags
        is_love = "love" in domain_tags
        is_mood = "mood" in domain_tags
        is_wealth = "wealth" in domain_tags
        is_short = intent.time_horizon in ("today", "tomorrow")

        # ── Birth year animal + element ───────────────────────────
        year_val = get_highlight_value(system_data, "year animal")
        natal_animal = _extract_animal(year_val)
        natal_element = _extract_element(year_val)
        if year_val:
            items.append(EvidenceItem(
                feature="Birth year animal",
                value=year_val,
                weight=0.85,
            ))

        # ── Month animal (career / public influence) ───────────────
        month_val = get_highlight_value(system_data, "month animal")
        month_animal = _extract_animal(month_val)
        if month_val:
            # Boost weight when the question touches career or wealth
            w = 0.75 if (is_career or is_wealth) else 0.45
            items.append(EvidenceItem(
                feature="Month animal",
                value=month_val,
                weight=w,
            ))

        # ── Hour animal (inner self / hidden desires) ──────────────
        hour_val = get_highlight_value(system_data, "hour animal")
        hour_animal = _extract_animal(hour_val)
        if hour_val:
            # Boost weight when the question touches mood or love
            w = 0.70 if (is_mood or is_love) else 0.40
            items.append(EvidenceItem(
                feature="Hour animal",
                value=hour_val,
                weight=w,
            ))

        # ── Current year animal ────────────────────────────────────
        current_val = get_highlight_value(system_data, "current year")
        current_animal = _extract_animal(current_val)
        if current_val:
            items.append(EvidenceItem(
                feature="Current year animal",
                value=current_val,
                weight=0.8,
            ))

        # ── Year relation (harmony / clash) ───────────────────────
        if natal_animal and current_animal:
            relation = _find_relation(system_data, current_animal)
            items.append(EvidenceItem(
                feature="Year relation",
                value=f"{natal_animal}→{current_animal}: {relation}",
                weight=0.9,
            ))

        # ── Secret friend (boosted for love) ──────────────────────
        secret_val = get_highlight_value(system_data, "secret friend")
        secret_animal = _extract_animal(secret_val) if secret_val else None
        if secret_val:
            w = 0.75 if is_love else 0.40
            items.append(EvidenceItem(
                feature="Secret friend",
                value=secret_val,
                weight=w,
            ))

        # ── San He trine detection ─────────────────────────────────
        if natal_animal and current_animal:
            natal_trine = _san_he_group(natal_animal)
            current_trine = _san_he_group(current_animal)
            if (
                natal_trine
                and current_trine
                and natal_trine["element"] == current_trine["element"]
            ):
                items.append(EvidenceItem(
                    feature="San He trine",
                    value=(
                        f"{natal_animal} & {current_animal} share "
                        f"{natal_trine['element']} trine "
                        f"({natal_trine['quality']})"
                    ),
                    weight=0.85,
                ))

        # ── Liu He pair detection ──────────────────────────────────
        if natal_animal and current_animal:
            liu_he = _liu_he_partner(natal_animal, current_animal)
            if liu_he:
                w = 0.80 if is_love else 0.55
                items.append(EvidenceItem(
                    feature="Liu He bonding",
                    value=f"{natal_animal}+{current_animal}: {liu_he}",
                    weight=w,
                ))

        # ── Six Clash detection ────────────────────────────────────
        if natal_animal and current_animal and _is_clash(natal_animal, current_animal):
            items.append(EvidenceItem(
                feature="Six Clash",
                value=f"{natal_animal} clashes with {current_animal}",
                weight=0.90,
            ))

        # ── Element cycle between natal and current year ───────────
        current_element = _extract_element(current_val)
        if natal_element and current_element and natal_element != current_element:
            if ELEMENT_PRODUCES.get(natal_element) == current_element:
                cycle_desc = f"{natal_element} produces {current_element} (flow)"
            elif ELEMENT_PRODUCES.get(current_element) == natal_element:
                cycle_desc = f"{current_element} produces {natal_element} (nourished)"
            elif ELEMENT_DESTROYS.get(natal_element) == current_element:
                cycle_desc = f"{natal_element} destroys {current_element} (dominance)"
            elif ELEMENT_DESTROYS.get(current_element) == natal_element:
                cycle_desc = f"{current_element} destroys {natal_element} (pressure)"
            else:
                cycle_desc = None
            if cycle_desc:
                items.append(EvidenceItem(
                    feature="Element cycle",
                    value=cycle_desc,
                    weight=0.65,
                ))

        # ── Full compatibility table: all 12 animal relations ──────
        comp_rows = get_table_rows(system_data, "compatibility")
        for row in comp_rows:
            if len(row) >= 3:
                animal_name = str(row[0]).strip()
                rel_label = str(row[1]).strip()
                try:
                    delta = float(row[2])
                except (ValueError, TypeError):
                    delta = None
                if animal_name and rel_label:
                    delta_str = f" (delta {delta:+.1f})" if delta is not None else ""
                    items.append(EvidenceItem(
                        feature=f"Compatibility: {animal_name}",
                        value=f"{rel_label}{delta_str}",
                        weight=0.35,
                    ))

        # ── Polarity ──────────────────────────────────────────────
        pol_val = get_highlight_value(system_data, "year polarity")
        if pol_val:
            items.append(EvidenceItem(
                feature="Year polarity",
                value=pol_val,
                weight=0.4,
            ))

        # ── Peach blossom ─────────────────────────────────────────
        peach_val = get_highlight_value(system_data, "peach blossom")
        if peach_val:
            weight = 0.7 if is_love else 0.3
            items.append(EvidenceItem(
                feature="Peach blossom",
                value=peach_val,
                weight=weight,
            ))

        # ── Day animal + reading from current cycle table ─────────
        current_rows = get_table_rows(system_data, "current cycle")
        day_animal: str | None = None
        for row in current_rows:
            label = str(row[0]).lower() if row else ""
            if "day" in label:
                if len(row) >= 3:
                    day_animal = _extract_animal(str(row[2]).strip())
                    items.append(EvidenceItem(
                        feature="Current day animal",
                        value=str(row[2]).strip(),
                        weight=0.6 if is_short else 0.3,
                    ))
                # Column 2 (index 1) = Reading text
                if len(row) >= 2 and str(row[1]).strip():
                    items.append(EvidenceItem(
                        feature="Day animal reading",
                        value=str(row[1]).strip(),
                        weight=0.50 if is_short else 0.25,
                    ))
                break

        # ── Hour animal reading from current cycle table ───────────
        for row in current_rows:
            label = str(row[0]).lower() if row else ""
            if "hour" in label:
                if len(row) >= 2 and str(row[1]).strip():
                    items.append(EvidenceItem(
                        feature="Hour animal reading",
                        value=str(row[1]).strip(),
                        weight=0.55 if (is_mood or is_love) else 0.28,
                    ))
                break

        # ── Upgrade 41: Animal hidden element extraction ─────────
        if natal_animal:
            hidden_elem = ANIMAL_HIDDEN_ELEMENT.get(natal_animal)
            if hidden_elem:
                items.append(EvidenceItem(
                    feature="Hidden element",
                    value=f"{natal_animal} carries hidden {hidden_elem}",
                    weight=0.55,
                    category="element",
                ))

        # ── Upgrade 42: Month-current year clash/harmony ─────────
        if month_animal and current_animal:
            if _is_clash(month_animal, current_animal):
                items.append(EvidenceItem(
                    feature="Month–Year clash",
                    value=f"{month_animal} (month) clashes with {current_animal} (year) — public life friction",
                    weight=0.80,
                    category="animal",
                ))
            else:
                liu_he_month = _liu_he_partner(month_animal, current_animal)
                if liu_he_month:
                    items.append(EvidenceItem(
                        feature="Month–Year Liu He",
                        value=f"{month_animal} (month) bonds with {current_animal} (year) — {liu_he_month}",
                        weight=0.70,
                        category="animal",
                    ))

        # ── Upgrade 43: Seasonal animal strength ─────────────────
        if natal_animal and month_animal:
            natal_season = ANIMAL_SEASON.get(natal_animal)
            current_season = CURRENT_SEASON_MAP.get(month_animal)
            if natal_season and current_season:
                if natal_season == current_season:
                    items.append(EvidenceItem(
                        feature="Seasonal strength",
                        value=f"{natal_animal} is in-season during {current_season} — strong energy",
                        weight=0.65,
                        category="animal",
                    ))
                elif OPPOSITE_SEASON.get(natal_season) == current_season:
                    items.append(EvidenceItem(
                        feature="Seasonal weakness",
                        value=f"{natal_animal} is out-of-season during {current_season} — subdued energy",
                        weight=0.50,
                        category="animal",
                    ))

        # ── Upgrade 44: Self-punishment detection ────────────────
        if natal_animal and current_animal and natal_animal == current_animal:
            if natal_animal in SELF_PUNISHMENT:
                items.append(EvidenceItem(
                    feature="Self-punishment",
                    value=f"{natal_animal} encounters itself — self-punishment year, inner turmoil likely",
                    weight=0.70,
                    category="animal",
                ))

        # ── Upgrade 45: Three Penalties (San Xing) ───────────────
        collected_animals: set[str] = set()
        if natal_animal:
            collected_animals.add(natal_animal)
        if month_animal:
            collected_animals.add(month_animal)
        if hour_animal:
            collected_animals.add(hour_animal)
        if current_animal:
            collected_animals.add(current_animal)
        if collected_animals:
            triggered_penalties = _find_penalties(collected_animals)
            for pen in triggered_penalties:
                items.append(EvidenceItem(
                    feature="Three Penalty (San Xing)",
                    value=f"{pen['name']} activated among {', '.join(sorted(collected_animals & pen['animals']))}",
                    weight=0.80,
                    category="animal",
                ))

        # ── Upgrade 46: Peach Blossom activation timing ──────────
        if natal_animal and current_animal:
            pb_animal = PEACH_BLOSSOM_ANIMAL.get(natal_animal)
            if pb_animal and current_animal == pb_animal:
                w = 0.85 if is_love else 0.60
                items.append(EvidenceItem(
                    feature="Peach Blossom activation",
                    value=f"Peach Blossom activated — {current_animal} year triggers romance for {natal_animal} natives",
                    weight=w,
                    category="star",
                ))

        # ── Upgrade 47: Nobleman Star (Gui Ren) ──────────────────
        if natal_animal and current_animal:
            nobleman_list = NOBLEMAN_ANIMAL.get(natal_animal, [])
            if current_animal in nobleman_list:
                items.append(EvidenceItem(
                    feature="Nobleman Star (Gui Ren)",
                    value=f"Nobleman Star activated — {current_animal} year brings powerful helpers for {natal_animal} natives",
                    weight=0.75,
                    category="star",
                ))

        # ── Upgrade 48: Traveling Horse (Yi Ma) ──────────────────
        if natal_animal and current_animal:
            travel_animal = TRAVELING_HORSE.get(natal_animal)
            if travel_animal and current_animal == travel_animal:
                items.append(EvidenceItem(
                    feature="Traveling Horse (Yi Ma)",
                    value=f"Traveling Horse activated — movement, travel, and career change energy for {natal_animal} natives",
                    weight=0.70,
                    category="star",
                ))

        # ── Upgrade 49: Void/Empty branch (Kong Wang) ────────────
        if natal_animal and day_animal:
            void_set = VOID_BRANCHES.get(natal_animal, set())
            if day_animal in void_set:
                items.append(EvidenceItem(
                    feature="Void branch (Kong Wang)",
                    value=f"Day animal {day_animal} falls into void branch for {natal_animal} — promises today may be unreliable",
                    weight=0.55,
                    category="animal",
                ))

        return items[:20]

    def _compute_stance(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
        evidence: list[EvidenceItem],
    ) -> dict[str, float]:
        options = intent.options or ["favorable", "cautious"]
        polarities = option_polarities(options)

        domain_tags = intent.domain_tags or []
        is_career = "career" in domain_tags
        is_love = "love" in domain_tags
        is_mood = "mood" in domain_tags
        is_short = intent.time_horizon in ("today", "tomorrow")

        action_score = 0.0
        total_weight = 0.0

        # ── Birth year animal archetype ────────────────────────────
        year_val = get_highlight_value(system_data, "year animal")
        natal_animal = _extract_animal(year_val)
        natal_element = _extract_element(year_val)

        # ── Upgrade 50: Animal domain amplification — compute multiplier ──
        natal_weight_multiplier = 0.8  # default
        primary_domain = (domain_tags[0] if domain_tags else None)
        if natal_animal and primary_domain:
            natal_domains = ANIMAL_DOMAIN.get(natal_animal, {})
            if primary_domain in natal_domains:
                natal_weight_multiplier = 1.2

        if natal_animal:
            action_score += ANIMAL_POLARITY.get(natal_animal, 0.0) * natal_weight_multiplier
            total_weight += natal_weight_multiplier
        if natal_element:
            action_score += ELEMENT_ENERGY.get(natal_element, 0.0) * 0.5
            total_weight += 0.5

        # ── Month animal (career-weighted) ─────────────────────────
        month_val = get_highlight_value(system_data, "month animal")
        month_animal = _extract_animal(month_val)

        # ── Upgrade 50: domain amplification for month animal ─────
        month_base_w = 0.6
        if month_animal and primary_domain:
            month_domains = ANIMAL_DOMAIN.get(month_animal, {})
            if primary_domain in month_domains:
                month_base_w = 1.2

        if month_animal:
            base_w = month_base_w
            domain_boost = _domain_weight(month_animal, "career", 0.5) if is_career else 0.5
            w = base_w * domain_boost / 0.5  # normalised boost
            w = min(w, 1.5)
            action_score += ANIMAL_POLARITY.get(month_animal, 0.0) * w
            total_weight += w

        # ── Hour animal (mood/love-weighted) ──────────────────────
        hour_val = get_highlight_value(system_data, "hour animal")
        hour_animal = _extract_animal(hour_val)

        # ── Upgrade 50: domain amplification for hour animal ──────
        hour_base_w = 0.5
        if hour_animal and primary_domain:
            hour_domains = ANIMAL_DOMAIN.get(hour_animal, {})
            if primary_domain in hour_domains:
                hour_base_w = 1.2

        if hour_animal:
            base_w = hour_base_w
            if is_mood:
                domain_boost = _domain_weight(hour_animal, "mood", 0.5)
                w = base_w * domain_boost / 0.5
            elif is_love:
                domain_boost = _domain_weight(hour_animal, "love", 0.5)
                w = base_w * domain_boost / 0.5
            else:
                w = base_w
            w = min(w, 1.5)
            action_score += ANIMAL_POLARITY.get(hour_animal, 0.0) * w
            total_weight += w

        # ── Current year relation ──────────────────────────────────
        current_val = get_highlight_value(system_data, "current year")
        current_animal = _extract_animal(current_val)
        if natal_animal and current_animal:
            relation = _find_relation(system_data, current_animal)
            push = 0.0
            for key, val in RELATION_PUSH.items():
                if key.lower() in relation.lower():
                    push = val
                    break
            action_score += push * 1.5
            total_weight += 1.5

            # Compatibility table delta (numeric harmony score, −1.0 to +1.0 range)
            delta = _find_delta(system_data, current_animal)
            if delta is not None:
                # Normalise delta to a reasonable influence weight
                action_score += (delta / 10.0) * 1.0
                total_weight += 1.0

        # ── Secret friend bonus ────────────────────────────────────
        secret_val = get_highlight_value(system_data, "secret friend")
        secret_animal = _extract_animal(secret_val) if secret_val else None
        if secret_animal and current_animal and secret_animal == current_animal:
            # Current year IS the secret friend → love/harmony boost
            w = 1.0 if is_love else 0.5
            action_score += 0.45 * w
            total_weight += w

        # ── San He trine bonus ─────────────────────────────────────
        if natal_animal and current_animal:
            natal_trine = _san_he_group(natal_animal)
            current_trine = _san_he_group(current_animal)
            if (
                natal_trine
                and current_trine
                and natal_trine["element"] == current_trine["element"]
            ):
                # Same trine = strong harmony → action support
                action_score += 0.50 * 1.2
                total_weight += 1.2

        # ── Liu He pair bonus ──────────────────────────────────────
        if natal_animal and current_animal:
            liu_he = _liu_he_partner(natal_animal, current_animal)
            if liu_he:
                w = 1.1 if is_love else 0.7
                action_score += 0.40 * w
                total_weight += w

        # ── Six Clash penalty ─────────────────────────────────────
        if natal_animal and current_animal and _is_clash(natal_animal, current_animal):
            action_score += -0.60 * 1.4
            total_weight += 1.4

        # ── Element cycle analysis ─────────────────────────────────
        current_element = _extract_element(current_val)
        if natal_element and current_element:
            cycle_effect = _element_cycle_effect(natal_element, current_element)
            action_score += cycle_effect * 0.9
            total_weight += 0.9

        # ── Current year element energy ────────────────────────────
        if current_element:
            action_score += ELEMENT_ENERGY.get(current_element, 0.0) * 0.6
            total_weight += 0.6

        # ── Current day animal (short-term) ────────────────────────
        current_rows = get_table_rows(system_data, "current cycle")
        day_animal: str | None = None
        for row in current_rows:
            if len(row) >= 3 and "day" in str(row[0]).lower():
                day_animal = _extract_animal(str(row[2]))
                if day_animal:
                    w = 1.0 if is_short else 0.3
                    action_score += ANIMAL_POLARITY.get(day_animal, 0.0) * w
                    total_weight += w
                break

        # ── Hour animal short-term mood influence ──────────────────
        for row in current_rows:
            if len(row) >= 2 and "hour" in str(row[0]).lower():
                hour_cycle_animal = _extract_animal(str(row[2]) if len(row) >= 3 else "")
                if hour_cycle_animal:
                    w = 0.55 if (is_mood or is_love) else 0.25
                    action_score += ANIMAL_POLARITY.get(hour_cycle_animal, 0.0) * w
                    total_weight += w
                break

        # ── Upgrade 41: Animal hidden element harmony/clash ──────
        if natal_animal and current_animal:
            natal_hidden = ANIMAL_HIDDEN_ELEMENT.get(natal_animal)
            current_year_elem = _extract_element(current_val)
            if natal_hidden and current_year_elem:
                hidden_signal = _hidden_elements_clash(natal_hidden, current_year_elem)
                if hidden_signal != 0.0:
                    action_score += hidden_signal * 0.7
                    total_weight += 0.7

        # ── Upgrade 42: Month-current year clash/harmony ─────────
        if month_animal and current_animal:
            if _is_clash(month_animal, current_animal):
                action_score += -0.30 * 0.8
                total_weight += 0.8
            else:
                liu_he_month = _liu_he_partner(month_animal, current_animal)
                if liu_he_month:
                    action_score += 0.25 * 0.8
                    total_weight += 0.8

        # ── Upgrade 43: Seasonal animal strength ─────────────────
        if natal_animal and month_animal:
            natal_season = ANIMAL_SEASON.get(natal_animal)
            current_season = CURRENT_SEASON_MAP.get(month_animal)
            if natal_season and current_season:
                if natal_season == current_season:
                    action_score += 0.12 * 0.6
                    total_weight += 0.6
                elif OPPOSITE_SEASON.get(natal_season) == current_season:
                    action_score += -0.08 * 0.6
                    total_weight += 0.6

        # ── Upgrade 44: Self-punishment detection ────────────────
        if natal_animal and current_animal and natal_animal == current_animal:
            if natal_animal in SELF_PUNISHMENT:
                action_score += -0.20 * 0.70
                total_weight += 0.70

        # ── Upgrade 45: Three Penalties (San Xing) ───────────────
        collected_animals: set[str] = set()
        if natal_animal:
            collected_animals.add(natal_animal)
        if month_animal:
            collected_animals.add(month_animal)
        if hour_animal:
            collected_animals.add(hour_animal)
        if current_animal:
            collected_animals.add(current_animal)
        if collected_animals:
            triggered_penalties = _find_penalties(collected_animals)
            for pen in triggered_penalties:
                pen_weight = 0.9
                action_score += pen["polarity"] * pen_weight
                total_weight += pen_weight

        # ── Upgrade 46: Peach Blossom activation timing ──────────
        if natal_animal and current_animal:
            pb_animal = PEACH_BLOSSOM_ANIMAL.get(natal_animal)
            if pb_animal and current_animal == pb_animal:
                if is_love:
                    action_score += 0.25 * 0.9
                    total_weight += 0.9
                else:
                    action_score += 0.10 * 0.5
                    total_weight += 0.5

        # ── Upgrade 47: Nobleman Star (Gui Ren) ──────────────────
        if natal_animal and current_animal:
            nobleman_list = NOBLEMAN_ANIMAL.get(natal_animal, [])
            if current_animal in nobleman_list:
                w = 0.9 if is_career else 0.7
                action_score += 0.15 * w
                total_weight += w

        # ── Upgrade 48: Traveling Horse (Yi Ma) ──────────────────
        if natal_animal and current_animal:
            travel_animal = TRAVELING_HORSE.get(natal_animal)
            if travel_animal and current_animal == travel_animal:
                if is_career:
                    action_score += 0.20 * 0.8
                    total_weight += 0.8
                elif is_mood or domain_tags and domain_tags[0] == "health":
                    # Neutral for mood/health — no score change, small weight
                    action_score += 0.0 * 0.3
                    total_weight += 0.3
                else:
                    action_score += 0.15 * 0.6
                    total_weight += 0.6

        # ── Upgrade 49: Void/Empty branch (Kong Wang) ────────────
        if natal_animal and day_animal:
            void_set = VOID_BRANCHES.get(natal_animal, set())
            if day_animal in void_set:
                action_score += -0.10 * 0.5
                total_weight += 0.5

        raw = action_score / total_weight if total_weight > 0 else 0.0
        return polarity_to_stance(options, raw)
