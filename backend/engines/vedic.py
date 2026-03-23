from __future__ import annotations

from datetime import timedelta
from typing import Any

from .common import (
    BAZI_BRANCHES,
    EXALTATION_SIGNS,
    SIGN_RULERS,
    VEDIC_NAKSHATRAS,
    VIMSHOTTARI_YEARS,
    calculate_planetary_positions,
    clamp,
    current_context_snapshot,
    highlight,
    house_quality,
    insight,
    map_score_to_label,
    planet_condition,
    round2,
    sexagenary_day_index,
    table,
)


BENEFICS = {"Jupiter", "Venus", "Moon", "Mercury"}
MALEFICS = {"Saturn", "Mars", "Rahu", "Ketu", "Sun"}
YOGA_NAMES = [
    "Vishkambha",
    "Priti",
    "Ayushman",
    "Saubhagya",
    "Shobhana",
    "Atiganda",
    "Sukarma",
    "Dhriti",
    "Shula",
    "Ganda",
    "Vriddhi",
    "Dhruva",
    "Vyaghata",
    "Harshana",
    "Vajra",
    "Siddhi",
    "Vyatipata",
    "Variyan",
    "Parigha",
    "Shiva",
    "Siddha",
    "Sadhya",
    "Shubha",
    "Shukla",
    "Brahma",
    "Indra",
    "Vaidhriti",
]

TITHI_BASE = [
    "Pratipada",
    "Dvitiya",
    "Tritiya",
    "Chaturthi",
    "Panchami",
    "Shashthi",
    "Saptami",
    "Ashtami",
    "Navami",
    "Dashami",
    "Ekadashi",
    "Dvadashi",
    "Trayodashi",
    "Chaturdashi",
    "Purnima",
]

SIGN_RULER_NAMES = {sign: ruler for sign, ruler in SIGN_RULERS.items()}


def _nakshatra(longitude: float) -> dict[str, Any]:
    segment = 360.0 / 27.0
    index = int(longitude // segment)
    pada = int((longitude % segment) // (segment / 4.0)) + 1
    name, ruler = VEDIC_NAKSHATRAS[index]
    return {"name": name, "ruler": ruler, "pada": pada, "index": index}


def _tithi(sun_longitude: float, moon_longitude: float) -> dict[str, Any]:
    phase = (moon_longitude - sun_longitude) % 360.0
    number = int(phase // 12.0) + 1
    paksha = "Shukla" if number <= 15 else "Krishna"
    base_index = (number - 1) % 15
    name = TITHI_BASE[base_index]
    if number == 30:
        name = "Amavasya"
    return {"number": number, "paksha": paksha, "name": name}


def _yoga(sun_longitude: float, moon_longitude: float) -> dict[str, Any]:
    value = (sun_longitude + moon_longitude) % 360.0
    number = int(value // (360.0 / 27.0))
    return {"name": YOGA_NAMES[number], "index": number + 1}


def _planet_dignity(name: str, sign: str) -> str:
    if sign in {"Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"}:
        if EXALTATION_SIGNS.get(name) == sign:
            return "Exalted"
    condition = planet_condition(name, sign)
    if condition == "Domicile":
        return "Own sign"
    if condition == "Debilitated":
        return "Debilitated"
    return "Neutral"


def _quality(positions: dict[str, Any], name: str) -> float:
    key = name
    if name == "Rahu":
        key = "North Node"
    elif name == "Ketu":
        key = "South Node"
    planet = positions[key]
    score = 0.0
    score += house_quality(planet["house"]) * 2.6
    dignity = _planet_dignity(name if name not in {"Rahu", "Ketu"} else "North Node", planet["sign"])
    if dignity == "Exalted":
        score += 8.0
    elif dignity == "Own sign":
        score += 6.0
    elif dignity == "Debilitated":
        score -= 7.0
    if name in {"Rahu", "Ketu"} and planet["house"] in {1, 5, 9, 10, 11}:
        score += 1.5
    return score


def _house_sign(asc_sign_index: int, house_number: int) -> str:
    return [
        "Aries",
        "Taurus",
        "Gemini",
        "Cancer",
        "Leo",
        "Virgo",
        "Libra",
        "Scorpio",
        "Sagittarius",
        "Capricorn",
        "Aquarius",
        "Pisces",
    ][(asc_sign_index + house_number - 1) % 12]


def _house_lords(asc_sign_index: int) -> dict[int, str]:
    return {house: SIGN_RULER_NAMES[_house_sign(asc_sign_index, house)] for house in range(1, 13)}


def _years_to_timedelta(years: float) -> timedelta:
    return timedelta(days=years * 365.2425)


def _build_vimshottari(moon_longitude: float, birth_dt, now_dt) -> dict[str, Any]:
    nak = _nakshatra(moon_longitude)
    sequence = list(VIMSHOTTARI_YEARS.keys())
    start_index = sequence.index(nak["ruler"])
    segment = 360.0 / 27.0
    fraction_used = (moon_longitude % segment) / segment
    cursor = birth_dt
    maha_periods = []

    first_lord = sequence[start_index]
    first_remaining_years = VIMSHOTTARI_YEARS[first_lord] * (1.0 - fraction_used)
    first_end = cursor + _years_to_timedelta(first_remaining_years)
    maha_periods.append({"lord": first_lord, "start": cursor, "end": first_end, "years": round2(first_remaining_years)})
    cursor = first_end

    for offset in range(1, 16):
        lord = sequence[(start_index + offset) % len(sequence)]
        years = VIMSHOTTARI_YEARS[lord]
        end = cursor + _years_to_timedelta(years)
        maha_periods.append({"lord": lord, "start": cursor, "end": end, "years": years})
        cursor = end
        if cursor > now_dt + timedelta(days=365.2425 * 30):
            break

    active = maha_periods[-1]
    for item in maha_periods:
        if item["start"] <= now_dt < item["end"]:
            active = item
            break

    maha_index = sequence.index(active["lord"])
    maha_duration_days = max((active["end"] - active["start"]).total_seconds() / 86400.0, 1.0)
    antardashas = []
    cursor = active["start"]
    for offset in range(len(sequence)):
        sub_lord = sequence[(maha_index + offset) % len(sequence)]
        proportion = VIMSHOTTARI_YEARS[sub_lord] / 120.0
        delta = timedelta(days=maha_duration_days * proportion)
        end = cursor + delta
        antardashas.append({"lord": sub_lord, "start": cursor, "end": end})
        cursor = end

    active_antar = antardashas[-1]
    for item in antardashas:
        if item["start"] <= now_dt < item["end"]:
            active_antar = item
            break

    def _serialize_period(period: dict[str, Any]) -> dict[str, Any]:
        return {**period, "start": period["start"].isoformat(), "end": period["end"].isoformat()}

    return {
        "nakshatra": nak,
        "maha_periods": [_serialize_period(p) for p in maha_periods[:10]],
        "current_maha": _serialize_period(active),
        "current_antar": _serialize_period(active_antar),
    }


def _gochara_house(natal_sign_index: int, current_sign_index: int) -> int:
    return ((current_sign_index - natal_sign_index) % 12) + 1


def _detect_yogas(positions: dict[str, Any], asc_sign_index: int, house_lords: dict[int, str]) -> list[str]:
    yogas: list[str] = []
    moon_house = positions["Moon"]["house"]
    jupiter_house = positions["Jupiter"]["house"]
    house_from_moon_to_jupiter = ((jupiter_house - moon_house) % 12) + 1
    if house_from_moon_to_jupiter in {1, 4, 7, 10}:
        yogas.append("Gajakesari Yoga")

    if positions["Sun"]["sign"] == positions["Mercury"]["sign"] and abs(positions["Sun"]["longitude"] - positions["Mercury"]["longitude"]) <= 14:
        yogas.append("Budha Aditya Yoga")

    if positions["Moon"]["sign"] == positions["Mars"]["sign"]:
        yogas.append("Chandra Mangala Yoga")

    ninth_lord = house_lords[9]
    tenth_lord = house_lords[10]
    if ninth_lord == tenth_lord or positions[ninth_lord]["sign"] == positions[tenth_lord]["sign"]:
        yogas.append("Raja Yoga signature")

    second_lord = house_lords[2]
    eleventh_lord = house_lords[11]
    if second_lord == eleventh_lord or positions[second_lord]["sign"] == positions[eleventh_lord]["sign"]:
        yogas.append("Dhana Yoga signature")

    return yogas


def _apply(score_map: dict[str, float], reasons: dict[str, list[str]], key: str, delta: float, reason: str) -> None:
    score_map[key] += delta
    sign = "+" if delta >= 0 else ""
    reasons[key].append(f"{sign}{delta:.1f}: {reason}")


def _score_chart(
    positions: dict[str, Any],
    current_positions: dict[str, Any],
    dasha: dict[str, Any],
    house_lords: dict[int, str],
    yogas: list[str],
) -> tuple[dict[str, float], dict[str, list[str]]]:
    scores = {"love": 50.0, "career": 50.0, "health": 50.0, "wealth": 50.0, "mood": 50.0}
    reasons = {key: [] for key in scores}

    asc_lord = house_lords[1]
    seventh_lord = house_lords[7]
    tenth_lord = house_lords[10]
    second_lord = house_lords[2]
    eleventh_lord = house_lords[11]

    _apply(scores, reasons, "health", _quality(positions, asc_lord) * 0.6, f"Lagna lord {asc_lord} shapes vitality")
    _apply(scores, reasons, "love", _quality(positions, seventh_lord) * 0.55, f"7th lord {seventh_lord} shapes relationship tone")
    _apply(scores, reasons, "love", _quality(positions, "Venus") * 0.45, "Venus sets relationship ease")
    _apply(scores, reasons, "career", _quality(positions, tenth_lord) * 0.65, f"10th lord {tenth_lord} shapes work direction")
    _apply(scores, reasons, "career", _quality(positions, "Saturn") * 0.35, "Saturn sets professional stamina")
    _apply(scores, reasons, "wealth", _quality(positions, second_lord) * 0.55, f"2nd lord {second_lord} shapes assets")
    _apply(scores, reasons, "wealth", _quality(positions, eleventh_lord) * 0.55, f"11th lord {eleventh_lord} shapes gains")
    _apply(scores, reasons, "wealth", _quality(positions, "Jupiter") * 0.35, "Jupiter shapes prosperity flow")
    _apply(scores, reasons, "mood", _quality(positions, "Moon") * 0.65, "Moon sets emotional baseline")

    if positions["Venus"]["house"] in {1, 5, 7, 11}:
        _apply(scores, reasons, "love", 5.0, "Venus occupies a supportive house")
    if positions[asc_lord]["house"] in {6, 8, 12}:
        _apply(scores, reasons, "health", -6.0, "Lagna lord is in a dusthana house")
    if positions[second_lord]["house"] in {2, 5, 9, 10, 11}:
        _apply(scores, reasons, "wealth", 4.5, "2nd lord sits in a constructive house")
    if positions[tenth_lord]["house"] in {1, 5, 9, 10, 11}:
        _apply(scores, reasons, "career", 5.0, "10th lord is well placed")
    if positions["Moon"]["house"] in {4, 5, 9}:
        _apply(scores, reasons, "mood", 4.0, "Moon is settled in a supportive house")
    if positions["Saturn"]["house"] in {6, 10, 11}:
        _apply(scores, reasons, "career", 3.0, "Saturn supports delayed but reliable output")
    if positions["Mars"]["house"] in {6, 8, 12}:
        _apply(scores, reasons, "health", -3.5, "Mars in a difficult house can raise strain")

    if "Gajakesari Yoga" in yogas:
        _apply(scores, reasons, "mood", 5.0, "Gajakesari Yoga supports resilience and optimism")
        _apply(scores, reasons, "wealth", 3.0, "Gajakesari Yoga can steady judgment and support")
    if "Budha Aditya Yoga" in yogas:
        _apply(scores, reasons, "career", 4.0, "Budha Aditya Yoga sharpens intellect and visibility")
    if "Dhana Yoga signature" in yogas:
        _apply(scores, reasons, "wealth", 5.0, "Dhana Yoga signature strengthens earning potential")
    if "Raja Yoga signature" in yogas:
        _apply(scores, reasons, "career", 5.0, "Raja Yoga signature supports status building")

    current_maha = dasha["current_maha"]["lord"]
    current_antar = dasha["current_antar"]["lord"]
    maha_quality = _quality(positions, current_maha)
    antar_quality = _quality(positions, current_antar)

    if current_maha in BENEFICS:
        _apply(scores, reasons, "mood", 3.0, f"Current mahadasha lord {current_maha} is benefic")
        _apply(scores, reasons, "love", 2.0, f"Current mahadasha lord {current_maha} softens tone")
    if current_maha in MALEFICS:
        _apply(scores, reasons, "health", -2.0, f"Current mahadasha lord {current_maha} demands discipline")
    _apply(scores, reasons, "career", maha_quality * 0.25, f"Current mahadasha lord {current_maha} colors the main life chapter")
    _apply(scores, reasons, "love", antar_quality * 0.2, f"Current antardasha lord {current_antar} shapes the present sub-cycle")
    _apply(scores, reasons, "wealth", antar_quality * 0.2, f"Current antardasha lord {current_antar} affects short term opportunities")

    natal_moon_sign_index = positions["Moon"]["sign_index"]
    moon_gochara = _gochara_house(natal_moon_sign_index, current_positions["Moon"]["sign_index"])
    jupiter_gochara = _gochara_house(natal_moon_sign_index, current_positions["Jupiter"]["sign_index"])
    saturn_gochara = _gochara_house(natal_moon_sign_index, current_positions["Saturn"]["sign_index"])

    if moon_gochara in {1, 3, 6, 7, 10, 11}:
        _apply(scores, reasons, "mood", 3.5, f"Moon transit from natal Moon sits in House {moon_gochara}")
    else:
        _apply(scores, reasons, "mood", -3.0, f"Moon transit from natal Moon sits in House {moon_gochara}")

    if jupiter_gochara in {2, 5, 7, 9, 11}:
        _apply(scores, reasons, "wealth", 4.0, f"Jupiter transit from natal Moon is favorable in House {jupiter_gochara}")
        _apply(scores, reasons, "career", 2.5, f"Jupiter transit from natal Moon supports expansion in House {jupiter_gochara}")
    else:
        _apply(scores, reasons, "wealth", -2.0, f"Jupiter transit from natal Moon is less generous in House {jupiter_gochara}")

    if saturn_gochara in {3, 6, 11}:
        _apply(scores, reasons, "career", 2.0, f"Saturn transit from natal Moon is constructive in House {saturn_gochara}")
    else:
        _apply(scores, reasons, "health", -2.5, f"Saturn transit from natal Moon adds pressure from House {saturn_gochara}")
        _apply(scores, reasons, "mood", -2.0, f"Saturn transit from natal Moon feels weightier in House {saturn_gochara}")

    return ({key: round2(clamp(value, 5, 95)) for key, value in scores.items()}, reasons)


def calculate(context: dict[str, Any]) -> dict[str, Any]:
    chart = calculate_planetary_positions(
        context["jd_ut"],
        context["latitude"],
        context["longitude"],
        sidereal=True,
        whole_sign=True,
    )
    positions = chart["positions"]
    asc_sign_index = positions["Ascendant"]["sign_index"]
    house_lords = _house_lords(asc_sign_index)

    current_chart = calculate_planetary_positions(
        context["current_jd_ut"],
        context["latitude"],
        context["longitude"],
        sidereal=True,
        whole_sign=True,
    )
    current_positions = current_chart["positions"]

    moon_nak = _nakshatra(positions["Moon"]["longitude"])
    asc_nak = _nakshatra(positions["Ascendant"]["longitude"])
    tithi = _tithi(positions["Sun"]["longitude"], positions["Moon"]["longitude"])
    yoga = _yoga(positions["Sun"]["longitude"], positions["Moon"]["longitude"])
    dasha = _build_vimshottari(positions["Moon"]["longitude"], context["birth_local"], context["now_local"])
    yogas = _detect_yogas(positions, asc_sign_index, house_lords)
    scores, reason_map = _score_chart(positions, current_positions, dasha, house_lords, yogas)

    planet_rows = []
    for name in ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "North Node", "South Node"]:
        nak = _nakshatra(positions[name]["longitude"])
        label_name = "Rahu" if name == "North Node" else "Ketu" if name == "South Node" else name
        planet_rows.append(
            [
                label_name,
                positions[name]["sign"],
                f"{positions[name]['degree_in_sign']:.2f}d",
                positions[name]["house"],
                f"{nak['name']} p{nak['pada']}",
                _planet_dignity(label_name, positions[name]["sign"]),
            ]
        )

    lord_rows = []
    for house, lord in house_lords.items():
        lord_rows.append([f"House {house}", _house_sign(asc_sign_index, house), lord, positions[lord]["house"]])

    panchanga_rows = [
        ["Lagna", positions["Ascendant"]["sign"], f"{asc_nak['name']} p{asc_nak['pada']}"],
        ["Moon nakshatra", moon_nak["name"], f"Ruler: {moon_nak['ruler']}"] ,
        ["Tithi", f"{tithi['paksha']} {tithi['name']}", f"Number {tithi['number']}"] ,
        ["Yoga", yoga["name"], f"Index {yoga['index']}"] ,
        ["Mahadasha", dasha['current_maha']['lord'], f"Until {dasha['current_maha']['end'][:10]}"] ,
        ["Antardasha", dasha['current_antar']['lord'], f"Until {dasha['current_antar']['end'][:10]}"] ,
    ]

    gochara_rows = [
        ["Moon", f"House {_gochara_house(positions['Moon']['sign_index'], current_positions['Moon']['sign_index'])} from natal Moon", current_positions["Moon"]["sign"]],
        ["Jupiter", f"House {_gochara_house(positions['Moon']['sign_index'], current_positions['Jupiter']['sign_index'])} from natal Moon", current_positions["Jupiter"]["sign"]],
        ["Saturn", f"House {_gochara_house(positions['Moon']['sign_index'], current_positions['Saturn']['sign_index'])} from natal Moon", current_positions["Saturn"]["sign"]],
    ]

    driver_rows = []
    for category in ["love", "career", "health", "wealth", "mood"]:
        for line in reason_map[category][:6]:
            driver_rows.append([category.title(), line])

    asc_sign = positions["Ascendant"]["sign"]
    moon_sign = positions["Moon"]["sign"]

    summary = [
        f"Your Vedic chart is read in the Lahiri sidereal zodiac with whole sign houses. The ascendant falls in {asc_sign}, so the life path begins through the lens of {house_lords[1]} as lagna lord.",
        f"The Moon is in {moon_sign} in {moon_nak['name']} pada {moon_nak['pada']}, which often colors emotional processing, habit patterns, and how the mind receives experience.",
        f"The current Vimshottari flow is {dasha['current_maha']['lord']} mahadasha with {dasha['current_antar']['lord']} antardasha. That timing layer strongly influences the daily probabilities below.",
    ]

    highlights = [
        highlight("Lagna", f"{asc_sign} rising"),
        highlight("Moon nakshatra", f"{moon_nak['name']} p{moon_nak['pada']}"),
        highlight("Current mahadasha", dasha["current_maha"]["lord"]),
        highlight("Current antardasha", dasha["current_antar"]["lord"]),
        highlight("Tithi", f"{tithi['paksha']} {tithi['name']}"),
        highlight("Yoga", yoga["name"]),
        highlight("Lagna lord", house_lords[1]),
        highlight("Strong yogas", ", ".join(yogas) if yogas else "None highlighted"),
    ]

    insights = [
        insight("Mind and perception", f"Moon in {moon_sign} within {moon_nak['name']} often describes how you process feeling, memory, and instinctive responses."),
        insight("Chart lordship", f"With {house_lords[1]} ruling the lagna and {house_lords[10]} ruling the 10th house, health and career are especially tied to those planets' house placements and dignity."),
        insight("Timing", f"The active {dasha['current_maha']['lord']} / {dasha['current_antar']['lord']} period is treated here as the main timing backbone for current outlook scoring."),
        insight("Yogas", f"Detected yoga signatures: {', '.join(yogas) if yogas else 'none of the simplified signatures fired strongly in this chart'}.") ,
    ]

    return {
        "id": "vedic",
        "name": "Vedic Astrology",
        "headline": f"{asc_sign} Lagna with Moon in {moon_nak['name']}",
        "summary": summary,
        "highlights": highlights,
        "scores": {key: {"value": value, "label": map_score_to_label(value)} for key, value in scores.items()},
        "insights": insights,
        "tables": [
            table("Graha positions", ["Graha", "Rashi", "Degree", "House", "Nakshatra", "Dignity"], planet_rows),
            table("House lords", ["House", "Rashi", "Lord", "Lord house"], lord_rows),
            table("Panchanga and dasha", ["Factor", "Value", "Detail"], panchanga_rows),
            table("Current gochara from natal Moon", ["Transit", "Relative house", "Current sign"], gochara_rows),
            table("Score drivers", ["Area", "Driver"], driver_rows),
        ],
        "meta": {
            "chart_type": "Lahiri sidereal / whole sign houses",
            "ayanamsha": chart["ayanamsa"],
            "yogas": yogas,
            "context": current_context_snapshot(context),
            "reference_day_index": sexagenary_day_index(context["birth_local"]),
        },
    }
