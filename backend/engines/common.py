from __future__ import annotations

import math
import os
import re
import threading
from collections import Counter, OrderedDict
from datetime import date, datetime, time, timedelta, timezone
from functools import lru_cache
from typing import Any, Iterable
from zoneinfo import ZoneInfo

try:
    from geopy.geocoders import Nominatim
except ModuleNotFoundError:
    Nominatim = None

try:
    from timezonefinder import TimezoneFinder
except ModuleNotFoundError:
    TimezoneFinder = None

try:
    import swisseph as swe
    _SWISSEPH_AVAILABLE = True
except ModuleNotFoundError:
    _SWISSEPH_AVAILABLE = False

    class _MissingSwissEph:
        def set_ephe_path(self, *_args: Any, **_kwargs: Any) -> None:
            return None

        def __getattr__(self, name: str) -> Any:
            if name.isupper():
                return 0
            raise ModuleNotFoundError(
                "swisseph is required for astro chart calculations. Install the optional chart-building dependencies."
            )

    swe = _MissingSwissEph()

# Swiss Ephemeris will automatically fall back to the Moshier ephemeris for
# many calculations when data files are not available. We still point it at a
# configurable ephemeris directory so users can drop in the official files.
swe.set_ephe_path(os.getenv("SE_EPHE_PATH", "."))

SIDEREAL_LOCK = threading.Lock()
GEOLOCATOR = Nominatim(user_agent="astrofusion-platform/1.0") if Nominatim is not None else None
TZFINDER = TimezoneFinder() if TimezoneFinder is not None else None

SIGNS = [
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
]

SIGN_ELEMENTS = {
    "Aries": "Fire",
    "Taurus": "Earth",
    "Gemini": "Air",
    "Cancer": "Water",
    "Leo": "Fire",
    "Virgo": "Earth",
    "Libra": "Air",
    "Scorpio": "Water",
    "Sagittarius": "Fire",
    "Capricorn": "Earth",
    "Aquarius": "Air",
    "Pisces": "Water",
}

SIGN_MODALITIES = {
    "Aries": "Cardinal",
    "Cancer": "Cardinal",
    "Libra": "Cardinal",
    "Capricorn": "Cardinal",
    "Taurus": "Fixed",
    "Leo": "Fixed",
    "Scorpio": "Fixed",
    "Aquarius": "Fixed",
    "Gemini": "Mutable",
    "Virgo": "Mutable",
    "Sagittarius": "Mutable",
    "Pisces": "Mutable",
}

PLANET_IDS = OrderedDict(
    [
        ("Sun", swe.SUN),
        ("Moon", swe.MOON),
        ("Mercury", swe.MERCURY),
        ("Venus", swe.VENUS),
        ("Mars", swe.MARS),
        ("Jupiter", swe.JUPITER),
        ("Saturn", swe.SATURN),
        ("Uranus", swe.URANUS),
        ("Neptune", swe.NEPTUNE),
        ("Pluto", swe.PLUTO),
        ("North Node", swe.MEAN_NODE),
    ]
)

TRADITIONAL_PLANET_IDS = OrderedDict(
    [
        ("Sun", swe.SUN),
        ("Moon", swe.MOON),
        ("Mercury", swe.MERCURY),
        ("Venus", swe.VENUS),
        ("Mars", swe.MARS),
        ("Jupiter", swe.JUPITER),
        ("Saturn", swe.SATURN),
    ]
)

SIGN_RULERS = {
    "Aries": "Mars",
    "Taurus": "Venus",
    "Gemini": "Mercury",
    "Cancer": "Moon",
    "Leo": "Sun",
    "Virgo": "Mercury",
    "Libra": "Venus",
    "Scorpio": "Mars",
    "Sagittarius": "Jupiter",
    "Capricorn": "Saturn",
    "Aquarius": "Saturn",
    "Pisces": "Jupiter",
}

PLANET_ELEMENTS = {
    "Sun": "Fire",
    "Moon": "Water",
    "Mercury": "Air",
    "Venus": "Water",
    "Mars": "Fire",
    "Jupiter": "Air",
    "Saturn": "Earth",
    "Uranus": "Air",
    "Neptune": "Water",
    "Pluto": "Water",
    "North Node": "Air",
    "Ketu": "Fire",
}

DOMICILE_SIGNS = {
    "Sun": {"Leo"},
    "Moon": {"Cancer"},
    "Mercury": {"Gemini", "Virgo"},
    "Venus": {"Taurus", "Libra"},
    "Mars": {"Aries", "Scorpio"},
    "Jupiter": {"Sagittarius", "Pisces"},
    "Saturn": {"Capricorn", "Aquarius"},
    "Uranus": {"Aquarius"},
    "Neptune": {"Pisces"},
    "Pluto": {"Scorpio"},
}

EXALTATION_SIGNS = {
    "Sun": "Aries",
    "Moon": "Taurus",
    "Mercury": "Virgo",
    "Venus": "Pisces",
    "Mars": "Capricorn",
    "Jupiter": "Cancer",
    "Saturn": "Libra",
}

DEBILITATION_SIGNS = {
    "Sun": "Libra",
    "Moon": "Scorpio",
    "Mercury": "Pisces",
    "Venus": "Virgo",
    "Mars": "Cancer",
    "Jupiter": "Capricorn",
    "Saturn": "Aries",
}

ASPECT_DEFS = [
    ("Conjunction", 0, 8.0),
    ("Sextile", 60, 4.0),
    ("Square", 90, 6.0),
    ("Trine", 120, 6.0),
    ("Quincunx", 150, 3.0),
    ("Opposition", 180, 8.0),
]

SUN_SIGN_THEMES = {
    "Aries": "direct, courageous, and inclined to initiate",
    "Taurus": "steady, grounded, and comfort oriented",
    "Gemini": "curious, adaptable, and mentally fast",
    "Cancer": "protective, intuitive, and emotionally receptive",
    "Leo": "radiant, expressive, and recognition seeking",
    "Virgo": "precise, service driven, and improvement focused",
    "Libra": "harmonizing, social, and fairness minded",
    "Scorpio": "intense, perceptive, and transformative",
    "Sagittarius": "optimistic, exploratory, and meaning seeking",
    "Capricorn": "strategic, disciplined, and long range focused",
    "Aquarius": "independent, future minded, and systems oriented",
    "Pisces": "imaginative, empathic, and fluid",
}

MOON_SIGN_THEMES = {
    "Aries": "emotions move quickly and prefer straightforward release",
    "Taurus": "emotions stabilize through comfort, rhythm, and loyalty",
    "Gemini": "emotions process through talking, learning, and variety",
    "Cancer": "emotions are deep, memory rich, and protective",
    "Leo": "emotions want warmth, pride, and wholehearted expression",
    "Virgo": "emotions seek order, practical care, and useful routines",
    "Libra": "emotions seek equilibrium, beauty, and relational repair",
    "Scorpio": "emotions are private, intense, and all or nothing",
    "Sagittarius": "emotions recover through perspective and movement",
    "Capricorn": "emotions are measured, controlled, and duty shaped",
    "Aquarius": "emotions are filtered through ideals, objectivity, and space",
    "Pisces": "emotions are porous, imaginative, and deeply sensitive",
}

ASCENDANT_THEMES = {
    "Aries": "you meet life head on and prefer quick action",
    "Taurus": "you project calm endurance and dependable pacing",
    "Gemini": "you present as alert, communicative, and versatile",
    "Cancer": "you meet the world cautiously, intuitively, and protectively",
    "Leo": "you project confidence, warmth, and creative presence",
    "Virgo": "you come across as thoughtful, practical, and observant",
    "Libra": "you project diplomacy, style, and social intelligence",
    "Scorpio": "you appear focused, guarded, and magnetically intense",
    "Sagittarius": "you present as adventurous, candid, and possibility oriented",
    "Capricorn": "you project seriousness, purpose, and composure",
    "Aquarius": "you come across as original, detached, and future minded",
    "Pisces": "you project softness, intuition, and permeability",
}

VEDIC_NAKSHATRAS = [
    ("Ashwini", "Ketu"),
    ("Bharani", "Venus"),
    ("Krittika", "Sun"),
    ("Rohini", "Moon"),
    ("Mrigashira", "Mars"),
    ("Ardra", "Rahu"),
    ("Punarvasu", "Jupiter"),
    ("Pushya", "Saturn"),
    ("Ashlesha", "Mercury"),
    ("Magha", "Ketu"),
    ("Purva Phalguni", "Venus"),
    ("Uttara Phalguni", "Sun"),
    ("Hasta", "Moon"),
    ("Chitra", "Mars"),
    ("Swati", "Rahu"),
    ("Vishakha", "Jupiter"),
    ("Anuradha", "Saturn"),
    ("Jyeshtha", "Mercury"),
    ("Mula", "Ketu"),
    ("Purva Ashadha", "Venus"),
    ("Uttara Ashadha", "Sun"),
    ("Shravana", "Moon"),
    ("Dhanishta", "Mars"),
    ("Shatabhisha", "Rahu"),
    ("Purva Bhadrapada", "Jupiter"),
    ("Uttara Bhadrapada", "Saturn"),
    ("Revati", "Mercury"),
]

VIMSHOTTARI_YEARS = {
    "Ketu": 7,
    "Venus": 20,
    "Sun": 6,
    "Moon": 10,
    "Mars": 7,
    "Rahu": 18,
    "Jupiter": 16,
    "Saturn": 19,
    "Mercury": 17,
}

CHINESE_ANIMALS = [
    "Rat",
    "Ox",
    "Tiger",
    "Rabbit",
    "Dragon",
    "Snake",
    "Horse",
    "Goat",
    "Monkey",
    "Rooster",
    "Dog",
    "Pig",
]

CHINESE_ELEMENTS = ["Wood", "Wood", "Fire", "Fire", "Earth", "Earth", "Metal", "Metal", "Water", "Water"]

CHINESE_TRINES = [
    {"Rat", "Dragon", "Monkey"},
    {"Ox", "Snake", "Rooster"},
    {"Tiger", "Horse", "Dog"},
    {"Rabbit", "Goat", "Pig"},
]

CHINESE_SECRET_FRIENDS = {
    "Rat": "Ox",
    "Ox": "Rat",
    "Tiger": "Pig",
    "Rabbit": "Dog",
    "Dragon": "Rooster",
    "Snake": "Monkey",
    "Horse": "Goat",
    "Goat": "Horse",
    "Monkey": "Snake",
    "Rooster": "Dragon",
    "Dog": "Rabbit",
    "Pig": "Tiger",
}

BAZI_STEMS = [
    ("Jia", "Wood", "Yang"),
    ("Yi", "Wood", "Yin"),
    ("Bing", "Fire", "Yang"),
    ("Ding", "Fire", "Yin"),
    ("Wu", "Earth", "Yang"),
    ("Ji", "Earth", "Yin"),
    ("Geng", "Metal", "Yang"),
    ("Xin", "Metal", "Yin"),
    ("Ren", "Water", "Yang"),
    ("Gui", "Water", "Yin"),
]

BAZI_BRANCHES = [
    ("Zi", "Rat", "Water"),
    ("Chou", "Ox", "Earth"),
    ("Yin", "Tiger", "Wood"),
    ("Mao", "Rabbit", "Wood"),
    ("Chen", "Dragon", "Earth"),
    ("Si", "Snake", "Fire"),
    ("Wu", "Horse", "Fire"),
    ("Wei", "Goat", "Earth"),
    ("Shen", "Monkey", "Metal"),
    ("You", "Rooster", "Metal"),
    ("Xu", "Dog", "Earth"),
    ("Hai", "Pig", "Water"),
]

BAZI_HIDDEN_STEMS = {
    "Zi": [("Gui", 1.0)],
    "Chou": [("Ji", 1.0), ("Gui", 0.6), ("Xin", 0.4)],
    "Yin": [("Jia", 1.0), ("Bing", 0.7), ("Wu", 0.4)],
    "Mao": [("Yi", 1.0)],
    "Chen": [("Wu", 1.0), ("Yi", 0.5), ("Gui", 0.4)],
    "Si": [("Bing", 1.0), ("Geng", 0.6), ("Wu", 0.4)],
    "Wu": [("Ding", 1.0), ("Ji", 0.5)],
    "Wei": [("Ji", 1.0), ("Ding", 0.6), ("Yi", 0.4)],
    "Shen": [("Geng", 1.0), ("Ren", 0.6), ("Wu", 0.4)],
    "You": [("Xin", 1.0)],
    "Xu": [("Wu", 1.0), ("Xin", 0.6), ("Ding", 0.4)],
    "Hai": [("Ren", 1.0), ("Jia", 0.6)],
}

ARABIC_LUNAR_MANSIONS = [
    "Al Sharatain",
    "Al Butain",
    "Al Thurayya",
    "Al Dabaran",
    "Al Haqah",
    "Al Hanah",
    "Al Dhira",
    "Al Nathrah",
    "Al Tarf",
    "Al Jabhah",
    "Al Zubrah",
    "Al Sarfah",
    "Al Awwa",
    "Al Simak",
    "Al Ghafr",
    "Al Zubana",
    "Al Iklil",
    "Al Qalb",
    "Al Shaula",
    "Al Naaim",
    "Al Baldah",
    "Sad al Dhabih",
    "Sad Bula",
    "Sad al Suud",
    "Sad al Akhbiyah",
    "Al Fargh al Muqaddam",
    "Al Fargh al Muakhkhar",
    "Batn al Hut",
]

TEMPERAMENTS = {
    "Fire": ("hot", "dry"),
    "Earth": ("cold", "dry"),
    "Air": ("hot", "moist"),
    "Water": ("cold", "moist"),
}

WEEKDAY_RULERS = {
    0: "Moon",
    1: "Mars",
    2: "Mercury",
    3: "Jupiter",
    4: "Venus",
    5: "Saturn",
    6: "Sun",
}

HEBREW_GEMATRIA = {
    "a": 1,
    "b": 2,
    "g": 3,
    "d": 4,
    "h": 5,
    "v": 6,
    "w": 6,
    "o": 6,
    "u": 6,
    "z": 7,
    "ch": 8,
    "t": 9,
    "y": 10,
    "k": 20,
    "c": 20,
    "l": 30,
    "m": 40,
    "n": 50,
    "s": 60,
    "e": 70,
    "p": 80,
    "f": 80,
    "tz": 90,
    "ts": 90,
    "q": 100,
    "r": 200,
    "sh": 300,
    "th": 400,
}

CHALDEAN_VALUES = {
    **{letter: 1 for letter in "AIJQY"},
    **{letter: 2 for letter in "BKR"},
    **{letter: 3 for letter in "CGLS"},
    **{letter: 4 for letter in "DMT"},
    **{letter: 5 for letter in "EHNX"},
    **{letter: 6 for letter in "UVW"},
    **{letter: 7 for letter in "OZ"},
    **{letter: 8 for letter in "FP"},
}

PYTHAGOREAN_VALUES = {
    **{letter: 1 for letter in "AJS"},
    **{letter: 2 for letter in "BKT"},
    **{letter: 3 for letter in "CLU"},
    **{letter: 4 for letter in "DMV"},
    **{letter: 5 for letter in "ENW"},
    **{letter: 6 for letter in "FOX"},
    **{letter: 7 for letter in "GPY"},
    **{letter: 8 for letter in "HQZ"},
    **{letter: 9 for letter in "IR"},
}

SEFIROT = {
    1: "Keter",
    2: "Chokmah",
    3: "Binah",
    4: "Chesed",
    5: "Gevurah",
    6: "Tiferet",
    7: "Netzach",
    8: "Hod",
    9: "Yesod",
    10: "Malkuth",
}

COORD_RE = re.compile(r"^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$")


class CalculationError(ValueError):
    pass


def _missing_optional_dependencies(*, include_chart_runtime: bool) -> list[str]:
    missing: list[str] = []
    if GEOLOCATOR is None:
        missing.append("geopy")
    if TZFINDER is None:
        missing.append("timezonefinder")
    if include_chart_runtime and not _SWISSEPH_AVAILABLE:
        missing.append("swisseph")
    return missing


def _require_optional_dependencies(*, include_chart_runtime: bool, feature: str) -> None:
    missing = _missing_optional_dependencies(include_chart_runtime=include_chart_runtime)
    if missing:
        raise CalculationError(
            f"{feature} requires optional dependencies that are not installed: {', '.join(missing)}."
        )


def clamp(value: float, minimum: float = 0.0, maximum: float = 100.0) -> float:
    return max(minimum, min(maximum, value))


def round2(value: float) -> float:
    return round(float(value), 2)


def clean_text(text: str | None) -> str:
    return (text or "").strip()


def parse_birth_time(value: str) -> time:
    value = clean_text(value)
    if not value:
        raise CalculationError("Birth time is required.")
    try:
        return time.fromisoformat(value)
    except ValueError as exc:
        raise CalculationError("Birth time must be in HH:MM or HH:MM:SS format.") from exc


def parse_birth_date(value: str) -> date:
    value = clean_text(value)
    if not value:
        raise CalculationError("Birth date is required.")
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise CalculationError("Birth date must be in YYYY-MM-DD format.") from exc
    if parsed.year < 1800 or parsed > date.today():
        raise CalculationError("Birth date must be between 1800-01-01 and today.")
    return parsed


@lru_cache(maxsize=512)
def resolve_location(location_text: str) -> dict[str, Any]:
    _require_optional_dependencies(include_chart_runtime=False, feature="Birth location resolution")
    location_text = clean_text(location_text)
    if not location_text:
        raise CalculationError("Birth location is required.")

    coord_match = COORD_RE.match(location_text)
    if coord_match:
        lat = float(coord_match.group(1))
        lon = float(coord_match.group(2))
        tz_name = TZFINDER.timezone_at(lat=lat, lng=lon) or TZFINDER.closest_timezone_at(lat=lat, lng=lon)
        if not tz_name:
            raise CalculationError("Could not determine a timezone for the provided coordinates.")
        return {
            "query": location_text,
            "name": f"{lat:.4f}, {lon:.4f}",
            "latitude": lat,
            "longitude": lon,
            "timezone": tz_name,
            "raw_address": location_text,
        }

    result = None
    last_exc: Exception | None = None
    for _attempt in range(3):
        try:
            result = GEOLOCATOR.geocode(location_text, exactly_one=True, addressdetails=False, timeout=10)
            break
        except Exception as exc:
            last_exc = exc
    if result is None and last_exc is not None:
        raise CalculationError(f"Geocoding failed after retries: {last_exc}") from last_exc
    if result is None:
        raise CalculationError("Could not geocode the birth location. Try a more specific place name or use 'lat, lon'.")

    lat = float(result.latitude)
    lon = float(result.longitude)
    tz_name = TZFINDER.timezone_at(lat=lat, lng=lon) or TZFINDER.closest_timezone_at(lat=lat, lng=lon)
    if not tz_name:
        raise CalculationError("Location was found, but its timezone could not be resolved.")

    return {
        "query": location_text,
        "name": result.address or location_text,
        "latitude": lat,
        "longitude": lon,
        "timezone": tz_name,
        "raw_address": result.address or location_text,
    }


def julian_day_from_datetime(dt_utc: datetime) -> float:
    decimal_hours = (
        dt_utc.hour
        + dt_utc.minute / 60.0
        + dt_utc.second / 3600.0
        + dt_utc.microsecond / 3_600_000_000.0
    )
    return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, decimal_hours)


def build_context(payload: Any) -> dict[str, Any]:
    _require_optional_dependencies(include_chart_runtime=True, feature="Birth chart construction")
    birth_date = parse_birth_date(payload.birth_date)
    birth_time = parse_birth_time(payload.birth_time)
    location = resolve_location(clean_text(payload.birth_location))

    tz = ZoneInfo(location["timezone"])
    birth_local = datetime.combine(birth_date, birth_time, tzinfo=tz)
    birth_utc = birth_local.astimezone(timezone.utc)

    now_local = datetime.now(tz)
    now_utc = now_local.astimezone(timezone.utc)

    return {
        "birth_date": birth_date,
        "birth_time": birth_time,
        "birth_location": clean_text(payload.birth_location),
        "full_name": clean_text(getattr(payload, "full_name", "")),
        "hebrew_name": clean_text(getattr(payload, "hebrew_name", "")),
        "location": location,
        "timezone": location["timezone"],
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "birth_local": birth_local,
        "birth_utc": birth_utc,
        "jd_ut": julian_day_from_datetime(birth_utc),
        "now_local": now_local,
        "now_utc": now_utc,
        "current_jd_ut": julian_day_from_datetime(now_utc),
        "age_years": round2((now_local.date() - birth_date).days / 365.2425),
    }


def degnorm(value: float) -> float:
    return swe.degnorm(value)


def decimal_to_dms(value: float) -> str:
    value = degnorm(value)
    degrees = int(value)
    minutes_full = (value - degrees) * 60.0
    minutes = int(minutes_full)
    seconds = int(round((minutes_full - minutes) * 60.0))
    if seconds == 60:
        seconds = 0
        minutes += 1
    if minutes == 60:
        minutes = 0
        degrees = (degrees + 1) % 360
    return f"{degrees:02d}d {minutes:02d}m {seconds:02d}s"


def degree_in_sign(value: float) -> float:
    return degnorm(value) % 30.0


def sign_index(value: float) -> int:
    return int(degnorm(value) // 30)


def sign_name(value: float) -> str:
    return SIGNS[sign_index(value)]


def sign_info(value: float) -> dict[str, Any]:
    idx = sign_index(value)
    return {
        "index": idx,
        "sign": SIGNS[idx],
        "degree": round2(degnorm(value)),
        "degree_in_sign": round2(degree_in_sign(value)),
        "formatted": f"{SIGNS[idx]} {degree_in_sign(value):.2f}d",
        "dms": decimal_to_dms(degree_in_sign(value)),
        "element": SIGN_ELEMENTS[SIGNS[idx]],
        "modality": SIGN_MODALITIES[SIGNS[idx]],
    }


def calc_ut(jd_ut: float, body: int, flags: int) -> tuple[list[float], int]:
    try:
        return swe.calc_ut(jd_ut, body, flags)
    except Exception:
        fallback_flags = (flags | swe.FLG_MOSEPH) & ~swe.FLG_SWIEPH
        return swe.calc_ut(jd_ut, body, fallback_flags)


def solar_longitude(jd_ut: float, sidereal: bool = False, ayanamsa: int = swe.SIDM_LAHIRI) -> float:
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED
    if sidereal:
        with SIDEREAL_LOCK:
            swe.set_sid_mode(ayanamsa, 0, 0)
            xx, _ = calc_ut(jd_ut, swe.SUN, flags | swe.FLG_SIDEREAL)
    else:
        xx, _ = calc_ut(jd_ut, swe.SUN, flags)
    return degnorm(xx[0])


def lunar_longitude(jd_ut: float, sidereal: bool = False, ayanamsa: int = swe.SIDM_LAHIRI) -> float:
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED
    if sidereal:
        with SIDEREAL_LOCK:
            swe.set_sid_mode(ayanamsa, 0, 0)
            xx, _ = calc_ut(jd_ut, swe.MOON, flags | swe.FLG_SIDEREAL)
    else:
        xx, _ = calc_ut(jd_ut, swe.MOON, flags)
    return degnorm(xx[0])


def houses_tropical(jd_ut: float, lat: float, lon: float, house_system: bytes = b"P") -> tuple[tuple[float, ...], tuple[float, ...]]:
    return swe.houses(jd_ut, lat, lon, house_system)


def houses_sidereal(
    jd_ut: float,
    lat: float,
    lon: float,
    house_system: bytes = b"P",
    ayanamsa: int = swe.SIDM_LAHIRI,
) -> tuple[tuple[float, ...], tuple[float, ...]]:
    flags = swe.FLG_SIDEREAL
    with SIDEREAL_LOCK:
        swe.set_sid_mode(ayanamsa, 0, 0)
        return swe.houses_ex(jd_ut, lat, lon, house_system, flags)


def normalize_cusps(cusps: Iterable[float]) -> list[float]:
    values = list(cusps)[:12]
    return [degnorm(value) for value in values]


def house_for_degree(degree: float, cusps: Iterable[float]) -> int:
    degree = degnorm(degree)
    cusp_values = normalize_cusps(cusps)
    extended = cusp_values + [cusp_values[0] + 360.0]
    adjusted_degree = degree
    if adjusted_degree < cusp_values[0]:
        adjusted_degree += 360.0
    for index in range(12):
        start = extended[index]
        end = extended[index + 1]
        if start <= adjusted_degree < end:
            return index + 1
    return 12


def whole_sign_house(planet_degree: float, asc_degree: float) -> int:
    return ((sign_index(planet_degree) - sign_index(asc_degree)) % 12) + 1


def calculate_planetary_positions(
    jd_ut: float,
    lat: float,
    lon: float,
    sidereal: bool = False,
    ayanamsa: int = swe.SIDM_LAHIRI,
    traditional_only: bool = False,
    house_system: bytes = b"P",
    whole_sign: bool = False,
) -> dict[str, Any]:
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED
    planets = TRADITIONAL_PLANET_IDS if traditional_only else PLANET_IDS

    if sidereal:
        flags |= swe.FLG_SIDEREAL
        cusps, ascmc = houses_sidereal(jd_ut, lat, lon, house_system, ayanamsa)
    else:
        cusps, ascmc = houses_tropical(jd_ut, lat, lon, house_system)

    ascendant = degnorm(ascmc[0])
    midheaven = degnorm(ascmc[1])

    positions: dict[str, Any] = {}
    if sidereal:
        with SIDEREAL_LOCK:
            swe.set_sid_mode(ayanamsa, 0, 0)
            for name, body in planets.items():
                xx, retflag = calc_ut(jd_ut, body, flags)
                longitude = degnorm(xx[0])
                house = whole_sign_house(longitude, ascendant) if whole_sign else house_for_degree(longitude, cusps)
                positions[name] = {
                    "name": name,
                    "longitude": round2(longitude),
                    "latitude": round2(xx[1]),
                    "distance_au": round2(xx[2]),
                    "speed": round2(xx[3]),
                    "retrograde": xx[3] < 0,
                    "sign": sign_name(longitude),
                    "sign_index": sign_index(longitude),
                    "degree_in_sign": round2(degree_in_sign(longitude)),
                    "house": house,
                    "retflag": retflag,
                }
    else:
        for name, body in planets.items():
            xx, retflag = calc_ut(jd_ut, body, flags)
            longitude = degnorm(xx[0])
            house = whole_sign_house(longitude, ascendant) if whole_sign else house_for_degree(longitude, cusps)
            positions[name] = {
                "name": name,
                "longitude": round2(longitude),
                "latitude": round2(xx[1]),
                "distance_au": round2(xx[2]),
                "speed": round2(xx[3]),
                "retrograde": xx[3] < 0,
                "sign": sign_name(longitude),
                "sign_index": sign_index(longitude),
                "degree_in_sign": round2(degree_in_sign(longitude)),
                "house": house,
                "retflag": retflag,
            }

    if "North Node" in positions:
        south_longitude = degnorm(positions["North Node"]["longitude"] + 180.0)
        south_house = whole_sign_house(south_longitude, ascendant) if whole_sign else house_for_degree(south_longitude, cusps)
        positions["South Node"] = {
            "name": "South Node",
            "longitude": round2(south_longitude),
            "latitude": 0.0,
            "distance_au": 0.0,
            "speed": round2(-positions["North Node"]["speed"]),
            "retrograde": positions["North Node"]["speed"] > 0,
            "sign": sign_name(south_longitude),
            "sign_index": sign_index(south_longitude),
            "degree_in_sign": round2(degree_in_sign(south_longitude)),
            "house": south_house,
            "retflag": positions["North Node"]["retflag"],
        }

    positions["Ascendant"] = {
        "name": "Ascendant",
        "longitude": round2(ascendant),
        "sign": sign_name(ascendant),
        "sign_index": sign_index(ascendant),
        "degree_in_sign": round2(degree_in_sign(ascendant)),
        "house": 1,
        "retrograde": False,
    }
    positions["Midheaven"] = {
        "name": "Midheaven",
        "longitude": round2(midheaven),
        "sign": sign_name(midheaven),
        "sign_index": sign_index(midheaven),
        "degree_in_sign": round2(degree_in_sign(midheaven)),
        "house": 10 if whole_sign else house_for_degree(midheaven, cusps),
        "retrograde": False,
    }

    return {
        "positions": positions,
        "cusps": [round2(value) for value in normalize_cusps(cusps)],
        "ascmc": [round2(degnorm(value)) for value in ascmc[:8]],
        "ayanamsa": round2(swe.get_ayanamsa_ut(jd_ut)) if sidereal else 0.0,
    }


def angular_distance(a: float, b: float) -> float:
    diff = abs(degnorm(a) - degnorm(b))
    return 360.0 - diff if diff > 180.0 else diff


def find_aspects(positions: dict[str, Any], names: list[str] | None = None) -> list[dict[str, Any]]:
    keys = names or [name for name in positions.keys() if name not in {"Ascendant", "Midheaven"}]
    aspects: list[dict[str, Any]] = []
    for idx, name_a in enumerate(keys):
        for name_b in keys[idx + 1 :]:
            a = positions[name_a]["longitude"]
            b = positions[name_b]["longitude"]
            distance = angular_distance(a, b)
            for aspect_name, exact_angle, orb in ASPECT_DEFS:
                delta = abs(distance - exact_angle)
                if delta <= orb:
                    aspects.append(
                        {
                            "between": f"{name_a} / {name_b}",
                            "name": aspect_name,
                            "distance": round2(distance),
                            "orb": round2(delta),
                            "applying": positions[name_a].get("speed", 0.0) > positions[name_b].get("speed", 0.0),
                            "a": name_a,
                            "b": name_b,
                        }
                    )
                    break
    aspects.sort(key=lambda item: (item["orb"], item["distance"]))
    return aspects


def dominant_counts(values: Iterable[str]) -> dict[str, int]:
    counter = Counter(value for value in values if value)
    return dict(counter.most_common())


def dominant_element_modality(positions: dict[str, Any], include: list[str] | None = None) -> dict[str, Any]:
    include = include or ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Ascendant"]
    signs = [positions[name]["sign"] for name in include if name in positions]
    elements = [SIGN_ELEMENTS[sign] for sign in signs]
    modalities = [SIGN_MODALITIES[sign] for sign in signs]
    element_counts = Counter(elements)
    modality_counts = Counter(modalities)
    dominant_element = element_counts.most_common(1)[0][0] if element_counts else "Balanced"
    dominant_modality = modality_counts.most_common(1)[0][0] if modality_counts else "Balanced"
    return {
        "elements": dict(element_counts),
        "modalities": dict(modality_counts),
        "dominant_element": dominant_element,
        "dominant_modality": dominant_modality,
    }


def planet_condition(name: str, sign: str) -> str:
    if sign in DOMICILE_SIGNS.get(name, set()):
        return "Domicile"
    if EXALTATION_SIGNS.get(name) == sign:
        return "Exalted"
    if DEBILITATION_SIGNS.get(name) == sign:
        return "Debilitated"
    return "Neutral"


def house_quality(house: int) -> int:
    if house in {1, 5, 9, 10, 11}:
        return 2
    if house in {4, 7}:
        return 1
    if house in {6, 8, 12}:
        return -2
    if house in {2, 3}:
        return 0
    return 0


def planet_quality_score(planet: dict[str, Any]) -> float:
    score = 0.0
    condition = planet_condition(planet["name"], planet["sign"])
    if condition == "Exalted":
        score += 10.0
    elif condition == "Domicile":
        score += 8.0
    elif condition == "Debilitated":
        score -= 8.0
    score += house_quality(planet.get("house", 0)) * 2.5
    if planet.get("retrograde"):
        score -= 1.0
    return score


GENERATION = {
    "Wood": "Fire",
    "Fire": "Earth",
    "Earth": "Metal",
    "Metal": "Water",
    "Water": "Wood",
}

CONTROLS = {
    "Wood": "Earth",
    "Fire": "Metal",
    "Earth": "Water",
    "Metal": "Wood",
    "Water": "Fire",
}


def produced_by(element: str) -> str:
    for parent, child in GENERATION.items():
        if child == element:
            return parent
    raise KeyError(element)


def controlled_by(element: str) -> str:
    for parent, target in CONTROLS.items():
        if target == element:
            return parent
    raise KeyError(element)


def element_relation(base: str, other: str) -> str:
    if base == other:
        return "same"
    if GENERATION[base] == other:
        return "produces"
    if produced_by(base) == other:
        return "resource"
    if CONTROLS[base] == other:
        return "controls"
    if controlled_by(base) == other:
        return "controlled_by"
    return "other"


def reduce_number(value: int, keep_masters: bool = True) -> int:
    value = abs(int(value))
    while value > 9:
        if keep_masters and value in {11, 22, 33}:
            return value
        value = sum(int(char) for char in str(value))
    return value


def alpha_only(text: str) -> str:
    return "".join(char for char in text.upper() if char.isalpha())


def pythagorean_value(text: str) -> int:
    return sum(PYTHAGOREAN_VALUES.get(char, 0) for char in alpha_only(text))


def chaldean_value(text: str) -> int:
    return sum(CHALDEAN_VALUES.get(char, 0) for char in alpha_only(text))


def vowels_value(text: str, table: dict[str, int]) -> int:
    return sum(table.get(char, 0) for char in alpha_only(text) if char in {"A", "E", "I", "O", "U", "Y"})


def consonants_value(text: str, table: dict[str, int]) -> int:
    return sum(table.get(char, 0) for char in alpha_only(text) if char not in {"A", "E", "I", "O", "U", "Y"})


def gematria_breakdown(text: str) -> dict[str, Any]:
    source = clean_text(text).lower()
    tokens: list[tuple[str, int]] = []
    idx = 0
    while idx < len(source):
        if source[idx].isspace():
            idx += 1
            continue
        for token in ("sh", "ch", "tz", "ts", "th"):
            if source.startswith(token, idx):
                tokens.append((token, HEBREW_GEMATRIA[token]))
                idx += len(token)
                break
        else:
            char = source[idx]
            if char.isalpha() and char in HEBREW_GEMATRIA:
                tokens.append((char, HEBREW_GEMATRIA[char]))
            idx += 1
    total = sum(value for _, value in tokens)
    ordinal_total = sum(index + 1 for index, _ in enumerate(tokens))
    reduced_total = sum(reduce_number(value, keep_masters=False) for _, value in tokens)
    return {
        "text": text,
        "tokens": [{"token": token, "value": value} for token, value in tokens],
        "total": total,
        "ordinal": ordinal_total,
        "reduced": reduce_number(reduced_total, keep_masters=False),
    }


def safe_divide(a: float, b: float) -> float:
    return a / b if b else 0.0


def map_score_to_label(score: float) -> str:
    if score >= 75:
        return "Strong"
    if score >= 60:
        return "Supportive"
    if score >= 45:
        return "Mixed"
    return "Challenging"


def polarity_label(value: int) -> str:
    return "Yang" if value % 2 == 0 else "Yin"


def stem_data(index: int) -> dict[str, str]:
    name, element, polarity = BAZI_STEMS[index % 10]
    return {"name": name, "element": element, "polarity": polarity}


def branch_data(index: int) -> dict[str, str]:
    name, animal, element = BAZI_BRANCHES[index % 12]
    return {"name": name, "animal": animal, "element": element}


def sexagenary_name(index: int) -> str:
    return f"{BAZI_STEMS[index % 10][0]} {BAZI_BRANCHES[index % 12][0]}"


def sexagenary_day_index(local_dt: datetime) -> int:
    adjusted_date = local_dt.date() + timedelta(days=1) if local_dt.hour >= 23 else local_dt.date()
    # 1944-01-01 is used here as a Jia Zi reference day.
    return (adjusted_date.toordinal() + 14) % 60


def hour_branch_index(local_time: time) -> int:
    return ((local_time.hour + 1) // 2) % 12


def year_pillar_from_lichun(local_dt: datetime) -> tuple[int, int]:
    year = local_dt.year
    lichun = lichun_datetime(year, local_dt.tzinfo)
    pillar_year = year if local_dt >= lichun else year - 1
    return (pillar_year - 4) % 10, (pillar_year - 4) % 12


def month_branch_from_solar_longitude(longitude: float) -> int:
    segment = int(((degnorm(longitude) - 315.0) % 360.0) // 30.0)
    return (2 + segment) % 12


def month_order_from_branch(branch_index_value: int) -> int:
    return ((branch_index_value - 2) % 12) + 1


def month_stem_from_year_stem(year_stem: int, month_branch_value: int) -> int:
    tiger_month_stem = {
        0: 2,
        5: 2,
        1: 4,
        6: 4,
        2: 6,
        7: 6,
        3: 8,
        8: 8,
        4: 0,
        9: 0,
    }[year_stem % 10]
    month_order = month_order_from_branch(month_branch_value)
    return (tiger_month_stem + month_order - 1) % 10


def hour_stem_from_day_stem(day_stem: int, hour_branch_value: int) -> int:
    zi_hour_start = {
        0: 0,
        5: 0,
        1: 2,
        6: 2,
        2: 4,
        7: 4,
        3: 6,
        8: 6,
        4: 8,
        9: 8,
    }[day_stem % 10]
    return (zi_hour_start + hour_branch_value) % 10


def signed_longitude_delta(longitude: float, target: float) -> float:
    return ((degnorm(longitude) - target + 180.0) % 360.0) - 180.0


def solar_longitude_crossing(target: float, jd_start: float, jd_end: float) -> float:
    start = jd_start
    end = jd_end
    start_delta = signed_longitude_delta(solar_longitude(start), target)
    end_delta = signed_longitude_delta(solar_longitude(end), target)
    if start_delta == 0:
        return start
    if end_delta == 0:
        return end
    for _ in range(50):
        mid = (start + end) / 2.0
        mid_delta = signed_longitude_delta(solar_longitude(mid), target)
        if abs(mid_delta) < 1e-6:
            return mid
        if (start_delta <= 0 <= mid_delta) or (start_delta >= 0 >= mid_delta):
            end = mid
            end_delta = mid_delta
        else:
            start = mid
            start_delta = mid_delta
    return (start + end) / 2.0


@lru_cache(maxsize=64)
def lichun_jd(year: int) -> float:
    approx_start = julian_day_from_datetime(datetime(year, 2, 3, 0, 0, tzinfo=timezone.utc))
    approx_end = julian_day_from_datetime(datetime(year, 2, 6, 0, 0, tzinfo=timezone.utc))
    return solar_longitude_crossing(315.0, approx_start, approx_end)


@lru_cache(maxsize=64)
def lichun_datetime(year: int, tzinfo: ZoneInfo | None) -> datetime:
    jd = lichun_jd(year)
    y, m, d, decimal_hour = swe.revjul(jd)
    hours = int(decimal_hour)
    minutes = int((decimal_hour - hours) * 60)
    seconds = int(round((((decimal_hour - hours) * 60) - minutes) * 60))
    utc_dt = datetime(y, m, d, hours, minutes, min(seconds, 59), tzinfo=timezone.utc)
    return utc_dt.astimezone(tzinfo or timezone.utc)


def current_context_snapshot(context: dict[str, Any]) -> dict[str, Any]:
    return {
        "birth_local": context["birth_local"].isoformat(),
        "birth_utc": context["birth_utc"].isoformat(),
        "now_local": context["now_local"].isoformat(),
        "timezone": context["timezone"],
        "location": {
            "name": context["location"]["name"],
            "latitude": round2(context["latitude"]),
            "longitude": round2(context["longitude"]),
        },
    }


def insight(title: str, text: str) -> dict[str, str]:
    return {"title": title, "text": text}


def table(title: str, columns: list[str], rows: list[list[Any]]) -> dict[str, Any]:
    return {"title": title, "columns": columns, "rows": rows}


def highlight(label: str, value: Any) -> dict[str, Any]:
    return {"label": label, "value": value}
