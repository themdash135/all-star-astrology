from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any

from .common import (
    ASCENDANT_THEMES,
    ASPECT_DEFS,
    MOON_SIGN_THEMES,
    SIGN_ELEMENTS,
    SIGN_MODALITIES,
    SUN_SIGN_THEMES,
    angular_distance,
    calculate_planetary_positions,
    clamp,
    current_context_snapshot,
    dominant_element_modality,
    find_aspects,
    highlight,
    house_quality,
    insight,
    map_score_to_label,
    planet_condition,
    planet_quality_score,
    round2,
    table,
)


SOFT_ASPECTS = {"Conjunction", "Sextile", "Trine"}
HARD_ASPECTS = {"Square", "Opposition", "Quincunx"}


def _format_planet_row(name: str, planet: dict[str, Any]) -> list[Any]:
    return [
        name,
        planet["sign"],
        f"{planet['degree_in_sign']:.2f}d",
        planet.get("house", "-"),
        "R" if planet.get("retrograde") else "D",
        planet_condition(name, planet["sign"]),
    ]


def _house_rows(cusps: list[float]) -> list[list[Any]]:
    return [[f"House {idx}", f"{value:.2f}d"] for idx, value in enumerate(cusps, start=1)]


def _count_house_occupants(positions: dict[str, Any], houses: set[int], names: set[str] | None = None) -> int:
    total = 0
    for name, planet in positions.items():
        if names and name not in names:
            continue
        if planet.get("house") in houses:
            total += 1
    return total


def _find_transit_aspects(transits: dict[str, Any], natal: dict[str, Any]) -> list[dict[str, Any]]:
    important_transits = ["Sun", "Moon", "Venus", "Mars", "Jupiter", "Saturn"]
    important_natal = ["Sun", "Moon", "Venus", "Mars", "Ascendant", "Midheaven"]
    results: list[dict[str, Any]] = []
    for transit_name in important_transits:
        for natal_name in important_natal:
            distance = angular_distance(transits[transit_name]["longitude"], natal[natal_name]["longitude"])
            for aspect_name, exact_angle, orb in ASPECT_DEFS:
                transit_orb = min(orb, 4.0)
                delta = abs(distance - exact_angle)
                if delta <= transit_orb:
                    results.append(
                        {
                            "transit": transit_name,
                            "natal": natal_name,
                            "name": aspect_name,
                            "distance": round2(distance),
                            "orb": round2(delta),
                        }
                    )
                    break
    results.sort(key=lambda item: (item["orb"], item["distance"]))
    return results[:18]


def _apply(score_map: dict[str, float], reasons: dict[str, list[str]], key: str, delta: float, reason: str) -> None:
    score_map[key] += delta
    sign = "+" if delta >= 0 else ""
    reasons[key].append(f"{sign}{delta:.1f}: {reason}")


def _score_chart(
    positions: dict[str, Any],
    aspects: list[dict[str, Any]],
    transit_aspects: list[dict[str, Any]],
    dominance: dict[str, Any],
) -> tuple[dict[str, float], dict[str, list[str]]]:
    scores = {"love": 50.0, "career": 50.0, "health": 50.0, "wealth": 50.0, "mood": 50.0}
    reasons: dict[str, list[str]] = defaultdict(list)

    venus = positions["Venus"]
    mars = positions["Mars"]
    sun = positions["Sun"]
    moon = positions["Moon"]
    jupiter = positions["Jupiter"]
    saturn = positions["Saturn"]
    asc = positions["Ascendant"]
    mc = positions["Midheaven"]

    # Base chart structure.
    for planet_name, category_map in {
        "Venus": ["love", "wealth", "mood"],
        "Sun": ["career", "health"],
        "Moon": ["mood", "health", "love"],
        "Jupiter": ["wealth", "career", "love"],
        "Saturn": ["career", "health"],
        "Mars": ["career", "health"],
    }.items():
        quality = planet_quality_score(positions[planet_name])
        for category in category_map:
            _apply(scores, reasons, category, quality * 0.35, f"{planet_name} placement quality in {positions[planet_name]['sign']} / House {positions[planet_name]['house']}")

    if venus["house"] in {5, 7}:
        _apply(scores, reasons, "love", 7.0, "Venus in a romance or partnership house")
    if moon["house"] in {4, 5, 7}:
        _apply(scores, reasons, "love", 4.0, "Moon supports closeness and receptivity")
    if jupiter["house"] in {2, 8, 11}:
        _apply(scores, reasons, "wealth", 6.0, "Jupiter strengthens abundance houses")
    if sun["house"] in {10, 11} or mc["sign"] in {"Aries", "Capricorn", "Leo", "Virgo"}:
        _apply(scores, reasons, "career", 6.0, "Public direction favors visibility and execution")
    if asc["sign"] in {"Virgo", "Capricorn", "Taurus"}:
        _apply(scores, reasons, "health", 3.5, "Ascendant sign supports bodily discipline")
    if moon["sign"] in {"Cancer", "Taurus", "Pisces"}:
        _apply(scores, reasons, "mood", 5.0, "Moon sign supports emotional recovery")
    if moon["sign"] in {"Scorpio", "Capricorn"}:
        _apply(scores, reasons, "mood", -4.0, "Moon sign carries heavier emotional weather")
    if venus["sign"] in {"Libra", "Taurus", "Pisces"}:
        _apply(scores, reasons, "love", 5.0, "Venus sign is relationally fluent")
    if mars["sign"] in {"Aries", "Scorpio", "Capricorn"}:
        _apply(scores, reasons, "career", 3.0, "Mars sign supports ambition and follow through")
    if saturn["house"] in {6, 10, 11}:
        _apply(scores, reasons, "career", 4.0, "Saturn channels effort into long term output")
    if _count_house_occupants(positions, {2, 11}, {"Venus", "Jupiter", "Sun", "Mercury"}) >= 2:
        _apply(scores, reasons, "wealth", 5.0, "Money houses carry helpful emphasis")
    if _count_house_occupants(positions, {6, 8, 12}, {"Saturn", "Mars", "Pluto"}) >= 2:
        _apply(scores, reasons, "health", -6.0, "Stress houses are loaded with heavier planets")
    if dominance["dominant_element"] == "Air":
        _apply(scores, reasons, "career", 3.0, "Air emphasis supports strategy and communication")
    if dominance["dominant_element"] == "Water":
        _apply(scores, reasons, "love", 3.0, "Water emphasis increases empathy and bonding")
        _apply(scores, reasons, "mood", 2.0, "Water emphasis boosts intuition")
    if dominance["dominant_element"] == "Fire":
        _apply(scores, reasons, "career", 2.0, "Fire emphasis adds initiative")
        _apply(scores, reasons, "health", 1.5, "Fire emphasis increases vitality")
    if dominance["dominant_element"] == "Earth":
        _apply(scores, reasons, "wealth", 3.0, "Earth emphasis stabilizes material planning")
        _apply(scores, reasons, "health", 2.0, "Earth emphasis supports consistency")

    # Natal aspects.
    for aspect in aspects:
        pair = {aspect["a"], aspect["b"]}
        soft = aspect["name"] in SOFT_ASPECTS
        hard = aspect["name"] in HARD_ASPECTS
        orb_multiplier = max(0.6, 1.0 - aspect["orb"] / 8.0)
        if pair == {"Venus", "Jupiter"} and soft:
            _apply(scores, reasons, "love", 5.0 * orb_multiplier, "Venus/Jupiter aspect sweetens relationships")
            _apply(scores, reasons, "wealth", 3.0 * orb_multiplier, "Venus/Jupiter aspect improves ease and attraction")
        if pair == {"Moon", "Venus"} and soft:
            _apply(scores, reasons, "love", 4.0 * orb_multiplier, "Moon/Venus soft aspect improves affection flow")
            _apply(scores, reasons, "mood", 4.5 * orb_multiplier, "Moon/Venus soft aspect softens emotional tone")
        if pair == {"Sun", "Jupiter"} and soft:
            _apply(scores, reasons, "career", 4.0 * orb_multiplier, "Sun/Jupiter aspect supports confidence and reach")
        if pair == {"Sun", "Saturn"} and soft:
            _apply(scores, reasons, "career", 3.5 * orb_multiplier, "Sun/Saturn soft aspect supports structure")
        if pair == {"Venus", "Saturn"} and hard:
            _apply(scores, reasons, "love", -5.0 * orb_multiplier, "Venus/Saturn hard aspect can cool warmth")
        if pair == {"Moon", "Saturn"} and hard:
            _apply(scores, reasons, "mood", -5.0 * orb_multiplier, "Moon/Saturn hard aspect can feel heavy")
        if pair == {"Moon", "Mars"} and hard:
            _apply(scores, reasons, "mood", -4.0 * orb_multiplier, "Moon/Mars hard aspect raises reactivity")
            _apply(scores, reasons, "health", -2.5 * orb_multiplier, "Moon/Mars hard aspect can increase stress")
        if pair == {"Sun", "Mars"} and hard:
            _apply(scores, reasons, "health", -3.0 * orb_multiplier, "Sun/Mars hard aspect can overheat pace")
        if pair == {"Jupiter", "Saturn"} and soft:
            _apply(scores, reasons, "career", 3.0 * orb_multiplier, "Jupiter/Saturn soft aspect balances growth and discipline")
        if pair == {"Mercury", "Jupiter"} and soft:
            _apply(scores, reasons, "career", 2.5 * orb_multiplier, "Mercury/Jupiter soft aspect helps judgment")
            _apply(scores, reasons, "wealth", 2.0 * orb_multiplier, "Mercury/Jupiter soft aspect improves opportunity reading")

    # Current transits.
    for aspect in transit_aspects:
        soft = aspect["name"] in SOFT_ASPECTS
        hard = aspect["name"] in HARD_ASPECTS
        orb_multiplier = max(0.5, 1.0 - aspect["orb"] / 4.0)
        if aspect["transit"] in {"Venus", "Jupiter"} and aspect["natal"] in {"Sun", "Moon", "Venus"} and soft:
            _apply(scores, reasons, "love", 3.5 * orb_multiplier, f"Helpful {aspect['transit']} transit to natal {aspect['natal']}")
            _apply(scores, reasons, "mood", 2.5 * orb_multiplier, f"Helpful {aspect['transit']} transit brightens the day")
        if aspect["transit"] == "Jupiter" and aspect["natal"] in {"Midheaven", "Sun"} and soft:
            _apply(scores, reasons, "career", 3.0 * orb_multiplier, "Jupiter transit expands visibility")
            _apply(scores, reasons, "wealth", 2.5 * orb_multiplier, "Jupiter transit opens material options")
        if aspect["transit"] == "Saturn" and aspect["natal"] in {"Moon", "Venus", "Sun"} and hard:
            _apply(scores, reasons, "mood", -3.5 * orb_multiplier, "Saturn transit slows the emotional climate")
            _apply(scores, reasons, "love", -2.0 * orb_multiplier, "Saturn transit asks for relational maturity")
        if aspect["transit"] == "Mars" and aspect["natal"] in {"Moon", "Ascendant"} and hard:
            _apply(scores, reasons, "health", -3.5 * orb_multiplier, "Mars transit raises friction and fatigue risk")
            _apply(scores, reasons, "mood", -2.5 * orb_multiplier, "Mars transit shortens patience")
        if aspect["transit"] == "Sun" and aspect["natal"] == "Midheaven" and soft:
            _apply(scores, reasons, "career", 1.5 * orb_multiplier, "Transit Sun spotlights career focus")

    return ({key: round2(clamp(value, 5, 95)) for key, value in scores.items()}, reasons)


def calculate(context: dict[str, Any]) -> dict[str, Any]:
    chart = calculate_planetary_positions(context["jd_ut"], context["latitude"], context["longitude"], sidereal=False)
    positions = chart["positions"]
    aspects = find_aspects(positions, ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"])

    transit_chart = calculate_planetary_positions(
        context["current_jd_ut"],
        context["latitude"],
        context["longitude"],
        sidereal=False,
    )
    transit_positions = transit_chart["positions"]
    transit_aspects = _find_transit_aspects(transit_positions, positions)
    dominance = dominant_element_modality(positions)

    scores, reason_map = _score_chart(positions, aspects, transit_aspects, dominance)

    sun = positions["Sun"]
    moon = positions["Moon"]
    asc = positions["Ascendant"]
    venus = positions["Venus"]
    mars = positions["Mars"]
    mc = positions["Midheaven"]

    element_counts = Counter(SIGN_ELEMENTS[positions[name]["sign"]] for name in ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Ascendant"])
    modality_counts = Counter(SIGN_MODALITIES[positions[name]["sign"]] for name in ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Ascendant"])

    summary = [
        f"Your western chart is anchored by a {sun['sign']} Sun, {moon['sign']} Moon, and {asc['sign']} Ascendant.",
        f"This points to a core style that is {SUN_SIGN_THEMES[sun['sign']]}, while emotionally {MOON_SIGN_THEMES[moon['sign']]}",
        f"You tend to project yourself through a {asc['sign']} rising lens, so {ASCENDANT_THEMES[asc['sign']]}. The chart leans {dominance['dominant_element']} and {dominance['dominant_modality']}, which colors how you move through relationships, work, and stress.",
    ]

    highlights = [
        highlight("Sun", f"{sun['sign']} {sun['degree_in_sign']:.2f}d in House {sun['house']}"),
        highlight("Moon", f"{moon['sign']} {moon['degree_in_sign']:.2f}d in House {moon['house']}"),
        highlight("Ascendant", f"{asc['sign']} {asc['degree_in_sign']:.2f}d"),
        highlight("Midheaven", f"{mc['sign']} {mc['degree_in_sign']:.2f}d"),
        highlight("Venus", f"{venus['sign']} in House {venus['house']}"),
        highlight("Mars", f"{mars['sign']} in House {mars['house']}"),
        highlight("Dominant element", dominance["dominant_element"]),
        highlight("Dominant modality", dominance["dominant_modality"]),
    ]

    planetary_rows = [_format_planet_row(name, positions[name]) for name in [
        "Sun",
        "Moon",
        "Mercury",
        "Venus",
        "Mars",
        "Jupiter",
        "Saturn",
        "Uranus",
        "Neptune",
        "Pluto",
        "North Node",
    ]]

    aspect_rows = [[item["between"], item["name"], f"{item['distance']:.2f}d", f"{item['orb']:.2f}d"] for item in aspects[:18]]
    transit_rows = [
        [
            item["transit"],
            item["name"],
            item["natal"],
            f"{item['distance']:.2f}d",
            f"{item['orb']:.2f}d",
        ]
        for item in transit_aspects
    ]

    driver_rows: list[list[Any]] = []
    for category in ["love", "career", "health", "wealth", "mood"]:
        for line in reason_map[category][:6]:
            driver_rows.append([category.title(), line])

    # Build enriched relationships text linking Venus/Mars to the love score.
    venus_condition = planet_condition("Venus", venus["sign"])
    venus_desc = f"Venus in {venus['sign']} in House {venus['house']}"
    if venus_condition == "Domicile":
        venus_desc += f" (in its own sign)"
    elif venus_condition == "Exalted":
        venus_desc += f" (exalted)"
    elif venus_condition == "Debilitated":
        venus_desc += f" (in detriment)"
    love_score = scores["love"]
    relationships_text = (
        f"With {venus_desc}, your love nature is "
        + ("deeply romantic and idealistic" if venus["sign"] in {"Pisces", "Libra", "Taurus"} else
           "intense and transformative" if venus["sign"] in {"Scorpio", "Aries"} else
           "expressive and warm" if venus["sign"] in {"Leo", "Sagittarius"} else
           "practical and grounded" if venus["sign"] in {"Virgo", "Capricorn"} else
           "intellectually curious and socially versatile" if venus["sign"] in {"Gemini", "Aquarius"} else
           "nurturing and protective")
        + f" — this is why your Love score sits at {love_score}%. "
        f"Mars in {mars['sign']} in House {mars['house']} shows how you pursue desire and assert boundaries, "
        + ("with directness and fire" if mars["sign"] in {"Aries", "Scorpio", "Capricorn"} else
           "with patience and strategy" if mars["sign"] in {"Taurus", "Virgo", "Libra"} else
           "with emotional intuition" if mars["sign"] in {"Cancer", "Pisces"} else
           "with adaptability and quick thinking")
        + "."
    )

    # Build enriched current sky text with specific transit descriptions.
    transit_descriptions = []
    aspect_label_map = {
        "Conjunction": "conjunct",
        "Sextile": "sextile",
        "Trine": "trine",
        "Square": "square",
        "Opposition": "opposite",
        "Quincunx": "quincunx",
    }
    transit_effect_map = {
        ("Jupiter", "Sun"): "expanding your sense of self and confidence",
        ("Jupiter", "Moon"): "nurturing emotional optimism and generosity",
        ("Jupiter", "Venus"): "amplifying attraction, social warmth, and pleasure",
        ("Jupiter", "Mars"): "fueling ambition and bold action",
        ("Jupiter", "Midheaven"): "opening doors for career visibility and growth",
        ("Jupiter", "Ascendant"): "boosting your public presence and personal magnetism",
        ("Saturn", "Sun"): "testing your discipline and long-term commitments",
        ("Saturn", "Moon"): "asking for emotional maturity and patience",
        ("Saturn", "Venus"): "challenging you to deepen relational commitment",
        ("Saturn", "Mars"): "requiring measured effort rather than impulsive action",
        ("Saturn", "Midheaven"): "restructuring your professional direction",
        ("Saturn", "Ascendant"): "prompting serious self-reflection",
        ("Venus", "Sun"): "brightening your self-expression and social charm",
        ("Venus", "Moon"): "softening emotional exchanges and daily mood",
        ("Venus", "Venus"): "heightening your appreciation for beauty and connection",
        ("Venus", "Mars"): "stirring romantic attraction and creative drive",
        ("Mars", "Sun"): "energizing your willpower and drive",
        ("Mars", "Moon"): "intensifying emotional reactions and instincts",
        ("Mars", "Venus"): "sparking passion and desire",
        ("Mars", "Ascendant"): "pushing you toward assertive self-expression",
        ("Sun", "Midheaven"): "spotlighting your career and public reputation",
        ("Sun", "Ascendant"): "illuminating your personal identity today",
        ("Moon", "Sun"): "connecting your inner feelings with your outward goals",
        ("Moon", "Moon"): "echoing your natal emotional patterns",
    }
    for ta in transit_aspects[:4]:
        aspect_word = aspect_label_map.get(ta["name"], ta["name"].lower())
        effect_key = (ta["transit"], ta["natal"])
        effect = transit_effect_map.get(effect_key, f"activating your natal {ta['natal']} themes")
        transit_descriptions.append(f"Transit {ta['transit']} {aspect_word} your natal {ta['natal']} is {effect}")
    if len(transit_descriptions) >= 2:
        current_sky_text = f"{transit_descriptions[0]}. {transit_descriptions[1]}. These are the strongest live contacts shaping your day."
    elif transit_descriptions:
        current_sky_text = f"{transit_descriptions[0]}. This is the most prominent transit contact active right now."
    else:
        current_sky_text = "No tight transit aspects are active today, so the sky is giving you a quieter window to work from your natal strengths."

    # Build element balance insight.
    element_traits = {
        "Fire": "driven by enthusiasm, initiative, and creative self-expression — you light up when you can lead and inspire",
        "Earth": "grounded in practicality, patience, and material results — you thrive when building something tangible",
        "Air": "oriented toward ideas, communication, and social connection — you excel when exchanging perspectives and strategizing",
        "Water": "guided by emotion, intuition, and empathy — you are strongest when trusting your inner compass and emotional intelligence",
    }
    modality_traits = {
        "Cardinal": "an initiating approach — you are a natural starter who thrives on launching new ventures and setting direction",
        "Fixed": "a persistent approach — you bring staying power, determination, and the ability to see things through to completion",
        "Mutable": "an adaptive approach — you are flexible, versatile, and skilled at adjusting to changing circumstances",
    }
    dom_element = dominance["dominant_element"]
    dom_modality = dominance["dominant_modality"]
    element_balance_text = (
        f"Your chart is dominated by {dom_element} energy with {dom_modality.lower()} momentum. "
        f"The {dom_element} emphasis means you are {element_traits.get(dom_element, 'a blend of multiple elemental qualities')}. "
        f"The {dom_modality} quality gives you {modality_traits.get(dom_modality, 'a balanced approach to starting and finishing')}."
    )

    insights = [
        insight(
            "Identity blend",
            f"The {sun['sign']} / {moon['sign']} / {asc['sign']} trio mixes willpower, feeling, and presentation in a way that makes you most effective when your outer pace matches your inner rhythm.",
        ),
        insight(
            "Relationships",
            relationships_text,
        ),
        insight(
            "Career focus",
            f"The Midheaven in {mc['sign']} and the Sun in House {sun['house']} point to how recognition, achievement, and contribution become visible in your public life.",
        ),
        insight(
            "Current sky",
            current_sky_text,
        ),
        insight(
            "Element balance",
            element_balance_text,
        ),
    ]

    return {
        "id": "western",
        "name": "Western Astrology",
        "headline": f"{sun['sign']} Sun, {moon['sign']} Moon, {asc['sign']} Rising",
        "summary": summary,
        "highlights": highlights,
        "scores": {key: {"value": value, "label": map_score_to_label(value)} for key, value in scores.items()},
        "insights": insights,
        "tables": [
            table("Planetary positions", ["Body", "Sign", "Degree", "House", "Motion", "Condition"], planetary_rows),
            table("House cusps", ["House", "Cusp"], _house_rows(chart["cusps"])),
            table("Major natal aspects", ["Pair", "Aspect", "Distance", "Orb"], aspect_rows),
            table("Current transit contacts", ["Transit", "Aspect", "Natal point", "Distance", "Orb"], transit_rows),
            table("Score drivers", ["Area", "Driver"], driver_rows),
        ],
        "meta": {
            "chart_type": "Tropical zodiac / Placidus houses",
            "element_counts": dict(element_counts),
            "modality_counts": dict(modality_counts),
            "context": current_context_snapshot(context),
        },
    }
