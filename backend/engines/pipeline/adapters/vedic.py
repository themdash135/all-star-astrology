"""Vedic Astrology adapter — real Jyotish logic.

Uses:
  - Tithi (lunar day) → Shukla (waxing) = growth/action, Krishna (waning) = rest
  - Yoga → auspicious vs inauspicious for action
  - Mahadasha / Antardasha lords → benefic vs malefic influence, domain-weighted
  - Gochara (transits from Moon) → planet-specific favorable houses
  - Nakshatra qualities + domain relevance → full 27-nakshatra data
  - Nakshatra pada precision → elemental sub-quarter modifiers (Upgrade 27)
  - Dasha timescale separation → short/long-term weighting (Upgrade 28)
  - Mahadasha-Antardasha interaction → synergy/friction detection (Upgrade 29)
  - Graha dignity (Exalted / Own sign / Debilitated) → polarity and confidence mods
  - Lagna lord house placement → career/domain boost
  - Strong yogas → evidence, stance boost, and domain-interpreted meaning (Upgrade 30)
"""

from __future__ import annotations

from typing import Any

from ..moon_phase import compute_phase, phase_evidence
from ..schemas import ClassifiedIntent, EvidenceItem
from .base import (
    BaseAdapter,
    get_highlight_value,
    get_table_rows,
    option_polarities,
    polarity_to_stance,
)

# ── Tithi influence ───────────────────────────────────────────────
# Shukla (waxing) = growth, action.  Krishna (waning) = rest, withdrawal.
# Specific tithis carry extra weight.

AUSPICIOUS_TITHIS = {
    "Dvitiya", "Tritiya", "Panchami", "Saptami",
    "Dashami", "Ekadashi", "Trayodashi",
}
INAUSPICIOUS_TITHIS = {
    "Chaturthi", "Ashtami", "Navami", "Chaturdashi",
    "Amavasya", "Purnima",  # extremes
}

# ── Yoga influence ────────────────────────────────────────────────
# Auspicious yogas support activity; inauspicious ones urge caution/rest.

AUSPICIOUS_YOGAS = {
    "Priti", "Ayushman", "Saubhagya", "Shobhana", "Sukarma",
    "Dhriti", "Harshana", "Siddhi", "Shiva", "Siddha", "Sadhya",
}
INAUSPICIOUS_YOGAS = {
    "Vishkambha", "Atiganda", "Shula", "Ganda", "Vyaghata",
    "Vajra", "Vyatipata", "Parigha",
}

# ── Dasha lord nature ─────────────────────────────────────────────
# Benefic lords promote activity and favourable outcomes.
# Malefic lords urge caution and restraint.

BENEFIC_LORDS = {"Jupiter", "Venus", "Moon", "Mercury"}
MALEFIC_LORDS = {"Saturn", "Mars", "Rahu", "Ketu", "Sun"}

DASHA_LORD_PUSH: dict[str, float] = {
    "Jupiter": 0.6, "Venus": 0.5, "Moon": 0.3, "Mercury": 0.2,
    "Sun": -0.1, "Mars": 0.2, "Saturn": -0.5, "Rahu": -0.3, "Ketu": -0.4,
}

# ── Dasha lord domain associations ───────────────────────────────
# Different lords strengthen or weaken specific life areas.

DASHA_DOMAIN_STRENGTH: dict[str, dict[str, float]] = {
    "Jupiter": {"wealth": 0.8, "career": 0.6, "mood": 0.5, "love": 0.4, "health": 0.3},
    "Venus":   {"love": 0.9, "wealth": 0.7, "mood": 0.6, "health": 0.3, "career": 0.3},
    "Moon":    {"mood": 0.9, "love": 0.6, "health": 0.5, "wealth": 0.3, "career": 0.2},
    "Sun":     {"career": 0.8, "health": 0.6, "mood": 0.4, "wealth": 0.3, "love": 0.2},
    "Mars":    {"career": 0.7, "health": 0.7, "wealth": 0.4, "love": 0.3, "mood": 0.2},
    "Mercury": {"career": 0.7, "wealth": 0.6, "mood": 0.5, "health": 0.3, "love": 0.3},
    "Saturn":  {"career": 0.8, "health": 0.5, "wealth": 0.4, "mood": 0.3, "love": 0.2},
    "Rahu":    {"career": 0.6, "wealth": 0.5, "mood": 0.4, "health": 0.3, "love": 0.3},
    "Ketu":    {"mood": 0.7, "health": 0.5, "career": 0.3, "wealth": 0.2, "love": 0.2},
}

# ── Upgrade 27: Nakshatra pada modifiers ─────────────────────────
# Each nakshatra spans 4 padas (quarters), cycling through Navamsha signs.
# Pada 1 = Aries (Fire), Pada 2 = Taurus (Earth), Pada 3 = Gemini (Air),
# Pada 4 = Cancer (Water), then the cycle repeats.

PADA_MODIFIER: dict[int, dict] = {
    1: {"element": "Fire", "polarity_mod": 0.15, "action": "initiative"},
    2: {"element": "Earth", "polarity_mod": -0.10, "action": "stability"},
    3: {"element": "Air", "polarity_mod": 0.10, "action": "communication"},
    4: {"element": "Water", "polarity_mod": -0.15, "action": "emotional depth"},
}

# ── Gochara planet-specific favorable houses ──────────────────────
# Real Vedic transit rules — each planet has its own set of good houses
# counted from natal Moon.

GOCHARA_FAVORABLE: dict[str, set[int]] = {
    "Sun":     {3, 6, 10, 11},
    "Moon":    {1, 3, 6, 7, 10, 11},
    "Mars":    {3, 6, 10, 11},
    "Mercury": {2, 4, 6, 8, 10, 11},
    "Jupiter": {2, 5, 7, 9, 11},
    "Venus":   {1, 2, 3, 4, 5, 8, 9, 11, 12},
    "Saturn":  {3, 6, 11},
}

# Fallback for Rahu / Ketu / other nodes (not in standard gochara set)
GOCHARA_GOOD_HOUSES = {3, 6, 10, 11}

# ── Full 27 Nakshatra data ────────────────────────────────────────
# Each nakshatra has a ruling planet, a quality (guna/category),
# a general polarity (-1 = challenging, +1 = auspicious), and
# domain-specific relevance weights.

NAKSHATRA_DATA: dict[str, dict] = {
    "Ashwini":           {"ruler": "Ketu",    "quality": "swift",    "polarity": 0.7,  "domains": {"health": 0.9, "career": 0.5}},
    "Bharani":           {"ruler": "Venus",   "quality": "fierce",   "polarity": -0.3, "domains": {"love": 0.8, "health": 0.6}},
    "Krittika":          {"ruler": "Sun",     "quality": "mixed",    "polarity": 0.4,  "domains": {"career": 0.7, "health": 0.5}},
    "Rohini":            {"ruler": "Moon",    "quality": "fixed",    "polarity": -0.2, "domains": {"love": 0.9, "wealth": 0.7}},
    "Mrigashira":        {"ruler": "Mars",    "quality": "soft",     "polarity": 0.3,  "domains": {"love": 0.7, "mood": 0.6}},
    "Ardra":             {"ruler": "Rahu",    "quality": "sharp",    "polarity": -0.5, "domains": {"mood": 0.8, "health": 0.6}},
    "Punarvasu":         {"ruler": "Jupiter", "quality": "moveable", "polarity": 0.4,  "domains": {"mood": 0.7, "wealth": 0.6}},
    "Pushya":            {"ruler": "Saturn",  "quality": "light",    "polarity": 0.5,  "domains": {"career": 0.8, "wealth": 0.7}},
    "Ashlesha":          {"ruler": "Mercury", "quality": "sharp",    "polarity": -0.6, "domains": {"mood": 0.7, "health": 0.6}},
    "Magha":             {"ruler": "Ketu",    "quality": "fierce",   "polarity": 0.3,  "domains": {"career": 0.8, "mood": 0.5}},
    "Purva Phalguni":    {"ruler": "Venus",   "quality": "fierce",   "polarity": 0.5,  "domains": {"love": 0.9, "mood": 0.7}},
    "Uttara Phalguni":   {"ruler": "Sun",     "quality": "fixed",    "polarity": 0.2,  "domains": {"career": 0.7, "love": 0.6}},
    "Hasta":             {"ruler": "Moon",    "quality": "light",    "polarity": 0.4,  "domains": {"career": 0.7, "health": 0.6}},
    "Chitra":            {"ruler": "Mars",    "quality": "soft",     "polarity": 0.3,  "domains": {"career": 0.6, "love": 0.5}},
    "Swati":             {"ruler": "Rahu",    "quality": "moveable", "polarity": 0.5,  "domains": {"career": 0.7, "wealth": 0.6}},
    "Vishakha":          {"ruler": "Jupiter", "quality": "mixed",    "polarity": 0.4,  "domains": {"career": 0.8, "wealth": 0.6}},
    "Anuradha":          {"ruler": "Saturn",  "quality": "soft",     "polarity": -0.2, "domains": {"love": 0.8, "mood": 0.6}},
    "Jyeshtha":          {"ruler": "Mercury", "quality": "sharp",    "polarity": 0.2,  "domains": {"career": 0.7, "mood": 0.5}},
    "Moola":             {"ruler": "Ketu",    "quality": "sharp",    "polarity": -0.4, "domains": {"mood": 0.8, "health": 0.6}},
    "Purva Ashadha":     {"ruler": "Venus",   "quality": "fierce",   "polarity": 0.3,  "domains": {"love": 0.7, "career": 0.6}},
    "Uttara Ashadha":    {"ruler": "Sun",     "quality": "fixed",    "polarity": 0.5,  "domains": {"career": 0.9, "wealth": 0.6}},
    "Shravana":          {"ruler": "Moon",    "quality": "moveable", "polarity": -0.1, "domains": {"career": 0.7, "mood": 0.7}},
    "Dhanishta":         {"ruler": "Mars",    "quality": "moveable", "polarity": 0.6,  "domains": {"wealth": 0.8, "career": 0.7}},
    "Shatabhisha":       {"ruler": "Rahu",    "quality": "moveable", "polarity": -0.3, "domains": {"health": 0.8, "mood": 0.6}},
    "Purva Bhadrapada":  {"ruler": "Jupiter", "quality": "fierce",   "polarity": -0.2, "domains": {"mood": 0.7, "wealth": 0.5}},
    "Uttara Bhadrapada": {"ruler": "Saturn",  "quality": "fixed",    "polarity": -0.4, "domains": {"mood": 0.8, "health": 0.6}},
    "Revati":            {"ruler": "Mercury", "quality": "soft",     "polarity": -0.1, "domains": {"love": 0.7, "mood": 0.8}},
}

# Legacy nakshatra type sets (kept for backward compatibility in stance logic)
FIXED_NAKSHATRAS = {
    "Rohini", "Uttara Phalguni", "Uttara Ashadha", "Uttara Bhadrapada",
}
MOVEABLE_NAKSHATRAS = {
    "Ashwini", "Mrigashira", "Punarvasu", "Hasta",
    "Anuradha", "Shravana", "Dhanishta", "Shatabhisha",
}
SOFT_NAKSHATRAS = {
    "Chitra", "Anuradha", "Mrigashira", "Revati",
}
SHARP_NAKSHATRAS = {
    "Ardra", "Ashlesha", "Jyeshtha", "Moola",
}

# ── Graha dignity effects ─────────────────────────────────────────
# Dignified planets amplify their domain influence; debilitated planets
# add caution and reduce confidence.

GRAHA_DIGNITY_EFFECT: dict[str, dict[str, float]] = {
    "Exalted":     {"polarity_mod": 0.3,  "confidence_mod": 0.15},
    "Own sign":    {"polarity_mod": 0.2,  "confidence_mod": 0.1},
    "Mooltrikona": {"polarity_mod": 0.2,  "confidence_mod": 0.1},
    "Friendly":    {"polarity_mod": 0.1,  "confidence_mod": 0.05},
    "Neutral":     {"polarity_mod": 0.0,  "confidence_mod": 0.0},
    "Enemy":       {"polarity_mod": -0.1, "confidence_mod": -0.05},
    "Debilitated": {"polarity_mod": -0.3, "confidence_mod": -0.1},
}

# ── Upgrade 30: Yoga meaning interpretation ──────────────────────
# Maps common yoga names to domain-specific interpretations for
# contextual stance and evidence enrichment.

YOGA_MEANING: dict[str, dict] = {
    "Gajakesari": {"meaning": "wisdom and emotional intelligence", "domains": {"mood": 0.8, "career": 0.6}, "polarity": 0.5},
    "Budha Aditya": {"meaning": "sharp intellect and authority", "domains": {"career": 0.9, "wealth": 0.5}, "polarity": 0.4},
    "Chandra Mangala": {"meaning": "emotional courage and drive", "domains": {"mood": 0.7, "career": 0.6, "love": 0.5}, "polarity": 0.3},
    "Raja": {"meaning": "power, status, and recognition", "domains": {"career": 0.9, "wealth": 0.7}, "polarity": 0.6},
    "Dhana": {"meaning": "wealth accumulation and prosperity", "domains": {"wealth": 0.9, "career": 0.6}, "polarity": 0.5},
}

# ── Upgrade 28: Dasha timescale weight multipliers ───────────────
# Short-term questions weight Antardasha more; long-term weight Mahadasha more.

DASHA_TIMESCALE: dict[str, dict[str, float]] = {
    "today":     {"maha_mult": 0.8, "antar_mult": 2.0},
    "tomorrow":  {"maha_mult": 0.8, "antar_mult": 2.0},
    "this_week": {"maha_mult": 0.8, "antar_mult": 2.0},
    "this_month": {"maha_mult": 1.0, "antar_mult": 1.0},  # medium-term: unchanged
    "this_year": {"maha_mult": 2.0, "antar_mult": 1.0},
    "general":   {"maha_mult": 2.0, "antar_mult": 1.0},
}

# ── Upgrade 7: Dasha lord domain boost table ─────────────────
# When the Mahadasha lord has strong domain affinity for the question,
# apply a direct stance boost/penalty.
DASHA_DOMAIN_BOOST: dict[str, dict[str, float]] = {
    "Venus":   {"love": 0.15, "wealth": 0.10, "mood": 0.08},
    "Jupiter": {"wealth": 0.15, "career": 0.10, "mood": 0.08},
    "Saturn":  {"career": 0.10, "health": -0.10, "mood": -0.08},
    "Mars":    {"career": 0.08, "health": 0.05, "love": -0.05},
    "Mercury": {"career": 0.08, "wealth": 0.06},
    "Moon":    {"mood": 0.12, "love": 0.08, "health": 0.05},
    "Sun":     {"career": 0.10, "health": 0.05},
    "Rahu":    {"career": 0.05, "mood": -0.08},
    "Ketu":    {"mood": 0.05, "health": -0.05},
}

# Houses whose lord placement supercharges specific domains
# e.g. lagna lord in 10th = strong career indicator
LAGNA_LORD_DOMAIN_HOUSE: dict[int, dict[str, float]] = {
    1:  {"health": 0.3, "mood": 0.2},
    2:  {"wealth": 0.4, "career": 0.2},
    3:  {"career": 0.3, "mood": 0.2},
    4:  {"mood": 0.4, "love": 0.2},
    5:  {"love": 0.4, "mood": 0.3},
    6:  {"health": 0.3, "career": 0.2},
    7:  {"love": 0.5, "career": 0.2},
    8:  {"health": 0.3, "mood": 0.2},
    9:  {"mood": 0.3, "wealth": 0.3},
    10: {"career": 0.5, "wealth": 0.3},
    11: {"wealth": 0.4, "career": 0.3},
    12: {"mood": 0.3, "health": 0.2},
}


def _parse_gochara_house(cell: str) -> int | None:
    """Extract house number from 'House 6 from natal Moon'."""
    for part in cell.split():
        if part.isdigit():
            return int(part)
    return None


def _is_gochara_favorable(planet: str, house_num: int) -> bool:
    """Return True if ``house_num`` is favorable for ``planet`` in gochara."""
    favorable_set = GOCHARA_FAVORABLE.get(planet, GOCHARA_GOOD_HOUSES)
    return house_num in favorable_set


def _resolve_nakshatra_name(raw: str) -> str | None:
    """Extract the nakshatra name from a raw highlight value.

    The value may contain extra info like degrees or pada numbers.
    Returns the matched key from NAKSHATRA_DATA or None.
    """
    if not raw:
        return None
    # Try two-word names first (e.g. "Purva Phalguni")
    for name in NAKSHATRA_DATA:
        if name.lower() in raw.lower():
            return name
    return None


def _extract_pada(raw: str) -> int | None:
    """Extract the pada number (1-4) from a nakshatra highlight value.

    Looks for patterns like "Pada 2", "pada 3", "P2", or a trailing digit
    after the nakshatra name.  Returns None if no pada is found.
    """
    if not raw:
        return None
    import re
    # "Pada X" or "pada X"
    m = re.search(r"[Pp]ada\s*(\d)", raw)
    if m:
        p = int(m.group(1))
        if 1 <= p <= 4:
            return p
    # Trailing "P2" style
    m = re.search(r"P(\d)", raw)
    if m:
        p = int(m.group(1))
        if 1 <= p <= 4:
            return p
    # Bare trailing digit after the nakshatra name (e.g. "Ashwini 1")
    parts = raw.strip().split()
    if parts and parts[-1].isdigit():
        p = int(parts[-1])
        if 1 <= p <= 4:
            return p
    return None


def _extract_graha_rows(system_data: dict[str, Any]) -> list[list]:
    """Return rows from the graha positions table (columns: Graha, Rashi, Degree, House, Nakshatra, Dignity)."""
    for fragment in ("graha", "planet", "position"):
        rows = get_table_rows(system_data, fragment)
        if rows:
            return rows
    return []


def _extract_house_lord_rows(system_data: dict[str, Any]) -> list[list]:
    """Return rows from the house lords table (columns: House, Rashi, Lord, Lord house)."""
    for fragment in ("house lord", "house lord", "lords"):
        rows = get_table_rows(system_data, fragment)
        if rows:
            return rows
    return []


def _parse_lagna_lord_house(system_data: dict[str, Any]) -> int | None:
    """Return the house number occupied by the lagna lord, or None.

    Checks the 'Lagna lord' highlight first, then falls back to the
    house lords table (row for House 1 → Lord → Lord house column).
    """
    # Direct highlight: "Lagna lord in 10th house" or similar
    lagna_lord_val = get_highlight_value(system_data, "lagna lord")
    if lagna_lord_val:
        for part in lagna_lord_val.replace("th", "").replace("st", "").replace("nd", "").replace("rd", "").split():
            if part.isdigit():
                return int(part)

    # Fallback: house lords table — find row where House == 1 and read Lord house col
    house_lord_rows = _extract_house_lord_rows(system_data)
    for row in house_lord_rows:
        if len(row) >= 4:
            house_cell = str(row[0]).strip()
            lord_house_cell = str(row[3]).strip()
            if house_cell in ("1", "House 1", "I", "Lagna"):
                for part in lord_house_cell.replace("th", "").replace("st", "").replace("nd", "").replace("rd", "").split():
                    if part.isdigit():
                        return int(part)
    return None


class VedicAdapter(BaseAdapter):
    system_id = "vedic"
    system_name = "Vedic Astrology"
    confidence_scale = 1.0

    def _extract_evidence(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
    ) -> list[EvidenceItem]:
        items: list[EvidenceItem] = []

        # Tithi
        tithi_val = get_highlight_value(system_data, "tithi")
        if tithi_val:
            weight = 0.85 if intent.time_horizon in ("today", "tomorrow") else 0.6
            items.append(EvidenceItem(feature="Tithi", value=tithi_val, weight=weight, category="tithi"))

        # Yoga
        yoga_val = get_highlight_value(system_data, "yoga")
        if yoga_val:
            weight = 0.8 if intent.time_horizon in ("today", "tomorrow") else 0.55
            items.append(EvidenceItem(feature="Yoga", value=yoga_val, weight=weight, category="yoga"))

        # Moon nakshatra — use full NAKSHATRA_DATA for domain-weighted evidence
        nak_val = get_highlight_value(system_data, "moon nakshatra")
        if nak_val:
            nak_name = _resolve_nakshatra_name(nak_val)
            if nak_name and nak_name in NAKSHATRA_DATA:
                nak_info = NAKSHATRA_DATA[nak_name]
                # Boost weight when nakshatra domains match question domains
                domain_relevance = max(
                    (nak_info["domains"].get(d, 0.0) for d in (intent.domain_tags or [])),
                    default=0.0,
                )
                base_weight = 0.7
                adjusted_weight = round(min(base_weight + domain_relevance * 0.2, 1.0), 2)
                ruler = nak_info.get("ruler", "")
                quality = nak_info.get("quality", "")
                # ── Upgrade 27: Nakshatra pada precision ─────────────
                pada = _extract_pada(nak_val)
                if pada and pada in PADA_MODIFIER:
                    pada_info = PADA_MODIFIER[pada]
                    value_str = (
                        f"{nak_name} Pada {pada} ({quality}, ruler {ruler})"
                        f" — {pada_info['action']} energy"
                    )
                else:
                    value_str = f"{nak_name} ({quality}, ruler {ruler})"
                items.append(EvidenceItem(
                    feature="Moon nakshatra",
                    value=value_str,
                    weight=adjusted_weight,
                    category="nakshatra",
                ))
            else:
                items.append(EvidenceItem(feature="Moon nakshatra", value=nak_val, weight=0.7, category="nakshatra"))

        # Mahadasha lord
        maha_val = get_highlight_value(system_data, "mahadasha")
        if maha_val:
            # Weight dasha evidence higher when lord's domain matches question
            maha_lord = next((k for k in DASHA_DOMAIN_STRENGTH if k.lower() in maha_val.lower()), None)
            if maha_lord and intent.domain_tags:
                domain_boost = max(
                    DASHA_DOMAIN_STRENGTH[maha_lord].get(d, 0.0) for d in intent.domain_tags
                )
                weight = round(min(0.75 + domain_boost * 0.2, 1.0), 2)
            else:
                weight = 0.75
            items.append(EvidenceItem(feature="Mahadasha lord", value=maha_val, weight=weight, category="dasha"))

        # Antardasha lord
        antar_val = get_highlight_value(system_data, "antardasha")
        if antar_val:
            antar_lord = next((k for k in DASHA_DOMAIN_STRENGTH if k.lower() in antar_val.lower()), None)
            if antar_lord and intent.domain_tags:
                domain_boost = max(
                    DASHA_DOMAIN_STRENGTH[antar_lord].get(d, 0.0) for d in intent.domain_tags
                )
                weight = round(min(0.65 + domain_boost * 0.15, 0.95), 2)
            else:
                weight = 0.65
            items.append(EvidenceItem(feature="Antardasha lord", value=antar_val, weight=weight, category="dasha"))

        # Lagna
        lagna_val = get_highlight_value(system_data, "lagna")
        if lagna_val and "lord" not in (lagna_val or "").lower():
            items.append(EvidenceItem(feature="Lagna", value=lagna_val, weight=0.5))

        # Lagna lord placement evidence
        lagna_lord_val = get_highlight_value(system_data, "lagna lord")
        if lagna_lord_val:
            ll_house = _parse_lagna_lord_house(system_data)
            if ll_house is not None:
                house_domain_map = LAGNA_LORD_DOMAIN_HOUSE.get(ll_house, {})
                # Check if any question domain is boosted by this house
                domain_match = any(
                    d in house_domain_map for d in (intent.domain_tags or [])
                )
                weight = 0.8 if domain_match else 0.55
                items.append(EvidenceItem(
                    feature="Lagna lord",
                    value=f"{lagna_lord_val} (House {ll_house})",
                    weight=weight,
                ))
            else:
                items.append(EvidenceItem(feature="Lagna lord", value=lagna_lord_val, weight=0.6))

        # Strong yogas evidence
        yoga_strong_val = get_highlight_value(system_data, "strong yoga")
        if not yoga_strong_val:
            yoga_strong_val = get_highlight_value(system_data, "yoga formed")
        if yoga_strong_val:
            # ── Upgrade 30: Yoga meaning interpretation ──────────────
            # Enrich evidence with domain-specific meaning when a known yoga matches
            yoga_value_str = yoga_strong_val
            for yoga_key, yoga_meta in YOGA_MEANING.items():
                if yoga_key.lower() in yoga_strong_val.lower():
                    # Check if any question domain is relevant (>= 0.6)
                    best_domain = ""
                    best_rel = 0.0
                    for d in (intent.domain_tags or []):
                        rel = yoga_meta["domains"].get(d, 0.0)
                        if rel > best_rel:
                            best_rel = rel
                            best_domain = d
                    if best_rel >= 0.6:
                        yoga_value_str = (
                            f"{yoga_key} Yoga — {yoga_meta['meaning']}"
                            f" (strong for {best_domain} questions)"
                        )
                    else:
                        yoga_value_str = f"{yoga_key} Yoga — {yoga_meta['meaning']}"
                    break  # use first match
            items.append(EvidenceItem(feature="Strong yogas", value=yoga_value_str, weight=0.8, category="yoga"))

        # Graha dignity evidence from positions table — top 3 most relevant grahas
        graha_rows = _extract_graha_rows(system_data)
        graha_dignity_items: list[EvidenceItem] = []
        for row in graha_rows:
            # Expected columns: Graha, Rashi, Degree, House, Nakshatra, Dignity
            if len(row) < 6:
                continue
            graha_name = str(row[0]).strip()
            dignity = str(row[5]).strip() if row[5] else ""
            if not dignity or dignity.lower() in ("", "-", "n/a"):
                continue
            effect = GRAHA_DIGNITY_EFFECT.get(dignity, None)
            if effect is None:
                # Try partial match
                for key in GRAHA_DIGNITY_EFFECT:
                    if key.lower() in dignity.lower():
                        effect = GRAHA_DIGNITY_EFFECT[key]
                        dignity = key
                        break
            if effect is None:
                continue
            pol_mod = effect["polarity_mod"]
            conf_mod = effect["confidence_mod"]
            # Higher weight for dignified or debilitated extremes
            base_w = 0.75 if abs(pol_mod) >= 0.3 else 0.55
            graha_dignity_items.append(EvidenceItem(
                feature=f"{graha_name} dignity",
                value=dignity,
                weight=round(base_w + conf_mod, 2),
            ))
        # Take top 3 by weight
        graha_dignity_items.sort(key=lambda e: e.weight, reverse=True)
        items.extend(graha_dignity_items[:3])

        # Gochara transits — use planet-specific favorable houses
        gochara_rows = get_table_rows(system_data, "gochara")
        for row in gochara_rows:
            if len(row) >= 2:
                planet = str(row[0]).strip()
                house_cell = str(row[1]).strip()
                house_num = _parse_gochara_house(house_cell)
                if house_num is not None:
                    fav = _is_gochara_favorable(planet, house_num)
                    items.append(EvidenceItem(
                        feature=f"Gochara {planet}",
                        value=f"House {house_num} ({'favorable' if fav else 'challenging'})",
                        weight=0.7 if planet in ("Moon", "Saturn", "Jupiter") else 0.45,
                    ))

        # Moon phase — Vedic uses tithi but phase adds cross-system confirmation
        phase = compute_phase(system_data)
        if phase:
            items.append(phase_evidence(phase, intent.time_horizon))

        return items[:14]

    def _compute_stance(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
        evidence: list[EvidenceItem],
    ) -> dict[str, float]:
        options = intent.options or ["favorable", "cautious"]
        polarities = option_polarities(options)

        # Accumulate: positive = auspicious/action, negative = inauspicious/rest
        action_score = 0.0
        total_weight = 0.0

        # ── Tithi ──────────────────────────────────────────────────
        tithi_val = get_highlight_value(system_data, "tithi") or ""
        paksha_push = 0.3 if "shukla" in tithi_val.lower() else -0.3
        action_score += paksha_push * 2.0
        total_weight += 2.0

        # Specific tithi name
        for name in AUSPICIOUS_TITHIS:
            if name.lower() in tithi_val.lower():
                action_score += 0.5
                total_weight += 0.5
                break
        for name in INAUSPICIOUS_TITHIS:
            if name.lower() in tithi_val.lower():
                action_score -= 0.5
                total_weight += 0.5
                break

        # ── Yoga ───────────────────────────────────────────────────
        yoga_val = get_highlight_value(system_data, "yoga") or ""
        for name in AUSPICIOUS_YOGAS:
            if name.lower() in yoga_val.lower():
                action_score += 0.6
                total_weight += 1.0
                break
        for name in INAUSPICIOUS_YOGAS:
            if name.lower() in yoga_val.lower():
                action_score -= 0.6
                total_weight += 1.0
                break

        # ── Dasha lords — general + domain-specific ────────────────
        maha_val = get_highlight_value(system_data, "mahadasha") or ""
        antar_val = get_highlight_value(system_data, "antardasha") or ""

        # ── Upgrade 28: Dasha timescale separation ───────────────
        # Short-term questions weight Antardasha more; long-term weight Mahadasha more.
        ts = DASHA_TIMESCALE.get(intent.time_horizon, {"maha_mult": 1.0, "antar_mult": 1.0})
        maha_mult = ts["maha_mult"]
        antar_mult = ts["antar_mult"]

        resolved_maha_lord: str | None = None
        resolved_antar_lord: str | None = None

        for lord_name, push in DASHA_LORD_PUSH.items():
            lord_lower = lord_name.lower()
            if lord_lower in maha_val.lower():
                resolved_maha_lord = lord_name
                maha_base_weight = 1.5 * maha_mult  # Upgrade 28: timescale-adjusted
                action_score += push * maha_base_weight
                total_weight += maha_base_weight
                # Domain-specific: if lord strongly rules a question domain, amplify
                if intent.domain_tags and lord_name in DASHA_DOMAIN_STRENGTH:
                    domain_max = max(
                        DASHA_DOMAIN_STRENGTH[lord_name].get(d, 0.0)
                        for d in intent.domain_tags
                    )
                    if domain_max > 0.5:
                        # High domain relevance: add extra directional push
                        action_score += push * domain_max * 0.5
                        total_weight += 0.5
            if lord_lower in antar_val.lower():
                resolved_antar_lord = lord_name
                antar_base_weight = 1.0 * antar_mult  # Upgrade 28: timescale-adjusted
                action_score += push * antar_base_weight
                total_weight += antar_base_weight
                if intent.domain_tags and lord_name in DASHA_DOMAIN_STRENGTH:
                    domain_max = max(
                        DASHA_DOMAIN_STRENGTH[lord_name].get(d, 0.0)
                        for d in intent.domain_tags
                    )
                    if domain_max > 0.5:
                        action_score += push * domain_max * 0.3
                        total_weight += 0.3

        # ── Upgrade 29: Mahadasha-Antardasha interaction ─────────
        # After processing both lords, check their benefic/malefic interaction.
        if resolved_maha_lord and resolved_antar_lord:
            maha_benefic = resolved_maha_lord in BENEFIC_LORDS
            antar_benefic = resolved_antar_lord in BENEFIC_LORDS
            if maha_benefic and not antar_benefic:
                # Good framework but current restrictions — timing friction
                action_score += -0.15
                evidence.append(EvidenceItem(
                    feature="Dasha interaction",
                    value=(
                        f"{resolved_maha_lord} Maha supports but"
                        f" {resolved_antar_lord} Antar restricts — timing friction"
                    ),
                    weight=0.7,
                    category="dasha",
                ))
            elif maha_benefic and antar_benefic:
                # Double benefic support
                action_score += 0.20
                evidence.append(EvidenceItem(
                    feature="Dasha interaction",
                    value=f"{resolved_maha_lord}/{resolved_antar_lord} — double benefic support",
                    weight=0.75,
                    category="dasha",
                ))
            elif not maha_benefic and antar_benefic:
                # Slight relief in difficult period
                action_score += 0.08
            elif not maha_benefic and not antar_benefic:
                # Both malefic — exercise caution
                action_score += -0.25
                evidence.append(EvidenceItem(
                    feature="Dasha interaction",
                    value=f"{resolved_maha_lord}/{resolved_antar_lord} — exercise caution",
                    weight=0.8,
                    category="dasha",
                ))

        # ── Gochara — planet-specific favorable houses ─────────────
        gochara_rows = get_table_rows(system_data, "gochara")
        for row in gochara_rows:
            if len(row) >= 2:
                planet = str(row[0]).strip()
                house_num = _parse_gochara_house(str(row[1]))
                if house_num is not None:
                    fav = _is_gochara_favorable(planet, house_num)
                    push = 0.3 if fav else -0.3
                    w = 1.0 if planet in ("Moon", "Saturn", "Jupiter") else 0.5
                    action_score += push * w
                    total_weight += w

        # ── Nakshatra — domain-specific scoring ────────────────────
        nak_val = get_highlight_value(system_data, "moon nakshatra") or ""
        nak_name = _resolve_nakshatra_name(nak_val)
        if nak_name and nak_name in NAKSHATRA_DATA:
            nak_info = NAKSHATRA_DATA[nak_name]
            nak_polarity = nak_info["polarity"]
            # If question domain is a strong domain for this nakshatra, amplify
            if intent.domain_tags:
                domain_relevance = max(
                    nak_info["domains"].get(d, 0.0) for d in intent.domain_tags
                )
                weight = 0.5 + domain_relevance * 0.5  # 0.5 – 1.0
            else:
                weight = 0.5
            action_score += nak_polarity * weight
            total_weight += weight

            # ── Upgrade 27: Nakshatra pada precision ─────────────
            # Apply pada elemental modifier as an additional weighted signal.
            pada = _extract_pada(nak_val)
            if pada and pada in PADA_MODIFIER:
                pada_mod = PADA_MODIFIER[pada]["polarity_mod"]
                action_score += pada_mod * 0.3
                total_weight += 0.3
        else:
            # Legacy quality-based scoring as fallback
            nak_name_legacy = nak_val.split()[0] if nak_val else ""
            if nak_name_legacy in MOVEABLE_NAKSHATRAS:
                action_score += 0.3
                total_weight += 0.5
            elif nak_name_legacy in FIXED_NAKSHATRAS:
                action_score -= 0.2
                total_weight += 0.5
            elif nak_name_legacy in SOFT_NAKSHATRAS:
                action_score -= 0.3
                total_weight += 0.5
            elif nak_name_legacy in SHARP_NAKSHATRAS:
                action_score += 0.2
                total_weight += 0.5

        # ── Graha dignity influence ────────────────────────────────
        graha_rows = _extract_graha_rows(system_data)
        for row in graha_rows:
            if len(row) < 6:
                continue
            dignity = str(row[5]).strip() if row[5] else ""
            effect = GRAHA_DIGNITY_EFFECT.get(dignity)
            if effect is None:
                for key in GRAHA_DIGNITY_EFFECT:
                    if key.lower() in dignity.lower():
                        effect = GRAHA_DIGNITY_EFFECT[key]
                        break
            if effect:
                pol_mod = effect["polarity_mod"]
                action_score += pol_mod * 0.4
                total_weight += 0.4

        # ── Lagna lord house effect ────────────────────────────────
        ll_house = _parse_lagna_lord_house(system_data)
        if ll_house is not None:
            house_domain_map = LAGNA_LORD_DOMAIN_HOUSE.get(ll_house, {})
            if intent.domain_tags:
                domain_push = sum(
                    house_domain_map.get(d, 0.0) for d in intent.domain_tags
                )
                # Positive push for relevant houses, but effect is directional:
                # houses 10/11 are outward-action; 12/8 are inward
                outward_houses = {2, 3, 5, 7, 9, 10, 11}
                inward_houses = {4, 6, 8, 12}
                if ll_house in outward_houses:
                    action_score += domain_push * 0.4
                elif ll_house in inward_houses:
                    action_score -= domain_push * 0.2
                total_weight += domain_push * 0.4 if domain_push > 0 else 0.2

        # ── Upgrade 30: Strong yoga interpretation ─────────────────
        # If strong yogas are detected and a yoga's domain matches the
        # question domain (relevance >= 0.6), apply the yoga's polarity
        # weighted by domain relevance as a stance signal.
        yoga_strong_val = get_highlight_value(system_data, "strong yoga") or ""
        if not yoga_strong_val:
            yoga_strong_val = get_highlight_value(system_data, "yoga formed") or ""
        if yoga_strong_val:
            for yoga_key, yoga_meta in YOGA_MEANING.items():
                if yoga_key.lower() in yoga_strong_val.lower():
                    # Find best domain match
                    best_domain_rel = 0.0
                    for d in (intent.domain_tags or []):
                        rel = yoga_meta["domains"].get(d, 0.0)
                        if rel > best_domain_rel:
                            best_domain_rel = rel
                    if best_domain_rel >= 0.6:
                        yoga_signal = yoga_meta["polarity"] * best_domain_rel * 0.3
                        action_score += yoga_signal
                        total_weight += abs(yoga_signal) if yoga_signal != 0 else 0.1

        # ── Upgrade 7: Dasha-aware timing boost ─────────────────
        # Apply direct boost/penalty based on Mahadasha lord + question domain.
        maha_lord_7 = next(
            (k for k in DASHA_DOMAIN_BOOST if k.lower() in maha_val.lower()),
            None,
        ) if maha_val else None
        if maha_lord_7 and intent.domain_tags:
            boosts = DASHA_DOMAIN_BOOST.get(maha_lord_7, {})
            for d in intent.domain_tags:
                b = boosts.get(d, 0.0)
                if b != 0.0:
                    # Positive boost pushes toward favorable (action)
                    action_score += b * 2.0
                    total_weight += abs(b) * 2.0

        raw = action_score / total_weight if total_weight > 0 else 0.0

        # ── Upgrade 3: Domain-specific amplification ─────────────
        # When key Vedic placements strongly match the domain, push
        # the stance further from neutral.
        amp = 0.0
        domains = set(intent.domain_tags or [])

        # Mahadasha lord + strong domain match → amplify
        maha_lord_amp = next(
            (k for k in DASHA_DOMAIN_STRENGTH if k.lower() in maha_val.lower()),
            None,
        ) if maha_val else None
        if maha_lord_amp and domains:
            dds = DASHA_DOMAIN_STRENGTH.get(maha_lord_amp, {})
            best_domain_match = max((dds.get(d, 0.0) for d in domains), default=0.0)
            lord_push = DASHA_LORD_PUSH.get(maha_lord_amp, 0.0)
            if best_domain_match >= 0.7:
                amp += lord_push * 0.35  # strong domain match

        # Exalted graha in a domain-relevant context → amplify
        for row in graha_rows:
            if len(row) < 6:
                continue
            graha_name = str(row[0]).strip()
            dignity = str(row[5]).strip() if row[5] else ""
            if "exalted" in dignity.lower() or "own sign" in dignity.lower():
                # Venus exalted + love question
                if graha_name == "Venus" and "love" in domains:
                    amp += 0.20
                elif graha_name == "Jupiter" and domains & {"wealth", "career"}:
                    amp += 0.18
                elif graha_name == "Mars" and domains & {"career", "health"}:
                    amp += 0.15
            elif "debilitated" in dignity.lower():
                if graha_name == "Venus" and "love" in domains:
                    amp -= 0.15
                elif graha_name == "Jupiter" and domains & {"wealth", "career"}:
                    amp -= 0.12

        # Nakshatra with high domain relevance → amplify
        if nak_name and nak_name in NAKSHATRA_DATA:
            nak_info_amp = NAKSHATRA_DATA[nak_name]
            for d in domains:
                if nak_info_amp["domains"].get(d, 0.0) >= 0.8:
                    amp += nak_info_amp["polarity"] * 0.12

        if amp != 0.0:
            if raw > 0:
                raw = min(raw + amp, 1.0)
            elif raw < 0:
                raw = max(raw - abs(amp) if amp < 0 else raw + amp, -1.0)
            else:
                raw += amp * 0.5

        return polarity_to_stance(options, raw)
