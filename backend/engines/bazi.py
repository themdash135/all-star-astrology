from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta
from typing import Any

from .common import (
    BAZI_BRANCHES,
    BAZI_HIDDEN_STEMS,
    BAZI_STEMS,
    CONTROLS,
    GENERATION,
    clamp,
    controlled_by,
    current_context_snapshot,
    element_relation,
    highlight,
    hour_branch_index,
    hour_stem_from_day_stem,
    insight,
    map_score_to_label,
    month_branch_from_solar_longitude,
    month_stem_from_year_stem,
    produced_by,
    round2,
    sexagenary_day_index,
    sexagenary_name,
    solar_longitude,
    stem_data,
    branch_data,
    table,
    year_pillar_from_lichun,
)

STEM_NAME_TO_INDEX = {data[0]: idx for idx, data in enumerate(BAZI_STEMS)}

# ── Chinese characters for stems and branches ──────────────────────
STEM_CHINESE = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
BRANCH_CHINESE = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

# ── Element colors (for frontend) ─────────────────────────────────
ELEMENT_COLORS = {
    "Wood": "#4caf50",
    "Fire": "#f44336",
    "Earth": "#ff9800",
    "Metal": "#ffd700",
    "Water": "#2196f3",
}

# ── Na Yin: 60 Jiazi cycle elements ───────────────────────────────
NA_YIN = [
    "Metal in the Sea", "Metal in the Sea",
    "Fire in the Furnace", "Fire in the Furnace",
    "Wood of the Forest", "Wood of the Forest",
    "Metal on the Road", "Metal on the Road",
    "Fire of the Thunderbolt", "Fire of the Thunderbolt",
    "Earth on the Roof", "Earth on the Roof",
    "Water in the Stream", "Water in the Stream",
    "Earth on the Wall", "Earth on the Wall",
    "Metal of the Hairpin", "Metal of the Hairpin",
    "Fire of the Mulberry", "Fire of the Mulberry",
    "Water of the Spring", "Water of the Spring",
    "Earth of the Sand", "Earth of the Sand",
    "Metal of the Sword", "Metal of the Sword",
    "Fire of the Mountain", "Fire of the Mountain",
    "Wood of the Flatland", "Wood of the Flatland",
    "Water of the River", "Water of the River",
    "Earth of the Fortress", "Earth of the Fortress",
    "Metal of the Axe", "Metal of the Axe",
    "Fire of the Lamp", "Fire of the Lamp",
    "Wood of the Pomegranate", "Wood of the Pomegranate",
    "Water of the Ocean", "Water of the Ocean",
    "Earth of the Thunderclap", "Earth of the Thunderclap",
    "Metal of the Mirror", "Metal of the Mirror",
    "Fire of the Peak", "Fire of the Peak",
    "Wood of the Willow", "Wood of the Willow",
    "Water of the Well", "Water of the Well",
    "Earth of the Roof Tiles", "Earth of the Roof Tiles",
    "Metal of the White Wax", "Metal of the White Wax",
    "Fire of the Sky", "Fire of the Sky",
    "Wood of the Cypress", "Wood of the Cypress",
    "Water of the Tap", "Water of the Tap",
    "Earth of the Earth", "Earth of the Earth",
]

# ── Branch combinations and clashes ───────────────────────────────
BRANCH_COMBINATIONS = {
    frozenset({"Zi", "Chou"}),
    frozenset({"Yin", "Hai"}),
    frozenset({"Mao", "Xu"}),
    frozenset({"Chen", "You"}),
    frozenset({"Si", "Shen"}),
    frozenset({"Wu", "Wei"}),
}

BRANCH_CLASHES = {
    frozenset({"Zi", "Wu"}),
    frozenset({"Chou", "Wei"}),
    frozenset({"Yin", "Shen"}),
    frozenset({"Mao", "You"}),
    frozenset({"Chen", "Xu"}),
    frozenset({"Si", "Hai"}),
}

BRANCH_HARMS = {
    frozenset({"Zi", "Wei"}),
    frozenset({"Chou", "Wu"}),
    frozenset({"Yin", "Si"}),
    frozenset({"Mao", "Chen"}),
    frozenset({"Shen", "Hai"}),
    frozenset({"You", "Xu"}),
}

BRANCH_DESTRUCTIONS = {
    frozenset({"Zi", "You"}),
    frozenset({"Chou", "Chen"}),
    frozenset({"Yin", "Hai"}),
    frozenset({"Mao", "Wu"}),
    frozenset({"Si", "Shen"}),
    frozenset({"Wei", "Xu"}),
}

PEACH_BLOSSOM_BRANCH = {
    "Zi": "You", "Chen": "You", "Shen": "You",
    "Chou": "Wu", "Si": "Wu", "You": "Wu",
    "Yin": "Mao", "Wu": "Mao", "Xu": "Mao",
    "Hai": "Zi", "Mao": "Zi", "Wei": "Zi",
}

# ── Na Yin interpretations ───────────────────────────────────────
NA_YIN_INTERPRETATIONS = {
    "Metal in the Sea": "Metal in the Sea represents hidden treasure — vast potential lying beneath the surface. You carry quiet wealth of spirit and resilience that reveals itself under pressure. Your strength is not showy but enduring, like gold resting on the ocean floor.",
    "Fire in the Furnace": "Fire in the Furnace is contained, purposeful flame — the forge that transforms raw material into something useful. You have the ability to refine ideas and people through focused intensity. Your passion works best when channeled into craft.",
    "Wood of the Forest": "Wood of the Forest represents abundant, communal growth. You thrive in groups and ecosystems, contributing to something larger than yourself. Your nature is generous, expansive, and deeply rooted in shared purpose.",
    "Metal on the Road": "Metal on the Road is the traveler's coin and the wanderer's blade — resourceful, mobile, and adaptable. You find value in movement and experience. Your strength lies in turning every journey into practical gain.",
    "Fire of the Thunderbolt": "Fire of the Thunderbolt is sudden, dramatic, and illuminating. You have the power to shock people awake with your ideas and presence. Brilliant but unpredictable, your energy creates breakthroughs when others see only dead ends.",
    "Earth on the Roof": "Earth on the Roof represents elevated stability — a vantage point built on solid ground. You see further than most because you build your foundations higher. Your gift is creating security that also provides perspective.",
    "Water in the Stream": "Water in the Stream is gentle, persistent, and life-giving. You nourish everything you touch with quiet consistency. Your power is not in force but in steady flow — wearing down obstacles through patience and grace.",
    "Earth on the Wall": "Earth on the Wall represents structure that protects and contains. You build solid foundations for others, and your greatest strength is creating security from seemingly fragile materials. You are the barrier between chaos and safety.",
    "Metal of the Hairpin": "Metal of the Hairpin is refined, decorative, and precise. You have an eye for beauty and detail that others miss. Your strength lies in turning the ordinary into the exquisite through careful attention and taste.",
    "Fire of the Mulberry": "Fire of the Mulberry is the slow burn of silk production — patient transformation that creates something precious. You understand that the most valuable outcomes require sustained warmth and time, not explosive heat.",
    "Water of the Spring": "Water of the Spring is pure origin energy — fresh, vital, and renewing. You have the gift of starting things cleanly, bringing fresh perspective wherever you go. Others are drawn to your clarity and sense of new beginning.",
    "Earth of the Sand": "Earth of the Sand is shifting, adaptable ground — capable of taking any shape. You are versatile and respond well to change, finding stability even in uncertain terrain. Your flexibility is your greatest asset.",
    "Metal of the Sword": "Metal of the Sword is decisive, sharp, and purposeful. You cut through confusion and get to the heart of things. Your directness and courage make you a natural problem-solver, but you must temper your edge with compassion.",
    "Fire of the Mountain": "Fire of the Mountain is the volcanic force beneath a calm exterior. You carry tremendous latent power that erupts at critical moments. Others may underestimate you, but your intensity runs deep and transforms landscapes.",
    "Wood of the Flatland": "Wood of the Flatland represents broad, open growth without limits. You expand horizontally, touching many lives and areas. Your nature is generous, accessible, and community-oriented — the meadow rather than the single tree.",
    "Water of the River": "Water of the River is powerful, directional, and unstoppable. Once you commit to a path, you carve through all obstacles. Your strength is in sustained momentum and the ability to carry others along with you.",
    "Earth of the Fortress": "Earth of the Fortress is impregnable stability and protective strength. You are the person others shelter behind. Your gift is creating unshakeable structures — in relationships, careers, and communities.",
    "Metal of the Axe": "Metal of the Axe is raw, functional power — the tool that clears the way. You are direct, efficient, and unafraid of hard work. Your strength lies in decisive action that makes space for new growth.",
    "Fire of the Lamp": "Fire of the Lamp is steady, guiding light in the darkness. You illuminate intimate spaces and bring warmth to close relationships. Your power is in constancy — always burning, always present when others need direction.",
    "Wood of the Pomegranate": "Wood of the Pomegranate represents hidden abundance — many seeds of potential within a single vessel. You carry multitudes within you, and your greatest gift is the variety and richness you bring to everything you touch.",
    "Water of the Ocean": "Water of the Ocean is vast, deep, and all-encompassing. You contain multitudes and move with tidal power. Your emotional depth and intellectual breadth make you a force of nature — patient, powerful, and impossible to contain.",
    "Earth of the Thunderclap": "Earth of the Thunderclap is sudden, startling solidity — the ground that shakes and settles stronger. You have the power to create dramatic shifts that ultimately stabilize. Your disruptions lead to better foundations.",
    "Metal of the Mirror": "Metal of the Mirror reflects truth with perfect clarity. You show others what they need to see, and your insight cuts through pretense. Your gift is honest perception — you understand situations and people at a glance.",
    "Fire of the Peak": "Fire of the Peak is the beacon on the mountaintop — visible to all, inspiring from a distance. You are meant to be seen and to guide. Your elevated passion draws others upward toward their own potential.",
    "Wood of the Willow": "Wood of the Willow is graceful resilience — bending without breaking, beautiful in any storm. You survive through flexibility and quiet strength. Your ability to adapt while staying rooted makes you nearly unbreakable.",
    "Water of the Well": "Water of the Well is deep, reliable sustenance — always there when needed. You are a dependable source of wisdom and emotional support. Your depth is not always visible on the surface, but those who draw from you find pure nourishment.",
    "Earth of the Roof Tiles": "Earth of the Roof Tiles is practical protection crafted with care. You create shelter and safety through methodical, skilled effort. Your strength is in the everyday structures that keep life running smoothly.",
    "Metal of the White Wax": "Metal of the White Wax is luminous purity — rare, beautiful, and refined through pressure. You have a gentle strength and an inner glow that comes from self-cultivation. Others see you as elegant and quietly powerful.",
    "Fire of the Sky": "Fire of the Sky is lightning and aurora — cosmic, dramatic, and awe-inspiring. You operate on a grand scale and think in sweeping visions. Your energy is electric and transformative, but it needs grounding to be sustained.",
    "Wood of the Cypress": "Wood of the Cypress is evergreen endurance — always growing, never losing your essential nature. You maintain your integrity through all seasons of life. Your constancy and quiet dignity earn deep, lasting respect.",
    "Water of the Tap": "Water of the Tap is controlled, accessible flow — bringing sustenance where it is needed most. You are practical, service-oriented, and deeply useful to your community. Your strength is in reliable delivery of what matters.",
    "Earth of the Earth": "Earth of the Earth is the purest expression of grounding energy — foundation upon foundation. You are deeply rooted, profoundly stable, and connected to the most fundamental forces of nature. Your presence alone calms and centers others.",
}

# ── Element practical advice ─────────────────────────────────────
ELEMENT_ADVICE = {
    "Wood": "surround yourself with plants, green spaces, and new beginnings — spend time outdoors, start creative projects, and embrace growth-oriented activities",
    "Fire": "bring in warm colors, candles, social gatherings, and passion projects — seek out inspiring experiences, engage in public speaking, or enjoy entertainment and celebration",
    "Earth": "focus on stability, nourishing food, grounding routines, and community — spend time in nature, garden, cook, and strengthen your home environment",
    "Metal": "embrace structure, organization, and refinement — declutter your space, invest in quality over quantity, practice discipline, and honor traditions",
    "Water": "seek flow, rest, and introspection — spend time near water, journal, meditate, prioritize sleep, and allow yourself to adapt rather than force outcomes",
}

ELEMENT_AVOID_ADVICE = {
    "Wood": "avoid excessive rigidity, over-planning, or pushing growth too aggressively — do not overcommit to new starts without finishing current projects",
    "Fire": "avoid overexposure, burnout, impulsive decisions, and emotional volatility — step back from drama and overstimulation",
    "Earth": "avoid overthinking, excessive worry, hoarding, or getting stuck in comfort zones — do not let caution become paralysis",
    "Metal": "avoid rigid routines, cold environments, excessive criticism, or perfectionism — do not let structure become a cage",
    "Water": "avoid isolation, emotional overwhelm, excessive passivity, or escapism — do not let introspection become withdrawal",
}

# ── Symbolic stars lookup by day branch ───────────────────────────
NOBLEMAN_STAR = {
    "Jia": ["Chou", "Wei"], "Yi": ["Zi", "Shen"], "Bing": ["You", "Hai"],
    "Ding": ["You", "Hai"], "Wu": ["Chou", "Wei"], "Ji": ["Zi", "Shen"],
    "Geng": ["Chou", "Wei"], "Xin": ["Yin", "Wu"], "Ren": ["Mao", "Si"],
    "Gui": ["Mao", "Si"],
}

ACADEMIC_STAR = {
    "Water": "Shen", "Wood": "Hai", "Fire": "Yin",
    "Metal": "Si", "Earth": "Shen",
}

TRAVELLING_HORSE = {
    "Zi": "Yin", "Chen": "Yin", "Shen": "Yin",
    "Chou": "Hai", "Si": "Hai", "You": "Hai",
    "Yin": "Shen", "Wu": "Shen", "Xu": "Shen",
    "Hai": "Si", "Mao": "Si", "Wei": "Si",
}

# ── Day Master personality profiles ───────────────────────────────
DAY_MASTER_PROFILES = {
    "Jia": {
        "title": "Jia Wood — The Towering Tree",
        "chinese": "甲木",
        "nature": "Yang Wood",
        "personality": "You are like a tall, upright tree — principled, ambitious, and steadfast. You value growth, integrity, and leadership. You tend to stand firm in your beliefs and naturally take charge in situations. Your sense of justice is strong, and you are drawn to causes larger than yourself.",
        "strengths": ["Natural leader", "Principled and ethical", "Resilient under pressure", "Growth-oriented mindset", "Protective of loved ones"],
        "challenges": ["Can be rigid or stubborn", "May resist compromise", "Sometimes too idealistic", "Difficulty adapting quickly"],
        "career": "Leadership, management, education, architecture, law, forestry, urban planning",
        "relationships": "You seek partners who respect your independence while offering warmth and nurturing. You are loyal and protective but need space to grow.",
    },
    "Yi": {
        "title": "Yi Wood — The Flexible Vine",
        "chinese": "乙木",
        "nature": "Yin Wood",
        "personality": "You are like a vine or flower — graceful, adaptable, and quietly persistent. You find ways around obstacles rather than confronting them head-on. Your charm and flexibility make you excellent at building relationships and navigating complex social situations.",
        "strengths": ["Highly adaptable", "Socially skilled", "Creative and artistic", "Gentle persuasion", "Resilient in subtle ways"],
        "challenges": ["Can be indecisive", "May avoid confrontation too much", "Sometimes overly dependent", "Can lose direction easily"],
        "career": "Arts, design, fashion, counseling, diplomacy, floristry, writing, healthcare",
        "relationships": "You seek harmony and emotional connection. You are nurturing and supportive but need a partner who provides stability and direction.",
    },
    "Bing": {
        "title": "Bing Fire — The Blazing Sun",
        "chinese": "丙火",
        "nature": "Yang Fire",
        "personality": "You are like the sun — radiant, warm, generous, and impossible to ignore. Your natural charisma lights up any room. You are passionate, optimistic, and have a big heart. You inspire others with your enthusiasm and vision.",
        "strengths": ["Charismatic and inspiring", "Generous and warm-hearted", "Visionary thinker", "Courageous and bold", "Natural optimist"],
        "challenges": ["Can be impulsive or dramatic", "May burn out from overgiving", "Sometimes scattered focus", "Ego can run hot"],
        "career": "Entertainment, media, public speaking, marketing, politics, energy sector, hospitality",
        "relationships": "You love passionately and openly. You need a partner who can match your energy and appreciate your warmth without being overwhelmed by your intensity.",
    },
    "Ding": {
        "title": "Ding Fire — The Candlelight",
        "chinese": "丁火",
        "nature": "Yin Fire",
        "personality": "You are like a candle flame — intimate, perceptive, and quietly brilliant. You illuminate the darkness with insight and warmth. Your intuition is sharp, and you have a gift for understanding people at a deep level.",
        "strengths": ["Deeply intuitive", "Thoughtful and perceptive", "Warm and caring in close circles", "Intellectual depth", "Strong inner vision"],
        "challenges": ["Can be moody or anxious", "May overthink situations", "Sometimes withdrawn", "Prone to emotional intensity"],
        "career": "Psychology, research, writing, spirituality, fine arts, technology, medicine",
        "relationships": "You form deep, meaningful bonds. You need emotional depth and intellectual stimulation from your partner. Surface-level connections leave you cold.",
    },
    "Wu": {
        "title": "Wu Earth — The Great Mountain",
        "chinese": "戊土",
        "nature": "Yang Earth",
        "personality": "You are like a mountain — solid, dependable, and immovable. People naturally trust and rely on you. You have great patience and a grounding presence that calms those around you. Your loyalty and steadiness are your greatest assets.",
        "strengths": ["Extremely reliable", "Patient and steady", "Strong and protective", "Excellent mediator", "Grounded in reality"],
        "challenges": ["Can be too conservative", "May resist change", "Sometimes possessive", "Slow to take action"],
        "career": "Real estate, banking, agriculture, construction, government, insurance, mining",
        "relationships": "You are a devoted partner who values stability and commitment. You express love through actions rather than words and seek a partner who appreciates loyalty.",
    },
    "Ji": {
        "title": "Ji Earth — The Fertile Garden",
        "chinese": "己土",
        "nature": "Yin Earth",
        "personality": "You are like fertile soil — nurturing, resourceful, and constantly producing. You have a gift for taking care of others and creating abundance from seemingly nothing. Your warmth draws people to you naturally.",
        "strengths": ["Nurturing and supportive", "Resourceful and practical", "Emotionally intelligent", "Good with finances", "Creates harmony"],
        "challenges": ["Can worry excessively", "May be overly self-sacrificing", "Sometimes manipulative when stressed", "Tendency to hoard"],
        "career": "Food industry, healthcare, childcare, human resources, finance, gardening, charity",
        "relationships": "You are deeply caring and attentive. You tend to give a lot in relationships and need a partner who reciprocates your generosity and doesn't take advantage.",
    },
    "Geng": {
        "title": "Geng Metal — The Mighty Sword",
        "chinese": "庚金",
        "nature": "Yang Metal",
        "personality": "You are like a sword or axe — sharp, decisive, and powerful. You have a strong sense of justice and are not afraid to cut through complications. Your directness and courage make you a formidable ally and a respected leader.",
        "strengths": ["Decisive and action-oriented", "Strong sense of justice", "Courageous and tough", "Loyal and direct", "Natural fighter and protector"],
        "challenges": ["Can be harsh or blunt", "May be overly aggressive", "Difficulty showing vulnerability", "Sometimes ruthless"],
        "career": "Military, law enforcement, surgery, engineering, fitness, martial arts, metalwork, technology",
        "relationships": "You value honesty and strength in a partner. You protect fiercely but struggle with emotional expression. You need a partner who can soften your edges.",
    },
    "Xin": {
        "title": "Xin Metal — The Precious Jewel",
        "chinese": "辛金",
        "nature": "Yin Metal",
        "personality": "You are like a gemstone — refined, beautiful, and valuable. You have high standards and an eye for quality. Your sensitivity and taste set you apart. Beneath your polished exterior is a sharp mind and a vulnerable heart.",
        "strengths": ["Refined taste and standards", "Sharp intellect", "Sensitive and empathetic", "Artistic sensibility", "Detail-oriented"],
        "challenges": ["Can be perfectionistic", "May be overly critical", "Sensitive to criticism", "Sometimes vain or materialistic"],
        "career": "Jewelry, luxury goods, finance, law, beauty industry, technology, music, precision work",
        "relationships": "You seek beauty and quality in relationships. You are romantic and attentive but can be demanding. You need a partner who meets your standards while accepting your sensitivity.",
    },
    "Ren": {
        "title": "Ren Water — The Mighty Ocean",
        "chinese": "壬水",
        "nature": "Yang Water",
        "personality": "You are like the ocean — vast, powerful, and constantly moving. Your mind is expansive and you think in big, sweeping terms. You are adventurous, philosophical, and drawn to exploration of all kinds.",
        "strengths": ["Visionary and big-picture thinker", "Adventurous and free-spirited", "Intelligent and philosophical", "Adaptable to any situation", "Strong survival instinct"],
        "challenges": ["Can be restless or unfocused", "May lack follow-through", "Sometimes reckless", "Difficulty with routine"],
        "career": "Travel, import/export, shipping, philosophy, technology, consulting, journalism, exploration",
        "relationships": "You need freedom in relationships. You are generous and exciting but can be unpredictable. You seek a partner who can ride the waves with you.",
    },
    "Gui": {
        "title": "Gui Water — The Morning Dew",
        "chinese": "癸水",
        "nature": "Yin Water",
        "personality": "You are like morning dew or rain — subtle, nourishing, and perceptive. You have extraordinary intuition and a gentle yet penetrating mind. You see through surfaces to the hidden layers beneath.",
        "strengths": ["Exceptional intuition", "Quietly influential", "Deep emotional intelligence", "Creative and imaginative", "Patient and persistent"],
        "challenges": ["Can be secretive", "May be overly passive", "Prone to depression if stagnant", "Difficulty asserting boundaries"],
        "career": "Research, psychology, occult sciences, writing, healing, music, spiritual work, data analysis",
        "relationships": "You connect at a soul level. You are devoted and intuitive about your partner's needs but can be hard to read. You need a partner who can navigate your emotional depths.",
    },
}

# ── Ten God descriptions ──────────────────────────────────────────
TEN_GOD_INFO = {
    "Friend": {"chinese": "比肩", "category": "Parallel", "element_type": "self"},
    "Rob Wealth": {"chinese": "劫财", "category": "Parallel", "element_type": "self"},
    "Eating God": {"chinese": "食神", "category": "Output", "element_type": "output"},
    "Hurting Officer": {"chinese": "伤官", "category": "Output", "element_type": "output"},
    "Indirect Wealth": {"chinese": "偏财", "category": "Wealth", "element_type": "wealth"},
    "Direct Wealth": {"chinese": "正财", "category": "Wealth", "element_type": "wealth"},
    "Seven Killings": {"chinese": "七杀", "category": "Power", "element_type": "power"},
    "Direct Officer": {"chinese": "正官", "category": "Power", "element_type": "power"},
    "Indirect Resource": {"chinese": "偏印", "category": "Resource", "element_type": "resource"},
    "Direct Resource": {"chinese": "正印", "category": "Resource", "element_type": "resource"},
}


def _ten_god(day_stem_idx: int, other_stem_idx: int) -> str:
    dm_name, dm_element, dm_polarity = BAZI_STEMS[day_stem_idx]
    other_name, other_element, other_polarity = BAZI_STEMS[other_stem_idx]
    same_polarity = dm_polarity == other_polarity
    relation = element_relation(dm_element, other_element)
    if relation == "same":
        return "Friend" if same_polarity else "Rob Wealth"
    if relation == "produces":
        return "Eating God" if same_polarity else "Hurting Officer"
    if relation == "controls":
        return "Indirect Wealth" if same_polarity else "Direct Wealth"
    if relation == "controlled_by":
        return "Seven Killings" if same_polarity else "Direct Officer"
    if relation == "resource":
        return "Indirect Resource" if same_polarity else "Direct Resource"
    return f"{dm_name} to {other_name}"


def _na_yin(stem_idx: int, branch_idx: int) -> str:
    sexagenary = (stem_idx % 10) + (branch_idx % 12)
    # The proper sexagenary index: find the 60-cycle position
    # stem_idx cycles 0-9, branch_idx cycles 0-11
    # The sexagenary pair number: both must share parity
    idx = (stem_idx % 10) * 6 + (branch_idx % 12) // 2
    return NA_YIN[idx % 60]


def _pillar(stem_idx: int, branch_idx: int, day_stem_idx: int) -> dict[str, Any]:
    stem_name, stem_element, stem_polarity = BAZI_STEMS[stem_idx]
    branch_name, animal, branch_element = BAZI_BRANCHES[branch_idx]
    hidden = [
        {
            "stem": name,
            "chinese": STEM_CHINESE[STEM_NAME_TO_INDEX.get(name, 0)],
            "element": BAZI_STEMS[STEM_NAME_TO_INDEX.get(name, 0)][1],
            "weight": weight,
            "ten_god": _ten_god(day_stem_idx, STEM_NAME_TO_INDEX.get(name, 0)),
        }
        for name, weight in BAZI_HIDDEN_STEMS[branch_name]
    ]
    tg = _ten_god(day_stem_idx, stem_idx)
    tg_info = TEN_GOD_INFO.get(tg, {})
    return {
        "stem_index": stem_idx,
        "branch_index": branch_idx,
        "stem": stem_name,
        "stem_chinese": STEM_CHINESE[stem_idx % 10],
        "stem_element": stem_element,
        "stem_polarity": stem_polarity,
        "stem_color": ELEMENT_COLORS[stem_element],
        "branch": branch_name,
        "branch_chinese": BRANCH_CHINESE[branch_idx % 12],
        "animal": animal,
        "branch_element": branch_element,
        "branch_color": ELEMENT_COLORS[branch_element],
        "name": f"{stem_name} {branch_name}",
        "chinese_name": f"{STEM_CHINESE[stem_idx % 10]}{BRANCH_CHINESE[branch_idx % 12]}",
        "ten_god": tg,
        "ten_god_chinese": tg_info.get("chinese", ""),
        "ten_god_category": tg_info.get("category", ""),
        "na_yin": _na_yin(stem_idx, branch_idx),
        "hidden_stems": hidden,
    }


def _four_pillars(local_dt, jd_ut) -> dict[str, Any]:
    year_stem, year_branch = year_pillar_from_lichun(local_dt)
    month_branch = month_branch_from_solar_longitude(solar_longitude(jd_ut))
    month_stem = month_stem_from_year_stem(year_stem, month_branch)
    day_index = sexagenary_day_index(local_dt)
    day_stem = day_index % 10
    day_branch = day_index % 12
    hour_branch = hour_branch_index(local_dt.time())
    hour_stem = hour_stem_from_day_stem(day_stem, hour_branch)

    return {
        "year": _pillar(year_stem, year_branch, day_stem),
        "month": _pillar(month_stem, month_branch, day_stem),
        "day": _pillar(day_stem, day_branch, day_stem),
        "hour": _pillar(hour_stem, hour_branch, day_stem),
        "day_index": day_index,
    }


def _element_balance(pillars: dict[str, Any]) -> dict[str, Any]:
    totals = Counter({"Wood": 0.0, "Fire": 0.0, "Earth": 0.0, "Metal": 0.0, "Water": 0.0})
    for key in ["year", "month", "day", "hour"]:
        pillar = pillars[key]
        totals[pillar["stem_element"]] += 2.0
        for hidden in pillar["hidden_stems"]:
            hidden_idx = STEM_NAME_TO_INDEX.get(hidden["stem"], 0)
            totals[BAZI_STEMS[hidden_idx][1]] += hidden["weight"]
    total_weight = sum(totals.values()) or 1.0
    percentages = {element: round2(value / total_weight * 100) for element, value in totals.items()}
    dominant = max(totals.items(), key=lambda item: item[1])[0]
    weakest = min(totals.items(), key=lambda item: item[1])[0]
    return {
        "totals": {key: round2(value) for key, value in totals.items()},
        "percentages": percentages,
        "colors": ELEMENT_COLORS,
        "dominant": dominant,
        "weakest": weakest,
    }


def _day_master_strength(pillars: dict[str, Any], balance: dict[str, Any]) -> dict[str, Any]:
    day_master_element = pillars["day"]["stem_element"]
    resource_element = produced_by(day_master_element)
    support = balance["totals"][day_master_element] + balance["totals"][resource_element]
    drain = sum(value for element, value in balance["totals"].items() if element not in {day_master_element, resource_element})
    month_element = pillars["month"]["branch_element"]
    season_bonus = 0.0
    if month_element == day_master_element:
        season_bonus += 2.0
    elif month_element == resource_element:
        season_bonus += 1.2
    elif CONTROLS[month_element] == day_master_element:
        season_bonus -= 1.5
    support += season_bonus

    total = support + drain or 1.0
    support_pct = round2(support / total * 100)
    drain_pct = round2(drain / total * 100)

    strong = support >= drain
    if strong:
        favorable = [GENERATION[day_master_element], CONTROLS[day_master_element], controlled_by(day_master_element)]
        unfavorable = [day_master_element, resource_element]
        strategy = "The Day Master is strong — you thrive when channeling energy outward through output, wealth pursuit, and taking on responsibility."
    else:
        favorable = [day_master_element, resource_element]
        unfavorable = [GENERATION[day_master_element], CONTROLS[day_master_element], controlled_by(day_master_element)]
        strategy = "The Day Master needs support — you do best when nourished by your own element and resource element. Avoid overextending."

    return {
        "day_master_element": day_master_element,
        "day_master_color": ELEMENT_COLORS[day_master_element],
        "resource_element": resource_element,
        "support_score": round2(support),
        "drain_score": round2(drain),
        "support_pct": support_pct,
        "drain_pct": drain_pct,
        "season_bonus": round2(season_bonus),
        "strong": strong,
        "strength_label": "Strong" if strong else "Weak",
        "favorable": favorable,
        "unfavorable": unfavorable,
        "favorable_colors": [ELEMENT_COLORS[e] for e in favorable],
        "unfavorable_colors": [ELEMENT_COLORS[e] for e in unfavorable],
        "strategy": strategy,
    }


def _symbolic_stars(natal: dict[str, Any]) -> list[dict[str, Any]]:
    stars = []
    day_stem = natal["day"]["stem"]
    day_branch = natal["day"]["branch"]
    year_branch = natal["year"]["branch"]
    all_branches = [natal[k]["branch"] for k in ["year", "month", "day", "hour"]]

    # Nobleman Star (Tian Yi Gui Ren)
    noble_branches = NOBLEMAN_STAR.get(day_stem, [])
    for b in all_branches:
        if b in noble_branches:
            stars.append({
                "name": "Nobleman Star",
                "chinese": "天乙贵人",
                "description": "Help from influential people arrives when you need it most. You attract benefactors and mentors naturally.",
                "found_in": b,
                "positive": True,
            })
            break

    # Academic Star (Wen Chang)
    dm_element = natal["day"]["stem_element"]
    academic_branch = ACADEMIC_STAR.get(dm_element, "")
    for b in all_branches:
        if b == academic_branch:
            stars.append({
                "name": "Academic Star",
                "chinese": "文昌",
                "description": "Strong aptitude for learning, writing, and intellectual pursuits. Academic success comes more easily.",
                "found_in": b,
                "positive": True,
            })
            break

    # Travelling Horse (Yi Ma)
    horse_branch = TRAVELLING_HORSE.get(year_branch, "")
    for b in all_branches:
        if b == horse_branch:
            stars.append({
                "name": "Travelling Horse",
                "chinese": "驿马",
                "description": "A life involving travel, movement, and change. You are restless and drawn to new horizons.",
                "found_in": b,
                "positive": True,
            })
            break

    # Peach Blossom (Tao Hua)
    peach = PEACH_BLOSSOM_BRANCH.get(day_branch, "")
    for b in all_branches:
        if b == peach:
            stars.append({
                "name": "Peach Blossom",
                "chinese": "桃花",
                "description": "Strong romantic appeal and charm. You attract attention and admirers easily. Can indicate artistic talent.",
                "found_in": b,
                "positive": True,
            })
            break

    # Branch interactions as stars
    for i, a in enumerate(all_branches):
        for b in all_branches[i + 1:]:
            pair = frozenset({a, b})
            if pair in BRANCH_CLASHES:
                stars.append({
                    "name": "Branch Clash",
                    "chinese": "相冲",
                    "description": f"{a} clashes with {b} — tension, disruption, and forced change in the areas governed by these pillars.",
                    "found_in": f"{a}–{b}",
                    "positive": False,
                })
            if pair in BRANCH_HARMS:
                stars.append({
                    "name": "Branch Harm",
                    "chinese": "相害",
                    "description": f"{a} harms {b} — hidden resentment, betrayal, or health issues related to these pillars.",
                    "found_in": f"{a}–{b}",
                    "positive": False,
                })

    return stars


def _da_yun(natal: dict[str, Any], birth_year: int, gender: str) -> list[dict[str, Any]]:
    """Calculate 10-Year Luck Periods (Da Yun / 大运)."""
    day_stem_idx = natal["day"]["stem_index"]
    year_stem_polarity = BAZI_STEMS[natal["year"]["stem_index"]][2]
    is_male = gender.lower() in ("male", "m", "man", "boy")

    # Direction: forward if (male+yang) or (female+yin), backward otherwise
    forward = (is_male and year_stem_polarity == "Yang") or (not is_male and year_stem_polarity == "Yin")

    month_stem = natal["month"]["stem_index"]
    month_branch = natal["month"]["branch_index"]

    periods = []
    for i in range(9):  # 9 luck periods covering ~90 years
        offset = i + 1 if forward else -(i + 1)
        stem = (month_stem + offset) % 10
        branch = (month_branch + offset) % 12
        start_age = 1 + i * 10
        end_age = start_age + 9
        start_year = birth_year + start_age
        end_year = birth_year + end_age

        stem_name, stem_element, stem_polarity = BAZI_STEMS[stem]
        branch_name, animal, branch_element = BAZI_BRANCHES[branch]
        tg = _ten_god(day_stem_idx, stem)
        tg_info = TEN_GOD_INFO.get(tg, {})

        periods.append({
            "index": i,
            "start_age": start_age,
            "end_age": end_age,
            "start_year": start_year,
            "end_year": end_year,
            "age_range": f"{start_age}–{end_age}",
            "year_range": f"{start_year}–{end_year}",
            "stem": stem_name,
            "stem_chinese": STEM_CHINESE[stem],
            "stem_element": stem_element,
            "stem_color": ELEMENT_COLORS[stem_element],
            "branch": branch_name,
            "branch_chinese": BRANCH_CHINESE[branch],
            "animal": animal,
            "branch_element": branch_element,
            "branch_color": ELEMENT_COLORS[branch_element],
            "pillar_name": f"{stem_name} {branch_name}",
            "chinese_name": f"{STEM_CHINESE[stem]}{BRANCH_CHINESE[branch]}",
            "ten_god": tg,
            "ten_god_chinese": tg_info.get("chinese", ""),
            "na_yin": _na_yin(stem, branch),
        })

    return periods


def _branch_interaction(a: str, b: str) -> tuple[int, str]:
    if a == b:
        return 4, "same branch resonance"
    if frozenset({a, b}) in BRANCH_COMBINATIONS:
        return 6, "branch combination"
    if frozenset({a, b}) in BRANCH_CLASHES:
        return -7, "branch clash"
    return 0, "neutral branch relation"


def _apply(score_map: dict[str, float], reasons: dict[str, list[str]], key: str, delta: float, reason: str) -> None:
    score_map[key] += delta
    sign = "+" if delta >= 0 else ""
    reasons[key].append(f"{sign}{delta:.1f}: {reason}")


def _score_chart(natal: dict[str, Any], current: dict[str, Any], balance: dict[str, Any], strength: dict[str, Any]) -> tuple[dict[str, float], dict[str, list[str]]]:
    scores = {"love": 50.0, "career": 50.0, "health": 50.0, "wealth": 50.0, "mood": 50.0}
    reasons = {key: [] for key in scores}

    dm_element = strength["day_master_element"]
    resource_element = strength["resource_element"]
    output_element = GENERATION[dm_element]
    wealth_element = CONTROLS[dm_element]
    authority_element = controlled_by(dm_element)

    current_elements = [
        current["year"]["stem_element"],
        current["year"]["branch_element"],
        current["month"]["stem_element"],
        current["month"]["branch_element"],
        current["day"]["stem_element"],
        current["day"]["branch_element"],
    ]
    current_counts = Counter(current_elements)

    for element, count in current_counts.items():
        if element in strength["favorable"]:
            _apply(scores, reasons, "career", count * 1.8, f"Current pillars emphasize favorable element {element}")
            _apply(scores, reasons, "wealth", count * 1.6, f"Current pillars emphasize favorable element {element}")
            _apply(scores, reasons, "mood", count * 1.2, f"Current pillars emphasize favorable element {element}")
        if element == wealth_element:
            _apply(scores, reasons, "wealth", count * 2.6, f"Current pillars activate wealth element {wealth_element}")
            _apply(scores, reasons, "love", count * 1.5, "Relationship chemistry is stimulated by real-world exchange")
        if element == authority_element:
            _apply(scores, reasons, "career", count * 2.2, f"Current pillars activate authority element {authority_element}")
            _apply(scores, reasons, "love", count * 1.2, "Partnership and commitment themes become more visible")
        if element == output_element:
            _apply(scores, reasons, "career", count * 1.6, f"Current pillars activate output element {output_element}")
        if element == resource_element:
            _apply(scores, reasons, "health", count * 1.4, f"Current pillars provide resource element {resource_element}")
            _apply(scores, reasons, "mood", count * 1.2, f"Current pillars provide resource element {resource_element}")

    dominant = balance["dominant"]
    weakest = balance["weakest"]
    if current_counts[dominant] >= 3 and dominant not in strength["favorable"]:
        _apply(scores, reasons, "health", -5.0, f"The already dominant natal element {dominant} is being overloaded")
        _apply(scores, reasons, "mood", -4.0, f"The already dominant natal element {dominant} is being overloaded")
    if current_counts[weakest] >= 1:
        _apply(scores, reasons, "health", 3.0, f"Current pillars supply the natal weak point element {weakest}")
        _apply(scores, reasons, "mood", 2.0, f"Current pillars supply the natal weak point element {weakest}")

    natal_day_branch = natal["day"]["branch"]
    natal_year_branch = natal["year"]["branch"]
    for current_branch in [current["year"]["branch"], current["month"]["branch"], current["day"]["branch"]]:
        delta, text = _branch_interaction(natal_day_branch, current_branch)
        _apply(scores, reasons, "mood", delta * 0.8, f"Day branch relation: {text}")
        _apply(scores, reasons, "health", delta * 0.55, f"Day branch relation: {text}")
        _apply(scores, reasons, "love", delta * 0.7, f"Day branch relation: {text}")

        delta_year, text_year = _branch_interaction(natal_year_branch, current_branch)
        _apply(scores, reasons, "career", delta_year * 0.6, f"Year branch relation: {text_year}")
        _apply(scores, reasons, "wealth", delta_year * 0.55, f"Year branch relation: {text_year}")

    peach_branch = PEACH_BLOSSOM_BRANCH[natal_day_branch]
    if current["year"]["branch"] == peach_branch or current["month"]["branch"] == peach_branch or current["day"]["branch"] == peach_branch:
        _apply(scores, reasons, "love", 6.0, f"Peach blossom branch {peach_branch} is activated")
        _apply(scores, reasons, "mood", 2.5, f"Peach blossom branch {peach_branch} increases magnetism")

    if strength["strong"]:
        _apply(scores, reasons, "career", 2.5, "A strong day master can use pressure productively")
        _apply(scores, reasons, "wealth", 2.0, "A strong day master can convert opportunity into results")
    else:
        _apply(scores, reasons, "health", 2.0, "A weaker day master does better when supported and paced well")

    return ({key: round2(clamp(value, 5, 95)) for key, value in scores.items()}, reasons)


def _find_current_luck_period(luck_periods: list[dict], age: int) -> dict | None:
    for period in luck_periods:
        if period["start_age"] <= age <= period["end_age"]:
            return period
    return None


def calculate(context: dict[str, Any]) -> dict[str, Any]:
    natal = _four_pillars(context["birth_local"], context["jd_ut"])
    current = _four_pillars(context["now_local"], context["current_jd_ut"])
    balance = _element_balance(natal)
    strength = _day_master_strength(natal, balance)

    scores, reason_map = _score_chart(natal, current, balance, strength)

    # Symbolic stars
    stars = _symbolic_stars(natal)

    # Da Yun (10-year luck periods)
    birth_year = context["birth_local"].year
    gender = context.get("gender", "male")
    luck_periods = _da_yun(natal, birth_year, gender)

    # Current age and active luck period
    age = context.get("age", 0)
    if not age:
        age = (context["now_local"] - context["birth_local"]).days // 365
    current_luck = _find_current_luck_period(luck_periods, age)

    # Day Master profile
    dm_stem = natal["day"]["stem"]
    dm_profile = DAY_MASTER_PROFILES.get(dm_stem, {})

    # Build pillar data for frontend (enriched)
    pillars_data = {}
    for key in ["year", "month", "day", "hour"]:
        p = natal[key]
        pillars_data[key] = p

    # Branch interactions between natal pillars
    branch_interactions = []
    pillar_keys = ["year", "month", "day", "hour"]
    for i, k1 in enumerate(pillar_keys):
        for k2 in pillar_keys[i + 1:]:
            b1 = natal[k1]["branch"]
            b2 = natal[k2]["branch"]
            pair = frozenset({b1, b2})
            interaction = None
            if pair in BRANCH_COMBINATIONS:
                interaction = {"type": "combination", "label": "Combination", "chinese": "六合", "positive": True}
            elif pair in BRANCH_CLASHES:
                interaction = {"type": "clash", "label": "Clash", "chinese": "相冲", "positive": False}
            elif pair in BRANCH_HARMS:
                interaction = {"type": "harm", "label": "Harm", "chinese": "相害", "positive": False}
            elif pair in BRANCH_DESTRUCTIONS:
                interaction = {"type": "destruction", "label": "Destruction", "chinese": "相破", "positive": False}
            if interaction:
                interaction["pillars"] = f"{k1.title()}–{k2.title()}"
                interaction["branches"] = f"{b1}–{b2}"
                branch_interactions.append(interaction)

    # Tables for detailed data tab (kept for backward compat)
    natal_rows = []
    for key in ["year", "month", "day", "hour"]:
        pillar = natal[key]
        natal_rows.append([
            key.title(),
            pillar["stem"],
            pillar["branch"],
            pillar["animal"],
            pillar["stem_element"],
            pillar["ten_god"],
        ])

    hidden_rows = []
    for key in ["year", "month", "day", "hour"]:
        pillar = natal[key]
        hidden_rows.append([
            key.title(),
            ", ".join(f"{item['stem']} ({item['ten_god']}, {item['weight']})" for item in pillar["hidden_stems"]),
        ])

    element_rows = [[element, value] for element, value in balance["totals"].items()]
    current_rows = []
    for key in ["year", "month", "day", "hour"]:
        pillar = current[key]
        current_rows.append([key.title(), pillar["name"], pillar["animal"], pillar["stem_element"], pillar["ten_god"]])

    driver_rows = []
    for category in ["love", "career", "health", "wealth", "mood"]:
        for line in reason_map[category][:6]:
            driver_rows.append([category.title(), line])

    day_master = natal["day"]
    headline = f"{day_master['stem_chinese']} {day_master['stem']} {day_master['stem_element']} Day Master"

    summary = [
        f"Your Day Master is {day_master['stem']} ({day_master['stem_chinese']}) — {day_master['stem_element']} {day_master['stem_polarity']}. This is the core of your BaZi chart and defines how you interact with the world.",
        f"Element balance: {balance['dominant']} dominates at {balance['percentages'][balance['dominant']]}%, while {balance['weakest']} is weakest at {balance['percentages'][balance['weakest']]}%. {strength['strategy']}",
        f"Current transit pillars are {current['year']['chinese_name']} {current['month']['chinese_name']} {current['day']['chinese_name']} {current['hour']['chinese_name']}, shaping today's energy.",
    ]

    highlights = [
        highlight("Day Master", f"{day_master['stem_chinese']} {day_master['stem']} ({day_master['stem_element']})"),
        highlight("Strength", strength["strength_label"]),
        highlight("Year pillar", f"{natal['year']['chinese_name']} {natal['year']['name']}"),
        highlight("Month pillar", f"{natal['month']['chinese_name']} {natal['month']['name']}"),
        highlight("Day pillar", f"{natal['day']['chinese_name']} {natal['day']['name']}"),
        highlight("Hour pillar", f"{natal['hour']['chinese_name']} {natal['hour']['name']}"),
        highlight("Dominant element", f"{balance['dominant']} ({balance['percentages'][balance['dominant']]}%)"),
        highlight("Weakest element", f"{balance['weakest']} ({balance['percentages'][balance['weakest']]}%)"),
        highlight("Favorable elements", ", ".join(strength["favorable"])),
        highlight("Unfavorable elements", ", ".join(strength.get("unfavorable", []))),
    ]

    # ── Build enriched insights ──
    dm_personality_snippet = ""
    if dm_profile:
        dm_personality_snippet = f" {dm_profile.get('personality', '')}"

    na_yin_name = natal["day"]["na_yin"]
    na_yin_meaning = NA_YIN_INTERPRETATIONS.get(na_yin_name, "")

    # Element strategy: actionable advice based on favorable/unfavorable
    favorable_elements = strength["favorable"]
    unfavorable_elements = strength.get("unfavorable", [])
    favorable_advice_parts = [ELEMENT_ADVICE[e] for e in favorable_elements if e in ELEMENT_ADVICE]
    unfavorable_advice_parts = [ELEMENT_AVOID_ADVICE[e] for e in unfavorable_elements if e in ELEMENT_AVOID_ADVICE]
    element_strategy_text = strength["strategy"]
    if favorable_advice_parts:
        element_strategy_text += f" {' and '.join(e for e in favorable_elements)} support you — {'; '.join(favorable_advice_parts)}."
    if unfavorable_advice_parts:
        element_strategy_text += f" Reduce excess {' and '.join(e for e in unfavorable_elements)} energy: {'; '.join(unfavorable_advice_parts)}."

    # Element balance: visual-friendly percentages with meaning
    pct = balance["percentages"]
    dominant_el = balance["dominant"]
    weakest_el = balance["weakest"]
    sorted_elements = sorted(pct.items(), key=lambda x: x[1], reverse=True)
    pct_breakdown = ", ".join(f"{el} {val}%" for el, val in sorted_elements)
    element_balance_meaning = f"Your element distribution is {pct_breakdown}. "
    element_balance_meaning += f"{dominant_el} dominates at {pct[dominant_el]}% while {weakest_el} is scarce at {pct[weakest_el]}%. "
    if dominant_el == "Metal":
        element_balance_meaning += "This suggests strong determination and structure, but watch for emotional dryness or difficulty going with the flow."
    elif dominant_el == "Water":
        element_balance_meaning += "This suggests deep intuition and adaptability, but watch for lack of direction or difficulty setting firm boundaries."
    elif dominant_el == "Wood":
        element_balance_meaning += "This suggests strong growth energy and ambition, but watch for impatience or overextending yourself."
    elif dominant_el == "Fire":
        element_balance_meaning += "This suggests high passion and visibility, but watch for burnout, impulsiveness, or difficulty with sustained focus."
    elif dominant_el == "Earth":
        element_balance_meaning += "This suggests groundedness and reliability, but watch for overthinking, stubbornness, or resistance to change."
    if weakest_el == "Water":
        element_balance_meaning += " Low Water can mean difficulty relaxing, trusting your intuition, or going with the flow."
    elif weakest_el == "Fire":
        element_balance_meaning += " Low Fire can mean difficulty with self-expression, visibility, or sustaining enthusiasm."
    elif weakest_el == "Wood":
        element_balance_meaning += " Low Wood can mean difficulty starting new projects, asserting yourself, or maintaining growth momentum."
    elif weakest_el == "Metal":
        element_balance_meaning += " Low Metal can mean difficulty with discipline, letting go, or maintaining clear boundaries."
    elif weakest_el == "Earth":
        element_balance_meaning += " Low Earth can mean difficulty with stability, routine, or feeling grounded and secure."

    insights = [
        insight("Day Master", f"The Day Master {day_master['stem']} ({day_master['stem_chinese']}) is {day_master['stem_element']} {day_master['stem_polarity']}. All Ten God relationships in your chart are measured from this stem.{dm_personality_snippet}"),
        insight("Strength analysis", f"Supporting elements score {strength['support_score']} ({strength['support_pct']}%) vs draining elements {strength['drain_score']} ({strength['drain_pct']}%). Season bonus: {strength['season_bonus']}. The Day Master is {'strong' if strength['strong'] else 'weak'}."),
        insight("Element strategy", element_strategy_text),
        insight("Na Yin", f"Your Day Pillar Na Yin is \"{na_yin_name}\" — this is the sound-element of your birth day in the 60 Jiazi cycle. {na_yin_meaning}"),
        insight("Element balance", element_balance_meaning),
        insight("Current timing", f"Today's pillars are {current['year']['name']}, {current['month']['name']}, {current['day']['name']}, and {current['hour']['name']}. These transit energies interact with your natal chart to produce the current alignment scores."),
    ]

    return {
        "id": "bazi",
        "name": "BaZi (Four Pillars)",
        "headline": headline,
        "summary": summary,
        "highlights": highlights,
        "scores": {key: {"value": value, "label": map_score_to_label(value)} for key, value in scores.items()},
        "insights": insights,
        # ── New enriched data for frontend ──
        "pillars": pillars_data,
        "current_pillars": {k: current[k] for k in ["year", "month", "day", "hour"]},
        "element_balance": balance,
        "day_master_strength": strength,
        "day_master_profile": dm_profile,
        "symbolic_stars": stars,
        "luck_periods": luck_periods,
        "current_luck_period": current_luck,
        "branch_interactions": branch_interactions,
        "age": age,
        # ── Legacy tables ──
        "tables": [
            table("Natal Four Pillars", ["Pillar", "Stem", "Branch", "Animal", "Stem element", "Ten God"], natal_rows),
            table("Hidden stems", ["Pillar", "Hidden stems"], hidden_rows),
            table("Element balance", ["Element", "Weight"], element_rows),
            table("Current pillars", ["Pillar", "Pillar name", "Animal", "Stem element", "Ten God"], current_rows),
            table("Score drivers", ["Area", "Driver"], driver_rows),
        ],
        "meta": {
            "engine_type": "Solar-term BaZi with Li Chun year boundary",
            "day_master_strength": strength,
            "context": current_context_snapshot(context),
        },
    }
