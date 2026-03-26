"""Planetary hour calculator — Chaldean order.

The 7 classical planets rule the hours in repeating Chaldean order:
  Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon

Each day of the week starts with its ruler:
  Sunday=Sun, Monday=Moon, Tuesday=Mars, Wednesday=Mercury,
  Thursday=Jupiter, Friday=Venus, Saturday=Saturn

Day is divided into 12 day-hours (sunrise to sunset) and 12 night-hours
(sunset to sunrise).  We approximate sunrise=06:00, sunset=18:00 for
simplicity — accurate enough for symbolic purposes.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from .schemas import EvidenceItem

CHALDEAN_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"]

# Which planet starts the day (index into CHALDEAN_ORDER)
DAY_START = {
    0: 3,  # Monday → Moon (index 6)... actually let me redo this properly
}

# Day of week (0=Monday in Python) → starting planet for hour 1
# Sunday=Sun, Monday=Moon, Tuesday=Mars, Wednesday=Mercury,
# Thursday=Jupiter, Friday=Venus, Saturday=Saturn
WEEKDAY_RULER_INDEX = {
    0: 6,  # Monday → Moon
    1: 2,  # Tuesday → Mars
    2: 5,  # Wednesday → Mercury
    3: 1,  # Thursday → Jupiter
    4: 4,  # Friday → Venus
    5: 0,  # Saturday → Saturn
    6: 3,  # Sunday → Sun
}

# Planetary hour influence on action
HOUR_POLARITY: dict[str, float] = {
    "Sun":     0.4,   # vitality, confidence
    "Moon":   -0.3,   # emotion, receptivity, rest
    "Mars":    0.8,   # action, energy, drive
    "Mercury": 0.3,   # communication, deals, travel
    "Jupiter": 0.5,   # expansion, luck, opportunity
    "Venus":  -0.1,   # comfort, beauty, relationships
    "Saturn": -0.7,   # restriction, discipline, patience
}

HOUR_MEANING: dict[str, str] = {
    "Sun":     "vitality and confidence",
    "Moon":    "emotion and receptivity",
    "Mars":    "action and drive",
    "Mercury": "communication and deals",
    "Jupiter": "expansion and opportunity",
    "Venus":   "relationships and comfort",
    "Saturn":  "discipline and patience",
}


def compute_planetary_hour(now: datetime | None = None) -> dict[str, Any]:
    """Compute the current planetary hour ruler.

    Parameters
    ----------
    now : datetime | None
        Current local time.  Uses datetime.now() if None.
    """
    if now is None:
        now = datetime.now()

    weekday = now.weekday()  # 0=Monday
    hour_decimal = now.hour + now.minute / 60.0

    # Determine if day or night hour
    # Approximate: day = 06:00-18:00, night = 18:00-06:00
    if 6.0 <= hour_decimal < 18.0:
        # Day hour
        hours_since_sunrise = hour_decimal - 6.0
        hour_index = int(hours_since_sunrise)  # 0-11
    else:
        # Night hour
        if hour_decimal >= 18.0:
            hours_since_sunset = hour_decimal - 18.0
        else:
            hours_since_sunset = hour_decimal + 6.0  # after midnight
        hour_index = 12 + int(hours_since_sunset)  # 12-23

    # Starting planet for this day
    start_idx = WEEKDAY_RULER_INDEX.get(weekday, 3)

    # Advance through Chaldean order
    planet_idx = (start_idx + hour_index) % 7
    ruler = CHALDEAN_ORDER[planet_idx]

    return {
        "ruler": ruler,
        "polarity": HOUR_POLARITY[ruler],
        "meaning": HOUR_MEANING[ruler],
        "hour_index": hour_index,
        "is_day": 6.0 <= hour_decimal < 18.0,
    }


def hour_evidence(hour_data: dict[str, Any], time_horizon: str) -> EvidenceItem:
    """Build evidence item from planetary hour."""
    weight = 0.85 if time_horizon in ("today", "tomorrow") else 0.4
    period = "day" if hour_data["is_day"] else "night"
    return EvidenceItem(
        feature="Planetary hour",
        value=f"{hour_data['ruler']} hour ({period}) — {hour_data['meaning']}",
        weight=weight,
    )
