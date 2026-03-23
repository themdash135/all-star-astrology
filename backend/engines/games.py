"""Games Engine — self-contained mini-game logic for the Games tab.

Each game is config-driven and returns a uniform result shape:
  - game_id, title, result_data (game-specific), teaser, premium_text, cta_label, cta_system
"""

from __future__ import annotations

import hashlib
import random
from datetime import date
from typing import Any

from .common import (
    SIGNS,
    SIGN_ELEMENTS,
    reduce_number,
    pythagorean_value,
    round2,
)

# ──────────────────────────────────────────────
# Shared data tables (config-driven content)
# ──────────────────────────────────────────────

PLANETS = [
    "Sun", "Moon", "Mercury", "Venus", "Mars",
    "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
]

HOUSES = list(range(1, 13))

SIGN_ICONS = {
    "Aries": "\u2648", "Taurus": "\u2649", "Gemini": "\u264A",
    "Cancer": "\u264B", "Leo": "\u264C", "Virgo": "\u264D",
    "Libra": "\u264E", "Scorpio": "\u264F", "Sagittarius": "\u2650",
    "Capricorn": "\u2651", "Aquarius": "\u2652", "Pisces": "\u2653",
}

PLANET_MEANINGS = {
    "Sun": "identity and willpower",
    "Moon": "emotions and intuition",
    "Mercury": "communication and thinking",
    "Venus": "love and beauty",
    "Mars": "drive and ambition",
    "Jupiter": "growth and opportunity",
    "Saturn": "discipline and structure",
    "Uranus": "change and innovation",
    "Neptune": "dreams and spirituality",
    "Pluto": "transformation and power",
}

HOUSE_MEANINGS = {
    1: "self and appearance",
    2: "finances and values",
    3: "communication and siblings",
    4: "home and roots",
    5: "creativity and romance",
    6: "health and daily routine",
    7: "partnerships and marriage",
    8: "transformation and shared resources",
    9: "travel and higher learning",
    10: "career and public image",
    11: "friendships and aspirations",
    12: "spirituality and hidden strengths",
}

ELEMENT_COMPAT = {
    ("Fire", "Fire"): 85, ("Fire", "Earth"): 45, ("Fire", "Air"): 80, ("Fire", "Water"): 40,
    ("Earth", "Fire"): 45, ("Earth", "Earth"): 75, ("Earth", "Air"): 50, ("Earth", "Water"): 85,
    ("Air", "Fire"): 80, ("Air", "Earth"): 50, ("Air", "Air"): 70, ("Air", "Water"): 55,
    ("Water", "Fire"): 40, ("Water", "Earth"): 85, ("Water", "Air"): 55, ("Water", "Water"): 80,
}

MODALITY_COMPAT = {
    ("Cardinal", "Cardinal"): 60, ("Cardinal", "Fixed"): 55, ("Cardinal", "Mutable"): 75,
    ("Fixed", "Cardinal"): 55, ("Fixed", "Fixed"): 50, ("Fixed", "Mutable"): 65,
    ("Mutable", "Cardinal"): 75, ("Mutable", "Fixed"): 65, ("Mutable", "Mutable"): 70,
}

SIGN_MODALITIES = {
    "Aries": "Cardinal", "Taurus": "Fixed", "Gemini": "Mutable",
    "Cancer": "Cardinal", "Leo": "Fixed", "Virgo": "Mutable",
    "Libra": "Cardinal", "Scorpio": "Fixed", "Sagittarius": "Mutable",
    "Capricorn": "Cardinal", "Aquarius": "Fixed", "Pisces": "Mutable",
}

FATE_CARDS = [
    {"title": "The Rising Star", "meaning": "A breakthrough moment is approaching. Prepare to shine.", "advice": "Take the lead on something you have been hesitating about."},
    {"title": "The Hidden Moon", "meaning": "Something unseen is influencing your path. Trust your instincts.", "advice": "Spend time in reflection before making a big decision."},
    {"title": "The Open Road", "meaning": "New opportunities are unfolding. Travel or movement is favored.", "advice": "Say yes to an invitation you would normally decline."},
    {"title": "The Walled Garden", "meaning": "Protection and boundaries serve you now. Guard your energy.", "advice": "Set one firm boundary today and hold it."},
    {"title": "The Twin Flames", "meaning": "A significant connection is deepening. Pay attention to mirrors.", "advice": "Reach out to someone who has been on your mind."},
    {"title": "The Golden Key", "meaning": "An answer you have been seeking is closer than you think.", "advice": "Revisit a problem from a completely different angle."},
    {"title": "The Deep Well", "meaning": "Emotional depth is available. Dive below the surface.", "advice": "Journal or meditate on what you are truly feeling."},
    {"title": "The Lightning Bolt", "meaning": "Sudden clarity or disruption. Change arrives fast.", "advice": "Be ready to act quickly when the moment comes."},
    {"title": "The Ancient Tree", "meaning": "Patience and rootedness bring reward. Growth takes time.", "advice": "Focus on one long-term goal instead of chasing quick wins."},
    {"title": "The Compass Rose", "meaning": "Direction becomes clear. Follow the pull you feel.", "advice": "Write down what truly matters to you right now."},
    {"title": "The Silver Thread", "meaning": "A pattern is connecting your recent experiences. Look for the thread.", "advice": "Notice what keeps repeating in your conversations."},
    {"title": "The Eclipse", "meaning": "An ending makes way for a beginning. Release with grace.", "advice": "Let go of one thing that no longer serves you."},
    {"title": "The Harvest", "meaning": "You are entering a season of reaping what was sown.", "advice": "Acknowledge your past effort — the results are coming."},
    {"title": "The Candle Flame", "meaning": "Small, steady effort now creates lasting warmth.", "advice": "Do one small act of kindness without expecting return."},
    {"title": "The Star Map", "meaning": "Your long-range vision is sharper than usual. Plan boldly.", "advice": "Dream three months ahead and write it down."},
    {"title": "The Still Water", "meaning": "Calm is your power. Do not rush what needs to settle.", "advice": "Pause before responding to anything that stirs emotion."},
    {"title": "The Iron Gate", "meaning": "A test of resolve. What you withstand now builds strength.", "advice": "Stay the course even when doubt whispers."},
    {"title": "The Feather", "meaning": "Lightness and ease are available. Stop forcing.", "advice": "Choose the path of least resistance today."},
    {"title": "The Mirror", "meaning": "What bothers you in others reveals something in yourself.", "advice": "Ask yourself what a recent frustration teaches you."},
    {"title": "The Bonfire", "meaning": "Passion and community ignite together. Gather your people.", "advice": "Share an idea with someone who will fan the flame."},
    {"title": "The Seed", "meaning": "Something planted today will grow beyond expectation.", "advice": "Start a small project with no pressure about the outcome."},
    {"title": "The Constellation", "meaning": "The bigger picture is forming. Trust the pattern.", "advice": "Zoom out from the details and see the shape emerging."},
    {"title": "The Chalice", "meaning": "Emotional abundance flows toward you. Receive it.", "advice": "Accept a compliment or offer without deflecting."},
    {"title": "The Shield", "meaning": "You are more protected than you realize. Stand firm.", "advice": "Face something you have been avoiding — you are ready."},
]

LIFE_PATH_MEANINGS = {
    1: {"trait": "The Leader", "teaser": "You are driven by independence and originality. Your path is about pioneering new ground.", "premium": "Life Path 1 carries the energy of creation and self-determination. You thrive when you trust your own vision rather than following the crowd. Your challenges come from impatience and a reluctance to ask for help. This year favors bold moves, especially in career and personal projects. Relationships work best when your partner respects your autonomy."},
    2: {"trait": "The Diplomat", "teaser": "You are guided by harmony and partnership. Your path is about connection and sensitivity.", "premium": "Life Path 2 is the frequency of cooperation and emotional intelligence. You sense what others miss and mediate naturally. Your challenge is self-assertion — learning that your needs matter as much as anyone else's. This period supports deepening existing bonds over starting new ones. Trust your intuition more than logic right now."},
    3: {"trait": "The Creative", "teaser": "You are fueled by expression and joy. Your path is about bringing ideas to life.", "premium": "Life Path 3 vibrates with creative fire and social magnetism. You communicate in ways that move people. Your challenge is focus — too many ideas can scatter your energy. This cycle rewards finishing what you start. Share your work publicly; hiding it dims your light."},
    4: {"trait": "The Builder", "teaser": "You are grounded by structure and dedication. Your path is about creating lasting foundations.", "premium": "Life Path 4 carries the blueprint energy — you see how things should be built and have the patience to do it right. Your challenge is rigidity and overwork. This period asks you to balance effort with rest. Financial decisions made now have long-term impact, so take them seriously but don't let fear drive them."},
    5: {"trait": "The Adventurer", "teaser": "You are moved by freedom and experience. Your path is about embracing change.", "premium": "Life Path 5 is the frequency of movement and sensory experience. You need variety or you wither. Your challenge is commitment — learning that freedom and depth are not enemies. This cycle favors travel, new skills, and breaking routines. Be careful with impulsive decisions around money."},
    6: {"trait": "The Nurturer", "teaser": "You are called by love and responsibility. Your path is about service and beauty.", "premium": "Life Path 6 resonates with home, family, and aesthetic harmony. You feel responsible for others' wellbeing, sometimes too much. Your challenge is perfectionism and martyrdom. This period highlights domestic life and creative projects. Set boundaries with those who drain you, and invest in what brings you beauty."},
    7: {"trait": "The Seeker", "teaser": "You are drawn to truth and inner knowing. Your path is about wisdom and solitude.", "premium": "Life Path 7 is the frequency of the mystic and analyst. You need time alone to process and go deep. Your challenge is isolation and overthinking. This cycle rewards study, research, and spiritual practice. Trust the answers that come in stillness rather than noise."},
    8: {"trait": "The Powerhouse", "teaser": "You are shaped by ambition and material mastery. Your path is about wielding influence wisely.", "premium": "Life Path 8 carries the energy of authority and abundance. You are here to learn the responsible use of power and resources. Your challenge is control — learning when to hold and when to release. This period is strong for business, investments, and leadership roles. Generosity unlocks more than hoarding."},
    9: {"trait": "The Humanitarian", "teaser": "You are inspired by compassion and vision. Your path is about serving the greater good.", "premium": "Life Path 9 vibrates with completion and universal love. You see the big picture and feel drawn to causes larger than yourself. Your challenge is letting go — of relationships, phases, and ego. This cycle supports creative projects with meaning, volunteer work, and releasing old resentments."},
    11: {"trait": "The Visionary", "teaser": "You carry heightened intuition and spiritual sensitivity. Your path is about illumination.", "premium": "Master Number 11 amplifies the 2 energy with spiritual voltage. You receive insights others miss but may struggle with anxiety from the intensity. This period asks you to channel your sensitivity into creative or healing work rather than absorbing others' pain. Trust your visions — they are more accurate than you think."},
    22: {"trait": "The Master Builder", "teaser": "You hold the power to manifest extraordinary visions into reality. Your path is about large-scale creation.", "premium": "Master Number 22 combines the vision of 11 with the practical power of 4. You are capable of building things that outlast you. Your challenge is the weight of your own potential — feeling like you should be doing more. This period rewards patient, strategic action. Think in years, not weeks."},
    33: {"trait": "The Master Teacher", "teaser": "You embody selfless service and spiritual wisdom. Your path is about uplifting others.", "premium": "Master Number 33 is the rarest vibration — the teacher who teaches by example. You radiate compassion but may neglect your own needs. This cycle asks you to receive as much as you give. Your mere presence heals; you do not always need to do more."},
}


# ──────────────────────────────────────────────
# Game registry (config-driven)
# ──────────────────────────────────────────────

GAME_REGISTRY = {
    "dice": {
        "title": "Astrology Dice",
        "description": "Roll three cosmic dice — sign, planet, and house — for instant guidance.",
        "icon": "\U0001F3B2",
        "free": True,
        "cta_label": "View Full Western Analysis",
        "cta_system": "western",
    },
    "fate": {
        "title": "Daily Fate Draw",
        "description": "Draw a cosmic card to reveal today's hidden message.",
        "icon": "\U0001F0CF",
        "free": True,
        "cta_label": "Ask the Oracle",
        "cta_system": "oracle",
    },
    "compatibility": {
        "title": "Quick Compatibility",
        "description": "Enter two birth dates for an instant compatibility reading.",
        "icon": "\U0001F495",
        "free": True,
        "cta_label": "View Full Combined Analysis",
        "cta_system": "combined-systems",
    },
    "numerology": {
        "title": "Numerology Quick",
        "description": "Enter your birth date for your Life Path number and meaning.",
        "icon": "\U0001F522",
        "free": True,
        "cta_label": "View Full Numerology System",
        "cta_system": "numerology",
    },
}


# ──────────────────────────────────────────────
# Shared engine helpers
# ──────────────────────────────────────────────

def _seeded_rng(seed_str: str) -> random.Random:
    """Deterministic RNG from a string seed."""
    h = int(hashlib.sha256(seed_str.encode()).hexdigest(), 16)
    return random.Random(h)


def _sign_from_date(birth_date: str) -> str:
    """Return zodiac sign from a YYYY-MM-DD date string."""
    month, day = int(birth_date[5:7]), int(birth_date[8:10])
    cutoffs = [
        (1, 20, "Capricorn"), (2, 19, "Aquarius"), (3, 20, "Pisces"),
        (4, 20, "Aries"), (5, 21, "Taurus"), (6, 21, "Gemini"),
        (7, 22, "Cancer"), (8, 23, "Leo"), (9, 23, "Virgo"),
        (10, 23, "Libra"), (11, 22, "Scorpio"), (12, 22, "Sagittarius"),
    ]
    for end_month, end_day, sign in cutoffs:
        if month == end_month and day <= end_day:
            return sign
        if month < end_month:
            return sign
    return "Capricorn"


def _life_path(birth_date: str) -> int:
    """Calculate life path number from YYYY-MM-DD."""
    digits = [int(ch) for ch in birth_date if ch.isdigit()]
    total = sum(digits)
    return reduce_number(total, keep_masters=True)


# ──────────────────────────────────────────────
# Individual game implementations
# ──────────────────────────────────────────────

def play_dice(params: dict[str, Any]) -> dict[str, Any]:
    seed = params.get("seed", str(date.today()))
    rng = _seeded_rng(f"dice-{seed}")

    sign = rng.choice(SIGNS)
    planet = rng.choice(PLANETS)
    house = rng.choice(HOUSES)

    element = SIGN_ELEMENTS.get(sign, "Fire")
    planet_meaning = PLANET_MEANINGS.get(planet, "cosmic energy")
    house_meaning = HOUSE_MEANINGS.get(house, "life matters")

    teaser = (
        f"You rolled {sign} {SIGN_ICONS.get(sign, '')} + {planet} + House {house}. "
        f"The cosmos points to {planet_meaning} expressed through the lens of "
        f"{sign} ({element}) in the realm of {house_meaning}."
    )

    premium = (
        f"Deep dive: {planet} in {sign} in the {house}th house reveals a powerful alignment. "
        f"The {element} element of {sign} charges {planet}'s energy around {planet_meaning}, "
        f"directing it specifically toward {house_meaning}. "
        f"This combination suggests a day where deliberate action in this area yields outsized results. "
        f"Pay attention to synchronicities related to {house_meaning} — the dice rarely lie."
    )

    return {
        "sign": sign,
        "sign_icon": SIGN_ICONS.get(sign, ""),
        "planet": planet,
        "house": house,
        "element": element,
        "teaser": teaser,
        "premium_text": premium,
    }


def play_fate(params: dict[str, Any]) -> dict[str, Any]:
    seed = params.get("seed", str(date.today()))
    rng = _seeded_rng(f"fate-{seed}")
    card = rng.choice(FATE_CARDS)

    teaser = f"\"{card['title']}\" — {card['meaning']}"
    premium = (
        f"The full reading for \"{card['title']}\": {card['meaning']} "
        f"Specific guidance: {card['advice']} "
        f"This card often appears when a turning point is near. "
        f"Consider how this message connects to what has been occupying your mind recently. "
        f"The cosmos does not send messages by accident."
    )

    return {
        "card_title": card["title"],
        "card_meaning": card["meaning"],
        "card_advice": card["advice"],
        "teaser": teaser,
        "premium_text": premium,
    }


def play_compatibility(params: dict[str, Any]) -> dict[str, Any]:
    date1 = params.get("birth_date_1", "")
    date2 = params.get("birth_date_2", "")

    if not date1 or not date2:
        return {"error": "Two birth dates are required.", "teaser": "", "premium_text": ""}

    sign1 = _sign_from_date(date1)
    sign2 = _sign_from_date(date2)
    elem1 = SIGN_ELEMENTS.get(sign1, "Fire")
    elem2 = SIGN_ELEMENTS.get(sign2, "Fire")
    mod1 = SIGN_MODALITIES.get(sign1, "Cardinal")
    mod2 = SIGN_MODALITIES.get(sign2, "Cardinal")

    element_score = ELEMENT_COMPAT.get((elem1, elem2), 50)
    modality_score = MODALITY_COMPAT.get((mod1, mod2), 60)

    # Factor in sign distance (opposite signs = tension + attraction)
    idx1 = SIGNS.index(sign1)
    idx2 = SIGNS.index(sign2)
    distance = min(abs(idx1 - idx2), 12 - abs(idx1 - idx2))
    distance_bonus = {0: 10, 6: 8, 4: 5, 3: -3, 1: -5}.get(distance, 0)

    raw = round2((element_score * 0.5) + (modality_score * 0.3) + (50 + distance_bonus) * 0.2)
    score = max(10, min(95, round(raw)))

    if score >= 75:
        vibe = "strong natural harmony"
    elif score >= 60:
        vibe = "solid compatibility with growth potential"
    elif score >= 45:
        vibe = "interesting tension that can spark or challenge"
    else:
        vibe = "very different energies that require conscious effort"

    teaser = (
        f"{sign1} {SIGN_ICONS.get(sign1, '')} + {sign2} {SIGN_ICONS.get(sign2, '')} = {score}% compatibility. "
        f"This pairing shows {vibe}."
    )

    premium = (
        f"Full compatibility breakdown: {sign1} ({elem1}/{mod1}) and {sign2} ({elem2}/{mod2}). "
        f"Element match: {element_score}% — {'harmonious' if element_score >= 70 else 'challenging but growth-oriented'}. "
        f"Modality match: {modality_score}% — {'flowing rhythm' if modality_score >= 65 else 'different pacing that needs patience'}. "
        f"For a complete picture including Moon sign, Venus, Mars, and all 8 systems, run a full combined reading."
    )

    return {
        "sign_1": sign1,
        "sign_1_icon": SIGN_ICONS.get(sign1, ""),
        "sign_2": sign2,
        "sign_2_icon": SIGN_ICONS.get(sign2, ""),
        "score": score,
        "element_score": element_score,
        "modality_score": modality_score,
        "vibe": vibe,
        "teaser": teaser,
        "premium_text": premium,
    }


def play_numerology(params: dict[str, Any]) -> dict[str, Any]:
    birth_date = params.get("birth_date", "")
    if not birth_date:
        return {"error": "Birth date is required.", "teaser": "", "premium_text": ""}

    lp = _life_path(birth_date)
    info = LIFE_PATH_MEANINGS.get(lp, LIFE_PATH_MEANINGS.get(reduce_number(lp, keep_masters=False), LIFE_PATH_MEANINGS[1]))

    teaser = f"Life Path {lp}: {info['trait']}. {info['teaser']}"
    premium = info["premium"]

    return {
        "life_path": lp,
        "trait": info["trait"],
        "teaser": teaser,
        "premium_text": premium,
    }


# ──────────────────────────────────────────────
# Dispatcher
# ──────────────────────────────────────────────

_GAME_FNS: dict[str, Any] = {
    "dice": play_dice,
    "fate": play_fate,
    "compatibility": play_compatibility,
    "numerology": play_numerology,
}


def play(game_id: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    """Main entry point — dispatches to the correct game and returns uniform shape."""
    if game_id not in GAME_REGISTRY:
        return {"error": f"Unknown game: {game_id}"}

    config = GAME_REGISTRY[game_id]
    fn = _GAME_FNS[game_id]
    result_data = fn(params or {})

    return {
        "game_id": game_id,
        "title": config["title"],
        "icon": config["icon"],
        "free": config["free"],
        "cta_label": config["cta_label"],
        "cta_system": config["cta_system"],
        "teaser": result_data.get("teaser", ""),
        "premium_text": result_data.get("premium_text", ""),
        "result": result_data,
    }


def list_games() -> list[dict[str, Any]]:
    """Return metadata for all available games."""
    return [
        {
            "game_id": gid,
            "title": cfg["title"],
            "description": cfg["description"],
            "icon": cfg["icon"],
            "free": cfg["free"],
        }
        for gid, cfg in GAME_REGISTRY.items()
    ]
