from __future__ import annotations

from collections import Counter
from typing import Any

from .common import (
    BAZI_BRANCHES,
    BAZI_HIDDEN_STEMS,
    BAZI_STEMS,
    CONTROLS,
    GENERATION,
    clamp,
    controlled_by,
    current_context_snapshot,
    element_relation,
    highlight,
    hour_branch_index,
    hour_stem_from_day_stem,
    insight,
    map_score_to_label,
    month_branch_from_solar_longitude,
    month_stem_from_year_stem,
    produced_by,
    round2,
    sexagenary_day_index,
    sexagenary_name,
    solar_longitude,
    stem_data,
    branch_data,
    table,
    year_pillar_from_lichun,
)

STEM_NAME_TO_INDEX = {data[0]: idx for idx, data in enumerate(BAZI_STEMS)}


BRANCH_COMBINATIONS = {
    frozenset({"Zi", "Chou"}),
    frozenset({"Yin", "Hai"}),
    frozenset({"Mao", "Xu"}),
    frozenset({"Chen", "You"}),
    frozenset({"Si", "Shen"}),
    frozenset({"Wu", "Wei"}),
}

BRANCH_CLASHES = {
    frozenset({"Zi", "Wu"}),
    frozenset({"Chou", "Wei"}),
    frozenset({"Yin", "Shen"}),
    frozenset({"Mao", "You"}),
    frozenset({"Chen", "Xu"}),
    frozenset({"Si", "Hai"}),
}

PEACH_BLOSSOM_BRANCH = {
    "Zi": "You",
    "Chen": "You",
    "Shen": "You",
    "Chou": "Wu",
    "Si": "Wu",
    "You": "Wu",
    "Yin": "Mao",
    "Wu": "Mao",
    "Xu": "Mao",
    "Hai": "Zi",
    "Mao": "Zi",
    "Wei": "Zi",
}


def _ten_god(day_stem_idx: int, other_stem_idx: int) -> str:
    dm_name, dm_element, dm_polarity = BAZI_STEMS[day_stem_idx]
    other_name, other_element, other_polarity = BAZI_STEMS[other_stem_idx]
    same_polarity = dm_polarity == other_polarity
    relation = element_relation(dm_element, other_element)
    if relation == "same":
        return "Friend" if same_polarity else "Rob Wealth"
    if relation == "produces":
        return "Eating God" if same_polarity else "Hurting Officer"
    if relation == "controls":
        return "Indirect Wealth" if same_polarity else "Direct Wealth"
    if relation == "controlled_by":
        return "Seven Killings" if same_polarity else "Direct Officer"
    if relation == "resource":
        return "Indirect Resource" if same_polarity else "Direct Resource"
    return f"{dm_name} to {other_name}"


def _pillar(stem_idx: int, branch_idx: int, day_stem_idx: int) -> dict[str, Any]:
    stem_name, stem_element, stem_polarity = BAZI_STEMS[stem_idx]
    branch_name, animal, branch_element = BAZI_BRANCHES[branch_idx]
    hidden = [{"stem": name, "weight": weight, "ten_god": _ten_god(day_stem_idx, STEM_NAME_TO_INDEX.get(name, 0))} for name, weight in BAZI_HIDDEN_STEMS[branch_name]]
    return {
        "stem_index": stem_idx,
        "branch_index": branch_idx,
        "stem": stem_name,
        "stem_element": stem_element,
        "stem_polarity": stem_polarity,
        "branch": branch_name,
        "animal": animal,
        "branch_element": branch_element,
        "name": f"{stem_name} {branch_name}",
        "ten_god": _ten_god(day_stem_idx, stem_idx),
        "hidden_stems": hidden,
    }


def _four_pillars(local_dt, jd_ut) -> dict[str, Any]:
    year_stem, year_branch = year_pillar_from_lichun(local_dt)
    month_branch = month_branch_from_solar_longitude(solar_longitude(jd_ut))
    month_stem = month_stem_from_year_stem(year_stem, month_branch)
    day_index = sexagenary_day_index(local_dt)
    day_stem = day_index % 10
    day_branch = day_index % 12
    hour_branch = hour_branch_index(local_dt.time())
    hour_stem = hour_stem_from_day_stem(day_stem, hour_branch)

    return {
        "year": _pillar(year_stem, year_branch, day_stem),
        "month": _pillar(month_stem, month_branch, day_stem),
        "day": _pillar(day_stem, day_branch, day_stem),
        "hour": _pillar(hour_stem, hour_branch, day_stem),
        "day_index": day_index,
    }


def _element_balance(pillars: dict[str, Any]) -> dict[str, Any]:
    totals = Counter({"Wood": 0.0, "Fire": 0.0, "Earth": 0.0, "Metal": 0.0, "Water": 0.0})
    for key in ["year", "month", "day", "hour"]:
        pillar = pillars[key]
        totals[pillar["stem_element"]] += 2.0
        for hidden in pillar["hidden_stems"]:
            hidden_idx = STEM_NAME_TO_INDEX.get(hidden["stem"], 0)
            totals[BAZI_STEMS[hidden_idx][1]] += hidden["weight"]
    dominant = max(totals.items(), key=lambda item: item[1])[0]
    weakest = min(totals.items(), key=lambda item: item[1])[0]
    return {
        "totals": {key: round2(value) for key, value in totals.items()},
        "dominant": dominant,
        "weakest": weakest,
    }


def _day_master_strength(pillars: dict[str, Any], balance: dict[str, Any]) -> dict[str, Any]:
    day_master_element = pillars["day"]["stem_element"]
    resource_element = produced_by(day_master_element)
    support = balance["totals"][day_master_element] + balance["totals"][resource_element]
    drain = sum(value for element, value in balance["totals"].items() if element not in {day_master_element, resource_element})
    month_element = pillars["month"]["branch_element"]
    season_bonus = 0.0
    if month_element == day_master_element:
        season_bonus += 2.0
    elif month_element == resource_element:
        season_bonus += 1.2
    elif CONTROLS[month_element] == day_master_element:
        season_bonus -= 1.5
    support += season_bonus

    strong = support >= drain
    if strong:
        favorable = [GENERATION[day_master_element], CONTROLS[day_master_element], controlled_by(day_master_element)]
        strategy = "The day master is strong enough to benefit from output, wealth, and authority elements."
    else:
        favorable = [day_master_element, resource_element]
        strategy = "The day master is on the weaker side and benefits from self and resource elements."

    return {
        "day_master_element": day_master_element,
        "resource_element": resource_element,
        "support_score": round2(support),
        "drain_score": round2(drain),
        "season_bonus": round2(season_bonus),
        "strong": strong,
        "favorable": favorable,
        "strategy": strategy,
    }


def _branch_interaction(a: str, b: str) -> tuple[int, str]:
    if a == b:
        return 4, "same branch resonance"
    if frozenset({a, b}) in BRANCH_COMBINATIONS:
        return 6, "branch combination"
    if frozenset({a, b}) in BRANCH_CLASHES:
        return -7, "branch clash"
    return 0, "neutral branch relation"


def _apply(score_map: dict[str, float], reasons: dict[str, list[str]], key: str, delta: float, reason: str) -> None:
    score_map[key] += delta
    sign = "+" if delta >= 0 else ""
    reasons[key].append(f"{sign}{delta:.1f}: {reason}")


def _score_chart(natal: dict[str, Any], current: dict[str, Any], balance: dict[str, Any], strength: dict[str, Any]) -> tuple[dict[str, float], dict[str, list[str]]]:
    scores = {"love": 50.0, "career": 50.0, "health": 50.0, "wealth": 50.0, "mood": 50.0}
    reasons = {key: [] for key in scores}

    dm_element = strength["day_master_element"]
    resource_element = strength["resource_element"]
    output_element = GENERATION[dm_element]
    wealth_element = CONTROLS[dm_element]
    authority_element = controlled_by(dm_element)

    current_elements = [
        current["year"]["stem_element"],
        current["year"]["branch_element"],
        current["month"]["stem_element"],
        current["month"]["branch_element"],
        current["day"]["stem_element"],
        current["day"]["branch_element"],
    ]
    current_counts = Counter(current_elements)

    for element, count in current_counts.items():
        if element in strength["favorable"]:
            _apply(scores, reasons, "career", count * 1.8, f"Current pillars emphasize favorable element {element}")
            _apply(scores, reasons, "wealth", count * 1.6, f"Current pillars emphasize favorable element {element}")
            _apply(scores, reasons, "mood", count * 1.2, f"Current pillars emphasize favorable element {element}")
        if element == wealth_element:
            _apply(scores, reasons, "wealth", count * 2.6, f"Current pillars activate wealth element {wealth_element}")
            _apply(scores, reasons, "love", count * 1.5, "Relationship chemistry is stimulated by real-world exchange")
        if element == authority_element:
            _apply(scores, reasons, "career", count * 2.2, f"Current pillars activate authority element {authority_element}")
            _apply(scores, reasons, "love", count * 1.2, "Partnership and commitment themes become more visible")
        if element == output_element:
            _apply(scores, reasons, "career", count * 1.6, f"Current pillars activate output element {output_element}")
        if element == resource_element:
            _apply(scores, reasons, "health", count * 1.4, f"Current pillars provide resource element {resource_element}")
            _apply(scores, reasons, "mood", count * 1.2, f"Current pillars provide resource element {resource_element}")

    dominant = balance["dominant"]
    weakest = balance["weakest"]
    if current_counts[dominant] >= 3 and dominant not in strength["favorable"]:
        _apply(scores, reasons, "health", -5.0, f"The already dominant natal element {dominant} is being overloaded")
        _apply(scores, reasons, "mood", -4.0, f"The already dominant natal element {dominant} is being overloaded")
    if current_counts[weakest] >= 1:
        _apply(scores, reasons, "health", 3.0, f"Current pillars supply the natal weak point element {weakest}")
        _apply(scores, reasons, "mood", 2.0, f"Current pillars supply the natal weak point element {weakest}")

    natal_day_branch = natal["day"]["branch"]
    natal_year_branch = natal["year"]["branch"]
    for current_branch in [current["year"]["branch"], current["month"]["branch"], current["day"]["branch"]]:
        delta, text = _branch_interaction(natal_day_branch, current_branch)
        _apply(scores, reasons, "mood", delta * 0.8, f"Day branch relation: {text}")
        _apply(scores, reasons, "health", delta * 0.55, f"Day branch relation: {text}")
        _apply(scores, reasons, "love", delta * 0.7, f"Day branch relation: {text}")

        delta_year, text_year = _branch_interaction(natal_year_branch, current_branch)
        _apply(scores, reasons, "career", delta_year * 0.6, f"Year branch relation: {text_year}")
        _apply(scores, reasons, "wealth", delta_year * 0.55, f"Year branch relation: {text_year}")

    peach_branch = PEACH_BLOSSOM_BRANCH[natal_day_branch]
    if current["year"]["branch"] == peach_branch or current["month"]["branch"] == peach_branch or current["day"]["branch"] == peach_branch:
        _apply(scores, reasons, "love", 6.0, f"Peach blossom branch {peach_branch} is activated")
        _apply(scores, reasons, "mood", 2.5, f"Peach blossom branch {peach_branch} increases magnetism")

    if strength["strong"]:
        _apply(scores, reasons, "career", 2.5, "A strong day master can use pressure productively")
        _apply(scores, reasons, "wealth", 2.0, "A strong day master can convert opportunity into results")
    else:
        _apply(scores, reasons, "health", 2.0, "A weaker day master does better when supported and paced well")

    return ({key: round2(clamp(value, 5, 95)) for key, value in scores.items()}, reasons)


def calculate(context: dict[str, Any]) -> dict[str, Any]:
    natal = _four_pillars(context["birth_local"], context["jd_ut"])
    current = _four_pillars(context["now_local"], context["current_jd_ut"])
    balance = _element_balance(natal)
    strength = _day_master_strength(natal, balance)

    scores, reason_map = _score_chart(natal, current, balance, strength)

    natal_rows = []
    for key in ["year", "month", "day", "hour"]:
        pillar = natal[key]
        natal_rows.append([
            key.title(),
            pillar["stem"],
            pillar["branch"],
            pillar["animal"],
            pillar["stem_element"],
            pillar["ten_god"],
        ])

    hidden_rows = []
    for key in ["year", "month", "day", "hour"]:
        pillar = natal[key]
        hidden_rows.append([
            key.title(),
            ", ".join(f"{item['stem']} ({item['ten_god']}, {item['weight']})" for item in pillar["hidden_stems"]),
        ])

    element_rows = [[element, value] for element, value in balance["totals"].items()]
    current_rows = []
    for key in ["year", "month", "day", "hour"]:
        pillar = current[key]
        current_rows.append([key.title(), pillar["name"], pillar["animal"], pillar["stem_element"], pillar["ten_god"]])

    driver_rows = []
    for category in ["love", "career", "health", "wealth", "mood"]:
        for line in reason_map[category][:6]:
            driver_rows.append([category.title(), line])

    day_master = natal["day"]
    headline = f"{day_master['stem_element']} {day_master['stem']} Day Master"

    summary = [
        f"This BaZi engine uses solar-term months and Li Chun year boundaries to derive the Four Pillars. Your day master is {day_master['stem']} ({day_master['stem_element']}), which is treated as the center of the chart.",
        f"Element balance shows {balance['dominant']} as the dominant natal element and {balance['weakest']} as the weakest. {strength['strategy']}",
        f"Current probabilities are generated by comparing natal branches and element balance against the current year, month, day, and hour pillars.",
    ]

    highlights = [
        highlight("Day Master", f"{day_master['stem']} ({day_master['stem_element']})"),
        highlight("Year pillar", natal["year"]["name"]),
        highlight("Month pillar", natal["month"]["name"]),
        highlight("Day pillar", natal["day"]["name"]),
        highlight("Hour pillar", natal["hour"]["name"]),
        highlight("Dominant element", balance["dominant"]),
        highlight("Weakest element", balance["weakest"]),
        highlight("Favorable elements", ", ".join(strength["favorable"])),
    ]

    insights = [
        insight("Day master logic", f"The day master is {day_master['stem']} {day_master['stem_element']}. All ten-god labels in the tables are measured relative to that stem."),
        insight("Seasonal weight", f"The month pillar {natal['month']['name']} is weighted strongly because BaZi treats the season as a major factor in day-master strength."),
        insight("Element strategy", strength["strategy"]),
        insight("Current timing", f"The current pillars are {current['year']['name']}, {current['month']['name']}, {current['day']['name']}, and {current['hour']['name']}, which are used to form the score set below."),
    ]

    return {
        "id": "bazi",
        "name": "BaZi (Four Pillars)",
        "headline": headline,
        "summary": summary,
        "highlights": highlights,
        "scores": {key: {"value": value, "label": map_score_to_label(value)} for key, value in scores.items()},
        "insights": insights,
        "tables": [
            table("Natal Four Pillars", ["Pillar", "Stem", "Branch", "Animal", "Stem element", "Ten God"], natal_rows),
            table("Hidden stems", ["Pillar", "Hidden stems"], hidden_rows),
            table("Element balance", ["Element", "Weight"], element_rows),
            table("Current pillars", ["Pillar", "Pillar name", "Animal", "Stem element", "Ten God"], current_rows),
            table("Score drivers", ["Area", "Driver"], driver_rows),
        ],
        "meta": {
            "engine_type": "Solar-term BaZi with Li Chun year boundary",
            "day_master_strength": strength,
            "context": current_context_snapshot(context),
        },
    }
