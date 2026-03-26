"""Moon phase engine — computes current lunar phase from sign + degree.

Phase angle = (Moon longitude - Sun longitude) mod 360

Phase names and action polarity:
  New Moon       (0-45)     → withdraw, seed intentions           -0.8
  Waxing Crescent(45-90)   → begin, initiate                      0.3
  First Quarter  (90-135)   → commit, push through resistance      0.6
  Waxing Gibbous (135-180)  → refine, adjust, build momentum       0.4
  Full Moon      (180-225)  → culminate, release, decide            0.7
  Waning Gibbous (225-270)  → share, teach, distribute             -0.1
  Last Quarter   (270-315)  → re-evaluate, let go, course-correct  -0.5
  Waning Crescent(315-360)  → rest, surrender, prepare for new     -0.7
"""

from __future__ import annotations

from typing import Any

from .schemas import EvidenceItem

SIGN_ORDER = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

SIGN_INDEX = {name: i for i, name in enumerate(SIGN_ORDER)}

PHASES = [
    (0,   45,  "New Moon",         -0.8, "withdraw, seed intentions"),
    (45,  90,  "Waxing Crescent",   0.3, "begin and initiate"),
    (90,  135, "First Quarter",     0.6, "commit and push through"),
    (135, 180, "Waxing Gibbous",    0.4, "refine and build momentum"),
    (180, 225, "Full Moon",         0.7, "culminate and decide"),
    (225, 270, "Waning Gibbous",   -0.1, "share and distribute"),
    (270, 315, "Last Quarter",     -0.5, "re-evaluate and let go"),
    (315, 360, "Waning Crescent",  -0.7, "rest and prepare"),
]


def _parse_longitude(highlight_value: str) -> float | None:
    """Extract absolute ecliptic longitude from a highlight like 'Pisces 15.93d in House 7'."""
    for sign, idx in SIGN_INDEX.items():
        if sign in highlight_value:
            # Find the degree number after the sign name
            after_sign = highlight_value.split(sign)[-1].strip()
            for token in after_sign.split():
                cleaned = token.rstrip("d").rstrip(",")
                try:
                    deg = float(cleaned)
                    return idx * 30.0 + deg
                except ValueError:
                    continue
    return None


def compute_phase(system_data: dict[str, Any]) -> dict[str, Any] | None:
    """Compute moon phase from Western engine highlights.

    Returns dict with phase_name, phase_angle, polarity, advice, or None if
    Sun/Moon positions aren't available.
    """
    highlights = system_data.get("highlights", [])

    sun_long = None
    moon_long = None
    for h in highlights:
        label = str(h.get("label", "")).lower()
        value = str(h.get("value", ""))
        if label == "sun" and sun_long is None:
            sun_long = _parse_longitude(value)
        elif label == "moon" and moon_long is None:
            moon_long = _parse_longitude(value)

    if sun_long is None or moon_long is None:
        return None

    angle = (moon_long - sun_long) % 360.0

    for lo, hi, name, polarity, advice in PHASES:
        if lo <= angle < hi:
            return {
                "phase_name": name,
                "phase_angle": round(angle, 1),
                "polarity": polarity,
                "advice": advice,
            }

    # Edge case: exactly 360
    return {
        "phase_name": "New Moon",
        "phase_angle": round(angle, 1),
        "polarity": -0.8,
        "advice": "withdraw, seed intentions",
    }


def phase_evidence(phase: dict[str, Any], time_horizon: str) -> EvidenceItem:
    """Build an evidence item from a computed moon phase."""
    weight = 0.9 if time_horizon in ("today", "tomorrow") else 0.6
    return EvidenceItem(
        feature="Moon phase",
        value=f"{phase['phase_name']} — {phase['advice']}",
        weight=weight,
    )
