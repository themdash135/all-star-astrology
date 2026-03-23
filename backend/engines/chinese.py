from __future__ import annotations

from typing import Any

from lunardate import LunarDate

from .common import (
    BAZI_BRANCHES,
    CHINESE_ANIMALS,
    CHINESE_ELEMENTS,
    CHINESE_SECRET_FRIENDS,
    CHINESE_TRINES,
    CalculationError,
    GENERATION,
    CONTROLS,
    clamp,
    current_context_snapshot,
    highlight,
    hour_branch_index,
    insight,
    map_score_to_label,
    polarity_label,
    round2,
    sexagenary_day_index,
    table,
)


ANIMAL_THEMES = {
    "Rat": "quick, adaptive, resourceful, and socially alert",
    "Ox": "steady, patient, dependable, and endurance based",
    "Tiger": "bold, instinctive, brave, and momentum oriented",
    "Rabbit": "gentle, diplomatic, artistic, and tactful",
    "Dragon": "commanding, idealistic, ambitious, and expressive",
    "Snake": "strategic, subtle, intuitive, and selective",
    "Horse": "free moving, energetic, candid, and mobile",
    "Goat": "sensitive, aesthetic, caring, and peace seeking",
    "Monkey": "inventive, playful, clever, and flexible",
    "Rooster": "precise, proud, structured, and improvement focused",
    "Dog": "loyal, ethical, protective, and justice minded",
    "Pig": "warm, generous, trusting, and comfort seeking",
}

CLASH_PAIRS = {
    frozenset({"Rat", "Horse"}),
    frozenset({"Ox", "Goat"}),
    frozenset({"Tiger", "Monkey"}),
    frozenset({"Rabbit", "Rooster"}),
    frozenset({"Dragon", "Dog"}),
    frozenset({"Snake", "Pig"}),
}

HARM_PAIRS = {
    frozenset({"Rat", "Goat"}),
    frozenset({"Ox", "Horse"}),
    frozenset({"Tiger", "Snake"}),
    frozenset({"Rabbit", "Dragon"}),
    frozenset({"Monkey", "Pig"}),
    frozenset({"Dog", "Rooster"}),
}

PEACH_BLOSSOM = {
    "Rat": "Rooster",
    "Dragon": "Rooster",
    "Monkey": "Rooster",
    "Ox": "Horse",
    "Snake": "Horse",
    "Rooster": "Horse",
    "Tiger": "Rabbit",
    "Horse": "Rabbit",
    "Dog": "Rabbit",
    "Rabbit": "Rat",
    "Goat": "Rat",
    "Pig": "Rat",
}

MONTH_ANIMALS = {
    1: "Tiger",
    2: "Rabbit",
    3: "Dragon",
    4: "Snake",
    5: "Horse",
    6: "Goat",
    7: "Monkey",
    8: "Rooster",
    9: "Dog",
    10: "Pig",
    11: "Rat",
    12: "Ox",
}


def _year_profile(lunar_year: int) -> dict[str, Any]:
    stem_index = (lunar_year - 4) % 10
    branch_index = (lunar_year - 4) % 12
    return {
        "lunar_year": lunar_year,
        "stem_index": stem_index,
        "branch_index": branch_index,
        "animal": CHINESE_ANIMALS[branch_index],
        "element": CHINESE_ELEMENTS[stem_index],
        "polarity": polarity_label(stem_index),
    }


def _animal_relation(a: str, b: str) -> tuple[int, str]:
    if a == b:
        return 7, "same animal resonance"
    if any({a, b}.issubset(group) for group in CHINESE_TRINES):
        return 10, "trine harmony"
    if CHINESE_SECRET_FRIENDS.get(a) == b or CHINESE_SECRET_FRIENDS.get(b) == a:
        return 6, "secret friend support"
    if frozenset({a, b}) in CLASH_PAIRS:
        return -10, "direct clash"
    if frozenset({a, b}) in HARM_PAIRS:
        return -6, "friction or harm"
    return 0, "neutral relation"


def _element_relation(natal: str, current: str) -> tuple[int, str]:
    if natal == current:
        return 5, "same element tone"
    if GENERATION[natal] == current:
        return 3, "your natal element feeds the current cycle"
    if GENERATION[current] == natal:
        return 6, "the current cycle nourishes your natal element"
    if CONTROLS[natal] == current:
        return 2, "you can direct the current cycle"
    if CONTROLS[current] == natal:
        return -5, "the current cycle presses on your natal element"
    return 0, "balanced elemental contrast"


def _apply(score_map: dict[str, float], reasons: dict[str, list[str]], key: str, delta: float, reason: str) -> None:
    score_map[key] += delta
    sign = "+" if delta >= 0 else ""
    reasons[key].append(f"{sign}{delta:.1f}: {reason}")


def calculate(context: dict[str, Any]) -> dict[str, Any]:
    birth_local = context["birth_local"]
    current_local = context["now_local"]

    _LUNAR_MIN_YEAR, _LUNAR_MAX_YEAR = 1901, 2099
    if not (_LUNAR_MIN_YEAR <= birth_local.year <= _LUNAR_MAX_YEAR):
        raise CalculationError(
            f"Birth date {birth_local.date()} is outside the supported lunar calendar range ({_LUNAR_MIN_YEAR}-{_LUNAR_MAX_YEAR})."
        )
    if not (_LUNAR_MIN_YEAR <= current_local.year <= _LUNAR_MAX_YEAR):
        raise CalculationError(
            f"Current date {current_local.date()} is outside the supported lunar calendar range ({_LUNAR_MIN_YEAR}-{_LUNAR_MAX_YEAR})."
        )
    try:
        birth_lunar = LunarDate.fromSolarDate(birth_local.year, birth_local.month, birth_local.day)
    except (ValueError, IndexError) as exc:
        raise CalculationError(f"Birth date {birth_local.date()} is outside the supported lunar calendar range.") from exc
    try:
        current_lunar = LunarDate.fromSolarDate(current_local.year, current_local.month, current_local.day)
    except (ValueError, IndexError) as exc:
        raise CalculationError(f"Current date {current_local.date()} is outside the supported lunar calendar range.") from exc

    natal_year = _year_profile(birth_lunar.year)
    current_year = _year_profile(current_lunar.year)

    birth_day_index = sexagenary_day_index(birth_local)
    current_day_index = sexagenary_day_index(current_local)
    birth_day_branch = BAZI_BRANCHES[birth_day_index % 12][1]
    current_day_branch = BAZI_BRANCHES[current_day_index % 12][1]

    birth_hour_animal = BAZI_BRANCHES[hour_branch_index(context["birth_time"])][1]
    current_hour_animal = BAZI_BRANCHES[hour_branch_index(current_local.time())][1]

    natal_month_animal = MONTH_ANIMALS[abs(birth_lunar.month)]
    current_month_animal = MONTH_ANIMALS[abs(current_lunar.month)]

    love_rel_year, love_rel_year_text = _animal_relation(natal_year["animal"], current_year["animal"])
    love_rel_month, love_rel_month_text = _animal_relation(natal_year["animal"], current_month_animal)
    day_rel, day_rel_text = _animal_relation(birth_day_branch, current_day_branch)
    element_delta, element_text = _element_relation(natal_year["element"], current_year["element"])

    scores = {"love": 50.0, "career": 50.0, "health": 50.0, "wealth": 50.0, "mood": 50.0}
    reasons = {key: [] for key in scores}

    _apply(scores, reasons, "love", love_rel_year * 0.55, f"Current year animal relation: {love_rel_year_text}")
    _apply(scores, reasons, "love", love_rel_month * 0.35, f"Current lunar month relation: {love_rel_month_text}")
    _apply(scores, reasons, "mood", day_rel * 0.45, f"Current day animal relation: {day_rel_text}")
    _apply(scores, reasons, "health", element_delta * 0.4, f"Element cycle: {element_text}")
    _apply(scores, reasons, "wealth", element_delta * 0.55, f"Element cycle: {element_text}")
    _apply(scores, reasons, "career", love_rel_year * 0.25, f"Annual animal relation affects timing and alliances")
    _apply(scores, reasons, "career", element_delta * 0.45, f"Annual element affects work rhythm")

    if natal_year["animal"] == "Dragon":
        _apply(scores, reasons, "career", 4.0, "Dragon year birth tends to seek scale and visibility")
    if natal_year["animal"] == "Ox":
        _apply(scores, reasons, "wealth", 4.0, "Ox year birth favors patient accumulation")
    if natal_year["animal"] == "Rabbit":
        _apply(scores, reasons, "mood", 3.5, "Rabbit year birth benefits from quieter pacing")
    if natal_year["animal"] in {"Tiger", "Horse"}:
        _apply(scores, reasons, "career", 2.5, "Tiger/Horse profile adds momentum and initiative")

    peach = PEACH_BLOSSOM[natal_year["animal"]]
    if current_year["animal"] == peach or current_month_animal == peach:
        _apply(scores, reasons, "love", 6.0, f"Peach blossom animal {peach} is activated")
        _apply(scores, reasons, "mood", 2.0, f"Peach blossom activation increases social magnetism")

    if frozenset({natal_year["animal"], current_year["animal"]}) in CLASH_PAIRS:
        _apply(scores, reasons, "health", -5.0, "Annual clash suggests pacing yourself physically")
        _apply(scores, reasons, "mood", -4.0, "Annual clash can feel more restless")
    if frozenset({natal_year["animal"], current_year["animal"]}) in HARM_PAIRS:
        _apply(scores, reasons, "wealth", -3.0, "Annual harm suggests more scrutiny around agreements")

    if natal_year["polarity"] == current_year["polarity"]:
        _apply(scores, reasons, "career", 2.0, "Yin/Yang polarity aligns with the current year")
        _apply(scores, reasons, "mood", 1.5, "Yin/Yang polarity feels familiar this year")

    scores = {key: round2(clamp(value, 5, 95)) for key, value in scores.items()}

    birth_rows = [
        ["Lunar birth year", natal_year["lunar_year"], f"{natal_year['element']} {natal_year['animal']} ({natal_year['polarity']})"],
        ["Lunar birth month", birth_lunar.month, natal_month_animal],
        ["Lunar birth day", birth_lunar.day, birth_day_branch],
        ["Birth hour animal", birth_local.strftime("%H:%M"), birth_hour_animal],
    ]

    current_rows = [
        ["Current lunar year", current_year["lunar_year"], f"{current_year['element']} {current_year['animal']} ({current_year['polarity']})"],
        ["Current lunar month", current_lunar.month, current_month_animal],
        ["Current day animal", current_local.date().isoformat(), current_day_branch],
        ["Current hour animal", current_local.strftime("%H:%M"), current_hour_animal],
    ]

    compatibility_rows = []
    for animal in CHINESE_ANIMALS:
        delta, relation = _animal_relation(natal_year["animal"], animal)
        compatibility_rows.append([animal, relation, delta])

    driver_rows = []
    for category in ["love", "career", "health", "wealth", "mood"]:
        for line in reasons[category][:5]:
            driver_rows.append([category.title(), line])

    summary = [
        f"Your popular Chinese zodiac profile is centered on a {natal_year['element']} {natal_year['animal']} year, which usually reads as {ANIMAL_THEMES[natal_year['animal']]}",
        f"The lunar month adds a {natal_month_animal} tone, the day branch adds {birth_day_branch}, and the birth hour adds {birth_hour_animal}, giving the tab more than a simple year-sign reading.",
        f"For current outlook, this engine compares your natal animal and element with the current lunar year, month, day, and peach blossom activation to generate the score set below.",
    ]

    highlights = [
        highlight("Year animal", f"{natal_year['element']} {natal_year['animal']}"),
        highlight("Year polarity", natal_year["polarity"]),
        highlight("Month animal", natal_month_animal),
        highlight("Day animal", birth_day_branch),
        highlight("Hour animal", birth_hour_animal),
        highlight("Current year", f"{current_year['element']} {current_year['animal']}"),
        highlight("Peach blossom", peach),
        highlight("Secret friend", CHINESE_SECRET_FRIENDS[natal_year["animal"]]),
    ]

    insights = [
        insight("Core animal style", f"The {natal_year['animal']} archetype tends to be {ANIMAL_THEMES[natal_year['animal']]}. The element {natal_year['element']} changes how forcefully or subtly that style is expressed."),
        insight("Layered pillars", f"This tab uses the lunar birth year, lunar month, sexagenary day branch, and two-hour birth animal to add more texture than a year-sign horoscope alone."),
        insight("Compatibility frame", f"The most naturally supportive animals for {natal_year['animal']} come from the trine group and secret-friend pairing shown in the table below."),
        insight("Current timing", f"The current cycle compares your natal profile to {current_year['animal']} year, {current_month_animal} month, and {current_day_branch} day vibrations."),
    ]

    return {
        "id": "chinese",
        "name": "Chinese Zodiac",
        "headline": f"{natal_year['element']} {natal_year['animal']} with a {natal_month_animal} lunar month tone",
        "summary": summary,
        "highlights": highlights,
        "scores": {key: {"value": value, "label": map_score_to_label(value)} for key, value in scores.items()},
        "insights": insights,
        "tables": [
            table("Birth lunar profile", ["Layer", "Value", "Reading"], birth_rows),
            table("Current cycle", ["Layer", "Value", "Reading"], current_rows),
            table("Animal compatibility", ["Animal", "Relation", "Delta"], compatibility_rows),
            table("Score drivers", ["Area", "Driver"], driver_rows),
        ],
        "meta": {
            "engine_type": "Popular lunar zodiac with year / month / day / hour animal overlays",
            "birth_lunar": {"year": birth_lunar.year, "month": birth_lunar.month, "day": birth_lunar.day},
            "current_lunar": {"year": current_lunar.year, "month": current_lunar.month, "day": current_lunar.day},
            "context": current_context_snapshot(context),
        },
    }
