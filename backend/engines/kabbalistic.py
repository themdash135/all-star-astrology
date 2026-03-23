from __future__ import annotations

from typing import Any

from .common import (
    CHALDEAN_VALUES,
    SEFIROT,
    alpha_only,
    chaldean_value,
    clamp,
    consonants_value,
    current_context_snapshot,
    highlight,
    insight,
    map_score_to_label,
    reduce_number,
    round2,
    table,
    vowels_value,
)


TREE_PATHS = {
    1: ("Aleph", "breath, openness, beginning"),
    2: ("Beth", "containment, shelter, form"),
    3: ("Gimel", "movement, passage, exchange"),
    4: ("Daleth", "threshold, relationship, receptivity"),
    5: ("He", "revelation, space, emergence"),
    6: ("Vav", "bonding, linkage, alignment"),
    7: ("Zayin", "discernment, tension, purpose"),
    8: ("Cheth", "containment, memory, protection"),
    9: ("Teth", "hidden strength, cultivation"),
    10: ("Yod", "seed, essence, concentration"),
    11: ("Kaph", "capacity, shaping, transmission"),
    12: ("Lamed", "learning, direction, aspiration"),
    13: ("Mem", "depth, intuition, gestation"),
    14: ("Nun", "renewal, descent, regeneration"),
    15: ("Samekh", "support, trust, centering"),
    16: ("Ayin", "perception, value, appetite"),
    17: ("Pe", "speech, expression, declaration"),
    18: ("Tzaddi", "integrity, discipline, refinement"),
    19: ("Qoph", "dream, imagination, subconscious"),
    20: ("Resh", "mind, attention, illumination"),
    21: ("Shin", "fire, transformation, will"),
    22: ("Tav", "completion, embodiment, seal"),
}

SEFIRAH_THEMES = {
    1: "pure potential and unity",
    2: "wisdom, intuition, and originating spark",
    3: "understanding, structure, and inner analysis",
    4: "mercy, generosity, and expansion",
    5: "discipline, boundaries, and discernment",
    6: "beauty, harmony, and heart integration",
    7: "desire, artistry, and relational magnetism",
    8: "language, thought, systems, and strategy",
    9: "bonding, memory, and emotional foundation",
    10: "material grounding and practical manifestation",
}


def _digit_sum(value: str | int) -> int:
    return sum(int(char) for char in str(value) if char.isdigit())


def _birth_path(birth_date) -> int:
    return reduce_number(_digit_sum(birth_date.strftime("%Y%m%d")))


def _personal_year(birth_date, current_year: int) -> int:
    return reduce_number(_digit_sum(f"{birth_date.month:02d}{birth_date.day:02d}") + reduce_number(_digit_sum(current_year), keep_masters=False))


def _path_index(total: int) -> int:
    if total <= 0:
        return 1
    return ((total - 1) % 22) + 1


def _sefirah_number(value: int) -> int:
    reduced = reduce_number(value, keep_masters=False)
    return 10 if reduced == 0 else reduced


def _text_source(context: dict[str, Any]) -> tuple[str, str]:
    if alpha_only(context["full_name"]):
        return context["full_name"], "full name"
    if alpha_only(context["hebrew_name"]):
        return context["hebrew_name"], "hebrew or transliterated name"
    return context["birth_location"], "birth location phrase"


def _apply(score_map: dict[str, float], reasons: dict[str, list[str]], key: str, delta: float, reason: str) -> None:
    score_map[key] += delta
    sign = "+" if delta >= 0 else ""
    reasons[key].append(f"{sign}{delta:.1f}: {reason}")


def calculate(context: dict[str, Any]) -> dict[str, Any]:
    birth_date = context["birth_date"]
    current_date = context["now_local"].date()

    source_text, source_label = _text_source(context)
    source_clean = alpha_only(source_text) or alpha_only(context["birth_location"])
    name_total = chaldean_value(source_text)
    soul_total = vowels_value(source_text, CHALDEAN_VALUES)
    personality_total = consonants_value(source_text, CHALDEAN_VALUES)

    birth_path = _birth_path(birth_date)
    personal_year = _personal_year(birth_date, current_date.year)
    personal_month = reduce_number(personal_year + current_date.month)
    personal_day = reduce_number(personal_month + current_date.day)

    birth_sefirah = _sefirah_number(birth_path)
    name_sefirah = _sefirah_number(name_total or birth_path)
    cycle_sefirah = _sefirah_number(personal_year)
    soul_sefirah = _sefirah_number(soul_total or personal_month)
    personality_sefirah = _sefirah_number(personality_total or personal_day)

    name_path = _path_index(name_total or birth_path)
    cycle_path = _path_index(_digit_sum(f"{birth_date.month:02d}{birth_date.day:02d}{current_date.year}"))
    soul_path = _path_index(soul_total or name_total or birth_path)

    scores = {"love": 50.0, "career": 50.0, "health": 50.0, "wealth": 50.0, "mood": 50.0}
    reasons = {key: [] for key in scores}

    if birth_sefirah in {2, 6, 7, 9}:
        _apply(scores, reasons, "love", 5.0, f"Birth sefirah {SEFIROT[birth_sefirah]} emphasizes bonding and empathy")
        _apply(scores, reasons, "mood", 2.5, f"Birth sefirah {SEFIROT[birth_sefirah]} is emotionally responsive")
    if birth_sefirah in {4, 5, 8, 10}:
        _apply(scores, reasons, "career", 5.0, f"Birth sefirah {SEFIROT[birth_sefirah]} supports structure and execution")
        _apply(scores, reasons, "wealth", 4.0, f"Birth sefirah {SEFIROT[birth_sefirah]} supports practical results")
    if birth_sefirah in {3, 8}:
        _apply(scores, reasons, "career", 2.5, f"Birth sefirah {SEFIROT[birth_sefirah]} sharpens analysis")
    if birth_sefirah in {9, 10}:
        _apply(scores, reasons, "health", 2.5, f"Birth sefirah {SEFIROT[birth_sefirah]} favors grounding and embodiment")

    if cycle_sefirah in {2, 6, 7, 9}:
        _apply(scores, reasons, "love", 6.0, f"Current cycle enters {SEFIROT[cycle_sefirah]} mode")
    if cycle_sefirah in {4, 5, 8, 10}:
        _apply(scores, reasons, "career", 6.0, f"Current cycle enters {SEFIROT[cycle_sefirah]} mode")
        _apply(scores, reasons, "wealth", 5.0, f"Current cycle enters {SEFIROT[cycle_sefirah]} mode")
    if cycle_sefirah in {9, 10, 6}:
        _apply(scores, reasons, "health", 4.0, f"Current cycle supports stabilization through {SEFIROT[cycle_sefirah]}")
    if cycle_sefirah == 3:
        _apply(scores, reasons, "mood", 1.5, "Current cycle increases introspective thinking")

    if name_sefirah == birth_sefirah:
        _apply(scores, reasons, "mood", 3.5, "Name vibration and birth path point toward the same sefirah")
        _apply(scores, reasons, "love", 2.0, "Inner and outer themes are more integrated")
    if name_sefirah == cycle_sefirah:
        _apply(scores, reasons, "career", 2.5, "Name vibration matches the current year gate")
        _apply(scores, reasons, "wealth", 2.0, "Name vibration matches the current year gate")
    if soul_sefirah == cycle_sefirah:
        _apply(scores, reasons, "love", 2.5, "Inner desire aligns with the current year")
        _apply(scores, reasons, "mood", 2.0, "Inner desire aligns with the current year")
    if personality_sefirah in {5, 8}:
        _apply(scores, reasons, "career", 2.0, f"Outer style reflects {SEFIROT[personality_sefirah]} discipline and language")

    # Path gates give the more symbolic layer.
    if cycle_path in {4, 6, 12, 17, 22}:
        _apply(scores, reasons, "career", 2.0, f"Current path {TREE_PATHS[cycle_path][0]} favors deliberate expression")
    if cycle_path in {3, 4, 6, 15, 21}:
        _apply(scores, reasons, "love", 2.0, f"Current path {TREE_PATHS[cycle_path][0]} opens relational learning")
    if cycle_path in {8, 10, 15, 22}:
        _apply(scores, reasons, "health", 1.8, f"Current path {TREE_PATHS[cycle_path][0]} supports centering and embodiment")
    if cycle_path in {19, 21}:
        _apply(scores, reasons, "mood", 1.5, f"Current path {TREE_PATHS[cycle_path][0]} heightens imagination and will")

    scores = {key: round2(clamp(value, 5, 95)) for key, value in scores.items()}

    core_rows = [
        ["Birth path", birth_path, SEFIROT[birth_sefirah], SEFIRAH_THEMES[birth_sefirah]],
        ["Name total", name_total or "n/a", SEFIROT[name_sefirah], SEFIRAH_THEMES[name_sefirah]],
        ["Soul total", soul_total or "n/a", SEFIROT[soul_sefirah], SEFIRAH_THEMES[soul_sefirah]],
        ["Personality total", personality_total or "n/a", SEFIROT[personality_sefirah], SEFIRAH_THEMES[personality_sefirah]],
        ["Current year", personal_year, SEFIROT[cycle_sefirah], SEFIRAH_THEMES[cycle_sefirah]],
    ]

    path_rows = [
        ["Name path", name_path, TREE_PATHS[name_path][0], TREE_PATHS[name_path][1]],
        ["Soul path", soul_path, TREE_PATHS[soul_path][0], TREE_PATHS[soul_path][1]],
        ["Cycle path", cycle_path, TREE_PATHS[cycle_path][0], TREE_PATHS[cycle_path][1]],
    ]

    cycle_rows = [
        ["Personal Year", personal_year, SEFIROT[cycle_sefirah]],
        ["Personal Month", personal_month, SEFIROT[_sefirah_number(personal_month)]],
        ["Personal Day", personal_day, SEFIROT[_sefirah_number(personal_day)]],
    ]

    driver_rows = []
    for category in ["love", "career", "health", "wealth", "mood"]:
        for line in reasons[category][:6]:
            driver_rows.append([category.title(), line])

    summary = [
        f"This tab applies a Kabbalistic numerology lens to the birth date and the text source '{source_label}'. The main birth signature reduces to sefirah {SEFIROT[birth_sefirah]}, which emphasizes {SEFIRAH_THEMES[birth_sefirah]}.",
        f"The current cycle reduces to sefirah {SEFIROT[cycle_sefirah]} and path {TREE_PATHS[cycle_path][0]}, so the daily scores below lean on that gate as the live influence.",
        f"Name-based values are computed with the Chaldean table here so the Kabbalistic tab stays distinct from the Pythagorean numerology tab.",
    ]

    highlights = [
        highlight("Source text", source_text or context["birth_location"]),
        highlight("Birth sefirah", SEFIROT[birth_sefirah]),
        highlight("Name sefirah", SEFIROT[name_sefirah]),
        highlight("Cycle sefirah", SEFIROT[cycle_sefirah]),
        highlight("Name path", TREE_PATHS[name_path][0]),
        highlight("Cycle path", TREE_PATHS[cycle_path][0]),
        highlight("Soul sefirah", SEFIROT[soul_sefirah]),
        highlight("Personality sefirah", SEFIROT[personality_sefirah]),
    ]

    insights = [
        insight("Birth sefirah", f"{SEFIROT[birth_sefirah]} describes the main incarnation tone in this reading and carries themes of {SEFIRAH_THEMES[birth_sefirah]}"),
        insight("Name vibration", f"The active text source is '{source_text or context['birth_location']}', producing total {name_total or 0} and path {TREE_PATHS[name_path][0]}"),
        insight("Current gate", f"The present-year gate is {SEFIROT[cycle_sefirah]} with path {TREE_PATHS[cycle_path][0]}, which sets the live probability tone."),
        insight("Method", "This engine uses Chaldean totals, sefirot correspondences, and 22 symbolic path gates rather than the Pythagorean table used in the general numerology tab."),
    ]

    return {
        "id": "kabbalistic",
        "name": "Kabbalistic",
        "headline": f"{SEFIROT[birth_sefirah]} birth tone with a {SEFIROT[cycle_sefirah]} current gate",
        "summary": summary,
        "highlights": highlights,
        "scores": {key: {"value": value, "label": map_score_to_label(value)} for key, value in scores.items()},
        "insights": insights,
        "tables": [
            table("Core correspondences", ["Factor", "Value", "Sefirah", "Theme"], core_rows),
            table("Path gates", ["Layer", "Index", "Path", "Theme"], path_rows),
            table("Current cycles", ["Cycle", "Value", "Sefirah"], cycle_rows),
            table("Score drivers", ["Area", "Driver"], driver_rows),
        ],
        "meta": {
            "engine_type": "Chaldean / sefirotic symbolic engine",
            "source_label": source_label,
            "context": current_context_snapshot(context),
        },
    }
