from __future__ import annotations

import random
from typing import Any

from .common import current_context_snapshot, highlight, insight, round2, table


SYSTEM_WEIGHTS = {
    "western": 1.0,
    "vedic": 1.0,
    "chinese": 0.8,
    "bazi": 1.0,
    "numerology": 0.8,
    "kabbalistic": 0.7,
    "gematria": 0.7,
    "persian": 0.85,
}

AREAS = ["love", "career", "health", "wealth", "mood"]


def _sentiment(score: float) -> str:
    if score >= 75:
        return "strong positive"
    if score >= 60:
        return "positive"
    if score >= 45:
        return "mixed"
    if score >= 30:
        return "challenging"
    return "strong challenging"


def _label(score: float) -> str:
    if score >= 75:
        return "Strong alignment"
    if score >= 60:
        return "Supportive alignment"
    if score >= 45:
        return "Mixed alignment"
    return "Weaker alignment"


AREA_NAMES = {
    "love": "love life", "career": "career and professional path",
    "health": "health and physical energy", "wealth": "finances and material security",
    "mood": "emotional well-being and inner state",
}

SYSTEM_DISPLAY = {
    "western": "Western Astrology", "vedic": "Vedic Astrology",
    "chinese": "Chinese Zodiac", "bazi": "BaZi (Four Pillars)",
    "numerology": "Numerology", "kabbalistic": "Kabbalistic system",
    "gematria": "Gematria", "persian": "Persian Astrology",
}


def _extract_drivers(system_data: dict, area: str) -> list[tuple[str, float, str]]:
    """Extract (system_name, delta, plain_text) drivers for an area from one system."""
    name = system_data.get("name", "System")
    out: list[tuple[str, float, str]] = []
    for tbl in system_data.get("tables", []):
        if "driver" not in tbl.get("title", "").lower():
            continue
        for row in tbl.get("rows", []):
            if row[0].lower() != area:
                continue
            raw = row[1] if len(row) > 1 else ""
            try:
                delta = float(raw.split(":")[0])
            except (ValueError, IndexError):
                delta = 0.0
            text = raw.split(":", 1)[1].strip() if ":" in raw else raw
            out.append((name, delta, text))
    return out


def _build_area_narrative(
    area: str,
    score: float,
    sentiment: str,
    systems: dict[str, Any],
    probabilities: dict,
) -> str:
    """Build a personalized plain-English narrative for a life area."""
    area_name = AREA_NAMES.get(area, area)
    info = probabilities.get(area, {})
    agreeing = info.get("agreeing_systems", [])
    n_agree = len(agreeing)

    # Collect all drivers across systems
    positives: list[tuple[str, float, str]] = []
    cautions: list[tuple[str, float, str]] = []
    for sys_id, sys_data in systems.items():
        for name, delta, text in _extract_drivers(sys_data, area):
            if delta > 0:
                positives.append((SYSTEM_DISPLAY.get(sys_id, name), delta, text))
            elif delta < 0:
                cautions.append((SYSTEM_DISPLAY.get(sys_id, name), delta, text))
    positives.sort(key=lambda x: -x[1])
    cautions.sort(key=lambda x: x[1])

    # ── Opening ──
    if score >= 75:
        openings = [
            f"Your {area_name} is in an exceptionally strong position right now.",
            f"The cosmos is clearly supporting your {area_name} at this time.",
            f"This is one of the strongest periods for your {area_name}.",
        ]
    elif score >= 60:
        openings = [
            f"Your {area_name} is well-supported by the current cosmic climate.",
            f"Most traditions see favorable energy around your {area_name}.",
            f"The overall picture for your {area_name} is positive, with some nuance.",
        ]
    elif score >= 45:
        openings = [
            f"Your {area_name} is in a transitional phase with mixed signals.",
            f"The cosmic picture for your {area_name} is nuanced — some forces help, others test you.",
            f"This is a period of balance for your {area_name}, with both opportunity and caution.",
        ]
    else:
        openings = [
            f"Your {area_name} faces some cosmic headwinds right now.",
            f"The stars suggest extra care and patience around your {area_name}.",
            f"This is a period of testing for your {area_name} — slow, deliberate action is favored.",
        ]
    parts = [random.choice(openings)]

    # ── Agreement context ──
    if n_agree >= 6:
        parts.append(f"{n_agree} of 8 systems agree on this reading, which is a strong consensus.")
    elif n_agree >= 4:
        parts.append(f"{n_agree} systems lean in the same direction here, giving moderate confidence.")

    # ── Top positive drivers (up to 3, named by system) ──
    if positives:
        top = positives[:3]
        driver_sentences = []
        for sys_name, delta, text in top:
            clean = text.rstrip(".")
            if delta >= 5.0:
                driver_sentences.append(f"{sys_name} highlights a powerful signal: {clean.lower()}.")
            elif delta >= 2.0:
                driver_sentences.append(f"{sys_name} notes that {clean.lower()}.")
            else:
                driver_sentences.append(f"{sys_name} sees a subtle boost from {clean.lower()}.")
        parts.extend(driver_sentences)
        if len(positives) >= 3:
            parts.append("When multiple systems point to the same positive signal, it carries more weight than any single tradition alone.")

    # ── Caution drivers (up to 2) ──
    if cautions:
        top_c = cautions[:2]
        caution_parts = []
        for sys_name, delta, text in top_c:
            clean = text.rstrip(".")
            caution_parts.append(f"{clean.lower()}")
        if len(caution_parts) == 1:
            parts.append(f"On the cautious side, {caution_parts[0]}.")
        else:
            parts.append(f"Watch for {caution_parts[0]}, and {caution_parts[1]}.")
        parts.append("These caution signals are not warnings of doom — they are invitations to be more intentional in this area.")

    # ── Closing advice (rich, practical, area-specific) ──
    if area == "love":
        if score >= 60:
            parts.append("This is a genuinely favorable period for your love life — the kind of cosmic window that rewards vulnerability and honest expression.")
            parts.append("If you have been holding back feelings or avoiding a difficult conversation with someone you care about, now is the time to speak.")
            parts.append("New connections formed during this period tend to have more depth than usual, so stay open to unexpected people.")
        else:
            parts.append("This is not the time to chase or force romantic outcomes — the energy favors turning inward and strengthening your relationship with yourself first.")
            parts.append("If you are in a partnership, focus on listening more than fixing, and let small irritations pass without turning them into battles.")
            parts.append("Periods like this often precede breakthroughs, but only if you resist the urge to push.")
    elif area == "career":
        if score >= 60:
            parts.append("The energy supports decisive professional action — trust your gut on opportunities, especially ones that have been lingering at the edges of your awareness.")
            parts.append("This is a strong window for making bold asks, pitching ideas, or stepping into a leadership role you have been circling.")
            parts.append("The alignment across systems suggests that effort invested now will compound in the months ahead.")
        else:
            parts.append("This is a period for consolidation rather than conquest — protect what you have built and avoid risky professional pivots.")
            parts.append("If you feel stuck or undervalued, resist the impulse to make dramatic moves. The cosmic weather shifts, and patience here pays dividends later.")
            parts.append("Use this time to learn, plan, and build skills quietly so you are ready when the window opens.")
    elif area == "health":
        if score >= 60:
            parts.append("Your vitality is cosmically supported right now — this is the time to establish routines that will carry you through less favorable periods.")
            parts.append("Physical exercise, consistent sleep, and clean eating will amplify the positive energy the systems are detecting in your chart.")
            parts.append("If you have been putting off a health goal or habit change, the current alignment makes it easier to build momentum.")
        else:
            parts.append("Listen to your body with extra care during this period — fatigue, low motivation, or minor aches are signals to rest, not push through.")
            parts.append("The cosmic pressure on your health sector means your reserves are lower than usual, so recovery is not optional, it is necessary.")
            parts.append("Prioritize sleep, hydration, and stress reduction. This period passes, and you want to emerge from it strong.")
    elif area == "wealth":
        if score >= 60:
            parts.append("Financial energy is flowing in your favor — stay disciplined and the right opportunities will find you without needing to chase them.")
            parts.append("This is a good period for thoughtful investments, negotiating raises, or launching revenue-generating ideas you have been refining.")
            parts.append("The key word is disciplined: the cosmic support amplifies smart moves, but it also amplifies impulsive ones.")
        else:
            parts.append("Be conservative with money during this period — avoid large purchases, risky investments, or lending amounts you cannot afford to lose.")
            parts.append("The cosmic headwind on your wealth sector does not mean loss is inevitable, but it does mean the margin for financial error is thinner than usual.")
            parts.append("Focus on protecting your existing resources and building a buffer. The abundance window returns, and you want to be positioned for it.")
    elif area == "mood":
        if score >= 60:
            parts.append("Your emotional resilience is genuinely strong right now — you have the inner clarity to handle difficult conversations and make decisions you have been avoiding.")
            parts.append("Use this period to address anything that has been weighing on you emotionally, because you are better equipped than usual to process it without spiraling.")
            parts.append("Share this stability with the people around you — your groundedness right now can be a gift to others who are struggling.")
        else:
            parts.append("Emotional weather is heavier than usual — give yourself real grace and avoid making permanent decisions based on temporary feelings.")
            parts.append("Journaling, walks in nature, or even just sitting with your feelings without trying to fix them can be profoundly restorative during this period.")
            parts.append("Remember that emotional lows are part of natural cycles, not evidence that something is wrong with you. This passes.")

    return " ".join(parts)


def calculate(context: dict[str, Any], systems: dict[str, Any]) -> dict[str, Any]:
    per_system_rows = []
    consensus_rows = []
    probabilities: dict[str, dict[str, Any]] = {}
    highlights = []

    for system_id, data in systems.items():
        row = [data["name"], SYSTEM_WEIGHTS.get(system_id, 1.0)]
        for area in AREAS:
            row.append(data["scores"][area]["value"])
        per_system_rows.append(row)

    for area in AREAS:
        weighted_total = 0.0
        weight_sum = 0.0
        contributors = []
        for system_id, data in systems.items():
            weight = SYSTEM_WEIGHTS.get(system_id, 1.0)
            value = data["scores"][area]["value"]
            weighted_total += value * weight
            weight_sum += weight
            contributors.append({
                "system_id": system_id,
                "name": data["name"],
                "value": value,
                "weight": weight,
                "sentiment": _sentiment(value),
            })
        contributors.sort(key=lambda item: (-item["value"], item["name"]))
        score = round2(weighted_total / weight_sum if weight_sum else 0.0)
        sentiment = _sentiment(score)
        agreeing = [item for item in contributors if item["sentiment"] == sentiment]
        confidence = round2((len(agreeing) / len(contributors)) * 100 if contributors else 0.0)
        probabilities[area] = {
            "value": score,
            "label": _label(score),
            "confidence": confidence,
            "sentiment": sentiment,
            "agreeing_systems": [item["name"] for item in agreeing],
            "leaders": contributors[:3],
            "laggards": contributors[-3:],
        }
        consensus_rows.append([
            area.title(),
            score,
            _label(score),
            f"{confidence:.0f}%",
            ", ".join(item["name"] for item in agreeing) or "None",
        ])

    sorted_areas = sorted(probabilities.items(), key=lambda item: item[1]["value"], reverse=True)
    strongest_area = sorted_areas[0][0]
    weakest_area = sorted_areas[-1][0]
    overall_confidence = round2(sum(item["confidence"] for item in probabilities.values()) / len(probabilities))
    top_positive_systems = sorted(
        systems.items(),
        key=lambda pair: sum(pair[1]["scores"][area]["value"] for area in AREAS) / len(AREAS),
        reverse=True,
    )

    highlights.extend(
        [
            highlight("Strongest area", f"{strongest_area.title()} {probabilities[strongest_area]['value']:.0f}%"),
            highlight("Most cautious area", f"{weakest_area.title()} {probabilities[weakest_area]['value']:.0f}%"),
            highlight("Overall agreement", f"{overall_confidence:.0f}%"),
            highlight("Top leaning system", top_positive_systems[0][1]["name"] if top_positive_systems else "n/a"),
        ]
    )

    summary = [
        f"Each score blends your birth chart (fixed) with current planetary transits (changing) across all eight systems. Higher means stronger overall alignment — not a daily forecast.",
        f"Agreement shows how many systems point in the same direction. For example, if six of eight systems lean positive on an area, agreement is 75%.",
        f"Right now the strongest collective signal is {strongest_area} and the most cautious signal is {weakest_area}. Overall agreement is {overall_confidence:.0f}%.",
    ]

    insights = [
        insight("Method", "Each system contributes a normalized 0-100 score for every life area. The combined engine computes a weighted average and then measures how many systems share the same positive, mixed, or challenging sentiment."),
        insight("Agreement", "Agreement is not a claim of truth. It is simply the proportion of engines pointing in the same direction after they are reduced to positive, mixed, or challenging labels."),
        insight("Interpretation", f"Use the strongest area ({strongest_area}) as the easiest place to lean in and the weakest area ({weakest_area}) as the place to slow down, review, or avoid overcommitting."),
        insight("Weights", "Western, Vedic, and BaZi carry the heaviest weight in this implementation, while the symbolic systems still influence the blend but slightly less strongly."),
    ]

    area_rows = []
    for area in AREAS:
        leaders = ", ".join(f"{item['name']} ({item['value']:.0f})" for item in probabilities[area]["leaders"])
        laggards = ", ".join(f"{item['name']} ({item['value']:.0f})" for item in probabilities[area]["laggards"])
        area_rows.append([
            area.title(),
            probabilities[area]["value"],
            probabilities[area]["label"],
            f"{probabilities[area]['confidence']:.0f}%",
            leaders,
            laggards,
        ])

    # ── Plain-English area narratives ──
    area_narratives = {}
    for area in AREAS:
        area_narratives[area] = _build_area_narrative(
            area,
            probabilities[area]["value"],
            probabilities[area]["sentiment"],
            systems,
            probabilities,
        )

    return {
        "id": "combined",
        "name": "Combined Analysis",
        "headline": f"{strongest_area.title()} leads while {weakest_area.title()} needs the most caution",
        "summary": summary,
        "highlights": highlights,
        "probabilities": probabilities,
        "area_narratives": area_narratives,
        "confidence": {"overall": overall_confidence, **{area: info["confidence"] for area, info in probabilities.items()}},
        "insights": insights,
        "tables": [
            table(
                "System score matrix",
                ["System", "Weight", "Love", "Career", "Health", "Wealth", "Mood"],
                per_system_rows,
            ),
            table(
                "Consensus by life area",
                ["Area", "Alignment", "Label", "Agreement", "Aligned systems"],
                consensus_rows,
            ),
            table(
                "Leaders and laggards",
                ["Area", "Alignment", "Label", "Agreement", "Top contributors", "Lowest contributors"],
                area_rows,
            ),
        ],
        "meta": {
            "weights": SYSTEM_WEIGHTS,
            "context": current_context_snapshot(context),
        },
    }
