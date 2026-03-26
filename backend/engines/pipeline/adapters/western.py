"""Western Astrology adapter — deep planetary logic.

Uses:
  - Moon sign → emotional tone (rest vs action)
  - Moon phase → timing cycle (new=withdraw, full=act, waning=rest)
  - Transit interpretation → specific meaning per planet+aspect+natal
  - Retrograde detection → Mercury/Venus/Mars Rx modify advice
  - Element balance → fire/air = action, water/earth = rest
  - Venus sign/house → love domain influence
  - Mars sign/house → health/career domain influence
  - Ascendant sign → self/health/mood baseline
  - Midheaven sign → career/status influence
  - Dominant modality → Cardinal=action, Fixed=wait, Mutable=adapt
  - Planet conditions → Dignified/Exalted boost, Detriment/Fall caution
  - Natal aspect tension → hard vs soft aspects for overall chart tone
  - Planet dignity system → domicile/exaltation boost; detriment/fall caution
  - House domain mapping → house placements linked to life areas
  - Aspect orb weighting → tighter orbs carry more influence (Upgrade 18)
  - Applying vs separating → direct planets strengthen, retrograde weakens (Upgrade 19)
  - Lunar node interpretation → North Node house aligned with soul direction (Upgrade 20)
  - Rulership chain logic → sign ruler dignity boosts domain stance (Upgrade 21)
  - House ruler integration → ruling planet condition modifies stance (Upgrade 22)
  - Compound transit detection → overlapping transits amplify or create tension (Upgrade 23)
  - Element/modality balance in stance → dominant element vs question direction (Upgrade 24)
  - Retrograde shadow period → Mercury post-shadow caution flag (Upgrade 25)
  - Aspect pattern recognition → Grand Trine / T-Square / Yod detection (Upgrade 26)
"""

from __future__ import annotations

from typing import Any

from ..moon_phase import compute_phase, phase_evidence
from ..retrograde import detect_retrogrades, retrograde_evidence
from ..schemas import ClassifiedIntent, EvidenceItem
from ..transit_interpreter import interpret_all_transits, transit_evidence
from .base import (
    BaseAdapter,
    get_highlight_value,
    get_table_rows,
    option_polarities,
    polarity_to_stance,
)

SIGN_ELEMENT: dict[str, str] = {
    "Aries": "Fire", "Taurus": "Earth", "Gemini": "Air", "Cancer": "Water",
    "Leo": "Fire", "Virgo": "Earth", "Libra": "Air", "Scorpio": "Water",
    "Sagittarius": "Fire", "Capricorn": "Earth", "Aquarius": "Air", "Pisces": "Water",
}

ELEMENT_POLARITY: dict[str, float] = {
    "Fire": 0.8, "Air": 0.5, "Earth": -0.3, "Water": -0.7,
}

PLANET_INFLUENCE: dict[str, float] = {
    "Mars": 0.7, "Jupiter": 0.4, "Sun": 0.3, "Mercury": 0.2,
    "Venus": -0.1, "Moon": 0.0, "Saturn": -0.6, "Neptune": -0.3,
    "Uranus": 0.5, "Pluto": -0.2,
}

ASPECT_STRENGTH: dict[str, float] = {
    "Conjunction": 1.0, "Opposition": 0.8, "Square": 0.7,
    "Trine": 0.6, "Sextile": 0.5,
}

HARD_ASPECTS = {"Square", "Opposition"}

# ── Planet dignity system ─────────────────────────────────────────
# Each entry maps a planet to its four dignity states.
# Domicile/exaltation = strength; detriment/fall = weakness.
PLANET_DIGNITY: dict[str, dict[str, list[str]]] = {
    "Sun": {
        "domicile": ["Leo"],
        "exaltation": ["Aries"],
        "detriment": ["Aquarius"],
        "fall": ["Libra"],
    },
    "Moon": {
        "domicile": ["Cancer"],
        "exaltation": ["Taurus"],
        "detriment": ["Capricorn"],
        "fall": ["Scorpio"],
    },
    "Mercury": {
        "domicile": ["Gemini", "Virgo"],
        "exaltation": ["Virgo"],
        "detriment": ["Sagittarius", "Pisces"],
        "fall": ["Pisces"],
    },
    "Venus": {
        "domicile": ["Taurus", "Libra"],
        "exaltation": ["Pisces"],
        "detriment": ["Scorpio", "Aries"],
        "fall": ["Virgo"],
    },
    "Mars": {
        "domicile": ["Aries", "Scorpio"],
        "exaltation": ["Capricorn"],
        "detriment": ["Libra", "Taurus"],
        "fall": ["Cancer"],
    },
    "Jupiter": {
        "domicile": ["Sagittarius", "Pisces"],
        "exaltation": ["Cancer"],
        "detriment": ["Gemini", "Virgo"],
        "fall": ["Capricorn"],
    },
    "Saturn": {
        "domicile": ["Capricorn", "Aquarius"],
        "exaltation": ["Libra"],
        "detriment": ["Cancer", "Leo"],
        "fall": ["Aries"],
    },
}

# ── House domain mapping ──────────────────────────────────────────
# Each house is linked to life-area domains and a human-readable meaning.
HOUSE_DOMAIN: dict[int, dict[str, Any]] = {
    1:  {"domains": ["health", "mood"],         "meaning": "self and vitality"},
    2:  {"domains": ["wealth"],                  "meaning": "possessions and income"},
    3:  {"domains": ["career", "mood"],          "meaning": "communication and learning"},
    4:  {"domains": ["mood", "love"],            "meaning": "home and emotional foundation"},
    5:  {"domains": ["love", "mood"],            "meaning": "romance, creativity, and pleasure"},
    6:  {"domains": ["health", "career"],        "meaning": "daily work and health routines"},
    7:  {"domains": ["love"],                    "meaning": "partnerships and marriage"},
    8:  {"domains": ["wealth", "health"],        "meaning": "shared resources and transformation"},
    9:  {"domains": ["career", "mood"],          "meaning": "higher learning and expansion"},
    10: {"domains": ["career"],                  "meaning": "public status and achievement"},
    11: {"domains": ["career", "mood"],          "meaning": "community and aspirations"},
    12: {"domains": ["health", "mood"],          "meaning": "hidden matters and spiritual retreat"},
}

# ── Modality influence ────────────────────────────────────────────
# Cardinal = action-oriented, Fixed = stable/resistant, Mutable = adaptive.
MODALITY_POLARITY: dict[str, float] = {
    "Cardinal": 0.6, "Fixed": -0.3, "Mutable": 0.2,
}

# Planet condition strings reported by the engine (condition column).
# Positive conditions boost evidence weight; negative ones flag caution.
CONDITION_POLARITY: dict[str, float] = {
    "Dignified": 0.3,
    "Exalted":   0.4,
    "Peregrine": 0.0,
    "Detriment": -0.3,
    "Fall":      -0.4,
}

# ── Upgrade 20: North Node house themes ──────────────────────────
NODE_THEMES: dict[int, str] = {
    1:  "self-discovery and personal identity are your soul's direction",
    2:  "building material security and self-worth is your soul's direction",
    3:  "communication and sharing knowledge is your soul's direction",
    4:  "creating emotional roots and home life is your soul's direction",
    5:  "creative self-expression and joy are your soul's direction",
    6:  "service, health, and daily practice are your soul's direction",
    7:  "partnerships and commitment are your soul's direction",
    8:  "deep transformation and shared resources are your soul's direction",
    9:  "expanding horizons and higher learning are your soul's direction",
    10: "public achievement and career legacy are your soul's direction",
    11: "community, ideals, and collective vision are your soul's direction",
    12: "spiritual surrender and inner wisdom are your soul's direction",
}

# Mapping from Node house to relevant domains
_NODE_HOUSE_DOMAINS: dict[int, list[str]] = {
    1: ["health", "mood"], 2: ["wealth"], 3: ["career", "mood"],
    4: ["mood", "love"], 5: ["love", "mood"], 6: ["health", "career"],
    7: ["love"], 8: ["wealth", "health"], 9: ["career", "mood"],
    10: ["career"], 11: ["career", "mood"], 12: ["health", "mood"],
}

# ── Upgrade 21: Sign-to-ruler mapping ────────────────────────────
SIGN_RULER: dict[str, str] = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury",
    "Cancer": "Moon", "Leo": "Sun", "Virgo": "Mercury",
    "Libra": "Venus", "Scorpio": "Pluto", "Sagittarius": "Jupiter",
    "Capricorn": "Saturn", "Aquarius": "Uranus", "Pisces": "Neptune",
}

# ── Upgrade 25: Mercury shadow period detection ─────────────────
SHADOW_PLANETS: set[str] = {"Mercury"}

# ── Upgrade 24: Element-to-action keywords mapping ──────────────
# Action-oriented question keywords → element that supports them
_ACTION_ELEMENTS = {"Fire", "Air"}
_REST_ELEMENTS = {"Water", "Earth"}
_ACTION_KEYWORDS = {
    "bold", "leap", "start", "begin", "act", "move", "change", "risk",
    "launch", "pursue", "go", "jump", "take", "initiate", "advance",
}
_REST_KEYWORDS = {
    "wait", "rest", "pause", "hold", "stay", "slow", "reflect",
    "withdraw", "retreat", "conserve", "protect", "careful",
}


def _parse_sign(value: str) -> str | None:
    for sign in SIGN_ELEMENT:
        if sign in value:
            return sign
    return None


def _parse_house(value: str) -> int | None:
    """Extract house number from a string like 'Leo (House 5)' or '5'."""
    import re
    m = re.search(r"[Hh]ouse\s*(\d{1,2})", value)
    if m:
        h = int(m.group(1))
        return h if 1 <= h <= 12 else None
    m = re.search(r"\b(\d{1,2})\b", value)
    if m:
        h = int(m.group(1))
        return h if 1 <= h <= 12 else None
    return None


def _dignity_state(planet: str, sign: str) -> str | None:
    """Return 'domicile', 'exaltation', 'detriment', 'fall', or None."""
    info = PLANET_DIGNITY.get(planet)
    if not info:
        return None
    for state in ("domicile", "exaltation", "detriment", "fall"):
        if sign in info[state]:
            return state
    return None


def _dignity_weight_delta(state: str | None) -> float:
    """Return weight adjustment for a dignity state."""
    if state in ("domicile", "exaltation"):
        return 0.15
    if state in ("detriment", "fall"):
        return -0.10
    return 0.0


def _house_domain_match(house: int | None, domains: list[str]) -> bool:
    """Return True when the house governs at least one of the queried domains."""
    if house is None:
        return False
    house_info = HOUSE_DOMAIN.get(house, {})
    house_domains = set(house_info.get("domains", []))
    return bool(house_domains & set(domains))


def _parse_degree(value: str) -> float | None:
    """Extract a numeric degree from a string like '12.45' or '12°30'."""
    import re
    m = re.search(r"(\d+(?:\.\d+)?)", str(value))
    if m:
        return float(m.group(1))
    return None


def _parse_orb(value: str) -> float | None:
    """Extract orb value from a column string like '2.34' or '2°34'."""
    import re
    m = re.search(r"(\d+(?:\.\d+)?)", str(value).strip())
    if m:
        return float(m.group(1))
    return None


def _orb_weight_factor(orb: float | None) -> float:
    """Upgrade 18: orb-based weight multiplier for aspect influence.

    Tight (<2°) = 1.0x, moderate (2-5°) = 0.7x, wide (5-8°) = 0.4x.
    """
    if orb is None:
        return 0.7  # default to moderate when orb is unknown
    if orb < 2.0:
        return 1.0
    if orb < 5.0:
        return 0.7
    return 0.4


def _question_implies_action(question_text: str) -> str | None:
    """Upgrade 24: determine if a question implies action or rest.

    Returns 'action', 'rest', or None.
    """
    words = set(question_text.lower().split())
    action_hits = len(words & _ACTION_KEYWORDS)
    rest_hits = len(words & _REST_KEYWORDS)
    if action_hits > rest_hits and action_hits > 0:
        return "action"
    if rest_hits > action_hits and rest_hits > 0:
        return "rest"
    return None


class WesternAdapter(BaseAdapter):
    system_id = "western"
    system_name = "Western Astrology"
    confidence_scale = 1.0

    # ── Upgrade 26: Aspect pattern recognition ──────────────────
    @staticmethod
    def _detect_aspect_patterns(aspect_rows: list[list]) -> list[EvidenceItem]:
        """Scan aspect rows for Grand Trine, T-Square, and Yod patterns."""
        patterns: list[EvidenceItem] = []

        # Build lookup structures: aspect_name → list of (planetA, planetB)
        trines: list[tuple[str, str]] = []
        oppositions: list[tuple[str, str]] = []
        squares: list[tuple[str, str]] = []
        sextiles: list[tuple[str, str]] = []
        quincunxes: list[tuple[str, str]] = []

        for row in aspect_rows:
            if len(row) < 2:
                continue
            pair_str = str(row[0]).strip()
            aspect_name = str(row[1]).strip()
            # Parse pair: "Sun-Moon", "Sun / Moon", "Sun–Moon", etc.
            parts = [p.strip() for p in pair_str.replace("–", "-").replace("/", "-").split("-") if p.strip()]
            if len(parts) != 2:
                continue
            pa, pb = parts[0], parts[1]
            if aspect_name == "Trine":
                trines.append((pa, pb))
            elif aspect_name == "Opposition":
                oppositions.append((pa, pb))
            elif aspect_name == "Square":
                squares.append((pa, pb))
            elif aspect_name == "Sextile":
                sextiles.append((pa, pb))
            elif aspect_name in ("Quincunx", "Inconjunct"):
                quincunxes.append((pa, pb))

        # Helper: collect all planets involved in an aspect list
        def _planets_in(pairs: list[tuple[str, str]]) -> set[str]:
            s: set[str] = set()
            for a, b in pairs:
                s.add(a)
                s.add(b)
            return s

        # Helper: check if 3 planets are mutually connected by a list of pairs
        def _three_connected(pairs: list[tuple[str, str]]) -> set[str] | None:
            planets = _planets_in(pairs)
            pair_set = {frozenset(p) for p in pairs}
            planet_list = list(planets)
            for i in range(len(planet_list)):
                for j in range(i + 1, len(planet_list)):
                    for k in range(j + 1, len(planet_list)):
                        a, b, c = planet_list[i], planet_list[j], planet_list[k]
                        if (
                            frozenset([a, b]) in pair_set
                            and frozenset([b, c]) in pair_set
                            and frozenset([a, c]) in pair_set
                        ):
                            return {a, b, c}
            return None

        # Grand Trine: 3 planets each trine to each other
        gt_planets = _three_connected(trines)
        if gt_planets:
            patterns.append(EvidenceItem(
                feature="Grand Trine",
                value="Grand Trine detected — natural flow and ease",
                weight=0.85,
                category="aspect",
            ))

        # T-Square: 2 planets in opposition, both square a 3rd
        opp_set = {frozenset(p) for p in oppositions}
        sq_set = {frozenset(p) for p in squares}
        t_square_found = False
        for opp_a, opp_b in oppositions:
            if t_square_found:
                break
            # Find a planet that squares both opp_a and opp_b
            sq_planets = _planets_in(squares)
            for apex in sq_planets:
                if apex == opp_a or apex == opp_b:
                    continue
                if frozenset([apex, opp_a]) in sq_set and frozenset([apex, opp_b]) in sq_set:
                    patterns.append(EvidenceItem(
                        feature="T-Square",
                        value="T-Square detected — tension driving growth",
                        weight=0.80,
                        category="aspect",
                    ))
                    t_square_found = True
                    break

        # Yod (Finger of God): 2 quincunxes + 1 sextile forming a Y
        qx_set = {frozenset(p) for p in quincunxes}
        sx_set = {frozenset(p) for p in sextiles}
        yod_found = False
        for qa, qb in quincunxes:
            if yod_found:
                break
            # qa is the apex (quincunx to both base planets)
            # Find another quincunx from qa to a different planet
            for qa2, qb2 in quincunxes:
                if yod_found:
                    break
                other = None
                if qa2 == qa and qb2 != qb:
                    other = qb2
                elif qb2 == qa and qa2 != qb:
                    other = qa2
                if other is None:
                    continue
                # Check if the two base planets (qb and other) are sextile
                if frozenset([qb, other]) in sx_set:
                    patterns.append(EvidenceItem(
                        feature="Yod",
                        value="Yod detected — fated redirection point",
                        weight=0.85,
                        category="aspect",
                    ))
                    yod_found = True

        return patterns

    def _extract_evidence(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
    ) -> list[EvidenceItem]:
        items: list[EvidenceItem] = []

        # Moon phase (improvement #2)
        phase = compute_phase(system_data)
        if phase:
            items.append(phase_evidence(phase, intent.time_horizon))

        # Sun sign
        sun_val = get_highlight_value(system_data, "sun")
        if sun_val:
            sun_sign = _parse_sign(sun_val)
            sun_state = _dignity_state("Sun", sun_sign) if sun_sign else None
            w = round(0.7 + _dignity_weight_delta(sun_state), 2)
            items.append(EvidenceItem(feature="Sun sign", value=sun_val, weight=w))

        # Moon sign
        moon_val = get_highlight_value(system_data, "moon")
        if moon_val:
            base_w = 0.9 if intent.time_horizon in ("today", "tomorrow") else 0.7
            moon_sign = _parse_sign(moon_val)
            moon_state = _dignity_state("Moon", moon_sign) if moon_sign else None
            w = round(min(base_w + _dignity_weight_delta(moon_state), 1.0), 2)
            items.append(EvidenceItem(feature="Moon sign", value=moon_val, weight=w))

        # Dominant element
        elem_val = get_highlight_value(system_data, "dominant element")
        if elem_val:
            items.append(EvidenceItem(feature="Dominant element", value=elem_val, weight=0.6))

        # ── Venus sign / house ────────────────────────────────────
        venus_val = get_highlight_value(system_data, "venus")
        if venus_val:
            venus_sign = _parse_sign(venus_val)
            venus_house = _parse_house(venus_val)
            venus_state = _dignity_state("Venus", venus_sign) if venus_sign else None
            base_w = 0.65
            if "love" in intent.domain_tags:
                base_w = 0.85
            elif "mood" in intent.domain_tags:
                base_w = 0.70
            w = round(min(base_w + _dignity_weight_delta(venus_state), 1.0), 2)
            house_info = HOUSE_DOMAIN.get(venus_house, {}) if venus_house else {}
            house_meaning = house_info.get("meaning", "")
            value_str = venus_val
            if house_meaning:
                value_str = f"{venus_val} — {house_meaning}"
            if venus_state in ("detriment", "fall"):
                value_str += f" (caution: {venus_state})"
            items.append(EvidenceItem(feature="Venus", value=value_str, weight=w))

        # ── Mars sign / house ─────────────────────────────────────
        mars_val = get_highlight_value(system_data, "mars")
        if mars_val:
            mars_sign = _parse_sign(mars_val)
            mars_house = _parse_house(mars_val)
            mars_state = _dignity_state("Mars", mars_sign) if mars_sign else None
            base_w = 0.60
            if "health" in intent.domain_tags or "career" in intent.domain_tags:
                base_w = 0.80
            w = round(min(base_w + _dignity_weight_delta(mars_state), 1.0), 2)
            house_info = HOUSE_DOMAIN.get(mars_house, {}) if mars_house else {}
            house_meaning = house_info.get("meaning", "")
            value_str = mars_val
            if house_meaning:
                value_str = f"{mars_val} — {house_meaning}"
            if mars_state in ("detriment", "fall"):
                value_str += f" (caution: {mars_state})"
            items.append(EvidenceItem(feature="Mars", value=value_str, weight=w))

        # ── Ascendant sign ────────────────────────────────────────
        asc_val = get_highlight_value(system_data, "ascendant")
        if asc_val:
            base_w = 0.70
            if "health" in intent.domain_tags or "mood" in intent.domain_tags:
                base_w = 0.85
            items.append(EvidenceItem(feature="Ascendant", value=asc_val, weight=base_w))

        # ── Midheaven sign ────────────────────────────────────────
        mc_val = get_highlight_value(system_data, "midheaven")
        if mc_val:
            base_w = 0.65
            if "career" in intent.domain_tags:
                base_w = 0.85
            items.append(EvidenceItem(feature="Midheaven", value=mc_val, weight=base_w))

        # ── Dominant modality ─────────────────────────────────────
        mod_val = get_highlight_value(system_data, "dominant modality")
        if mod_val:
            items.append(EvidenceItem(feature="Dominant modality", value=mod_val, weight=0.55))

        # ── Planet conditions from planetary positions table ───────
        planet_rows = get_table_rows(system_data, "planet")
        if not planet_rows:
            # Some engines label the table differently — try generic fallback
            planet_rows = get_table_rows(system_data, "position")
        for row in planet_rows:
            # Expected column order: Body, Sign, Degree, House, Motion, Condition
            if len(row) < 6:
                continue
            body      = str(row[0]).strip()
            sign      = str(row[1]).strip()
            house_raw = str(row[3]).strip()
            condition = str(row[5]).strip()

            if condition in ("", "—", "-", "Normal"):
                continue  # skip uninformative conditions

            cond_pol = CONDITION_POLARITY.get(condition, 0.0)
            base_w = 0.55 + abs(cond_pol)  # stronger conditions carry more weight
            base_w = round(min(base_w, 0.95), 2)

            # Boost when the planet's house is domain-relevant
            house_num = _parse_house(house_raw)
            if house_num and _house_domain_match(house_num, intent.domain_tags):
                base_w = round(min(base_w + 0.10, 1.0), 2)

            label = f"{condition.capitalize()}" if cond_pol >= 0 else f"Caution: {condition}"
            items.append(EvidenceItem(
                feature=f"{body} condition",
                value=f"{body} in {sign} — {label}",
                weight=base_w,
            ))

        # ── Natal aspects: hard vs soft tension indicator ──────────
        # Upgrade 18: extract orb and set it on aspect-related evidence items
        aspect_rows = get_table_rows(system_data, "aspect")
        hard_count = 0
        soft_count = 0
        for row in aspect_rows:
            # Expected column order: Pair, Aspect, Distance, Orb
            if len(row) < 2:
                continue
            aspect_name = str(row[1]).strip()
            orb_val = _parse_orb(str(row[3])) if len(row) >= 4 else None
            orb_factor = _orb_weight_factor(orb_val)
            if aspect_name in HARD_ASPECTS:
                hard_count += 1
                # Individual tight hard aspects are noteworthy
                if orb_val is not None and orb_val < 2.0:
                    pair = str(row[0]).strip() if len(row) >= 1 else "unknown"
                    items.append(EvidenceItem(
                        feature=f"Tight {aspect_name}",
                        value=f"{pair} — {aspect_name} (orb {orb_val:.1f}°)",
                        weight=round(min(0.70 * orb_factor, 1.0), 2),
                        orb=orb_val,
                        category="aspect",
                    ))
            elif aspect_name in {"Trine", "Sextile"}:
                soft_count += 1

        if hard_count + soft_count > 0:
            total_aspects = hard_count + soft_count
            tension_pct = round(hard_count / total_aspects * 100)
            if hard_count > soft_count:
                tension_label = f"{tension_pct}% hard aspects — chart tension present"
                tension_w = 0.65
            else:
                tension_label = f"{100 - tension_pct}% soft aspects — chart flow present"
                tension_w = 0.60
            items.append(EvidenceItem(
                feature="Natal aspect balance",
                value=tension_label,
                weight=tension_w,
                category="aspect",
            ))

        # ── Upgrade 26: Aspect pattern recognition ──────────────
        items.extend(self._detect_aspect_patterns(aspect_rows))

        # ── Upgrade 20: Lunar node interpretation ───────────────
        node_val = (
            get_highlight_value(system_data, "north node")
            or get_highlight_value(system_data, "node")
        )
        if node_val:
            node_house = _parse_house(node_val)
            if node_house and node_house in NODE_THEMES:
                theme = NODE_THEMES[node_house]
                node_domains = _NODE_HOUSE_DOMAINS.get(node_house, [])
                domain_match = bool(set(node_domains) & set(intent.domain_tags))
                if domain_match:
                    items.append(EvidenceItem(
                        feature="North Node",
                        value=f"House {node_house} — {theme}",
                        weight=0.80,
                        category="house",
                    ))

        # ── Deep transit interpretation (improvement #1) — domain-filtered
        # Upgrade 4: boost transit evidence weights for timing/general questions
        transit_interps = interpret_all_transits(system_data, intent.domain_tags)
        transit_items = transit_evidence(transit_interps, max_items=3, domains=intent.domain_tags)
        if intent.question_type in ("timing_question", "general_guidance_question"):
            for ti in transit_items:
                ti = EvidenceItem(
                    feature=ti.feature,
                    value=ti.value,
                    weight=round(min(ti.weight + 0.20, 1.0), 2),
                )
                items.insert(0, ti)  # prioritize at front
        else:
            items.extend(transit_items)

        # ── Retrograde detection (improvement #5) ─────────────────
        retrogrades = detect_retrogrades(system_data)
        items.extend(retrograde_evidence(retrogrades, intent.domain_tags))

        # ── Upgrade 25: Mercury post-shadow period ──────────────
        # If Mercury is Direct but degree < 15° in its sign, flag as
        # post-retrograde shadow (communication still clearing).
        rx_planets = {rx["planet"] for rx in retrogrades}
        if "Mercury" not in rx_planets:
            # Mercury is not currently retrograde — check for shadow
            planet_rows_shadow = get_table_rows(system_data, "planet")
            if not planet_rows_shadow:
                planet_rows_shadow = get_table_rows(system_data, "position")
            for row in planet_rows_shadow:
                if len(row) < 5:
                    continue
                body = str(row[0]).strip()
                if body not in SHADOW_PLANETS:
                    continue
                motion = str(row[4]).strip()
                if motion == "D":
                    degree = _parse_degree(str(row[2]).strip()) if len(row) >= 3 else None
                    if degree is not None and degree < 15.0:
                        items.append(EvidenceItem(
                            feature="Mercury post-shadow",
                            value="Mercury post-shadow — communication still clearing",
                            weight=0.40,
                            category="planet",
                        ))

        return items[:16]

    def _compute_stance(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
        evidence: list[EvidenceItem],
    ) -> dict[str, float]:
        options = intent.options or ["favorable", "cautious"]

        action_score = 0.0
        total_weight = 0.0

        # ── Moon phase (strongest short-term signal) ───────────────
        phase = compute_phase(system_data)
        if phase:
            w = 3.0 if intent.time_horizon in ("today", "tomorrow") else 1.5
            action_score += phase["polarity"] * w
            total_weight += w

        # ── Moon sign element ──────────────────────────────────────
        moon_val = get_highlight_value(system_data, "moon")
        if moon_val:
            moon_sign = _parse_sign(moon_val)
            if moon_sign:
                elem = SIGN_ELEMENT[moon_sign]
                w = 2.0 if intent.time_horizon in ("today", "tomorrow") else 1.0
                action_score += ELEMENT_POLARITY[elem] * w
                total_weight += w

        # ── Dominant element ───────────────────────────────────────
        elem_val = get_highlight_value(system_data, "dominant element")
        if elem_val:
            for elem, pol in ELEMENT_POLARITY.items():
                if elem.lower() in elem_val.lower():
                    action_score += pol * 0.8
                    total_weight += 0.8
                    break

        # ── Venus position influence ───────────────────────────────
        # Venus in fire/air = outgoing, expressive love; water/earth = cautious
        venus_val = get_highlight_value(system_data, "venus")
        if venus_val and "love" in intent.domain_tags:
            venus_sign = _parse_sign(venus_val)
            if venus_sign:
                elem = SIGN_ELEMENT[venus_sign]
                # Fire/air Venus → more expressive/favorable for love questions
                venus_pol = ELEMENT_POLARITY[elem] * 0.6
                venus_state = _dignity_state("Venus", venus_sign)
                if venus_state in ("domicile", "exaltation"):
                    venus_pol += 0.2
                elif venus_state in ("detriment", "fall"):
                    venus_pol -= 0.2
                action_score += venus_pol * 1.5
                total_weight += 1.5

        # ── Mars position influence ────────────────────────────────
        # Mars in fire = strong drive; water = lower drive / internalized
        mars_val = get_highlight_value(system_data, "mars")
        if mars_val and (
            "health" in intent.domain_tags or "career" in intent.domain_tags
        ):
            mars_sign = _parse_sign(mars_val)
            if mars_sign:
                elem = SIGN_ELEMENT[mars_sign]
                mars_pol = ELEMENT_POLARITY[elem] * 0.5
                mars_state = _dignity_state("Mars", mars_sign)
                if mars_state in ("domicile", "exaltation"):
                    mars_pol += 0.25
                elif mars_state in ("detriment", "fall"):
                    mars_pol -= 0.25
                action_score += mars_pol * 1.2
                total_weight += 1.2

        # ── Modality balance influence ─────────────────────────────
        # Cardinal-heavy = action-ready; Fixed-heavy = wait/hold; Mutable = adapt
        mod_val = get_highlight_value(system_data, "dominant modality")
        if mod_val:
            for mod, pol in MODALITY_POLARITY.items():
                if mod.lower() in mod_val.lower():
                    action_score += pol * 0.9
                    total_weight += 0.9
                    break
        else:
            # Fall back to modality counts in meta if available
            meta = system_data.get("meta", {})
            mod_counts: dict[str, int] = meta.get("modality_counts", {})
            if mod_counts:
                weighted_sum = sum(
                    MODALITY_POLARITY.get(m, 0.0) * cnt
                    for m, cnt in mod_counts.items()
                )
                total_planets = sum(mod_counts.values()) or 1
                mod_pol = weighted_sum / total_planets
                action_score += mod_pol * 0.9
                total_weight += 0.9

        # ── Natal aspect tension indicator ─────────────────────────
        # Many hard aspects = cautious; many soft aspects = favorable flow
        # Upgrade 18: weight each aspect's influence by its orb
        aspect_rows = get_table_rows(system_data, "aspect")
        if not aspect_rows:
            aspect_rows = get_table_rows(system_data, "natal aspect")
        hard_weighted = 0.0
        soft_weighted = 0.0
        hard_count = 0
        soft_count = 0
        for row in aspect_rows:
            if len(row) < 2:
                continue
            aspect_name = str(row[1]).strip()
            orb_val = _parse_orb(str(row[3])) if len(row) >= 4 else None
            orb_factor = _orb_weight_factor(orb_val)
            if aspect_name in HARD_ASPECTS:
                hard_count += 1
                hard_weighted += orb_factor
            elif aspect_name in {"Trine", "Sextile"}:
                soft_count += 1
                soft_weighted += orb_factor

        if hard_weighted + soft_weighted > 0:
            # Normalised tension weighted by orb: -1.0 (all hard) to +1.0 (all soft)
            tension_score = (soft_weighted - hard_weighted) / (hard_weighted + soft_weighted)
            aspect_w = 0.8
            action_score += tension_score * aspect_w
            total_weight += aspect_w

        # ── Planet dignity aggregated influence ────────────────────
        # Planets in domicile/exaltation push toward favorable;
        # those in detriment/fall push toward cautious.
        # Upgrade 19: applying (D) vs separating (R) weight bonus
        planet_rows = get_table_rows(system_data, "planet")
        if not planet_rows:
            planet_rows = get_table_rows(system_data, "position")
        dignity_score = 0.0
        dignity_weight = 0.0
        for row in planet_rows:
            if len(row) < 6:
                continue
            body = str(row[0]).strip()
            sign = str(row[1]).strip()
            motion = str(row[4]).strip() if len(row) >= 5 else ""
            state = _dignity_state(body, sign)
            if state is None:
                continue
            planet_base = abs(PLANET_INFLUENCE.get(body, 0.1))
            delta = _dignity_weight_delta(state)
            # Upgrade 19: applying (Direct) aspects get +0.1 bonus;
            # separating (Retrograde) get -0.05 penalty
            if motion == "D":
                delta += 0.10
            elif motion == "R":
                delta -= 0.05
            dignity_score += delta * planet_base
            dignity_weight += planet_base

        if dignity_weight > 0:
            norm_dignity = dignity_score / dignity_weight
            action_score += norm_dignity * 1.0
            total_weight += 1.0

        # ── Deep transit interpretation ────────────────────────────
        # Upgrade 4: 2-3x weight on timing/general questions
        transit_interps = interpret_all_transits(system_data, intent.domain_tags)
        is_timing = intent.question_type in ("timing_question", "general_guidance_question")
        for t in transit_interps[:6]:
            w = 2.5 if is_timing else 1.0
            action_score += t["polarity"] * w
            total_weight += w

        # ── Retrograde effect ─────────────────────────────────────
        retrogrades = detect_retrogrades(system_data)
        for rx in retrogrades:
            domain_relevant = bool(set(rx["domains"]) & set(intent.domain_tags))
            w = 1.5 if domain_relevant else 0.5
            action_score += rx["polarity"] * w
            total_weight += w

        # ── Upgrade 20: North Node in stance ─────────────────────
        node_val = (
            get_highlight_value(system_data, "north node")
            or get_highlight_value(system_data, "node")
        )
        if node_val:
            node_house = _parse_house(node_val)
            if node_house:
                node_domains = _NODE_HOUSE_DOMAINS.get(node_house, [])
                if bool(set(node_domains) & set(intent.domain_tags)):
                    # Chart supports this direction
                    action_score += 0.2
                    total_weight += 0.2

        # ── Upgrade 21: Rulership chain logic ────────────────────
        # For love-domain questions, check if the 7th-house ruler is dignified.
        if "love" in (intent.domain_tags or []) and planet_rows:
            # Find sign on the 7th house cusp from planet positions
            for row in planet_rows:
                if len(row) < 4:
                    continue
                house_num = _parse_house(str(row[3]).strip())
                if house_num == 7:
                    cusp_sign = _parse_sign(str(row[1]).strip())
                    if cusp_sign:
                        ruler = SIGN_RULER.get(cusp_sign)
                        if ruler:
                            ruler_state = _dignity_state(ruler, cusp_sign)
                            # Also check ruler's actual sign from planet_rows
                            for r2 in planet_rows:
                                if len(r2) < 2:
                                    continue
                                if str(r2[0]).strip() == ruler:
                                    actual_sign = _parse_sign(str(r2[1]).strip())
                                    if actual_sign:
                                        ruler_state = _dignity_state(ruler, actual_sign)
                                    break
                            if ruler_state in ("domicile", "exaltation"):
                                action_score += 0.15
                                total_weight += 0.15
                    break  # only need the first planet in house 7

        # ── Upgrade 22: House ruler integration ──────────────────
        # For each domain, trace the ruling planet of relevant houses.
        _UPGRADE22_DOMAIN_HOUSES: dict[str, list[int]] = {
            "love": [5, 7], "career": [6, 10], "health": [1, 6],
            "wealth": [2, 8], "mood": [4, 12],
        }
        if planet_rows:
            # Build a house→sign map from planet positions
            house_sign_map: dict[int, str] = {}
            planet_sign_map: dict[str, str] = {}
            for row in planet_rows:
                if len(row) < 4:
                    continue
                body = str(row[0]).strip()
                sign = _parse_sign(str(row[1]).strip())
                h = _parse_house(str(row[3]).strip())
                if sign:
                    planet_sign_map[body] = sign
                if h and sign and h not in house_sign_map:
                    house_sign_map[h] = sign

            for domain in (intent.domain_tags or []):
                for h_num in _UPGRADE22_DOMAIN_HOUSES.get(domain, []):
                    cusp_sign = house_sign_map.get(h_num)
                    if not cusp_sign:
                        continue
                    ruler = SIGN_RULER.get(cusp_sign)
                    if not ruler:
                        continue
                    ruler_actual_sign = planet_sign_map.get(ruler)
                    if not ruler_actual_sign:
                        continue
                    r_state = _dignity_state(ruler, ruler_actual_sign)
                    if r_state in ("domicile", "exaltation"):
                        action_score += 0.12
                        total_weight += 0.12
                    elif r_state in ("detriment", "fall"):
                        action_score -= 0.08
                        total_weight += 0.08

        # ── Upgrade 23: Compound transit detection ───────────────
        # If two transits target the same natal point with same polarity → boost.
        # If they conflict (opposite polarity) → tension.
        if len(transit_interps) >= 2:
            # Group transits by target natal planet
            from collections import defaultdict
            transit_by_target: dict[str, list[dict]] = defaultdict(list)
            for t in transit_interps[:6]:
                target = t.get("natal", "")
                if target:
                    transit_by_target[target].append(t)
            for target, group in transit_by_target.items():
                if len(group) < 2:
                    continue
                pols = [t["polarity"] for t in group]
                all_positive = all(p > 0 for p in pols)
                all_negative = all(p < 0 for p in pols)
                if all_positive or all_negative:
                    # Compound confirmation
                    action_score += 0.15
                    total_weight += 0.15
                elif any(p > 0 for p in pols) and any(p < 0 for p in pols):
                    # Conflicting transits → tension
                    action_score -= 0.05
                    total_weight += 0.05

        # ── Upgrade 24: Element/modality balance in stance ───────
        # If dominant element opposes question's implied action, penalize.
        if elem_val:
            # Determine the dominant element
            dominant_elem = None
            for e in SIGN_ELEMENT.values():
                if e.lower() in elem_val.lower():
                    dominant_elem = e
                    break
            if dominant_elem:
                # Determine question direction from the question text embedded
                # in intent (we use domain_tags + options as a proxy)
                question_text = " ".join(intent.options or [])
                q_direction = _question_implies_action(question_text)
                if q_direction == "action" and dominant_elem in _REST_ELEMENTS:
                    # Chart fundamentally opposes the bold action
                    action_score -= 0.12
                    total_weight += 0.12
                elif q_direction == "rest" and dominant_elem in _ACTION_ELEMENTS:
                    # Chart opposes the restful direction
                    action_score -= 0.12
                    total_weight += 0.12
                elif q_direction == "action" and dominant_elem in _ACTION_ELEMENTS:
                    # Chart supports bold direction
                    action_score += 0.08
                    total_weight += 0.08
                elif q_direction == "rest" and dominant_elem in _REST_ELEMENTS:
                    # Chart supports restful direction
                    action_score += 0.08
                    total_weight += 0.08

        # ── Upgrade 26: Aspect pattern recognition in stance ─────
        pattern_evidence = self._detect_aspect_patterns(aspect_rows)
        for pe in pattern_evidence:
            if "Grand Trine" in pe.feature:
                action_score += 0.2
                total_weight += 0.2
            elif "T-Square" in pe.feature:
                action_score -= 0.1
                total_weight += 0.1
            # Yod has no direct stance effect (just evidence weight 0.85)

        raw = action_score / total_weight if total_weight > 0 else 0.0

        # ── Upgrade 5: House-domain mapping in stance ────────────
        # Planets in dignity in a domain-relevant house boost favorable;
        # malefics or debilitated planets in those houses penalize.
        HOUSE_DOMAIN_MAP: dict[str, list[int]] = {
            "love": [5, 7], "career": [6, 10], "health": [1, 6],
            "wealth": [2, 8], "mood": [4, 12],
        }
        relevant_houses: set[int] = set()
        for d in (intent.domain_tags or []):
            relevant_houses.update(HOUSE_DOMAIN_MAP.get(d, []))

        if relevant_houses and planet_rows:
            for row in planet_rows:
                if len(row) < 6:
                    continue
                body = str(row[0]).strip()
                sign = str(row[1]).strip()
                house_raw = str(row[3]).strip()
                house_num = _parse_house(house_raw)
                if house_num not in relevant_houses:
                    continue
                state = _dignity_state(body, sign)
                if state in ("domicile", "exaltation"):
                    action_score += 0.3
                    total_weight += 0.3
                elif state in ("detriment", "fall"):
                    action_score -= 0.2
                    total_weight += 0.2
                elif body in ("Saturn", "Mars", "Pluto"):
                    # Malefic in domain house → caution
                    action_score -= 0.15
                    total_weight += 0.15
                elif body in ("Venus", "Jupiter"):
                    # Benefic in domain house → favorable
                    action_score += 0.15
                    total_weight += 0.15

        # ── Upgrade 3: Domain-specific amplification ─────────────
        # When key placements strongly match the question domain,
        # push the stance further from neutral.
        amp = 0.0
        domains = set(intent.domain_tags or [])

        # Venus dignified + love → strong favorable push
        if venus_val and "love" in domains:
            venus_sign = _parse_sign(venus_val)
            if venus_sign:
                vs = _dignity_state("Venus", venus_sign)
                if vs in ("domicile", "exaltation"):
                    amp += 0.25
                elif vs in ("detriment", "fall"):
                    amp -= 0.15

        # Mars dignified + career/health → strong push
        if mars_val and domains & {"career", "health"}:
            mars_sign = _parse_sign(mars_val)
            if mars_sign:
                ms = _dignity_state("Mars", mars_sign)
                if ms in ("domicile", "exaltation"):
                    amp += 0.20
                elif ms in ("detriment", "fall"):
                    amp -= 0.12

        # Jupiter dignified + wealth → strong push
        planet_rows_amp = get_table_rows(system_data, "planet") or get_table_rows(system_data, "position")
        for row in planet_rows_amp:
            if len(row) < 2:
                continue
            body = str(row[0]).strip()
            sign = str(row[1]).strip()
            if body == "Jupiter" and "wealth" in domains:
                js = _dignity_state("Jupiter", sign)
                if js in ("domicile", "exaltation"):
                    amp += 0.20
                elif js in ("detriment", "fall"):
                    amp -= 0.10
            if body == "Saturn" and "career" in domains:
                ss = _dignity_state("Saturn", sign)
                if ss in ("domicile", "exaltation"):
                    amp += 0.15

        # Apply amplification to raw action score (preserve direction)
        if amp != 0.0:
            if raw > 0:
                raw = min(raw + amp, 1.0)
            elif raw < 0:
                raw = max(raw - abs(amp) if amp < 0 else raw + amp, -1.0)
            else:
                raw += amp * 0.5

        return polarity_to_stance(options, raw)
