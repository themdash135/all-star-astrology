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

ROOT_DESCRIPTIONS: dict[int, str] = {
    1: (
        "Root 1 is the origin point — leadership, independence, and pioneering spirit. "
        "A person with this root is here to initiate, to stand at the front of the line, "
        "and to carve paths that did not exist before."
    ),
    2: (
        "Root 2 is the mirror — partnership, balance, and receptivity. "
        "A person with this root is here to connect, to mediate, and to find truth "
        "in the space between two perspectives."
    ),
    3: (
        "Root 3 is the voice — expression, creativity, and communicative brilliance. "
        "A person with this root is here to turn inner visions into words, art, "
        "or performances that move others."
    ),
    4: (
        "Root 4 is the foundation — structure, discipline, and embodied order. "
        "A person with this root is here to build things that last, to bring "
        "stability where chaos reigns."
    ),
    5: (
        "Root 5 is the threshold — change, freedom, and restless movement. "
        "A person with this root is here to break stagnation, to explore, "
        "and to catalyze transformation wherever they go."
    ),
    6: (
        "Root 6 is the heart — harmony, beauty, and nurturing care. "
        "A person with this root is here to heal, to beautify, and to create "
        "environments where others feel loved and safe."
    ),
    7: (
        "Root 7 is the seeker — study, solitude, and spiritual searching. "
        "A person with this root is here to go deep, to question assumptions, "
        "and to bring back wisdom from inner exploration."
    ),
    8: (
        "Root 8 is the executive — power, material mastery, and organizational force. "
        "A person with this root is here to manage resources, build empires, "
        "and turn vision into tangible abundance."
    ),
    9: (
        "Root 9 is the sage — completion, universal compassion, and humanitarianism. "
        "A person with this root is here to serve the whole, to close cycles with grace, "
        "and to embody wisdom earned through experience."
    ),
    11: (
        "Root 11 is the intuitive channel — doubled sensitivity, visionary insight, "
        "and a direct line to the unseen. A person with this root receives impressions "
        "that others miss, but must learn to ground them."
    ),
    22: (
        "Root 22 is the master builder — the ability to manifest grand visions on "
        "the material plane. A person with this root combines spiritual understanding "
        "with practical engineering on a large scale."
    ),
    33: (
        "Root 33 is the master teacher — selfless service, healing guidance, and "
        "the capacity to uplift communities. A person with this root is called to "
        "lead through compassion and lived example."
    ),
}

GATE_TIMING: dict[int, str] = {
    1: "new beginnings, self-assertion, and launching independent ventures. It is a year to start something entirely your own.",
    2: "patience, cooperation, and behind-the-scenes partnership. It is a year to listen deeply and let alliances form.",
    3: "creative expression, social visibility, and joyful communication. It is a year to put your voice into the world.",
    4: "hard work, foundations, and methodical progress. It is a year to build brick by brick without shortcuts.",
    5: "freedom, change, and unexpected openings. It is a year when restlessness leads to breakthroughs if you lean into it.",
    6: "home, family, and responsibility to those you love. It is a year to nurture relationships and create beauty.",
    7: "reflection, inner work, and spiritual deepening. It is a year to study, rest, and trust the unseen process.",
    8: "power, material mastery, and financial momentum. When your roots harmonize with this gate, career and financial energy flows most freely.",
    9: "completion, release, and compassionate closure. It is a year to finish what was started and let go of what no longer serves.",
    11: "heightened intuition, inspiration, and illumination. It is a year when subtle signals carry more weight than loud actions.",
    22: "ambitious manifestation and large-scale building. It is a year when disciplined effort can produce lasting legacy.",
    33: "selfless service, teaching, and healing. It is a year when your greatest fulfillment comes through lifting others.",
}

RESONANCE_THEMES: dict[int, str] = {
    0: ("neutrality and the void", "a pause before new meaning crystallizes"),
    1: ("singular purpose and divine unity", "a vibration that stands alone and leads"),
    2: ("duality and sacred partnership", "the interplay of opposites seeking balance"),
    3: ("creative trinity and joyful expression", "the triangle of creation, sustenance, and transformation"),
    4: ("earthly stability and the four directions", "a call to ground vision into structure"),
    5: ("dynamic change and the five senses", "the body's wisdom meeting the soul's restlessness"),
    6: ("harmony, the Star of David, and covenant", "a vibration of responsibility and love"),
    7: ("mystery, the sabbath, and inner completion", "the sacred number of rest, reflection, and spiritual law"),
    8: ("infinity, abundance, and karmic balance", "a vibration that circulates power and consequence"),
    9: ("universal compassion and the end of cycles", "the final single digit, carrying all that came before"),
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

    # Build resonance interpretation from the gematria total
    resonance_root = breakdown["total"] % 10 if breakdown["total"] else 0
    resonance_themes, resonance_interp = RESONANCE_THEMES.get(
        resonance_root, ("symbolic patterning", "a unique numerical vibration")
    )

    insights = [
        insight(
            "Phrase root",
            f"The text root is {text_root}, which points toward "
            f"{ROOT_THEMES.get(text_root, 'symbolic patterning')}. "
            f"{ROOT_DESCRIPTIONS.get(text_root, '')}"
        ),
        insight(
            "Bridge logic",
            f"The bridge root is formed by combining gematria total "
            f"{breakdown['total']} with birth-date digits {birth_digits}, "
            f"yielding bridge root {bridge_root}. "
            f"Bridge root {bridge_root} connects your name vibration to "
            f"{ROOT_THEMES.get(bridge_root, 'symbolic patterning')}. "
            f"{ROOT_DESCRIPTIONS.get(bridge_root, '')} "
            f"It suggests your personal identity serves a purpose aligned with "
            f"that energy."
        ),
        insight(
            "Resonance",
            f"Your gematria total of {breakdown['total']} resonates with themes "
            f"of {resonance_themes}. In the Hebrew tradition, numbers of this "
            f"magnitude point to {resonance_interp}. The reduced root "
            f"{text_root} distills this into a single directive: "
            f"{ROOT_THEMES.get(text_root, 'symbolic patterning')}."
        ),
        insight(
            "Current timing",
            f"Current gate {current_gate} aligns with themes of "
            f"{GATE_TIMING.get(current_gate, 'symbolic transition and recalibration.')} "
            f"When your roots harmonize with this gate, the corresponding life "
            f"areas receive an extra boost of coherence and momentum."
        ),
        insight(
            "Method",
            "This engine focuses on phrase values and root alignment. It does not "
            "reuse the sefirah and path-gate method from the Kabbalistic tab."
        ),
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
