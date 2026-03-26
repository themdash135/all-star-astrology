"""Persian / Islamic Astrology adapter — strongest timing system.

Uses:
  - Planetary day ruler → benefic (Venus, Jupiter) vs malefic (Mars, Saturn)
  - Temperament → Choleric (action) / Sanguine (social) / Melancholic (caution) / Phlegmatic (rest)
  - Sect (Day/Night chart) → influences energy quality
  - Lot of Fortune house → angular (strong) vs cadent (weak)
  - Lot of Spirit house → vocation/will quality
  - Lunar mansion → current vs natal mansion alignment
  - Ascendant sign → health and personal presence
  - Traditional planet conditions → dignity aggregate
  - Temperament quality weights → humoral balance
  - Current Moon/Sun sign → short-term timing context

This is the strongest timing-sensitive system in the router.
Best for: "should I do it now or later?", action vs pause, day/night quality.
"""

from __future__ import annotations

import re as _re
from typing import Any

from ..moon_phase import compute_phase, phase_evidence
from ..planetary_hours import compute_planetary_hour, hour_evidence
from ..schemas import ClassifiedIntent, EvidenceItem
from .base import (
    BaseAdapter,
    get_highlight_value,
    get_table_rows,
    option_polarities,
    polarity_to_stance,
)

# ── Planetary day ruler → action polarity ─────────────────────────

DAY_RULER_PUSH: dict[str, float] = {
    "Sun":      0.3,    # vitality, visibility → mild action
    "Moon":    -0.2,    # emotion, receptivity → mild rest
    "Mars":     0.7,    # aggression, energy → strong action
    "Mercury":  0.2,    # communication → mild action
    "Jupiter":  0.5,    # expansion, optimism → action
    "Venus":   -0.1,    # comfort, pleasure → mild rest
    "Saturn":  -0.7,    # restriction, delay → strong rest
}

# ── Temperament → polarity ────────────────────────────────────────

TEMPERAMENT_PUSH: dict[str, float] = {
    "Choleric":    0.7,   # hot/dry → decisive action
    "Sanguine":    0.3,   # hot/moist → social, outgoing
    "Melancholic":-0.4,   # cold/dry → planning, caution
    "Phlegmatic": -0.6,   # cold/moist → recovery, rest
}

# ── Lot house quality ────────────────────────────────────────────
# Angular (1,4,7,10) = strong, Succedent (2,5,8,11) = moderate, Cadent (3,6,9,12) = weak

HOUSE_QUALITY: dict[int, float] = {
    1: 0.5, 2: 0.2, 3: -0.1, 4: 0.3, 5: 0.3, 6: -0.2,
    7: 0.4, 8: -0.3, 9: 0.1, 10: 0.5, 11: 0.3, 12: -0.4,
}

# ── 28 Lunar Mansions ────────────────────────────────────────────

LUNAR_MANSION_DATA: dict[int, dict[str, Any]] = {
    1:  {"name": "Al-Sharatain",       "polarity":  0.5,  "meaning": "beginnings and bold action"},
    2:  {"name": "Al-Butain",          "polarity": -0.2,  "meaning": "seeking wealth and treasure"},
    3:  {"name": "Al-Thurayya",        "polarity":  0.6,  "meaning": "elevation and recognition"},
    4:  {"name": "Al-Dabaran",         "polarity": -0.3,  "meaning": "confrontation and destruction of obstacles"},
    5:  {"name": "Al-Haq'a",           "polarity":  0.3,  "meaning": "learning and eloquence"},
    6:  {"name": "Al-Han'a",           "polarity":  0.4,  "meaning": "goodness and commerce"},
    7:  {"name": "Al-Dhira",           "polarity":  0.5,  "meaning": "love and friendship"},
    8:  {"name": "Al-Nathra",          "polarity": -0.4,  "meaning": "protection and healing"},
    9:  {"name": "Al-Tarf",            "polarity": -0.3,  "meaning": "repelling enemies"},
    10: {"name": "Al-Jabha",           "polarity":  0.6,  "meaning": "honor and success"},
    11: {"name": "Al-Zubra",           "polarity":  0.2,  "meaning": "fear and caution"},
    12: {"name": "Al-Sarfa",           "polarity": -0.2,  "meaning": "change and endings"},
    13: {"name": "Al-Awwa",            "polarity":  0.4,  "meaning": "trade and harvest"},
    14: {"name": "Al-Simak",           "polarity":  0.5,  "meaning": "authority and prominence"},
    15: {"name": "Al-Ghafr",           "polarity": -0.3,  "meaning": "hidden matters and secrets"},
    16: {"name": "Al-Zubana",          "polarity": -0.4,  "meaning": "obstacles and hindrances"},
    17: {"name": "Al-Iklil",           "polarity":  0.3,  "meaning": "healing and restoration"},
    18: {"name": "Al-Qalb",            "polarity": -0.5,  "meaning": "heart matters and conflict"},
    19: {"name": "Al-Shawla",          "polarity": -0.3,  "meaning": "medicines and travel"},
    20: {"name": "Al-Na'am",           "polarity":  0.4,  "meaning": "taming and domesticity"},
    21: {"name": "Al-Balda",           "polarity": -0.2,  "meaning": "destruction of crops — caution"},
    22: {"name": "Sa'd al-Dhabih",     "polarity": -0.4,  "meaning": "escaping and flight"},
    23: {"name": "Sa'd Bula",          "polarity": -0.3,  "meaning": "medicine and healing"},
    24: {"name": "Sa'd al-Su'ud",      "polarity":  0.7,  "meaning": "the luckiest mansion — great fortune"},
    25: {"name": "Sa'd al-Akhbiya",    "polarity": -0.2,  "meaning": "vengeance and anger"},
    26: {"name": "Al-Fargh al-Awwal",  "polarity":  0.3,  "meaning": "union and marriage"},
    27: {"name": "Al-Fargh al-Thani",  "polarity":  0.4,  "meaning": "trade and agriculture"},
    28: {"name": "Batn al-Hut",        "polarity": -0.5,  "meaning": "imprisonment and confinement"},
}

# ── Planet condition effects ──────────────────────────────────────

PLANET_CONDITION_EFFECT: dict[str, float] = {
    "Dignified":  0.3,
    "Exalted":    0.4,
    "Ruler":      0.3,
    "Detriment": -0.3,
    "Fall":       -0.4,
    "Peregrine":  -0.1,
}

# ── Temperament domain analysis ──────────────────────────────────

TEMPERAMENT_DOMAIN: dict[str, dict[str, float]] = {
    "Choleric":    {"career": 0.8, "health": 0.5, "love": 0.3},
    "Sanguine":    {"love": 0.8, "mood": 0.7, "career": 0.5},
    "Melancholic": {"career": 0.6, "wealth": 0.6, "mood": 0.4},
    "Phlegmatic":  {"health": 0.7, "mood": 0.6, "love": 0.5},
}

# ── Lot house domain meanings ─────────────────────────────────────

LOT_HOUSE_MEANING: dict[int, dict[str, Any]] = {
    1:  {"meaning": "personal initiative",     "domains": {"health": 0.8, "mood": 0.6}},
    2:  {"meaning": "material resources",      "domains": {"wealth": 0.9}},
    3:  {"meaning": "communication",           "domains": {"career": 0.6}},
    4:  {"meaning": "foundations and home",    "domains": {"mood": 0.7, "love": 0.5}},
    5:  {"meaning": "creativity and pleasure", "domains": {"love": 0.8, "mood": 0.6}},
    6:  {"meaning": "service and health",      "domains": {"health": 0.8, "career": 0.5}},
    7:  {"meaning": "partnerships",            "domains": {"love": 0.9, "career": 0.4}},
    8:  {"meaning": "shared resources",        "domains": {"wealth": 0.7, "health": 0.5}},
    9:  {"meaning": "higher purpose",          "domains": {"mood": 0.7, "career": 0.5}},
    10: {"meaning": "public standing",         "domains": {"career": 0.9, "wealth": 0.5}},
    11: {"meaning": "aspirations",             "domains": {"career": 0.6, "mood": 0.6}},
    12: {"meaning": "hidden matters",          "domains": {"mood": 0.7, "health": 0.5}},
}

# ── Sign element polarity ─────────────────────────────────────────

SIGN_ELEMENT_POLARITY: dict[str, float] = {
    "Fire":  0.6,   # Aries, Leo, Sagittarius
    "Air":   0.4,   # Gemini, Libra, Aquarius
    "Water": -0.3,  # Cancer, Scorpio, Pisces
    "Earth": -0.2,  # Taurus, Virgo, Capricorn
}

SIGN_TO_ELEMENT: dict[str, str] = {
    "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
    "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
    "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water",
    "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
}

# ── Upgrade 81: Sect-Aware Planet Dignity ───────────────────────
SECT_BENEFIC: dict[str, set[str]] = {
    "Day":   {"Jupiter", "Sun", "Saturn"},
    "Night": {"Venus", "Moon", "Mars"},
}

# ── Upgrade 82: Triplicity Ruler Chain ──────────────────────────
# (day_ruler, night_ruler, participating_ruler)
TRIPLICITY_RULERS: dict[str, tuple[str, str, str]] = {
    "Aries":       ("Sun",     "Jupiter", "Saturn"),
    "Taurus":      ("Venus",   "Moon",    "Mars"),
    "Gemini":      ("Saturn",  "Mercury", "Jupiter"),
    "Cancer":      ("Venus",   "Mars",    "Moon"),
    "Leo":         ("Sun",     "Jupiter", "Saturn"),
    "Virgo":       ("Venus",   "Moon",    "Mars"),
    "Libra":       ("Saturn",  "Mercury", "Jupiter"),
    "Scorpio":     ("Venus",   "Mars",    "Moon"),
    "Sagittarius": ("Sun",     "Jupiter", "Saturn"),
    "Capricorn":   ("Venus",   "Moon",    "Mars"),
    "Aquarius":    ("Saturn",  "Mercury", "Jupiter"),
    "Pisces":      ("Venus",   "Mars",    "Moon"),
}

# ── Upgrade 83: Fixed Star Influence ────────────────────────────
FIXED_STARS: dict[str, dict[str, Any]] = {
    "Regulus":    {"domain": "career", "push": 0.15},
    "Spica":      {"domain": "wealth", "push": 0.12},
    "Algol":      {"domain": "health", "push": -0.15},
    "Fomalhaut":  {"domain": "mood",   "push": 0.10},
    "Antares":    {"domain": "career", "push": -0.10},
    "Aldebaran":  {"domain": "career", "push": 0.10},
}

# ── Upgrade 85: Temperament Extremity thresholds ────────────────
# (applied inline — constants here for clarity)
EXTREMITY_HIGH = 0.7
EXTREMITY_LOW = 0.4
EXTREMITY_AMP_HIGH = 1.4
EXTREMITY_AMP_LOW = 0.7

# ── Upgrade 87: Mansion Series Grouping ─────────────────────────
def _mansion_series(idx: int) -> int:
    """Return series number 0-3 for a 1-based mansion index."""
    return (idx - 1) // 7   # 1-7→0, 8-14→1, 15-21→2, 22-28→3

# ── Upgrade 88: Planet Condition Weight by Importance ───────────
PLANET_IMPORTANCE: dict[str, float] = {
    "Jupiter": 1.5,
    "Saturn":  1.5,
    "Mars":    1.3,
    "Sun":     1.2,
    "Venus":   1.1,
    "Moon":    1.0,
    "Mercury": 0.8,
}

# ── Upgrade 89: Ascendant Decan Precision ───────────────────────
DECAN_MODIFIER: dict[int, float] = {1: 0.06, 2: 0.02, 3: -0.04}

# ── Upgrade 90: Mansion Domain Mapping ──────────────────────────
MANSION_DOMAIN: dict[int, str] = {
    1: "career",  2: "wealth",  3: "career",  4: "career",
    5: "mood",    6: "wealth",  7: "love",    8: "health",
    9: "career",  10: "career", 11: "mood",   12: "mood",
    13: "wealth", 14: "career", 15: "mood",   16: "career",
    17: "health", 18: "love",   19: "health", 20: "love",
    21: "wealth", 22: "mood",   23: "health", 24: "wealth",
    25: "mood",   26: "love",   27: "wealth", 28: "mood",
}


def _parse_house(value: str | None) -> int | None:
    """Extract house number from 'House 7'."""
    if not value:
        return None
    for part in value.split():
        if part.isdigit():
            return int(part)
    return None


def _parse_mansion_index(value: str | None) -> int | None:
    """Extract mansion index from table row value (may be int or string)."""
    if value is None:
        return None
    try:
        return int(str(value).strip())
    except (ValueError, AttributeError):
        return None


def _mansions_harmonize(natal_idx: int, current_idx: int) -> bool:
    """Return True when the two mansion indices are in harmonious relation.

    Harmonious patterns: same mansion, 7-mansion (quarter) apart, or
    14-mansion (opposition) apart — traditional waxing/waning symmetry.
    """
    diff = abs(natal_idx - current_idx) % 28
    return diff in {0, 7, 14, 21}


def _sign_from_highlight(value: str | None) -> str | None:
    """Extract bare sign name from a highlight value such as 'Aries rising'."""
    if not value:
        return None
    return value.split()[0].strip()


def _parse_degree(value: str | None) -> float | None:
    """Extract a numeric degree from a string like '15° Aries' or 'Aries 22.5°'."""
    if not value:
        return None
    m = _re.search(r"(\d+(?:\.\d+)?)", value)
    return float(m.group(1)) if m else None


def _get_sect_label(system_data: dict[str, Any]) -> str | None:
    """Return 'Day' or 'Night' from highlights."""
    sect_val = get_highlight_value(system_data, "sect")
    if not sect_val:
        return None
    lower = sect_val.lower()
    if "day" in lower:
        return "Day"
    if "night" in lower:
        return "Night"
    return None


class PersianAdapter(BaseAdapter):
    system_id = "persian"
    system_name = "Persian Astrology"
    confidence_scale = 0.95

    def _extract_evidence(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
    ) -> list[EvidenceItem]:
        items: list[EvidenceItem] = []
        domains = set(intent.domain_tags or [])

        # Day ruler — strongest timing signal
        ruler_val = get_highlight_value(system_data, "current day ruler")
        if ruler_val:
            weight = 0.95 if intent.time_horizon in ("today", "tomorrow") else 0.7
            items.append(EvidenceItem(feature="Planetary day ruler", value=ruler_val, weight=weight))

        # Temperament
        temp_val = get_highlight_value(system_data, "temperament")
        if temp_val:
            items.append(EvidenceItem(feature="Temperament", value=temp_val, weight=0.8))

        # Sect
        sect_val = get_highlight_value(system_data, "sect")
        if sect_val:
            items.append(EvidenceItem(feature="Sect", value=sect_val, weight=0.5))

        # Lot of Fortune
        fortune_val = get_highlight_value(system_data, "lot of fortune")
        fortune_house = _parse_house(fortune_val)
        if fortune_val:
            weight = 0.65
            if fortune_house and domains:
                lot_domains = LOT_HOUSE_MEANING.get(fortune_house, {}).get("domains", {})
                if any(d in lot_domains for d in domains):
                    weight = min(weight + 0.15, 1.0)
            items.append(EvidenceItem(feature="Lot of Fortune", value=fortune_val, weight=weight))

        # Lot of Spirit
        spirit_val = get_highlight_value(system_data, "lot of spirit")
        spirit_house = _parse_house(spirit_val)
        if spirit_val:
            items.append(EvidenceItem(feature="Lot of Spirit", value=spirit_val, weight=0.55))

        # Natal lunar mansion
        natal_mansion_val = get_highlight_value(system_data, "natal lunar mansion")
        if natal_mansion_val:
            items.append(EvidenceItem(feature="Natal lunar mansion", value=natal_mansion_val, weight=0.5))

        # Chart ruler
        chart_ruler = get_highlight_value(system_data, "chart ruler")
        if chart_ruler:
            items.append(EvidenceItem(feature="Chart ruler", value=chart_ruler, weight=0.45))

        # ── NEW: Ascendant sign (boosted for health/mood) ────────────
        asc_val = get_highlight_value(system_data, "ascendant")
        if asc_val:
            weight = 0.65
            if "health" in domains or "mood" in domains:
                weight = 0.8
            items.append(EvidenceItem(feature="Ascendant", value=asc_val, weight=weight))

        # ── NEW: Current lunar mansion with meaning ──────────────────
        lots_rows = get_table_rows(system_data, "lots and mansions")
        current_mansion_idx: int | None = None
        natal_mansion_idx: int | None = None
        for row in lots_rows:
            if len(row) >= 3 and "current lunar mansion" in str(row[0]).lower():
                current_mansion_idx = _parse_mansion_index(row[1])
                current_mansion_name = str(row[2]) if len(row) > 2 else str(row[1])
                if current_mansion_idx and current_mansion_idx in LUNAR_MANSION_DATA:
                    md = LUNAR_MANSION_DATA[current_mansion_idx]
                    meaning = md["meaning"]
                    items.append(EvidenceItem(
                        feature="Current lunar mansion",
                        value=f"{current_mansion_name} — {meaning}",
                        weight=0.7,
                    ))
            elif len(row) >= 3 and "natal lunar mansion" in str(row[0]).lower():
                natal_mansion_idx = _parse_mansion_index(row[1])

        # ── NEW: Natal vs current mansion comparison ─────────────────
        if natal_mansion_idx and current_mansion_idx:
            harmonious = _mansions_harmonize(natal_mansion_idx, current_mansion_idx)
            relation = "harmonious" if harmonious else "tense"
            items.append(EvidenceItem(
                feature="Natal–current mansion relation",
                value=relation,
                weight=0.6 if harmonious else 0.65,
            ))

        # ── NEW: Planet conditions from traditional positions table ───
        planet_rows = get_table_rows(system_data, "traditional planet positions")
        condition_items: list[tuple[float, EvidenceItem]] = []
        for row in planet_rows:
            if len(row) < 5:
                continue
            planet_name = str(row[0])
            condition = str(row[4])
            effect = PLANET_CONDITION_EFFECT.get(condition, 0.0)
            if effect != 0.0:
                abs_effect = abs(effect)
                ev = EvidenceItem(
                    feature=f"{planet_name} condition",
                    value=f"{condition} in {row[1]}",
                    weight=round(0.4 + abs_effect * 0.5, 2),
                )
                condition_items.append((abs_effect, ev))
        # Keep the 3 most significant conditions
        condition_items.sort(key=lambda x: x[0], reverse=True)
        for _, ev in condition_items[:3]:
            items.append(ev)

        # ── NEW: Temperament quality weights ─────────────────────────
        temp_rows = get_table_rows(system_data, "temperament profile")
        quality_weights: dict[str, float] = {}
        for row in temp_rows:
            if len(row) >= 2:
                key = str(row[0]).lower().strip()
                if key in ("hot", "cold", "dry", "moist"):
                    try:
                        quality_weights[key.title()] = float(row[1])
                    except (ValueError, TypeError):
                        pass
        if quality_weights:
            summary_parts = [f"{k}={v:.1f}" for k, v in sorted(quality_weights.items())]
            items.append(EvidenceItem(
                feature="Temperament qualities",
                value=", ".join(summary_parts),
                weight=0.55,
            ))

        # ── NEW: Lot of Fortune house domain relevance ───────────────
        if fortune_val:
            fortune_house = _parse_house(fortune_val)
            if fortune_house and fortune_house in LOT_HOUSE_MEANING and domains:
                lot_info = LOT_HOUSE_MEANING[fortune_house]
                lot_domains = lot_info["domains"]
                matched_domains = [d for d in domains if d in lot_domains]
                if matched_domains:
                    top_domain = max(matched_domains, key=lambda d: lot_domains[d])
                    rel_score = lot_domains[top_domain]
                    items.append(EvidenceItem(
                        feature="Fortune house domain",
                        value=f"House {fortune_house} ({lot_info['meaning']}) — {top_domain} relevance {rel_score:.0%}",
                        weight=round(0.5 + rel_score * 0.3, 2),
                    ))

        # ── NEW: Current Moon sign and Sun sign ──────────────────────
        current_rows = get_table_rows(system_data, "current cycle")
        for row in current_rows:
            if len(row) >= 2 and "current moon sign" in str(row[0]).lower():
                moon_sign = str(row[1])
                weight = 0.6 if intent.time_horizon in ("today", "tomorrow") else 0.35
                items.append(EvidenceItem(
                    feature="Current Moon sign",
                    value=moon_sign,
                    weight=weight,
                ))
            elif len(row) >= 2 and "current sun sign" in str(row[0]).lower():
                sun_sign = str(row[1])
                items.append(EvidenceItem(
                    feature="Current Sun sign",
                    value=sun_sign,
                    weight=0.4,
                ))

        # ── NEW: Temperament domain relevance indicator ───────────────
        if temp_val and domains:
            temp_name = temp_val.strip()
            domain_scores = TEMPERAMENT_DOMAIN.get(temp_name, {})
            matched = {d: domain_scores[d] for d in domains if d in domain_scores}
            if matched:
                top_domain = max(matched, key=matched.get)  # type: ignore[arg-type]
                rel = matched[top_domain]
                items.append(EvidenceItem(
                    feature="Temperament domain fit",
                    value=f"{temp_name} is {rel:.0%} relevant to {top_domain}",
                    weight=round(0.4 + rel * 0.35, 2),
                ))

        # ── Upgrade 82: Triplicity Ruler Chain ──────────────────────
        if asc_val:
            asc_sign = _sign_from_highlight(asc_val)
            if asc_sign and asc_sign in TRIPLICITY_RULERS:
                trip = TRIPLICITY_RULERS[asc_sign]
                # Evaluate all three rulers from planet condition rows
                _cond_map: dict[str, str] = {}
                for row in planet_rows:
                    if len(row) >= 5:
                        _cond_map[str(row[0]).strip()] = str(row[4]).strip()
                strong_set = {"Dignified", "Exalted", "Ruler"}
                weak_set = {"Detriment", "Fall"}
                strong_count = sum(1 for r in trip if _cond_map.get(r) in strong_set)
                weak_count = sum(1 for r in trip if _cond_map.get(r) in weak_set)
                if strong_count == 3:
                    trip_push = 0.15
                    desc = "all 3 triplicity rulers strong"
                elif weak_count == 3:
                    trip_push = -0.12
                    desc = "all 3 triplicity rulers weak"
                else:
                    trip_push = round((strong_count - weak_count) * 0.05, 2)
                    desc = f"{strong_count} strong, {weak_count} weak of 3 triplicity rulers"
                items.append(EvidenceItem(
                    feature="Triplicity ruler chain",
                    value=f"{asc_sign}: {trip[0]}/{trip[1]}/{trip[2]} — {desc}",
                    weight=0.60,
                ))

        # ── Upgrade 83: Fixed Star Influence ────────────────────────
        for star_name, star_info in FIXED_STARS.items():
            # Check planet positions table for mentions of this star
            for row in planet_rows:
                row_text = " ".join(str(c) for c in row).lower()
                if star_name.lower() in row_text:
                    items.append(EvidenceItem(
                        feature=f"Fixed star {star_name}",
                        value=f"{star_info['domain']} influence ({star_info['push']:+.2f})",
                        weight=0.65,
                    ))
                    break  # only once per star

        # ── Upgrade 84: Void-of-Course Moon Detection ───────────────
        for row in current_rows:
            if len(row) >= 2 and "current moon sign" in str(row[0]).lower():
                moon_degree = _parse_degree(str(row[1]))
                if moon_degree is not None and moon_degree > 25:
                    # Check for applying aspects — look for aspect mentions
                    has_applying = False
                    for arow in current_rows:
                        arow_text = " ".join(str(c) for c in arow).lower()
                        if "applying" in arow_text or "aspect" in arow_text:
                            has_applying = True
                            break
                    if not has_applying:
                        items.append(EvidenceItem(
                            feature="Void-of-course Moon",
                            value=f"Moon at {moon_degree:.0f}° with no applying aspects — caution for timing",
                            weight=0.60,
                        ))
                break

        # ── Upgrade 85: Temperament Extremity (evidence note) ───────
        if quality_weights:
            max_qw = max(quality_weights.values())
            if max_qw > EXTREMITY_HIGH:
                items.append(EvidenceItem(
                    feature="Temperament extremity",
                    value=f"dominant quality at {max_qw:.1f} — amplified temperament",
                    weight=0.55,
                ))
            elif max_qw < EXTREMITY_LOW:
                items.append(EvidenceItem(
                    feature="Temperament extremity",
                    value=f"balanced qualities (max {max_qw:.1f}) — muted temperament",
                    weight=0.55,
                ))

        # ── Upgrade 86: Lot Interaction (Fortune × Spirit) ──────────
        if fortune_house is not None and spirit_house is not None:
            lot_distance = (spirit_house - fortune_house) % 12
            if lot_distance == 0:
                lot_desc = "same house — synergy"
                lot_push = 0.12
            elif lot_distance == 6:
                lot_desc = "opposing houses — creative tension"
                lot_push = 0.06
            elif lot_distance in (3, 9):
                lot_desc = "square aspect — friction"
                lot_push = -0.08
            else:
                lot_desc = f"distance {lot_distance}"
                lot_push = 0.0
            if lot_push != 0.0:
                items.append(EvidenceItem(
                    feature="Lot interaction (Fortune × Spirit)",
                    value=f"Houses {fortune_house} & {spirit_house}: {lot_desc} ({lot_push:+.2f})",
                    weight=0.55,
                ))

        # ── Upgrade 87: Mansion Series Grouping ─────────────────────
        if natal_mansion_idx and current_mansion_idx:
            natal_series = _mansion_series(natal_mansion_idx)
            current_series = _mansion_series(current_mansion_idx)
            series_diff = abs(natal_series - current_series)
            series_names = {0: "beginning", 1: "growth", 2: "harvest", 3: "release"}
            if series_diff == 0:
                series_desc = "same series — resonance"
                series_push = 0.08
            elif series_diff == 1 or series_diff == 3:
                series_desc = "adjacent series — flow"
                series_push = 0.04
            else:
                series_desc = "opposite series — contrast"
                series_push = -0.06
            items.append(EvidenceItem(
                feature="Mansion series",
                value=f"natal={series_names.get(natal_series, '?')}, current={series_names.get(current_series, '?')}: {series_desc}",
                weight=0.50,
            ))

        # ── Upgrade 89: Ascendant Decan Precision ───────────────────
        if asc_val:
            asc_deg = _parse_degree(asc_val)
            if asc_deg is not None:
                if asc_deg < 10:
                    decan = 1
                    decan_desc = "1st decan — pure sign energy"
                elif asc_deg < 20:
                    decan = 2
                    decan_desc = "2nd decan — secondary influence"
                else:
                    decan = 3
                    decan_desc = "3rd decan — tertiary influence"
                items.append(EvidenceItem(
                    feature="Ascendant decan",
                    value=f"{asc_deg:.0f}° {decan_desc}",
                    weight=0.45,
                ))

        # ── Upgrade 90: Mansion Domain evidence ─────────────────────
        if current_mansion_idx and current_mansion_idx in MANSION_DOMAIN and domains:
            m_domain = MANSION_DOMAIN[current_mansion_idx]
            match_flag = m_domain in domains
            items.append(EvidenceItem(
                feature="Mansion domain alignment",
                value=f"mansion {current_mansion_idx} ({m_domain}) {'matches' if match_flag else 'differs from'} question domain",
                weight=0.50,
            ))

        # Planetary hour
        hour_data = compute_planetary_hour()
        items.append(hour_evidence(hour_data, intent.time_horizon))

        # Moon phase
        phase = compute_phase(system_data)
        if phase:
            items.append(phase_evidence(phase, intent.time_horizon))

        return items[:18]

    def _compute_stance(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
        evidence: list[EvidenceItem],
    ) -> dict[str, float]:
        options = intent.options or ["favorable", "cautious"]
        polarities = option_polarities(options)
        domains = set(intent.domain_tags or [])

        action_score = 0.0
        total_weight = 0.0

        # ── Planetary day ruler (strongest timing factor) ──────────
        ruler_val = get_highlight_value(system_data, "current day ruler") or ""
        ruler_push = DAY_RULER_PUSH.get(ruler_val.strip(), 0.0)
        w = 3.0 if intent.time_horizon in ("today", "tomorrow") else 1.5
        if intent.question_type == "timing_question":
            w *= 1.3
        action_score += ruler_push * w
        total_weight += w

        # ── Temperament (with Upgrade 85: extremity scaling) ────────
        temp_val = get_highlight_value(system_data, "temperament") or ""
        matched_temp: str | None = None
        # Parse temperament quality weights for extremity check
        _temp_rows = get_table_rows(system_data, "temperament profile")
        _quality_weights: dict[str, float] = {}
        for _row in _temp_rows:
            if len(_row) >= 2:
                _key = str(_row[0]).lower().strip()
                if _key in ("hot", "cold", "dry", "moist"):
                    try:
                        _quality_weights[_key.title()] = float(_row[1])
                    except (ValueError, TypeError):
                        pass
        extremity_mult = 1.0
        if _quality_weights:
            _max_qw = max(_quality_weights.values())
            if _max_qw > EXTREMITY_HIGH:
                extremity_mult = EXTREMITY_AMP_HIGH
            elif _max_qw < EXTREMITY_LOW:
                extremity_mult = EXTREMITY_AMP_LOW

        for temp_name, push in TEMPERAMENT_PUSH.items():
            if temp_name.lower() in temp_val.lower():
                matched_temp = temp_name
                scaled_push = push * extremity_mult
                action_score += scaled_push * 1.5
                total_weight += 1.5
                break

        # ── NEW: Temperament domain-specific scoring ────────────────
        if matched_temp and domains:
            domain_weights = TEMPERAMENT_DOMAIN.get(matched_temp, {})
            domain_relevance = max((domain_weights.get(d, 0.0) for d in domains), default=0.0)
            if domain_relevance > 0:
                temp_push = TEMPERAMENT_PUSH.get(matched_temp, 0.0) * extremity_mult
                # Scale the extra push by how relevant this temperament is to the domain
                extra_w = 0.8 * domain_relevance
                action_score += temp_push * extra_w
                total_weight += extra_w

        # ── Sect ───────────────────────────────────────────────────
        sect_val = get_highlight_value(system_data, "sect") or ""
        if "day" in sect_val.lower():
            action_score += 0.2 * 0.8
            total_weight += 0.8
        elif "night" in sect_val.lower():
            action_score -= 0.2 * 0.8
            total_weight += 0.8

        # ── Lot of Fortune house quality ───────────────────────────
        fortune_val = get_highlight_value(system_data, "lot of fortune")
        fortune_house = _parse_house(fortune_val)
        if fortune_house is not None:
            quality = HOUSE_QUALITY.get(fortune_house, 0.0)
            w = 1.0
            # ── NEW: Lot house domain-specific scoring ──────────────
            if domains and fortune_house in LOT_HOUSE_MEANING:
                lot_domains = LOT_HOUSE_MEANING[fortune_house]["domains"]
                domain_boost = max((lot_domains.get(d, 0.0) for d in domains), default=0.0)
                w += domain_boost * 0.8
            action_score += quality * w
            total_weight += w

        # ── Lot of Spirit house quality ────────────────────────────
        spirit_val = get_highlight_value(system_data, "lot of spirit")
        spirit_house = _parse_house(spirit_val)
        if spirit_house is not None:
            quality = HOUSE_QUALITY.get(spirit_house, 0.0)
            action_score += quality * 0.8
            total_weight += 0.8

        # ── NEW: Current lunar mansion polarity ────────────────────
        lots_rows = get_table_rows(system_data, "lots and mansions")
        current_mansion_idx: int | None = None
        natal_mansion_idx: int | None = None
        for row in lots_rows:
            if len(row) >= 2 and "current lunar mansion" in str(row[0]).lower():
                current_mansion_idx = _parse_mansion_index(row[1])
            elif len(row) >= 2 and "natal lunar mansion" in str(row[0]).lower():
                natal_mansion_idx = _parse_mansion_index(row[1])

        if current_mansion_idx and current_mansion_idx in LUNAR_MANSION_DATA:
            mansion_pol = LUNAR_MANSION_DATA[current_mansion_idx]["polarity"]
            # Upgrade 90: Mansion domain mapping — amplify/reduce polarity
            if domains and current_mansion_idx in MANSION_DOMAIN:
                m_domain = MANSION_DOMAIN[current_mansion_idx]
                if m_domain in domains:
                    mansion_pol *= 1.4
                else:
                    mansion_pol *= 0.8
            w = 1.2 if intent.time_horizon in ("today", "tomorrow") else 0.6
            action_score += mansion_pol * w
            total_weight += w

        # ── NEW: Natal-current mansion alignment ───────────────────
        if natal_mansion_idx and current_mansion_idx:
            harmonious = _mansions_harmonize(natal_mansion_idx, current_mansion_idx)
            alignment_push = 0.15 if harmonious else -0.15
            action_score += alignment_push * 0.8
            total_weight += 0.8

        # ── Planet condition aggregate (Upgrades 81 + 88) ────────
        planet_rows = get_table_rows(system_data, "traditional planet positions")
        sect_label = _get_sect_label(system_data)
        net_dignity = 0.0
        importance_sum = 0.0
        for row in planet_rows:
            if len(row) < 5:
                continue
            planet_name = str(row[0]).strip()
            condition = str(row[4])
            effect = PLANET_CONDITION_EFFECT.get(condition, 0.0)
            # Upgrade 81: Sect-aware dignity multiplier
            if sect_label and effect != 0.0:
                own_sect = SECT_BENEFIC.get(sect_label, set())
                opposite_sect_key = "Night" if sect_label == "Day" else "Day"
                opposite_sect = SECT_BENEFIC.get(opposite_sect_key, set())
                if planet_name in own_sect:
                    effect *= 1.3
                elif planet_name in opposite_sect:
                    effect *= 0.7
            # Upgrade 88: Weight by planet importance
            importance = PLANET_IMPORTANCE.get(planet_name, 1.0)
            net_dignity += effect * importance
            importance_sum += importance
        if importance_sum > 0:
            avg_dignity = net_dignity / importance_sum
            w = 1.0
            action_score += avg_dignity * w
            total_weight += w

        # ── NEW: Ascendant sign element polarity ───────────────────
        asc_val = get_highlight_value(system_data, "ascendant")
        if asc_val:
            asc_sign = _sign_from_highlight(asc_val)
            if asc_sign:
                element = SIGN_TO_ELEMENT.get(asc_sign)
                if element:
                    el_pol = SIGN_ELEMENT_POLARITY.get(element, 0.0)
                    w = 0.9
                    if "health" in domains or "mood" in domains:
                        w = 1.3
                    action_score += el_pol * w
                    total_weight += w

        # ── NEW: Current Moon sign short-term influence ─────────────
        current_rows = get_table_rows(system_data, "current cycle")
        for row in current_rows:
            if len(row) >= 2 and "current moon sign" in str(row[0]).lower():
                moon_sign = str(row[1])
                element = SIGN_TO_ELEMENT.get(moon_sign)
                if element:
                    moon_el_pol = SIGN_ELEMENT_POLARITY.get(element, 0.0)
                    w = 1.0 if intent.time_horizon in ("today", "tomorrow") else 0.3
                    action_score += moon_el_pol * w
                    total_weight += w
                break

        # ── Upgrade 82: Triplicity Ruler Chain stance ─────────────
        if asc_val:
            asc_sign_trip = _sign_from_highlight(asc_val)
            if asc_sign_trip and asc_sign_trip in TRIPLICITY_RULERS:
                trip = TRIPLICITY_RULERS[asc_sign_trip]
                _cond_map_s: dict[str, str] = {}
                for row in planet_rows:
                    if len(row) >= 5:
                        _cond_map_s[str(row[0]).strip()] = str(row[4]).strip()
                strong_set = {"Dignified", "Exalted", "Ruler"}
                weak_set = {"Detriment", "Fall"}
                strong_c = sum(1 for r in trip if _cond_map_s.get(r) in strong_set)
                weak_c = sum(1 for r in trip if _cond_map_s.get(r) in weak_set)
                if strong_c == 3:
                    trip_stance_push = 0.15
                elif weak_c == 3:
                    trip_stance_push = -0.12
                else:
                    trip_stance_push = round((strong_c - weak_c) * 0.05, 2)
                if trip_stance_push != 0.0:
                    action_score += trip_stance_push * 0.6
                    total_weight += 0.6

        # ── Upgrade 83: Fixed Star Influence stance ───────────────
        for star_name, star_info in FIXED_STARS.items():
            for row in planet_rows:
                row_text = " ".join(str(c) for c in row).lower()
                if star_name.lower() in row_text:
                    star_push = star_info["push"]
                    # Domain relevance boost
                    if star_info["domain"] in domains:
                        star_push *= 1.3
                    action_score += star_push * 0.65
                    total_weight += 0.65
                    break

        # ── Upgrade 84: Void-of-Course Moon stance ────────────────
        for row in current_rows:
            if len(row) >= 2 and "current moon sign" in str(row[0]).lower():
                voc_degree = _parse_degree(str(row[1]))
                if voc_degree is not None and voc_degree > 25:
                    has_applying = False
                    for arow in current_rows:
                        arow_text = " ".join(str(c) for c in arow).lower()
                        if "applying" in arow_text or "aspect" in arow_text:
                            has_applying = True
                            break
                    if not has_applying:
                        voc_push = -0.10
                        if intent.question_type == "timing_question":
                            voc_push *= 1.5
                        action_score += voc_push * 0.6
                        total_weight += 0.6
                break

        # ── Upgrade 86: Lot Interaction (Fortune × Spirit) stance ─
        if fortune_house is not None and spirit_house is not None:
            lot_dist = (spirit_house - fortune_house) % 12
            if lot_dist == 0:
                lot_stance_push = 0.12
            elif lot_dist == 6:
                lot_stance_push = 0.06
            elif lot_dist in (3, 9):
                lot_stance_push = -0.08
            else:
                lot_stance_push = 0.0
            if lot_stance_push != 0.0:
                action_score += lot_stance_push * 0.55
                total_weight += 0.55

        # ── Upgrade 87: Mansion Series Grouping stance ────────────
        if natal_mansion_idx and current_mansion_idx:
            n_series = _mansion_series(natal_mansion_idx)
            c_series = _mansion_series(current_mansion_idx)
            s_diff = abs(n_series - c_series)
            if s_diff == 0:
                series_push = 0.08
            elif s_diff == 1 or s_diff == 3:
                series_push = 0.04
            else:
                series_push = -0.06
            action_score += series_push * 0.5
            total_weight += 0.5

        # ── Upgrade 89: Ascendant Decan Precision stance ──────────
        if asc_val:
            asc_deg_s = _parse_degree(asc_val)
            if asc_deg_s is not None:
                if asc_deg_s < 10:
                    decan_mod = DECAN_MODIFIER[1]
                elif asc_deg_s < 20:
                    decan_mod = DECAN_MODIFIER[2]
                else:
                    decan_mod = DECAN_MODIFIER[3]
                action_score += decan_mod * 0.45
                total_weight += 0.45

        # ── Planetary hour ─────────────────────────────────────────
        hour_data = compute_planetary_hour()
        w = 2.5 if intent.time_horizon in ("today", "tomorrow") else 0.8
        if intent.question_type == "timing_question":
            w *= 1.3
        action_score += hour_data["polarity"] * w
        total_weight += w

        # ── Moon phase ────────────────────────────────────────────
        phase = compute_phase(system_data)
        if phase:
            w = 1.5 if intent.time_horizon in ("today", "tomorrow") else 0.7
            action_score += phase["polarity"] * w
            total_weight += w

        raw = action_score / total_weight if total_weight > 0 else 0.0
        return polarity_to_stance(options, raw)
