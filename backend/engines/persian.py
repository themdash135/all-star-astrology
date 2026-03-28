from __future__ import annotations

from typing import Any

from .common import (
    ARABIC_LUNAR_MANSIONS,
    SIGN_ELEMENTS,
    SIGN_RULERS,
    TEMPERAMENTS,
    WEEKDAY_RULERS,
    calculate_planetary_positions,
    clamp,
    current_context_snapshot,
    highlight,
    house_quality,
    insight,
    map_score_to_label,
    planet_condition,
    round2,
    table,
    whole_sign_house,
)

TRADITIONAL_PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"]

TEMPERAMENT_DESCRIPTIONS: dict[str, str] = {
    "Choleric": (
        "Bold, decisive, and action-oriented. You process the world through challenge "
        "and conquest, excelling when there is a clear target. Your health benefits "
        "from cool, moist foods and calming environments. Watch for impatience, "
        "overwork, and inflammatory conditions — your fire burns hot and needs "
        "deliberate rest to avoid burnout."
    ),
    "Sanguine": (
        "Warm, sociable, and optimistic. You process the world through connection "
        "and shared experience, thriving in collaborative and lively settings. "
        "Your health benefits from light, dry foods and regular movement. Watch for "
        "overcommitment and scattered energy — your enthusiasm can stretch you thin "
        "if you don't protect your boundaries."
    ),
    "Melancholic": (
        "Analytical, detail-oriented, and deeply thoughtful. You process the world "
        "carefully and need routine and structure to thrive. Your health benefits "
        "from warm, moist foods and environments. Watch for overthinking and "
        "isolation — your depth is a gift, but it needs social warmth and physical "
        "movement to stay in balance."
    ),
    "Phlegmatic": (
        "Steady, patient, and deeply resilient. You process the world through "
        "careful observation and move at a deliberate pace that others often "
        "underestimate. Your health benefits from warm, dry foods and stimulating "
        "activity. Watch for inertia and emotional suppression — your calm exterior "
        "can mask needs that deserve attention."
    ),
}

MANSION_DESCRIPTIONS: dict[str, str] = {
    "Al Sharatain": "The Two Signs — a mansion of bold beginnings, courage, and the first spark of initiative. Favors starting new ventures.",
    "Al Butain": "The Little Belly — a mansion of hidden riches, patience, and finding treasure where others overlook. Good for research and discovery.",
    "Al Thurayya": "The Pleiades — a mansion of luminous gatherings, abundance, and social elevation. Favors networking and public appearances.",
    "Al Dabaran": "The Follower — a mansion of pursuit, determination, and relentless focus on a goal. Favors building wealth and destroying obstacles.",
    "Al Haqah": "The Mark — a mansion of study, learning, and the transmission of knowledge. Favors education, writing, and teaching.",
    "Al Hanah": "The Brand — a mansion of recognition, reputation, and being marked for greatness. Favors career advancement and fame.",
    "Al Dhira": "The Forearm — a mansion of commerce, trade, and practical exchange. Favors deals, negotiations, and financial transactions.",
    "Al Nathrah": "The Gap — a mansion of nurturing, protection, and emotional shelter. Favors family matters, healing, and domestic peace.",
    "Al Tarf": "The Glance — a mansion of perception, quick judgment, and the ability to read situations instantly. Favors intuitive decisions.",
    "Al Jabhah": "The Forehead — a mansion of authority, command, and public victory. Favors leadership decisions and asserting dominance.",
    "Al Zubrah": "The Mane — a mansion of pride, loyalty, and regal bearing. Favors building alliances and earning respect.",
    "Al Sarfah": "The Changer — a mansion of transformation, weather shifts, and turning points. Favors letting go of the old to make room for the new.",
    "Al Awwa": "The Barker — a mansion of communication, honest speech, and calling things by their true name. Favors negotiations and truth-telling.",
    "Al Simak": "The Unarmed One — a mansion of peace, diplomacy, and defenseless openness. Favors partnerships, romance, and acts of trust.",
    "Al Ghafr": "The Cover — a mansion of concealment, strategy, and keeping counsel. Favors privacy, secrecy, and behind-the-scenes work.",
    "Al Zubana": "The Claws — a mansion of balance, justice, and weighing outcomes. Favors legal matters, contracts, and moral decisions.",
    "Al Iklil": "The Crown — a mansion of honor, elevation, and crowning achievement. Favors ceremonies, promotions, and public recognition.",
    "Al Qalb": "The Heart — a mansion of passion, courage, and the burning center. Favors bold romantic gestures and acts of personal bravery.",
    "Al Shaula": "The Sting — a mansion of danger, testing, and sharp transformation. Requires caution but rewards those who face difficulty honestly.",
    "Al Naaim": "The Ostriches — a mansion of swiftness, adaptability, and resourceful movement. Favors travel, quick decisions, and flexibility.",
    "Al Baldah": "The City — a mansion of civilization, community, and collective order. Favors civic engagement and working within institutions.",
    "Sad al Dhabih": "The Lucky Slaughterer — a mansion of sacrifice, release, and purposeful endings. Favors clearing debts and cutting losses wisely.",
    "Sad Bula": "The Good Luck of the Swallower — a mansion of absorption, healing, and quiet restoration. Favors recovery and consolidating gains.",
    "Sad al Suud": "The Luckiest of the Lucky — a mansion of supreme fortune, optimism, and doors that open effortlessly. Favors new starts and wish fulfillment.",
    "Sad al Akhbiyah": "The Lucky Star of Hidden Things — a mansion of buried treasure, revelation, and secrets that come to light for your benefit.",
    "Al Fargh al Muqaddam": "The Front Spout — a mansion of outpouring generosity, social connection, and the flow of resources toward you.",
    "Al Fargh al Muakhkhar": "The Rear Spout — governs endings that lead to new beginnings, a pouring out that makes space for fresh energy.",
    "Batn al Hut": "The Belly of the Fish — a mansion of deep intuition, dreams, and the unconscious wisdom that guides from below the surface.",
}

LOT_HOUSE_MEANINGS: dict[int, str] = {
    1: "self, body, and personal identity — your fortune or vocation is tied to who you are at your core",
    2: "personal resources, income, and self-worth — material comfort comes through what you own and earn directly",
    3: "communication, siblings, and local networks — growth comes through learning, writing, and nearby connections",
    4: "home, family, and roots — your deepest support comes from ancestry, property, and private foundations",
    5: "creativity, pleasure, and children — joy and luck flow through self-expression, romance, and generative acts",
    6: "service, health, and daily routines — fulfillment comes through discipline, helping others, and bodily care",
    7: "partnerships, marriage, and open rivals — your path is shaped by one-to-one commitments and collaborations",
    8: "shared resources, transformation, and others' money — power comes through merging assets and facing endings",
    9: "travel, philosophy, and higher learning — your greatest growth comes through broadening horizons and seeking meaning",
    10: "career, public reputation, and legacy — your highest calling plays out on the public stage",
    11: "community, friendships, and group endeavors — your greatest comfort comes through alliances and shared ideals",
    12: "solitude, hidden enemies, and spiritual retreat — wisdom comes through withdrawal, sacrifice, and unseen forces",
}


def _lot_of_fortune(asc: float, sun: float, moon: float, day_chart: bool) -> float:
    return (asc + moon - sun) % 360.0 if day_chart else (asc + sun - moon) % 360.0


def _lot_of_spirit(asc: float, sun: float, moon: float, day_chart: bool) -> float:
    return (asc + sun - moon) % 360.0 if day_chart else (asc + moon - sun) % 360.0


def _mansion(longitude: float) -> dict[str, Any]:
    size = 360.0 / 28.0
    index = int(longitude // size)
    return {"index": index + 1, "name": ARABIC_LUNAR_MANSIONS[index]}


def _temperament(positions: dict[str, Any]) -> dict[str, Any]:
    counts = {"hot": 0.0, "cold": 0.0, "dry": 0.0, "moist": 0.0}

    def add_element(element: str, weight: float) -> None:
        q1, q2 = TEMPERAMENTS[element]
        counts[q1] += weight
        counts[q2] += weight

    asc_sign = positions["Ascendant"]["sign"]
    add_element(SIGN_ELEMENTS[positions["Sun"]["sign"]], 2.0)
    add_element(SIGN_ELEMENTS[positions["Moon"]["sign"]], 2.0)
    add_element(SIGN_ELEMENTS[asc_sign], 3.0)
    chart_ruler = SIGN_RULERS[asc_sign]
    add_element(SIGN_ELEMENTS[positions[chart_ruler]["sign"]], 1.5)

    hot_cold = "hot" if counts["hot"] >= counts["cold"] else "cold"
    dry_moist = "dry" if counts["dry"] >= counts["moist"] else "moist"
    temperament = {
        ("hot", "dry"): "Choleric",
        ("hot", "moist"): "Sanguine",
        ("cold", "dry"): "Melancholic",
        ("cold", "moist"): "Phlegmatic",
    }[(hot_cold, dry_moist)]

    return {
        "counts": {key: round2(value) for key, value in counts.items()},
        "dominant": temperament,
        "chart_ruler": chart_ruler,
    }


def _quality(planet: dict[str, Any], name: str) -> float:
    score = house_quality(planet["house"]) * 2.8
    condition = planet_condition(name, planet["sign"])
    if condition == "Domicile":
        score += 6.0
    elif condition == "Exalted":
        score += 8.0
    elif condition == "Debilitated":
        score -= 7.0
    return score


def _apply(score_map: dict[str, float], reasons: dict[str, list[str]], key: str, delta: float, reason: str) -> None:
    score_map[key] += delta
    sign = "+" if delta >= 0 else ""
    reasons[key].append(f"{sign}{delta:.1f}: {reason}")


def calculate(context: dict[str, Any]) -> dict[str, Any]:
    chart = calculate_planetary_positions(
        context["jd_ut"],
        context["latitude"],
        context["longitude"],
        sidereal=False,
        traditional_only=True,
        whole_sign=True,
    )
    positions = chart["positions"]

    current_chart = calculate_planetary_positions(
        context["current_jd_ut"],
        context["latitude"],
        context["longitude"],
        sidereal=False,
        traditional_only=True,
        whole_sign=True,
    )
    current_positions = current_chart["positions"]

    asc = positions["Ascendant"]["longitude"]
    sun = positions["Sun"]["longitude"]
    moon = positions["Moon"]["longitude"]
    day_chart = positions["Sun"]["house"] in {7, 8, 9, 10, 11, 12}

    fortune = _lot_of_fortune(asc, sun, moon, day_chart)
    spirit = _lot_of_spirit(asc, sun, moon, day_chart)
    fortune_house = whole_sign_house(fortune, asc)
    spirit_house = whole_sign_house(spirit, asc)
    natal_mansion = _mansion(moon)
    current_mansion = _mansion(current_positions["Moon"]["longitude"])
    temperament = _temperament(positions)

    weekday_ruler = WEEKDAY_RULERS[context["now_local"].weekday()]
    asc_ruler = SIGN_RULERS[positions["Ascendant"]["sign"]]

    scores = {"love": 50.0, "career": 50.0, "health": 50.0, "wealth": 50.0, "mood": 50.0}
    reasons = {key: [] for key in scores}

    _apply(scores, reasons, "love", _quality(positions["Venus"], "Venus") * 0.6, "Venus shapes attraction and harmony")
    _apply(scores, reasons, "mood", _quality(positions["Moon"], "Moon") * 0.65, "Moon shapes emotional weather")
    _apply(scores, reasons, "career", _quality(positions["Sun"], "Sun") * 0.45, "Sun shapes visibility and purpose")
    _apply(scores, reasons, "career", _quality(positions["Mercury"], "Mercury") * 0.35, "Mercury shapes judgment and language")
    _apply(scores, reasons, "wealth", _quality(positions["Jupiter"], "Jupiter") * 0.55, "Jupiter shapes increase and patronage")
    _apply(scores, reasons, "health", _quality(positions[asc_ruler], asc_ruler) * 0.45, f"Ascendant ruler {asc_ruler} shapes bodily vitality")

    _apply(scores, reasons, "wealth", house_quality(fortune_house) * 3.0, f"Lot of Fortune falls in House {fortune_house}")
    _apply(scores, reasons, "career", house_quality(spirit_house) * 3.0, f"Lot of Spirit falls in House {spirit_house}")
    _apply(scores, reasons, "mood", house_quality(spirit_house) * 1.5, f"Lot of Spirit colors morale from House {spirit_house}")

    if positions["Venus"]["house"] in {1, 5, 7, 10, 11}:
        _apply(scores, reasons, "love", 5.0, "Venus is in a constructive whole-sign house")
    if positions["Jupiter"]["house"] in {2, 5, 9, 10, 11}:
        _apply(scores, reasons, "wealth", 4.5, "Jupiter occupies a supportive house")
    if positions["Saturn"]["house"] in {6, 8, 12}:
        _apply(scores, reasons, "health", -4.5, "Saturn occupies a difficult house")
        _apply(scores, reasons, "mood", -3.0, "Saturn occupies a difficult house")
    if positions["Mars"]["house"] in {6, 8, 12}:
        _apply(scores, reasons, "health", -3.5, "Mars occupies a difficult house")
    if positions[asc_ruler]["house"] in {1, 5, 9, 10, 11}:
        _apply(scores, reasons, "health", 3.5, f"Ascendant ruler {asc_ruler} is well placed")

    if weekday_ruler in {"Venus", "Jupiter"}:
        _apply(scores, reasons, "love", 3.0, f"Today's planetary day is ruled by {weekday_ruler}")
        _apply(scores, reasons, "wealth", 3.0, f"Today's planetary day is ruled by {weekday_ruler}")
    elif weekday_ruler == "Mercury":
        _apply(scores, reasons, "career", 3.0, "Mercury day supports communication and trading")
    elif weekday_ruler == "Sun":
        _apply(scores, reasons, "career", 2.0, "Sun day highlights reputation and visibility")
    elif weekday_ruler in {"Mars", "Saturn"}:
        _apply(scores, reasons, "health", -3.0, f"{weekday_ruler} day requires pacing and restraint")
        _apply(scores, reasons, "mood", -2.0, f"{weekday_ruler} day can feel sterner or sharper")

    if natal_mansion["index"] == current_mansion["index"]:
        _apply(scores, reasons, "mood", 2.5, "Current Moon returns to the natal lunar mansion")
        _apply(scores, reasons, "love", 1.5, "Current Moon repeats the natal lunar mansion tone")
    elif abs(natal_mansion["index"] - current_mansion["index"]) in {7, 14, 21}:
        _apply(scores, reasons, "mood", 1.5, "Current Moon forms a quarter-phase relation to the natal mansion")

    if temperament["dominant"] == "Choleric":
        _apply(scores, reasons, "career", 2.5, "Choleric temperament supports decisive action")
        _apply(scores, reasons, "health", -1.5, "Choleric temperament can overheat pace")
    elif temperament["dominant"] == "Sanguine":
        _apply(scores, reasons, "love", 2.5, "Sanguine temperament supports social warmth")
        _apply(scores, reasons, "mood", 2.0, "Sanguine temperament supports buoyancy")
    elif temperament["dominant"] == "Melancholic":
        _apply(scores, reasons, "wealth", 2.0, "Melancholic temperament supports planning and detail")
        _apply(scores, reasons, "mood", -1.5, "Melancholic temperament can brood")
    elif temperament["dominant"] == "Phlegmatic":
        _apply(scores, reasons, "health", 2.5, "Phlegmatic temperament favors recovery and steadiness")
        _apply(scores, reasons, "career", -1.0, "Phlegmatic temperament may move more slowly")

    scores = {key: round2(clamp(value, 5, 95)) for key, value in scores.items()}

    planet_rows = []
    for name in TRADITIONAL_PLANETS:
        planet_rows.append([
            name,
            positions[name]["sign"],
            f"{positions[name]['degree_in_sign']:.2f}d",
            positions[name]["house"],
            planet_condition(name, positions[name]["sign"]),
        ])

    lots_rows = [
        ["Sect", "Day" if day_chart else "Night", positions["Sun"]["house"]],
        ["Lot of Fortune", f"{fortune:.2f}d", f"House {fortune_house}"],
        ["Lot of Spirit", f"{spirit:.2f}d", f"House {spirit_house}"],
        ["Natal lunar mansion", natal_mansion["index"], natal_mansion["name"]],
        ["Current lunar mansion", current_mansion["index"], current_mansion["name"]],
    ]

    temperament_rows = [[key.title(), value] for key, value in temperament["counts"].items()]
    temperament_rows.append(["Dominant temperament", temperament["dominant"]])
    temperament_rows.append(["Chart ruler", temperament["chart_ruler"]])

    current_rows = [
        ["Weekday ruler", weekday_ruler, context["now_local"].strftime("%A")],
        ["Current Moon sign", current_positions["Moon"]["sign"], current_mansion["name"]],
        ["Current Sun sign", current_positions["Sun"]["sign"], current_positions["Sun"]["house"]],
    ]

    driver_rows = []
    for category in ["love", "career", "health", "wealth", "mood"]:
        for line in reasons[category][:6]:
            driver_rows.append([category.title(), line])

    summary = [
        f"This tab uses a traditional Persian and Islamic astrology frame: tropical zodiac, whole-sign houses, sect, lots, lunar mansions, and humoral temperament.",
        f"The chart is a {'day' if day_chart else 'night'} chart. The Moon is in the mansion {natal_mansion['name']}, and the dominant temperament is {temperament['dominant']}.",
        f"Daily scores combine natal condition with the current planetary day ruler ({weekday_ruler}) and the current Moon mansion ({current_mansion['name']}).",
    ]

    highlights = [
        highlight("Sect", "Day chart" if day_chart else "Night chart"),
        highlight("Ascendant", f"{positions['Ascendant']['sign']} rising"),
        highlight("Chart ruler", asc_ruler),
        highlight("Lot of Fortune", f"House {fortune_house}"),
        highlight("Lot of Spirit", f"House {spirit_house}"),
        highlight("Natal lunar mansion", natal_mansion["name"]),
        highlight("Current day ruler", weekday_ruler),
        highlight("Temperament", temperament["dominant"]),
    ]

    # Build rich sect explanation
    if day_chart:
        sect_explanation = (
            f"As a day chart (Sun in House {positions['Sun']['house']}), the Sun is "
            f"your most powerful ally. Solar themes — visibility, authority, vitality — "
            f"work in your favor. Plan important actions during daylight hours. "
            f"Jupiter also gains strength as the diurnal benefic, while Saturn operates "
            f"more constructively as the diurnal malefic, lending discipline without "
            f"excessive harshness."
        )
    else:
        sect_explanation = (
            f"As a night chart (Sun in House {positions['Sun']['house']}), the Moon is "
            f"your most powerful ally. Lunar themes — intuition, receptivity, emotional "
            f"intelligence — work in your favor. Trust your instincts and let important "
            f"decisions incubate overnight. Venus also gains strength as the nocturnal "
            f"benefic, while Mars operates more constructively as the nocturnal malefic, "
            f"lending drive without excessive aggression."
        )

    # Build rich lot interpretations
    fortune_meaning = LOT_HOUSE_MEANINGS.get(fortune_house, "a specialized area of life")
    spirit_meaning = LOT_HOUSE_MEANINGS.get(spirit_house, "a specialized area of life")

    natal_mansion_desc = MANSION_DESCRIPTIONS.get(natal_mansion["name"], "")
    current_mansion_desc = MANSION_DESCRIPTIONS.get(current_mansion["name"], "")
    temperament_desc = TEMPERAMENT_DESCRIPTIONS.get(temperament["dominant"], "")

    insights = [
        insight(
            "Sect",
            sect_explanation
        ),
        insight(
            "Lots",
            f"Lot of Fortune in House {fortune_house} suggests your greatest material "
            f"comfort comes through {fortune_meaning}. "
            f"Lot of Spirit in House {spirit_house} points to vocation rooted in "
            f"{spirit_meaning}. Together, these two lots map where worldly ease and "
            f"life purpose concentrate in your chart."
        ),
        insight(
            "Lunar mansions",
            f"The natal Moon is in {natal_mansion['name']}. {natal_mansion_desc} "
            f"The current Moon is in {current_mansion['name']}. {current_mansion_desc} "
            f"When the transiting Moon returns to your natal mansion or forms a "
            f"quarter-phase relation, emotional resonance heightens."
        ),
        insight(
            "Temperament",
            f"The dominant temperament is {temperament['dominant']}, derived from "
            f"Sun, Moon, Ascendant, and chart-ruler qualities. {temperament_desc} "
            f"This temperament shapes health tendencies, emotional weather, and the "
            f"natural pace at which you operate."
        ),
    ]

    return {
        "id": "persian",
        "name": "Persian / Islamic Astrology",
        "headline": f"{temperament['dominant']} temperament with {natal_mansion['name']} Moon mansion",
        "summary": summary,
        "highlights": highlights,
        "scores": {key: {"value": value, "label": map_score_to_label(value)} for key, value in scores.items()},
        "insights": insights,
        "tables": [
            table("Traditional planet positions", ["Planet", "Sign", "Degree", "House", "Condition"], planet_rows),
            table("Lots and mansions", ["Factor", "Value", "Detail"], lots_rows),
            table("Temperament profile", ["Quality", "Weight"], temperament_rows),
            table("Current cycle", ["Factor", "Value", "Detail"], current_rows),
            table("Score drivers", ["Area", "Driver"], driver_rows),
        ],
        "meta": {
            "engine_type": "Traditional tropical / whole-sign / sect-and-lots engine",
            "context": current_context_snapshot(context),
        },
    }
