from __future__ import annotations

from typing import Any

from .common import (
    clamp,
    current_context_snapshot,
    gematria_breakdown,
    highlight,
    insight,
    map_score_to_label,
    reduce_number,
    round2,
    table,
)


ROOT_THEMES = {
    1: "origin, will, self-definition",
    2: "bonding, balance, partnership",
    3: "expression, pattern, communication",
    4: "structure, order, embodiment",
    5: "change, transition, threshold",
    6: "harmony, beauty, care",
    7: "study, privacy, spiritual searching",
    8: "power, administration, material traction",
    9: "completion, compassion, closure",
    11: "intuition and doubled sensitivity",
    22: "master building and implementation",
    33: "service and guidance",
}


def _digit_sum(value: str | int) -> int:
    return sum(int(char) for char in str(value) if char.isdigit())


def _source_text(context: dict[str, Any]) -> tuple[str, str]:
    if context["hebrew_name"].strip():
        return context["hebrew_name"], "hebrew or transliterated name"
    if context["full_name"].strip():
        return context["full_name"], "full name"
    return context["birth_location"], "birth location phrase"


def _personal_year(birth_date, current_year: int) -> int:
    return reduce_number(_digit_sum(f"{birth_date.month:02d}{birth_date.day:02d}") + reduce_number(_digit_sum(current_year), keep_masters=False))


def _apply(score_map: dict[str, float], reasons: dict[str, list[str]], key: str, delta: float, reason: str) -> None:
    score_map[key] += delta
    sign = "+" if delta >= 0 else ""
    reasons[key].append(f"{sign}{delta:.1f}: {reason}")


def calculate(context: dict[str, Any]) -> dict[str, Any]:
    source_text, source_label = _source_text(context)
    breakdown = gematria_breakdown(source_text)
    birth_digits = _digit_sum(context["birth_date"].strftime("%Y%m%d"))
    birth_root = reduce_number(birth_digits)
    text_root = reduce_number(breakdown["total"]) if breakdown["total"] else birth_root
    ordinal_root = reduce_number(breakdown["ordinal"]) if breakdown["ordinal"] else birth_root
    bridge_root = reduce_number(breakdown["total"] + birth_digits) if breakdown["total"] else reduce_number(birth_digits)
    current_gate = _personal_year(context["birth_date"], context["now_local"].year)

    word_rows = []
    for word in [piece for piece in source_text.split() if piece.strip()]:
        word_breakdown = gematria_breakdown(word)
        word_rows.append([word, word_breakdown["total"], reduce_number(word_breakdown["total"])])

    scores = {"love": 50.0, "career": 50.0, "health": 50.0, "wealth": 50.0, "mood": 50.0}
    reasons = {key: [] for key in scores}

    if text_root in {2, 6, 9, 11}:
        _apply(scores, reasons, "love", 5.0, f"Text root {text_root} emphasizes connection and empathy")
    if text_root in {1, 4, 8, 22}:
        _apply(scores, reasons, "career", 5.0, f"Text root {text_root} emphasizes structure and execution")
        _apply(scores, reasons, "wealth", 4.0, f"Text root {text_root} favors practical outcomes")
    if text_root in {4, 6, 7, 9}:
        _apply(scores, reasons, "health", 3.0, f"Text root {text_root} encourages order or restorative rhythm")
    if ordinal_root in {3, 5, 7, 11}:
        _apply(scores, reasons, "mood", 2.5, f"Ordinal root {ordinal_root} heightens thought, creativity, or sensitivity")

    if bridge_root in {2, 6, 9}:
        _apply(scores, reasons, "love", 3.5, f"Bridge root {bridge_root} connects text and birth date relationally")
    if bridge_root in {1, 4, 8, 22}:
        _apply(scores, reasons, "career", 3.5, f"Bridge root {bridge_root} links text and birth date toward results")
        _apply(scores, reasons, "wealth", 3.0, f"Bridge root {bridge_root} links text and birth date toward material focus")
    if bridge_root in {4, 6, 9}:
        _apply(scores, reasons, "health", 2.5, f"Bridge root {bridge_root} favors stabilization")

    if text_root == current_gate:
        _apply(scores, reasons, "career", 2.5, "Text root matches the current yearly gate")
        _apply(scores, reasons, "wealth", 2.0, "Text root matches the current yearly gate")
    if bridge_root == current_gate:
        _apply(scores, reasons, "mood", 2.0, "Bridge root matches the current yearly gate")
        _apply(scores, reasons, "love", 2.0, "Bridge root matches the current yearly gate")
    if ordinal_root == birth_root:
        _apply(scores, reasons, "mood", 1.8, "Ordinal root echoes the birth-date root")

    if breakdown["total"] and breakdown["total"] % 6 == 0:
        _apply(scores, reasons, "love", 1.5, "Total gematria is divisible by 6, emphasizing harmony")
    if breakdown["total"] and breakdown["total"] % 8 == 0:
        _apply(scores, reasons, "wealth", 1.5, "Total gematria is divisible by 8, emphasizing management and material traction")
    if breakdown["total"] and breakdown["total"] % 9 == 0:
        _apply(scores, reasons, "mood", 1.5, "Total gematria is divisible by 9, emphasizing closure and compassion")

    scores = {key: round2(clamp(value, 5, 95)) for key, value in scores.items()}

    token_rows = [[item["token"], item["value"]] for item in breakdown["tokens"]]
    root_rows = [
        ["Text total", breakdown["total"], text_root, ROOT_THEMES.get(text_root, "")],
        ["Ordinal total", breakdown["ordinal"], ordinal_root, ROOT_THEMES.get(ordinal_root, "")],
        ["Reduced total", breakdown["reduced"], breakdown["reduced"], ROOT_THEMES.get(breakdown["reduced"], "")],
        ["Birth-date root", birth_digits, birth_root, ROOT_THEMES.get(birth_root, "")],
        ["Bridge root", breakdown["total"] + birth_digits, bridge_root, ROOT_THEMES.get(bridge_root, "")],
        ["Current gate", current_gate, current_gate, ROOT_THEMES.get(current_gate, "")],
    ]

    driver_rows = []
    for category in ["love", "career", "health", "wealth", "mood"]:
        for line in reasons[category][:6]:
            driver_rows.append([category.title(), line])

    summary = [
        f"This tab treats '{source_text}' as the active gematria phrase and derives standard, ordinal, and reduced totals from it.",
        f"The live reading then bridges that phrase total with the birth-date root and the current yearly gate. The current gate is {current_gate}, while the text root is {text_root}.",
        f"Because gematria is symbolic rather than astronomical, the scores below are built from root alignment, bridge totals, and the phrase decomposition shown in the tables.",
    ]

    highlights = [
        highlight("Source text", source_text),
        highlight("Source type", source_label),
        highlight("Text total", breakdown["total"]),
        highlight("Text root", text_root),
        highlight("Ordinal root", ordinal_root),
        highlight("Bridge root", bridge_root),
        highlight("Birth root", birth_root),
        highlight("Current gate", current_gate),
    ]

    insights = [
        insight("Phrase root", f"The text root is {text_root}, which points toward {ROOT_THEMES.get(text_root, 'symbolic patterning')}"),
        insight("Bridge logic", f"The bridge root is formed by combining gematria total {breakdown['total']} with birth-date digits {birth_digits}. It is treated as the joined personal-symbolic signature."),
        insight("Current timing", f"The current yearly gate is {current_gate}. When roots match that gate, the engine boosts coherence across the score set."),
        insight("Method", "This engine focuses on phrase values and root alignment. It does not reuse the sefirah and path-gate method from the Kabbalistic tab."),
    ]

    return {
        "id": "gematria",
        "name": "Gematria",
        "headline": f"Text root {text_root} with bridge root {bridge_root}",
        "summary": summary,
        "highlights": highlights,
        "scores": {key: {"value": value, "label": map_score_to_label(value)} for key, value in scores.items()},
        "insights": insights,
        "tables": [
            table("Token values", ["Token", "Value"], token_rows),
            table("Word totals", ["Word", "Total", "Root"], word_rows),
            table("Root correspondences", ["Layer", "Total", "Root", "Theme"], root_rows),
            table("Score drivers", ["Area", "Driver"], driver_rows),
        ],
        "meta": {
            "engine_type": "Phrase-based gematria using standard, ordinal, and reduced totals",
            "source_label": source_label,
            "context": current_context_snapshot(context),
        },
    }
