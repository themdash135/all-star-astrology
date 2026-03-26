"""Retrograde detection — extracts retrograde status from engine tables.

Key retrograde effects:
  Mercury Rx → don't sign contracts, miscommunication, review old work
  Venus Rx   → don't start relationships, revisit old connections
  Mars Rx    → don't start conflicts, low physical energy, delays in action
  Jupiter Rx → internal growth, re-examine beliefs, quiet expansion
  Saturn Rx  → review commitments, karmic lessons resurface
"""

from __future__ import annotations

from typing import Any

from .schemas import EvidenceItem

RETROGRADE_EFFECTS: dict[str, dict[str, Any]] = {
    "Mercury": {
        "polarity": -0.4,
        "domains": ["career", "wealth"],
        "caution": "miscommunication and contract risks",
        "advice": "review, revise, and double-check before committing",
    },
    "Venus": {
        "polarity": -0.3,
        "domains": ["love"],
        "caution": "relationship confusion and resurfacing exes",
        "advice": "don't start new relationships; reflect on what you truly value",
    },
    "Mars": {
        "polarity": -0.6,
        "domains": ["health", "career"],
        "caution": "low drive and frustration with stalled progress",
        "advice": "avoid starting fights or forcing action; redirect energy inward",
    },
    "Jupiter": {
        "polarity": -0.2,
        "domains": ["mood", "career"],
        "caution": "expansion slows; reassess direction before growing further",
        "advice": "inner growth replaces outer luck for now",
    },
    "Saturn": {
        "polarity": -0.3,
        "domains": ["career", "health"],
        "caution": "old obligations resurface; structures feel constraining",
        "advice": "re-examine your commitments and release what no longer serves",
    },
}

# Planets we don't flag for retrograde (outer planets are Rx ~half the year)
SKIP_RETROGRADE = {"Uranus", "Neptune", "Pluto", "North Node", "South Node"}


def detect_retrogrades(system_data: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract retrograde planets from the Western engine's planetary positions table.

    Returns a list of dicts: [{planet, polarity, caution, advice, domains}]
    """
    retrogrades: list[dict[str, Any]] = []

    for tbl in system_data.get("tables", []):
        if "position" not in tbl.get("title", "").lower():
            continue
        for row in tbl.get("rows", []):
            if len(row) < 5:
                continue
            planet = str(row[0]).strip()
            motion = str(row[4]).strip()
            if motion == "R" and planet not in SKIP_RETROGRADE and planet in RETROGRADE_EFFECTS:
                info = RETROGRADE_EFFECTS[planet]
                retrogrades.append({
                    "planet": planet,
                    "polarity": info["polarity"],
                    "caution": info["caution"],
                    "advice": info["advice"],
                    "domains": info["domains"],
                })

    return retrogrades


def retrograde_evidence(retrogrades: list[dict[str, Any]], domains: list[str]) -> list[EvidenceItem]:
    """Build evidence items for active retrogrades relevant to the question domains."""
    items: list[EvidenceItem] = []
    for rx in retrogrades:
        # Higher weight if retrograde planet affects the question's domain
        domain_overlap = bool(set(rx["domains"]) & set(domains))
        weight = 0.85 if domain_overlap else 0.5
        items.append(EvidenceItem(
            feature=f"{rx['planet']} retrograde",
            value=rx["caution"],
            weight=weight,
        ))
    return items
