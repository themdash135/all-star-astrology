"""Poetic oracle engine for question classification and response composition."""

from __future__ import annotations

import hashlib
import re
from typing import Any


AREA_KEYWORDS: dict[str, set[str]] = {
    "love": {
        "love", "relationship", "partner", "dating", "marriage", "romance", "heart",
        "soulmate", "crush", "text", "ex", "boyfriend", "girlfriend", "wife", "husband",
        "feelings", "attraction", "romantic", "chemistry", "him", "her", "them",
    },
    "career": {
        "career", "work", "job", "promotion", "boss", "business", "professional",
        "interview", "project", "colleague", "office", "hire", "fired", "raise",
        "success", "freelance", "quit", "resign", "position",
    },
    "health": {
        "health", "body", "exercise", "sick", "energy", "sleep", "diet", "stress",
        "anxiety", "wellness", "tired", "pain", "healing", "recovery", "medical",
        "weight", "fitness", "vitality",
    },
    "wealth": {
        "money", "wealth", "invest", "financial", "savings", "budget", "rich", "income",
        "spend", "buy", "afford", "debt", "loan", "fortune", "abundance", "prosperity",
        "rent", "house", "apartment",
    },
    "mood": {
        "mood", "happy", "sad", "feel", "emotion", "vibe", "spirit", "mental", "joy",
        "depression", "motivation", "inspired", "creative", "purpose", "meaning",
        "direction", "lost", "confused", "peace",
    },
}

YES_NO_STARTERS = {"should", "will", "can", "is", "am", "do", "does", "would", "could", "are"}
TIMING_STARTERS = ("when", "how long", "how soon")

OPENINGS: dict[tuple[str, str], list[str]] = {
    ("yes_no", "positive"): [
        "The celestial currents speak with quiet certainty.",
        "The stars align in your favor, and their answer is clear.",
        "The cosmos leans toward yes, written softly but unmistakably across your chart.",
    ],
    ("yes_no", "mixed"): [
        "The heavens hold their breath, offering wisdom rather than a verdict.",
        "The stars refuse a simple answer and ask for discernment instead.",
        "The cosmic scales hover in delicate balance around this choice.",
    ],
    ("yes_no", "challenging"): [
        "The celestial currents urge patience rather than pursuit.",
        "The stars whisper not yet, and that is different from never.",
        "The heavens counsel waiting until the atmosphere changes around this question.",
    ],
    ("open", "positive"): [
        "The cosmic tapestry glows warmly around this part of your life.",
        "The stars see real promise in the territory you are asking about.",
        "The celestial picture here is rich with momentum and invitation.",
    ],
    ("open", "mixed"): [
        "The starlight here is filtered, present but nuanced.",
        "The cosmos reveals a landscape of complexity rather than certainty.",
        "The heavens show motion, though the path curves beyond what you can yet see.",
    ],
    ("open", "challenging"): [
        "The stars see a passage here, though it is narrower than you hoped.",
        "The cosmos asks for stillness before it reveals the next step.",
        "The celestial patterns are tangled here, and tangled things ask for patience.",
    ],
    ("timing", "positive"): [
        "The celestial clock is moving in your favor.",
        "Time is beginning to warm around this question.",
        "The stars sense proximity, even if they refuse a calendar date.",
    ],
    ("timing", "mixed"): [
        "The cosmic timing is in flux and has not yet crystallized.",
        "The heavens speak in seasons rather than deadlines.",
        "Time bends strangely here; the current is moving, but slowly.",
    ],
    ("timing", "challenging"): [
        "The celestial rhythms ask for patience before arrival.",
        "The stars do not deny the outcome, but they delay the hour.",
        "The cosmic clock moves by ripening, not by urgency.",
    ],
}

AREA_BODIES: dict[tuple[str, str], list[str]] = {
    ("love", "positive"): [
        "The current around your heart is warm and magnetic. Connection deepens where you allow honesty to remain softer than fear.",
        "Love moves through your chart like a river finding its true bed, patient, persuasive, and difficult to stop once it gathers force.",
        "Your emotional field carries invitation. The people who matter can feel it, even across distance and silence.",
    ],
    ("love", "mixed"): [
        "The heart wants clarity, but the stars ask for honesty first. What feels uncertain now becomes legible through patience.",
        "Romantic energy is present, though it asks to be met with discernment rather than fantasy.",
        "Affection and caution travel together here. Feel deeply, but do not abandon your inner compass.",
    ],
    ("love", "challenging"): [
        "The heart needs tending more than chasing right now. Turn the tenderness inward before sending it outward.",
        "The emotional weather is restless, not dangerous, but demanding of calm and self-trust.",
        "Love is not absent. It is waiting for you to clear the room it hopes to enter.",
    ],
    ("career", "positive"): [
        "Your professional energy carries momentum. The work you choose now has an echo that reaches farther than the present moment.",
        "Ambition and alignment meet in your chart. What you build here can hold weight.",
        "The career winds are behind you, not to carry you passively, but to reward decisive motion.",
    ],
    ("career", "mixed"): [
        "The professional landscape is rearranging itself. Opportunity is present, but it is not wearing its final name yet.",
        "Your path stands at a crossroads, and the cosmos illuminates options rather than making the choice for you.",
        "Work energy is active but scattered. One focused move matters more than many half-hearted ones.",
    ],
    ("career", "challenging"): [
        "The professional winds push against you, testing whether this path is conviction or only momentum.",
        "The career sky is overcast. This is not failure; it is a pause before definition returns.",
        "Your working life asks for recalibration. Pushing harder is not the wisdom the stars offer tonight.",
    ],
    ("health", "positive"): [
        "Vitality runs strong through your chart. Body and spirit are speaking to each other in the same language.",
        "The health currents are clean and supportive, suited to building steady strength rather than burning bright and brief.",
        "Energy is available to you now. Use it with reverence, because abundance is sweetest when it is not squandered.",
    ],
    ("health", "mixed"): [
        "The body speaks in whispers before it shouts. The stars advise listening while the message is still gentle.",
        "Your vitality shows both resilience and strain, asking for consistency more than dramatic correction.",
        "Balance is not waiting to be found; it is practiced in small acts of care.",
    ],
    ("health", "challenging"): [
        "Your vitality resembles a candle burning at both ends, radiant but not inexhaustible.",
        "Rest is not retreat. The stars see a body that needs gentleness and a spirit that needs silence.",
        "The cosmos urges tenderness with yourself. What feels like slowing down may be the beginning of healing.",
    ],
    ("wealth", "positive"): [
        "Material currents carry warmth here. What you cultivate now can become more stable than it first appears.",
        "Prosperity is less a lightning strike in your chart than a fertile season. Plant carefully and keep tending.",
        "Your financial path has movement in it, and wise attention turns that motion into substance.",
    ],
    ("wealth", "mixed"): [
        "The financial picture is nuanced, neither feast nor famine, but a lesson in pacing and attention.",
        "Money energy is present, though it asks for discipline so that invitation does not turn into leakage.",
        "Resources gather best around choices made slowly and with clear intention.",
    ],
    ("wealth", "challenging"): [
        "The material atmosphere is asking for caution. Preservation matters more than expansion right now.",
        "Your chart suggests tighter currents around resources, which is a call for wisdom rather than fear.",
        "Abundance is not gone, but it wants structure before it wants risk.",
    ],
    ("mood", "positive"): [
        "Your inner weather carries unusual brightness. The spirit is more coherent than it may have felt lately.",
        "Mood and meaning are beginning to align, restoring a sense of direction beneath the noise.",
        "The emotional current is supportive here, asking you to trust what feels quietly life-giving.",
    ],
    ("mood", "mixed"): [
        "Your inner landscape is shifting in subtle ways, and certainty has not yet caught up to the movement.",
        "The spirit is searching for quiet rather than answers. Give it space before you demand conclusions.",
        "Some emotions are clearing while others are still forming. Let them finish becoming themselves.",
    ],
    ("mood", "challenging"): [
        "The spirit looks tired, though not lost. This is a season for gentleness rather than self-judgment.",
        "Emotional heaviness shows up in your chart as a request for grounding, not as a permanent verdict.",
        "Your inner weather is stormy, but storms reveal what in you can still stand.",
    ],
}

QUESTION_BRIDGES: dict[str, list[str]] = {
    "yes_no": [
        "The answer becomes clearer when you move with calm rather than urgency.",
        "If you proceed, let it be from steadiness, not hunger for immediate certainty.",
        "This is less about forcing an outcome than meeting the right moment with courage.",
    ],
    "open": [
        "The lesson here is not hidden from you; it is simply arriving in layers.",
        "What the stars offer is orientation, not command.",
        "Your path opens more through attention than through control.",
    ],
    "timing": [
        "Watch for repeated openings and recurring names, because timing often announces itself through pattern before event.",
        "The stars prefer ripening to rushing, so notice what begins to feel easier rather than what feels dramatic.",
        "Cycles turn quietly before they turn visibly. Trust the subtler signs first.",
    ],
}

CHART_REFS: dict[str, list[str]] = {
    "sun": [
        "Your {value} Sun adds brightness and curiosity to the way this unfolds.",
        "The voice of your {value} Sun keeps asking you to act from what feels alive, not merely acceptable.",
    ],
    "moon": [
        "With a {value} Moon, your emotional truth notices currents long before logic names them.",
        "Your {value} Moon colors the question with intuition, softness, and a refusal to ignore what the heart already knows.",
    ],
    "rising": [
        "Your {value} Rising suggests that the outer path opens when you choose directness over hesitation.",
        "The mask of your {value} Rising favors movement, which matters now more than perfect certainty.",
    ],
    "chinese": [
        "Your {value} year lends this moment a distinct symbolic weather, patient on the surface and powerful underneath.",
        "The current carries the mark of your {value} sign, which thrives when instinct and timing cooperate.",
    ],
    "day_master": [
        "Your Day Master of {value} speaks of a core nature that adapts without losing itself.",
        "The BaZi signature of {value} suggests that flexibility is one of your strengths here.",
    ],
    "life_path": [
        "Your Life Path {value} reminds you that growth often arrives through movement rather than safety.",
        "Life Path {value} places a lesson of expansion inside this question, even if the first step feels small.",
    ],
    "nakshatra": [
        "Your nakshatra, {value}, adds a devotional undertone to the story, asking for trust as much as action.",
        "{value} in the Vedic layer suggests that the unseen rhythm matters as much as the visible one.",
    ],
}

CLOSINGS: dict[str, list[str]] = {
    "positive": [
        "Trust the opening that keeps returning to you.",
        "The current is moving; your task is to meet it with grace.",
        "What is meant to grow from this question has already begun.",
    ],
    "mixed": [
        "Move slowly enough to hear the second answer beneath the first.",
        "Clarity is coming, but it prefers a patient witness.",
        "Stay attentive. The path is forming while you stand inside it.",
    ],
    "challenging": [
        "Let patience do some of the work that force cannot.",
        "Guard your energy until the sky changes shape around this matter.",
        "The pause itself is part of the guidance.",
    ],
}

DEFAULT_BODIES = [
    "The stars answer in symbols before they answer in events. Stay close to what feels true, and the next step will stop hiding from you.",
    "Even when the heavens are quiet, they are not empty. Keep your attention soft and your choices deliberate.",
    "Not every answer arrives as certainty. Sometimes the gift is a steadier way of meeting the unknown.",
]


def _tokenize(text: str) -> tuple[str, set[str]]:
    normalized = re.sub(r"[^a-z0-9\s]", " ", text.lower()).strip()
    tokens = {part for part in normalized.split() if part}
    return normalized, tokens


def classify_question(question: str) -> dict[str, Any]:
    """Classify the user's question by shape and life area."""
    normalized, words = _tokenize(question or "")
    first_word = normalized.split()[0] if normalized else ""

    if any(normalized.startswith(prefix) for prefix in TIMING_STARTERS):
        q_type = "timing"
    elif first_word in YES_NO_STARTERS:
        q_type = "yes_no"
    else:
        q_type = "open"

    matched: list[str] = []
    for area, keywords in AREA_KEYWORDS.items():
        if words & keywords:
            matched.append(area)

    if not matched:
        matched = ["mood", "career"]

    return {"type": q_type, "areas": matched}


def _find_highlight(systems: dict[str, Any], system_id: str, *patterns: str) -> str | None:
    highlights = systems.get(system_id, {}).get("highlights", [])
    for item in highlights:
        label = str(item.get("label", "")).lower()
        if any(pattern in label for pattern in patterns):
            return str(item.get("value", ""))
    return None


def extract_chart_data(reading: dict[str, Any]) -> dict[str, str | None]:
    """Extract chart placements used in oracle prose."""
    systems = reading.get("systems", {})
    return {
        "sun": _find_highlight(systems, "western", "sun"),
        "moon": _find_highlight(systems, "western", "moon"),
        "rising": _find_highlight(systems, "western", "rising", "ascendant", "asc"),
        "chinese": _find_highlight(systems, "chinese", "animal", "zodiac", "sign"),
        "day_master": _find_highlight(systems, "bazi", "day master", "day stem", "day element"),
        "life_path": _find_highlight(systems, "numerology", "life path"),
        "nakshatra": _find_highlight(systems, "vedic", "nakshatra"),
    }


def _hash_seed(text: str) -> int:
    return int(hashlib.md5(text.encode("utf-8")).hexdigest()[:8], 16)


def _pick(options: list[str], seed: int) -> str:
    if not options:
        return ""
    return options[seed % len(options)]


def _simplify_sentiment(sentiment: str) -> str:
    if sentiment in {"strong positive", "positive"}:
        return "positive"
    if sentiment in {"strong challenging", "challenging"}:
        return "challenging"
    return "mixed"


def _voice_phrase(count: int) -> str:
    if count <= 0:
        return "No clear chorus rises from the systems yet."
    if count == 1:
        return "A single tradition murmurs in this direction."
    if count == 2:
        return "Two traditions echo one another."
    if count == 3:
        return "Three ancient voices speak in unison."
    if count == 4:
        return "Four traditions lean the same way."
    if count == 5:
        return "Five traditions whisper the same truth."
    if count == 6:
        return "Six traditions gather into a steady chorus."
    if count == 7:
        return "Seven traditions point toward the same horizon."
    return "All eight traditions ring together like a bell."


def _build_evidence(areas: list[str], probabilities: dict[str, Any]) -> list[dict[str, Any]]:
    evidence: list[dict[str, Any]] = []
    for area in areas[:2]:
        info = probabilities.get(area)
        if not info:
            continue
        agreeing_names = list(info.get("agreeing_systems", []))
        leaders = info.get("leaders", [])
        laggards = info.get("laggards", [])
        all_names = [item["name"] for item in leaders] + [item["name"] for item in laggards]
        dissenting = [n for n in all_names if n not in agreeing_names]
        # Remove duplicates while preserving order
        seen: set[str] = set()
        unique_dissenting: list[str] = []
        for n in dissenting:
            if n not in seen:
                seen.add(n)
                unique_dissenting.append(n)
        evidence.append(
            {
                "area": area,
                "sentiment": _simplify_sentiment(str(info.get("sentiment", "mixed"))),
                "score": round(info.get("value", 0)),
                "label": info.get("label", ""),
                "agreeing": len(agreeing_names),
                "systems": agreeing_names,
                "dissenting": unique_dissenting[:3],
                "leaders": [{"name": item["name"], "score": round(item["value"])} for item in leaders[:3]],
                "laggards": [{"name": item["name"], "score": round(item["value"])} for item in laggards[:3]],
                "voices": _voice_phrase(len(agreeing_names)),
            }
        )
    return evidence


def compose_response(question: str, reading: dict[str, Any]) -> dict[str, Any]:
    """Compose a poetic oracle answer grounded in the combined reading."""
    classification = classify_question(question)
    areas = classification["areas"][:2]
    q_type = classification["type"]
    probabilities = reading.get("combined", {}).get("probabilities", {})
    chart = extract_chart_data(reading)
    seed = _hash_seed((question or "").strip().lower() or "|".join(areas))

    primary_info = probabilities.get(areas[0], {})
    sentiment = _simplify_sentiment(str(primary_info.get("sentiment", "mixed")))

    parts: list[str] = []
    parts.append(_pick(OPENINGS.get((q_type, sentiment), OPENINGS[("open", "mixed")]), seed))

    primary_bodies = AREA_BODIES.get((areas[0], sentiment), DEFAULT_BODIES)
    parts.append(_pick(primary_bodies, seed + 1))

    primary_agreeing = len(primary_info.get("agreeing_systems", []))
    if primary_info:
        parts.append(_voice_phrase(primary_agreeing))

    if len(areas) > 1:
        secondary_info = probabilities.get(areas[1], {})
        secondary_sentiment = _simplify_sentiment(str(secondary_info.get("sentiment", "mixed")))
        secondary_bodies = AREA_BODIES.get((areas[1], secondary_sentiment))
        if secondary_bodies:
            parts.append(_pick(secondary_bodies, seed + 2))

    parts.append(_pick(QUESTION_BRIDGES[q_type], seed + 3))

    chart_priority = ["sun", "moon", "day_master", "chinese", "nakshatra", "life_path", "rising"]
    for key in chart_priority:
        value = chart.get(key)
        if value:
            parts.append(_pick(CHART_REFS[key], seed + 4).format(value=value))
            break

    parts.append(_pick(CLOSINGS[sentiment], seed + 5))

    answer = " ".join(part for part in parts if part).strip()
    if not answer:
        answer = _pick(DEFAULT_BODIES, seed)

    evidence = _build_evidence(areas, probabilities)
    return {"answer": answer, "areas": areas, "evidence": evidence}
