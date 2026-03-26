"""Temporal Variation Layer (Upgrade 10/18/19/20) — daily modulation factor.

Computes a small per-domain modulation from:
  (a) planetary day ruler (from Persian adapter data)
  (b) current Moon sign (from Western/Persian data)
  (c) current planetary hour (Upgrade 19)

Returns {domain: float} where values range from -0.12 to +0.12.
Applied to ALL adapter stances before aggregation.

Upgrade 18: Amplified temporal modulation clamp from ±0.08 → ±0.12.
Upgrade 19: Planetary hour stance integration.
Upgrade 20: Moon phase confidence modifier.
"""

from __future__ import annotations

import datetime
from typing import Any

from .planetary_hours import compute_planetary_hour

# ── Planetary day rulers ────────────────────────────────────────
# Monday=0 in Python datetime.weekday()
DAY_RULER: dict[int, str] = {
    0: "Moon",      # Monday
    1: "Mars",      # Tuesday
    2: "Mercury",   # Wednesday
    3: "Jupiter",   # Thursday
    4: "Venus",     # Friday
    5: "Saturn",    # Saturday
    6: "Sun",       # Sunday
}

# Planet → domain affinity for the day-ruler effect
PLANET_DAY_DOMAIN: dict[str, dict[str, float]] = {
    "Sun":     {"career": 0.06,  "health": 0.04,  "mood": 0.02},
    "Moon":    {"mood": 0.07,    "love": 0.05,    "health": 0.03},
    "Mars":    {"career": 0.05,  "health": 0.06,  "love": -0.03},
    "Mercury": {"career": 0.05,  "wealth": 0.04,  "mood": 0.03},
    "Jupiter": {"wealth": 0.07,  "career": 0.05,  "mood": 0.04},
    "Venus":   {"love": 0.08,    "mood": 0.05,    "wealth": 0.04},
    "Saturn":  {"career": 0.04,  "health": -0.05, "mood": -0.04},
}

# ── Moon sign element → domain modulation ────────────────────────
SIGN_ELEMENT: dict[str, str] = {
    "Aries": "Fire", "Taurus": "Earth", "Gemini": "Air", "Cancer": "Water",
    "Leo": "Fire", "Virgo": "Earth", "Libra": "Air", "Scorpio": "Water",
    "Sagittarius": "Fire", "Capricorn": "Earth", "Aquarius": "Air", "Pisces": "Water",
}

ELEMENT_DOMAIN_MOD: dict[str, dict[str, float]] = {
    "Fire":  {"career": 0.04,  "health": 0.03,  "mood": 0.02, "love": 0.01, "wealth": 0.01},
    "Earth": {"wealth": 0.05,  "career": 0.03,  "health": 0.02, "love": 0.00, "mood": -0.02},
    "Air":   {"mood": 0.04,    "love": 0.03,    "career": 0.02, "wealth": 0.01, "health": 0.00},
    "Water": {"love": 0.05,    "mood": 0.04,    "health": 0.01, "career": -0.02, "wealth": 0.00},
}

ALL_DOMAINS = ["love", "career", "health", "wealth", "mood"]

# ── Upgrade 19: Planetary hour → domain modifiers ─────────────────
PLANET_HOUR_DOMAIN: dict[str, dict[str, float]] = {
    "Sun":     {"career": 0.04, "health": 0.03},
    "Moon":    {"mood": 0.05,   "love": 0.02},
    "Mars":    {"career": 0.03, "health": -0.02},
    "Mercury": {"career": 0.02, "mood": 0.02},
    "Jupiter": {"wealth": 0.05, "career": 0.03},
    "Venus":   {"love": 0.05,   "mood": 0.03},
    "Saturn":  {"career": -0.03, "health": -0.02, "mood": -0.03},
}


def compute_planetary_hour_modifier(reading: dict[str, Any]) -> dict[str, float]:
    """Upgrade 19 — compute domain modifiers from the current planetary hour.

    Tries to extract the planetary hour ruler from the reading's Persian
    system data first; falls back to computing it from the current time.
    """
    ruler: str | None = None

    # Try reading data first (Persian system may have planetary hour info)
    persian = reading.get("systems", {}).get("persian", {})
    for h in persian.get("highlights", []):
        label = str(h.get("label", "")).lower()
        if "planetary hour" in label or "current hour" in label:
            val = str(h.get("value", ""))
            for planet in PLANET_HOUR_DOMAIN:
                if planet in val:
                    ruler = planet
                    break
            if ruler:
                break

    # Fall back to computing from current time
    if ruler is None:
        hour_data = compute_planetary_hour()
        ruler = hour_data["ruler"]

    return dict(PLANET_HOUR_DOMAIN.get(ruler, {}))


# ── Upgrade 20: Moon phase → confidence modifier ─────────────────
MOON_PHASE_CONFIDENCE: dict[str, float] = {
    "New Moon":         0.03,
    "Full Moon":        0.03,
    "Waxing Crescent":  0.01,
    "Waning Crescent":  0.01,
    "First Quarter":   -0.03,
    "Last Quarter":    -0.03,
    "Waxing Gibbous":   0.0,
    "Waning Gibbous":   0.0,
}


def moon_phase_confidence_modifier(reading: dict[str, Any]) -> float:
    """Upgrade 20 — return a confidence modifier based on current moon phase.

    Extracts the moon phase from the Western or Persian system data.
    Returns a small float adjustment for aggregation confidence.
    """
    # Try Western system first (most likely to have moon phase)
    western = reading.get("systems", {}).get("western", {})
    for h in western.get("highlights", []):
        label = str(h.get("label", "")).lower()
        if "moon phase" in label or "moon_phase" in label or "lunar phase" in label:
            val = str(h.get("value", ""))
            for phase, mod in MOON_PHASE_CONFIDENCE.items():
                if phase.lower() in val.lower():
                    return mod

    # Try Persian system
    persian = reading.get("systems", {}).get("persian", {})
    for h in persian.get("highlights", []):
        label = str(h.get("label", "")).lower()
        if "moon phase" in label or "lunar phase" in label:
            val = str(h.get("value", ""))
            for phase, mod in MOON_PHASE_CONFIDENCE.items():
                if phase.lower() in val.lower():
                    return mod

    # Check nested structures (some systems store moon phase differently)
    moon_phase = western.get("moon_phase") or persian.get("moon_phase")
    if isinstance(moon_phase, str):
        for phase, mod in MOON_PHASE_CONFIDENCE.items():
            if phase.lower() in moon_phase.lower():
                return mod

    return 0.0  # no phase found → neutral


def _get_current_moon_sign(reading: dict[str, Any]) -> str | None:
    """Extract the current Moon sign from Western or Persian system data."""
    # Try Persian first (has explicit current Moon sign)
    persian = reading.get("systems", {}).get("persian", {})
    for h in persian.get("highlights", []):
        label = str(h.get("label", "")).lower()
        if "current moon" in label:
            val = str(h.get("value", ""))
            for sign in SIGN_ELEMENT:
                if sign in val:
                    return sign

    # Fall back to Western Moon sign
    western = reading.get("systems", {}).get("western", {})
    for h in western.get("highlights", []):
        label = str(h.get("label", "")).lower()
        if label in ("moon", "moon sign"):
            val = str(h.get("value", ""))
            for sign in SIGN_ELEMENT:
                if sign in val:
                    return sign

    return None


def compute_temporal_modulation(reading: dict[str, Any]) -> dict[str, float]:
    """Compute daily domain modulation factors.

    Returns a dict like {"love": 0.04, "career": -0.02, ...}
    with values in the range [-0.12, +0.12].

    Upgrade 18: Amplified clamp range from ±0.08 → ±0.12.
    Upgrade 19: Planetary hour stance integration merged here.
    """
    mods: dict[str, float] = {d: 0.0 for d in ALL_DOMAINS}

    # (a) Planetary day ruler
    today = datetime.date.today()
    day_ruler = DAY_RULER.get(today.weekday(), "Sun")
    day_mods = PLANET_DAY_DOMAIN.get(day_ruler, {})
    for d in ALL_DOMAINS:
        mods[d] += day_mods.get(d, 0.0)

    # (b) Current Moon sign
    moon_sign = _get_current_moon_sign(reading)
    if moon_sign:
        element = SIGN_ELEMENT.get(moon_sign)
        if element:
            elem_mods = ELEMENT_DOMAIN_MOD.get(element, {})
            for d in ALL_DOMAINS:
                mods[d] += elem_mods.get(d, 0.0)

    # (c) Upgrade 19: Planetary hour modifiers
    hour_mods = compute_planetary_hour_modifier(reading)
    for d in ALL_DOMAINS:
        mods[d] += hour_mods.get(d, 0.0)

    # Clamp to [-0.12, +0.12] (Upgrade 18: was ±0.08)
    return {d: max(-0.12, min(0.12, round(v, 4))) for d, v in mods.items()}


def apply_temporal_modulation(
    opinions: list,
    modulation: dict[str, float],
    domain_tags: list[str],
) -> None:
    """Apply temporal modulation to adapter stances IN PLACE.

    For each opinion, shift the winning option's stance by the average
    domain modulation for the question's domain tags.
    """
    if not domain_tags or not modulation:
        return

    # Compute average mod for the question's domains
    avg_mod = sum(modulation.get(d, 0.0) for d in domain_tags) / len(domain_tags)
    if abs(avg_mod) < 0.005:
        return  # negligible

    for opinion in opinions:
        if not opinion.relevant:
            continue
        # Shift "favorable" up and "cautious" down (or vice versa)
        keys = list(opinion.stance.keys())
        if len(keys) < 2:
            continue

        # Apply shift to first option (usually "favorable" or active choice)
        new_stance = dict(opinion.stance)
        new_stance[keys[0]] = max(0.05, min(0.95, new_stance[keys[0]] + avg_mod))
        new_stance[keys[1]] = max(0.05, min(0.95, new_stance[keys[1]] - avg_mod))

        # Re-normalize
        total = sum(new_stance.values())
        if total > 0:
            opinion.stance = {k: round(v / total, 3) for k, v in new_stance.items()}
