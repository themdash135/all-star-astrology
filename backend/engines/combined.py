from __future__ import annotations

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
        return "High probability"
    if score >= 60:
        return "Supportive probability"
    if score >= 45:
        return "Mixed probability"
    return "Lower probability"


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
            highlight("Overall confidence", f"{overall_confidence:.0f}%"),
            highlight("Top leaning system", top_positive_systems[0][1]["name"] if top_positive_systems else "n/a"),
        ]
    )

    summary = [
        f"The combined engine blends all eight systems with explicit per-system weights and collapses them into probability-style scores for love, career, health, wealth, and mood.",
        f"Confidence is based on agreement rate among active systems. For example, if five of eight systems lean in the same direction on an area, the confidence for that area is 62.5%.",
        f"Right now the strongest collective signal is {strongest_area} and the most cautious signal is {weakest_area}. Overall agreement is {overall_confidence:.0f}%.",
    ]

    insights = [
        insight("Method", "Each system contributes a normalized 0-100 score for every life area. The combined engine computes a weighted average and then measures how many systems share the same positive, mixed, or challenging sentiment."),
        insight("Confidence", "Confidence is not a claim of truth. It is simply the proportion of engines pointing in the same direction after they are reduced to positive, mixed, or challenging labels."),
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

    return {
        "id": "combined",
        "name": "Combined Analysis",
        "headline": f"{strongest_area.title()} leads while {weakest_area.title()} needs the most caution",
        "summary": summary,
        "highlights": highlights,
        "probabilities": probabilities,
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
                ["Area", "Probability", "Label", "Confidence", "Agreeing systems"],
                consensus_rows,
            ),
            table(
                "Leaders and laggards",
                ["Area", "Probability", "Label", "Confidence", "Top contributors", "Lowest contributors"],
                area_rows,
            ),
        ],
        "meta": {
            "weights": SYSTEM_WEIGHTS,
            "context": current_context_snapshot(context),
        },
    }
