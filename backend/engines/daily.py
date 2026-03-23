"""Daily content engine for concise home-screen guidance."""

from __future__ import annotations

import hashlib
from typing import Any


AREA_LABELS = {
    "love": "Love",
    "career": "Career",
    "health": "Health",
    "wealth": "Wealth",
    "mood": "Mood",
}

FOCUS_OPENERS = {
    "strong positive": "{area} has the strongest wind behind it today.",
    "positive": "{area} carries the clearest momentum today.",
    "mixed": "{area} is still the strongest lane today, but it rewards patience over force.",
    "challenging": "Today is more about wise pacing than acceleration, even in {area}.",
    "strong challenging": "The sky is asking for conservation more than expansion today, including in {area}.",
}

CAUTION_LINES = {
    "love": "Keep emotional assumptions on a short leash before you react.",
    "career": "Avoid forcing a decision just to end uncertainty.",
    "health": "Pace your energy before the body asks more loudly.",
    "wealth": "Delay unnecessary spending and double-check the numbers.",
    "mood": "Do not mistake a passing feeling for a final conclusion.",
}

DO_MAP = {
    "love": [
        "Reach out where the connection already feels mutual.",
        "Say the quieter truth instead of rehearsing the perfect one.",
        "Make time for warmth, presence, and direct affection.",
        "Let curiosity lead the conversation instead of fear.",
    ],
    "career": [
        "Push the next concrete task across the line.",
        "Follow up on the conversation or idea that is already warm.",
        "Choose the work that creates traction, not just motion.",
        "Speak clearly about priorities and deadlines.",
    ],
    "health": [
        "Protect recovery time before the day gets noisy.",
        "Favor steady routines over dramatic corrections.",
        "Take the walk, stretch, or meal your body has been asking for.",
        "Choose consistency over intensity.",
    ],
    "wealth": [
        "Review the numbers before making the promise.",
        "Handle the practical errand you have been postponing.",
        "Favor long-term structure over quick excitement.",
        "Tighten one loose financial habit today.",
    ],
    "mood": [
        "Create a little more quiet around your attention.",
        "Follow the habit that helps you feel grounded quickly.",
        "Give your nervous system fewer tabs to keep open.",
        "Make room for a small thing that restores perspective.",
    ],
}

DONT_MAP = {
    "love": [
        "Do not chase reassurance that can only come from inside the bond.",
        "Do not read silence faster than facts.",
        "Do not turn hesitation into a story about your worth.",
        "Do not push a conversation that needs a calmer hour.",
    ],
    "career": [
        "Do not confuse urgency with importance.",
        "Do not volunteer for chaos just to feel useful.",
        "Do not send the message until the wording is clean.",
        "Do not make a major pivot from one tense moment.",
    ],
    "health": [
        "Do not spend tomorrow's energy today.",
        "Do not ignore the first signs of fatigue.",
        "Do not bargain away sleep for one more task.",
        "Do not mistake adrenaline for capacity.",
    ],
    "wealth": [
        "Do not make a money decision to soothe a feeling.",
        "Do not skip the details because the pitch sounds good.",
        "Do not let convenience set the budget.",
        "Do not rush into a purchase that can wait a day.",
    ],
    "mood": [
        "Do not let one sharp emotion narrate the whole day.",
        "Do not keep doom-scrolling when your body already says enough.",
        "Do not isolate so long that perspective disappears.",
        "Do not force clarity before it has formed.",
    ],
}

ANCHOR_TEMPLATES = {
    "sun": "Your {value} Sun does best with clean motion instead of overthinking.",
    "moon": "Your {value} Moon needs a little softness around the edges today.",
    "rising": "Your {value} Rising benefits from directness and simple next steps.",
    "chinese": "Your {value} year prefers timing and instinct working together.",
    "day_master": "Your {value} Day Master handles the day best through flexibility.",
    "life_path": "Life Path {value} grows faster when you move with intention, not panic.",
    "nakshatra": "{value} adds a quieter devotional rhythm beneath the practical choices.",
}

FALLBACK_DOS = [
    "Protect your attention before the day fragments it.",
    "Stay close to simple, repeatable choices.",
    "Let one well-chosen action count more than ten scattered ones.",
]

FALLBACK_DONTS = [
    "Do not overcommit from a temporary emotion.",
    "Do not skip the basics that keep you steady.",
    "Do not assume speed and clarity are the same thing.",
]


def _hash_seed(*parts: Any) -> int:
    text = "|".join(str(part) for part in parts if part is not None)
    return int(hashlib.md5(text.encode("utf-8")).hexdigest()[:8], 16)


def _pick_cycle(options: list[str], seed: int, count: int) -> list[str]:
    if not options:
        return []
    start = seed % len(options)
    return [options[(start + offset) % len(options)] for offset in range(min(count, len(options)))]


def _find_highlight(systems: dict[str, Any], system_id: str, *patterns: str) -> str | None:
    highlights = systems.get(system_id, {}).get("highlights", [])
    for item in highlights:
        label = str(item.get("label", "")).lower()
        if any(pattern in label for pattern in patterns):
            return str(item.get("value", ""))
    return None


def _extract_anchor(systems: dict[str, Any]) -> dict[str, str] | None:
    values = {
        "sun": _find_highlight(systems, "western", "sun"),
        "moon": _find_highlight(systems, "western", "moon"),
        "rising": _find_highlight(systems, "western", "rising", "ascendant", "asc"),
        "chinese": _find_highlight(systems, "chinese", "animal", "zodiac", "sign"),
        "day_master": _find_highlight(systems, "bazi", "day master", "day stem", "day element"),
        "life_path": _find_highlight(systems, "numerology", "life path"),
        "nakshatra": _find_highlight(systems, "vedic", "nakshatra"),
    }
    for key in ("sun", "moon", "day_master", "chinese", "life_path", "nakshatra", "rising"):
        value = values.get(key)
        if value:
            return {"key": key, "label": key.replace("_", " ").title(), "value": value}
    return None


def _build_focus_block(area: str, info: dict[str, Any]) -> dict[str, Any]:
    return {
        "area": area,
        "label": AREA_LABELS.get(area, area.title()),
        "score": round(float(info.get("value", 0.0))),
        "sentiment": str(info.get("sentiment", "mixed")),
        "confidence": round(float(info.get("confidence", 0.0))),
        "agreeing_systems": list(info.get("agreeing_systems", [])),
        "leaders": [item.get("name", "") for item in info.get("leaders", [])[:3] if item.get("name")],
    }


def _compose_message(
    focus_area: str,
    focus_info: dict[str, Any],
    caution_area: str,
    systems: dict[str, Any],
    seed: int,
) -> str:
    parts: list[str] = []
    focus_label = AREA_LABELS.get(focus_area, focus_area.title())
    focus_sentiment = str(focus_info.get("sentiment", "mixed"))
    parts.append(FOCUS_OPENERS.get(focus_sentiment, FOCUS_OPENERS["mixed"]).format(area=focus_label))

    agreeing = list(focus_info.get("agreeing_systems", []))
    leaders = [item.get("name", "") for item in focus_info.get("leaders", [])[:2] if item.get("name")]
    if agreeing:
        if leaders:
            joined = " and ".join(leaders[:2]) if len(leaders) <= 2 else ", ".join(leaders[:-1]) + f", and {leaders[-1]}"
            parts.append(f"{len(agreeing)} of 8 systems align there, with {joined} carrying the loudest signal.")
        else:
            parts.append(f"{len(agreeing)} of 8 systems lean in that direction.")

    parts.append(f"{AREA_LABELS.get(caution_area, caution_area.title())} is the place to handle gently. {CAUTION_LINES[caution_area]}")

    anchor = _extract_anchor(systems)
    if anchor:
        template = ANCHOR_TEMPLATES[anchor["key"]]
        parts.append(template.format(value=anchor["value"]))

    message = " ".join(part.strip() for part in parts if part).strip()
    if not message:
        return _pick_cycle(FALLBACK_DOS, seed, 1)[0]
    return message


def calculate(context: dict[str, Any], systems: dict[str, Any], combined: dict[str, Any]) -> dict[str, Any]:
    probabilities = dict(combined.get("probabilities", {}))
    ordered = sorted(probabilities.items(), key=lambda item: item[1].get("value", 0.0), reverse=True)
    now_local = context["now_local"]
    date_iso = now_local.date().isoformat()
    date_label = f"{now_local.strftime('%A, %B')} {now_local.day}"
    seed = _hash_seed(context.get("birth_date"), context.get("full_name"), date_iso)

    if not ordered:
        return {
            "id": "daily",
            "date": date_iso,
            "date_label": date_label,
            "message": "The sky is quiet enough today that the best guidance is to stay simple, observant, and grounded.",
            "dos": FALLBACK_DOS,
            "donts": FALLBACK_DONTS,
            "focus": None,
            "caution": None,
            "anchor": _extract_anchor(systems),
        }

    focus_area, focus_info = ordered[0]
    caution_area, caution_info = ordered[-1]
    message = _compose_message(focus_area, focus_info, caution_area, systems, seed)

    dos = _pick_cycle(DO_MAP.get(focus_area, FALLBACK_DOS), seed, 3)
    donts = _pick_cycle(DONT_MAP.get(caution_area, FALLBACK_DONTS), seed // 3 or seed + 1, 3)
    while len(dos) < 3:
        dos.append(FALLBACK_DOS[len(dos)])
    while len(donts) < 3:
        donts.append(FALLBACK_DONTS[len(donts)])

    return {
        "id": "daily",
        "date": date_iso,
        "date_label": date_label,
        "message": message,
        "dos": dos[:3],
        "donts": donts[:3],
        "focus": _build_focus_block(focus_area, focus_info),
        "caution": _build_focus_block(caution_area, caution_info),
        "anchor": _extract_anchor(systems),
    }
