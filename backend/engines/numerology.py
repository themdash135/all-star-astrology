from __future__ import annotations

from typing import Any

from .common import (
    PYTHAGOREAN_VALUES,
    alpha_only,
    clamp,
    consonants_value,
    current_context_snapshot,
    highlight,
    insight,
    map_score_to_label,
    pythagorean_value,
    reduce_number,
    round2,
    table,
    vowels_value,
)


NUMBER_THEMES = {
    1: "independence, initiative, self-definition",
    2: "partnership, sensitivity, diplomacy",
    3: "expression, creativity, visibility",
    4: "structure, discipline, consistency",
    5: "change, movement, experimentation",
    6: "care, responsibility, relational balance",
    7: "analysis, introspection, spiritual distance",
    8: "power, management, material execution",
    9: "completion, compassion, release",
    11: "intuition, inspiration, heightened perception",
    22: "master-building, scale, implementation",
    33: "teaching, stewardship, service",
}


def _digit_sum(value: str | int) -> int:
    return sum(int(char) for char in str(value) if char.isdigit())


def _life_path(birth_date) -> int:
    return reduce_number(_digit_sum(birth_date.strftime("%Y%m%d")))


def _birthday_number(day: int) -> tuple[int, int]:
    return day, reduce_number(day)


def _attitude_number(birth_date) -> int:
    return reduce_number(_digit_sum(f"{birth_date.month:02d}{birth_date.day:02d}"))


def _universal_year(year: int) -> int:
    return reduce_number(_digit_sum(year), keep_masters=False)


def _personal_year(birth_date, current_year: int) -> int:
    return reduce_number(_digit_sum(f"{birth_date.month:02d}{birth_date.day:02d}") + _universal_year(current_year))


def _personal_month(personal_year: int, current_month: int) -> int:
    return reduce_number(personal_year + current_month)


def _personal_day(personal_month: int, current_day: int) -> int:
    return reduce_number(personal_month + current_day)


def _pinnacles_and_challenges(birth_date, life_path: int) -> dict[str, Any]:
    month = reduce_number(birth_date.month, keep_masters=False)
    day = reduce_number(birth_date.day, keep_masters=False)
    year = reduce_number(_digit_sum(birth_date.year), keep_masters=False)

    pinnacle1 = reduce_number(month + day)
    pinnacle2 = reduce_number(day + year)
    pinnacle3 = reduce_number(pinnacle1 + pinnacle2)
    pinnacle4 = reduce_number(month + year)

    challenge1 = abs(day - month)
    challenge2 = abs(day - year)
    challenge3 = abs(challenge1 - challenge2)
    challenge4 = abs(month - year)

    first_end = 36 - reduce_number(life_path, keep_masters=False)
    return {
        "pinnacles": [pinnacle1, pinnacle2, pinnacle3, pinnacle4],
        "challenges": [challenge1, challenge2, challenge3, challenge4],
        "ranges": [
            f"0-{first_end}",
            f"{first_end + 1}-{first_end + 9}",
            f"{first_end + 10}-{first_end + 18}",
            f"{first_end + 19}+",
        ],
    }


def _active_pinnacle(age_years: float, life_path: int, data: dict[str, Any]) -> tuple[int, int, str]:
    first_end = 36 - reduce_number(life_path, keep_masters=False)
    if age_years <= first_end:
        return data["pinnacles"][0], data["challenges"][0], data["ranges"][0]
    if age_years <= first_end + 9:
        return data["pinnacles"][1], data["challenges"][1], data["ranges"][1]
    if age_years <= first_end + 18:
        return data["pinnacles"][2], data["challenges"][2], data["ranges"][2]
    return data["pinnacles"][3], data["challenges"][3], data["ranges"][3]


def _name_numbers(full_name: str) -> dict[str, Any]:
    if not alpha_only(full_name):
        return {}
    expression_total = pythagorean_value(full_name)
    soul_total = vowels_value(full_name, PYTHAGOREAN_VALUES)
    personality_total = consonants_value(full_name, PYTHAGOREAN_VALUES)
    return {
        "expression_total": expression_total,
        "expression": reduce_number(expression_total),
        "soul_urge_total": soul_total,
        "soul_urge": reduce_number(soul_total),
        "personality_total": personality_total,
        "personality": reduce_number(personality_total),
    }


def _apply(score_map: dict[str, float], reasons: dict[str, list[str]], key: str, delta: float, reason: str) -> None:
    score_map[key] += delta
    sign = "+" if delta >= 0 else ""
    reasons[key].append(f"{sign}{delta:.1f}: {reason}")


def calculate(context: dict[str, Any]) -> dict[str, Any]:
    birth_date = context["birth_date"]
    current_date = context["now_local"].date()
    full_name = context["full_name"]

    life_path = _life_path(birth_date)
    birthday_raw, birthday_reduced = _birthday_number(birth_date.day)
    attitude = _attitude_number(birth_date)
    universal_year = _universal_year(current_date.year)
    personal_year = _personal_year(birth_date, current_date.year)
    personal_month = _personal_month(personal_year, current_date.month)
    personal_day = _personal_day(personal_month, current_date.day)
    name_numbers = _name_numbers(full_name)
    pinnacle_data = _pinnacles_and_challenges(birth_date, life_path)
    active_pinnacle, active_challenge, active_range = _active_pinnacle(context["age_years"], life_path, pinnacle_data)

    maturity = reduce_number(life_path + (name_numbers.get("expression") or birthday_reduced))

    scores = {"love": 50.0, "career": 50.0, "health": 50.0, "wealth": 50.0, "mood": 50.0}
    reasons = {key: [] for key in scores}

    if life_path in {2, 6, 9, 11, 33}:
        _apply(scores, reasons, "love", 5.0, f"Life Path {life_path} is relationship-sensitive")
    if life_path in {1, 8, 22}:
        _apply(scores, reasons, "career", 5.0, f"Life Path {life_path} leans toward initiative and execution")
        _apply(scores, reasons, "wealth", 4.5, f"Life Path {life_path} leans toward material organization")
    if life_path in {4, 6}:
        _apply(scores, reasons, "health", 3.0, f"Life Path {life_path} favors consistent routines")
    if life_path in {3, 5, 11}:
        _apply(scores, reasons, "mood", 2.5, f"Life Path {life_path} is mentally or creatively active")
    if life_path == 7:
        _apply(scores, reasons, "mood", -2.5, "Life Path 7 often needs more space and quiet")

    if personal_year in {2, 6, 9}:
        _apply(scores, reasons, "love", 8.0, f"Personal Year {personal_year} puts relationships in focus")
    if personal_year in {1, 4, 8, 22}:
        _apply(scores, reasons, "career", 8.0, f"Personal Year {personal_year} supports work and direction")
        _apply(scores, reasons, "wealth", 6.0, f"Personal Year {personal_year} favors building or consolidation")
    if personal_year in {5}:
        _apply(scores, reasons, "career", 3.0, "Personal Year 5 supports movement and experimentation")
        _apply(scores, reasons, "mood", -2.0, "Personal Year 5 can feel overstimulating")
    if personal_year in {7}:
        _apply(scores, reasons, "career", -3.0, "Personal Year 7 favors reflection more than outward push")
        _apply(scores, reasons, "mood", -1.5, "Personal Year 7 can feel solitary")
    if personal_year in {4, 6, 7}:
        _apply(scores, reasons, "health", 4.0, f"Personal Year {personal_year} supports disciplined maintenance")

    if personal_month in {2, 6}:
        _apply(scores, reasons, "love", 3.0, f"Personal Month {personal_month} softens social tone")
    if personal_month in {8, 22}:
        _apply(scores, reasons, "wealth", 3.0, f"Personal Month {personal_month} is practical and results-oriented")
    if personal_day in {1, 3, 5}:
        _apply(scores, reasons, "career", 1.8, f"Personal Day {personal_day} supports action and communication")
    if personal_day in {6, 9}:
        _apply(scores, reasons, "love", 1.8, f"Personal Day {personal_day} supports empathy and connection")
    if personal_day in {4}:
        _apply(scores, reasons, "health", 1.5, "Personal Day 4 supports routine and order")

    if name_numbers:
        if name_numbers["expression"] in {1, 8, 22}:
            _apply(scores, reasons, "career", 3.5, f"Expression {name_numbers['expression']} amplifies execution")
            _apply(scores, reasons, "wealth", 2.5, f"Expression {name_numbers['expression']} amplifies administration")
        if name_numbers["soul_urge"] in {2, 6, 9, 11}:
            _apply(scores, reasons, "love", 3.5, f"Soul Urge {name_numbers['soul_urge']} values emotional connection")
        if name_numbers["personality"] in {3, 5}:
            _apply(scores, reasons, "mood", 2.0, f"Personality {name_numbers['personality']} keeps the tone lively")
        if name_numbers["expression"] == personal_year:
            _apply(scores, reasons, "career", 2.5, "Expression number aligns with the current year cycle")
        if name_numbers["soul_urge"] == personal_year:
            _apply(scores, reasons, "love", 2.5, "Soul Urge aligns with the current year cycle")

    if active_pinnacle in {8, 22}:
        _apply(scores, reasons, "career", 4.0, f"Active pinnacle {active_pinnacle} emphasizes construction and scale")
        _apply(scores, reasons, "wealth", 4.0, f"Active pinnacle {active_pinnacle} emphasizes results and management")
    if active_pinnacle in {2, 6, 9}:
        _apply(scores, reasons, "love", 3.0, f"Active pinnacle {active_pinnacle} emphasizes relational learning")
    if active_challenge in {4, 5}:
        _apply(scores, reasons, "mood", -2.0, f"Active challenge {active_challenge} adds tension around change or order")

    scores = {key: round2(clamp(value, 5, 95)) for key, value in scores.items()}

    core_rows = [
        ["Life Path", life_path, NUMBER_THEMES.get(life_path, "")],
        ["Birthday", f"{birthday_raw} / {birthday_reduced}", NUMBER_THEMES.get(birthday_reduced, "")],
        ["Attitude", attitude, NUMBER_THEMES.get(attitude, "")],
        ["Maturity", maturity, NUMBER_THEMES.get(maturity, "")],
    ]

    cycle_rows = [
        ["Universal Year", universal_year, NUMBER_THEMES.get(universal_year, "")],
        ["Personal Year", personal_year, NUMBER_THEMES.get(personal_year, "")],
        ["Personal Month", personal_month, NUMBER_THEMES.get(personal_month, "")],
        ["Personal Day", personal_day, NUMBER_THEMES.get(personal_day, "")],
        ["Active Pinnacle", active_pinnacle, f"Range {active_range}"],
        ["Active Challenge", active_challenge, NUMBER_THEMES.get(active_challenge, "")],
    ]

    pinnacle_rows = [
        [idx + 1, pinnacle, challenge, rng]
        for idx, (pinnacle, challenge, rng) in enumerate(zip(pinnacle_data["pinnacles"], pinnacle_data["challenges"], pinnacle_data["ranges"]))
    ]

    name_rows = []
    if name_numbers:
        name_rows = [
            ["Expression", name_numbers["expression_total"], name_numbers["expression"], NUMBER_THEMES.get(name_numbers["expression"], "")],
            ["Soul Urge", name_numbers["soul_urge_total"], name_numbers["soul_urge"], NUMBER_THEMES.get(name_numbers["soul_urge"], "")],
            ["Personality", name_numbers["personality_total"], name_numbers["personality"], NUMBER_THEMES.get(name_numbers["personality"], "")],
        ]

    driver_rows = []
    for category in ["love", "career", "health", "wealth", "mood"]:
        for line in reasons[category][:6]:
            driver_rows.append([category.title(), line])

    summary = [
        f"This numerology tab uses your birth date to compute the Life Path, Birthday, Attitude, current Personal Year, and longer pinnacle cycles. Your Life Path is {life_path}, which points toward {NUMBER_THEMES.get(life_path, '')}.",
        f"The active current cycle is Personal Year {personal_year}, Personal Month {personal_month}, and Personal Day {personal_day}. Those moving cycles drive the score set below.",
        f"The active pinnacle is {active_pinnacle} with challenge {active_challenge} across {active_range}, which adds the medium-term layer to the reading.",
    ]
    if name_numbers:
        summary.append(f"Because a name was provided, the tab also computes Expression {name_numbers['expression']}, Soul Urge {name_numbers['soul_urge']}, and Personality {name_numbers['personality']} numbers using the Pythagorean table.")

    highlights = [
        highlight("Life Path", life_path),
        highlight("Birthday", f"{birthday_raw} / {birthday_reduced}"),
        highlight("Attitude", attitude),
        highlight("Personal Year", personal_year),
        highlight("Personal Month", personal_month),
        highlight("Personal Day", personal_day),
        highlight("Active Pinnacle", active_pinnacle),
        highlight("Active Challenge", active_challenge),
    ]
    if name_numbers:
        highlights.extend([
            highlight("Expression", name_numbers["expression"]),
            highlight("Soul Urge", name_numbers["soul_urge"]),
            highlight("Personality", name_numbers["personality"]),
        ])

    insights = [
        insight("Life Path", f"Life Path {life_path} is the main long-run signature and describes the overall lesson emphasis of the lifetime."),
        insight("Current timing", f"Personal Year {personal_year}, Month {personal_month}, and Day {personal_day} create the current timing stack for the probabilities below."),
        insight("Pinnacles", f"Active pinnacle {active_pinnacle} and challenge {active_challenge} describe the current developmental chapter running through age {context['age_years']}."),
    ]
    if name_numbers:
        insights.append(insight("Name-based layer", f"Expression {name_numbers['expression']}, Soul Urge {name_numbers['soul_urge']}, and Personality {name_numbers['personality']} add the name-based layer to the birth-date core."))

    tables = [
        table("Core numbers", ["Number", "Value", "Theme"], core_rows),
        table("Current cycles", ["Cycle", "Value", "Theme / detail"], cycle_rows),
        table("Pinnacles and challenges", ["Stage", "Pinnacle", "Challenge", "Age range"], pinnacle_rows),
    ]
    if name_rows:
        tables.append(table("Name numbers", ["Number", "Total", "Reduced", "Theme"], name_rows))
    tables.append(table("Score drivers", ["Area", "Driver"], driver_rows))

    return {
        "id": "numerology",
        "name": "Numerology",
        "headline": f"Life Path {life_path} in a Personal Year {personal_year}",
        "summary": summary,
        "highlights": highlights,
        "scores": {key: {"value": value, "label": map_score_to_label(value)} for key, value in scores.items()},
        "insights": insights,
        "tables": tables,
        "meta": {
            "engine_type": "Pythagorean birth-date numerology with current cycle overlays",
            "context": current_context_snapshot(context),
            "full_name_used": bool(name_numbers),
        },
    }
