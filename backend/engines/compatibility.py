"""
Love & Compatibility Engine — cross-chart analysis across all 8 astrological systems.

Takes two complete readings (user + partner) and produces per-system compatibility
profiles including personality breakdowns, interaction dynamics, best matches, and advice.
"""
from __future__ import annotations

import random
from typing import Any, Literal

# ═══════════════════════════════════════════════════════════════
# INTENT MODES — adapt tone/emphasis without changing structure
# ═══════════════════════════════════════════════════════════════

VALID_INTENTS = ("dating", "serious", "marriage", "healing")
Intent = Literal["dating", "serious", "marriage", "healing"]

# ═══════════════════════════════════════════════════════════════
# WESTERN ASTROLOGY TABLES
# ═══════════════════════════════════════════════════════════════

SIGN_ELEMENT = {
    "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
    "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
    "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
    "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water",
}

SIGN_MODALITY = {
    "Aries": "Cardinal", "Cancer": "Cardinal", "Libra": "Cardinal", "Capricorn": "Cardinal",
    "Taurus": "Fixed", "Leo": "Fixed", "Scorpio": "Fixed", "Aquarius": "Fixed",
    "Gemini": "Mutable", "Virgo": "Mutable", "Sagittarius": "Mutable", "Pisces": "Mutable",
}

ELEMENT_COMPAT = {
    ("Fire", "Fire"): 78, ("Fire", "Air"): 85, ("Fire", "Earth"): 50, ("Fire", "Water"): 42,
    ("Air", "Air"): 72, ("Air", "Earth"): 48, ("Air", "Water"): 55,
    ("Earth", "Earth"): 80, ("Earth", "Water"): 85,
    ("Water", "Water"): 78,
}

def _element_compat_score(e1: str, e2: str) -> int:
    return ELEMENT_COMPAT.get((e1, e2), ELEMENT_COMPAT.get((e2, e1), 55))

VENUS_STYLE = {
    "Aries": "Bold and impatient in love — you chase what excites you and lose interest if the spark fades.",
    "Taurus": "Sensual and devoted — you love through touch, comfort, and consistency. Once committed, unshakeable.",
    "Gemini": "Flirtatious and mentally stimulated — words are your love language, you need someone who surprises you.",
    "Cancer": "Deeply nurturing — you love by creating safety and remembering every detail about your partner.",
    "Leo": "Generous and dramatic — you love to be adored and adore in return with grand gestures.",
    "Virgo": "Quietly devoted — you show love through acts of service and remembering the small things.",
    "Libra": "Romantic and partnership-oriented — you live for harmony, beauty, and fairness in love.",
    "Scorpio": "Intensely passionate and all-or-nothing — you crave deep emotional and physical intimacy.",
    "Sagittarius": "Adventurous and freedom-loving — you need a partner who grows with you and gives space.",
    "Capricorn": "Serious and long-term oriented — you want someone ambitious, reliable, and in it for keeps.",
    "Aquarius": "Unconventional and intellectually driven — you value friendship and independence in love.",
    "Pisces": "Dreamy and empathetic — you love with your whole soul and absorb your partner's emotions.",
}

MARS_STYLE = {
    "Aries": "Direct and fiery. Confronts issues head-on, fights fair but fast. In passion — initiating and enthusiastic.",
    "Taurus": "Slow to anger but immovable once pushed. In passion — sensual, steady, and deeply physical.",
    "Gemini": "Fights with words and wit. In passion — variety and verbal connection matter most.",
    "Cancer": "Retreats when hurt, uses emotional distance. In passion — needs emotional safety first.",
    "Leo": "Dramatic in conflict, needs respect. In passion — warm, generous, wants to be admired.",
    "Virgo": "Argues with logic and precision. In passion — attentive and focused on partner's needs.",
    "Libra": "Avoids direct conflict, seeks compromise. In passion — prioritizes partner's pleasure.",
    "Scorpio": "Intense and strategic in conflict. In passion — deeply transformative and possessive.",
    "Sagittarius": "Fights for freedom and honesty. In passion — adventurous and spontaneous.",
    "Capricorn": "Controlled and strategic, shuts down rather than explodes. In passion — ambitious about building.",
    "Aquarius": "Detaches emotionally in conflict. In passion — needs mental stimulation and experimentation.",
    "Pisces": "Absorbs conflict emotionally, often yields. In passion — intuitive and fantasy-driven.",
}

SUN_LOVE_ARCHETYPE = {
    "Aries": "The Initiator — bold, direct, energizing",
    "Taurus": "The Stabilizer — loyal, sensual, grounding",
    "Gemini": "The Communicator — witty, adaptable, curious",
    "Cancer": "The Nurturer — protective, intuitive, emotional",
    "Leo": "The Performer — generous, warm, commanding",
    "Virgo": "The Healer — practical, devoted, detail-oriented",
    "Libra": "The Harmonizer — diplomatic, romantic, fair",
    "Scorpio": "The Transformer — intense, passionate, deep",
    "Sagittarius": "The Explorer — adventurous, honest, expansive",
    "Capricorn": "The Builder — ambitious, responsible, enduring",
    "Aquarius": "The Visionary — independent, innovative, humanitarian",
    "Pisces": "The Mystic — empathetic, artistic, transcendent",
}

BEST_MATCH_SIGNS = {
    "Aries": ["Leo", "Sagittarius", "Gemini", "Aquarius"],
    "Taurus": ["Virgo", "Capricorn", "Cancer", "Pisces"],
    "Gemini": ["Libra", "Aquarius", "Aries", "Leo"],
    "Cancer": ["Scorpio", "Pisces", "Taurus", "Virgo"],
    "Leo": ["Aries", "Sagittarius", "Gemini", "Libra"],
    "Virgo": ["Taurus", "Capricorn", "Cancer", "Scorpio"],
    "Libra": ["Gemini", "Aquarius", "Leo", "Sagittarius"],
    "Scorpio": ["Cancer", "Pisces", "Virgo", "Capricorn"],
    "Sagittarius": ["Aries", "Leo", "Libra", "Aquarius"],
    "Capricorn": ["Taurus", "Virgo", "Scorpio", "Pisces"],
    "Aquarius": ["Gemini", "Libra", "Aries", "Sagittarius"],
    "Pisces": ["Cancer", "Scorpio", "Taurus", "Capricorn"],
}

# ═══════════════════════════════════════════════════════════════
# CHINESE ZODIAC TABLES
# ═══════════════════════════════════════════════════════════════

ANIMAL_PERSONALITY = {
    "Rat": "Clever, resourceful, and quick-witted. In love — attentive and charming but can be possessive.",
    "Ox": "Dependable, patient, and methodical. In love — deeply loyal and expects the same commitment in return.",
    "Tiger": "Brave, passionate, and unpredictable. In love — exciting but needs freedom and adventure.",
    "Rabbit": "Gentle, elegant, and diplomatic. In love — romantic and conflict-averse, creates a harmonious home.",
    "Dragon": "Charismatic, ambitious, and powerful. In love — passionate but can be dominating and self-focused.",
    "Snake": "Intuitive, wise, and mysterious. In love — deeply sensual and jealous, bonds run very deep.",
    "Horse": "Energetic, independent, and free-spirited. In love — enthusiastic but restless, needs personal space.",
    "Goat": "Creative, gentle, and empathetic. In love — nurturing and romantic but needs reassurance.",
    "Monkey": "Clever, entertaining, and adaptable. In love — fun and playful but can struggle with commitment.",
    "Rooster": "Organized, honest, and hardworking. In love — devoted and detail-oriented, values mutual respect.",
    "Dog": "Loyal, honest, and protective. In love — deeply faithful and anxious about abandonment.",
    "Pig": "Generous, compassionate, and trusting. In love — wholehearted and giving, sometimes too trusting.",
}

CHINESE_TRINES = [
    ("Rat", "Dragon", "Monkey"),
    ("Ox", "Snake", "Rooster"),
    ("Tiger", "Horse", "Dog"),
    ("Rabbit", "Goat", "Pig"),
]

CHINESE_SECRET_FRIENDS = {
    "Rat": "Ox", "Ox": "Rat", "Tiger": "Pig", "Pig": "Tiger",
    "Rabbit": "Dog", "Dog": "Rabbit", "Dragon": "Rooster", "Rooster": "Dragon",
    "Snake": "Monkey", "Monkey": "Snake", "Horse": "Goat", "Goat": "Horse",
}

CHINESE_SIX_CLASHES = {
    "Rat": "Horse", "Horse": "Rat", "Ox": "Goat", "Goat": "Ox",
    "Tiger": "Monkey", "Monkey": "Tiger", "Rabbit": "Rooster", "Rooster": "Rabbit",
    "Dragon": "Dog", "Dog": "Dragon", "Snake": "Pig", "Pig": "Snake",
}

CHINESE_ELEMENT_CYCLE = {
    "Wood": {"produces": "Fire", "controlled_by": "Metal", "controls": "Earth"},
    "Fire": {"produces": "Earth", "controlled_by": "Water", "controls": "Metal"},
    "Earth": {"produces": "Metal", "controlled_by": "Wood", "controls": "Water"},
    "Metal": {"produces": "Water", "controlled_by": "Fire", "controls": "Wood"},
    "Water": {"produces": "Wood", "controlled_by": "Earth", "controls": "Fire"},
}

# ═══════════════════════════════════════════════════════════════
# BAZI (FOUR PILLARS) TABLES
# ═══════════════════════════════════════════════════════════════

DAY_MASTER_LOVE = {
    "Jia Wood": {
        "personality": "Tall tree energy — principled, idealistic, and protective. You seek partners who respect your independence while offering warmth.",
        "strengths": "Loyal, protective, visionary",
        "needs": "Space to grow, a partner who doesn't try to control",
        "best_elements": ["Yin Fire", "Yin Earth"],
    },
    "Yi Wood": {
        "personality": "Vine energy — adaptable, charming, and socially graceful. You bend rather than break and seek harmony in love.",
        "strengths": "Flexible, diplomatic, emotionally intelligent",
        "needs": "Support structure, someone strong to lean on",
        "best_elements": ["Yang Metal", "Yang Fire"],
    },
    "Bing Fire": {
        "personality": "Sun energy — radiant, generous, and warm. You light up every room and love being the center of your partner's world.",
        "strengths": "Optimistic, generous, inspirational",
        "needs": "Appreciation, someone who reflects your light back",
        "best_elements": ["Yin Metal", "Yin Water"],
    },
    "Ding Fire": {
        "personality": "Candle flame energy — intimate, perceptive, and emotionally deep. You create cozy, meaningful connections.",
        "strengths": "Intuitive, romantic, emotionally nuanced",
        "needs": "Emotional depth, a partner who values intimacy over spectacle",
        "best_elements": ["Yang Metal", "Yang Wood"],
    },
    "Wu Earth": {
        "personality": "Mountain energy — stable, reliable, and immovable. You are the rock people build their lives around.",
        "strengths": "Dependable, patient, grounding presence",
        "needs": "Loyalty, someone who values stability over excitement",
        "best_elements": ["Yin Water", "Yin Wood"],
    },
    "Ji Earth": {
        "personality": "Garden soil energy — nurturing, fertile, and giving. You grow love through care and attention to detail.",
        "strengths": "Nurturing, detail-oriented, emotionally generous",
        "needs": "Appreciation for your efforts, reciprocal care",
        "best_elements": ["Yang Water", "Yang Wood"],
    },
    "Geng Metal": {
        "personality": "Sword energy — decisive, principled, and strong-willed. You cut through pretense and value honesty above all.",
        "strengths": "Loyal, protective, straightforward",
        "needs": "Respect, a partner who can handle directness",
        "best_elements": ["Yin Wood", "Yin Fire"],
    },
    "Xin Metal": {
        "personality": "Jewel energy — refined, sensitive, and aesthetically driven. You value beauty and elegance in relationships.",
        "strengths": "Artistic, perceptive, high standards",
        "needs": "Beauty, emotional refinement, someone who meets your standards",
        "best_elements": ["Yang Water", "Yang Fire"],
    },
    "Ren Water": {
        "personality": "Ocean energy — expansive, philosophical, and free-flowing. You love deeply but resist being contained.",
        "strengths": "Visionary, adaptable, emotionally vast",
        "needs": "Freedom, intellectual stimulation, a partner who doesn't cling",
        "best_elements": ["Yin Fire", "Yin Earth"],
    },
    "Gui Water": {
        "personality": "Rain/dew energy — gentle, introspective, and emotionally absorptive. You feel everything and love through empathy.",
        "strengths": "Empathetic, intuitive, emotionally deep",
        "needs": "Gentle handling, someone who protects your sensitivity",
        "best_elements": ["Yang Fire", "Yang Earth"],
    },
}

ELEMENT_RELATION = {
    ("Wood", "Fire"): ("productive", "Wood fuels Fire — you inspire and energize each other naturally."),
    ("Fire", "Earth"): ("productive", "Fire creates Earth — your passion builds stability together."),
    ("Earth", "Metal"): ("productive", "Earth produces Metal — your support refines and strengthens the bond."),
    ("Metal", "Water"): ("productive", "Metal generates Water — your structure gives depth and flow to the relationship."),
    ("Water", "Wood"): ("productive", "Water nourishes Wood — your emotional depth feeds growth in the relationship."),
    ("Wood", "Earth"): ("controlling", "Wood controls Earth — there can be a power imbalance to watch for."),
    ("Earth", "Water"): ("controlling", "Earth dams Water — one partner may feel restricted or contained."),
    ("Water", "Fire"): ("controlling", "Water extinguishes Fire — too much emotion can dampen passion."),
    ("Fire", "Metal"): ("controlling", "Fire melts Metal — intensity may overwhelm the more structured partner."),
    ("Metal", "Wood"): ("controlling", "Metal chops Wood — directness may hurt the more sensitive partner."),
    ("Wood", "Wood"): ("same", "Two Woods together — shared values but may compete for resources and attention."),
    ("Fire", "Fire"): ("same", "Double Fire — exciting and passionate but prone to burnouts and arguments."),
    ("Earth", "Earth"): ("same", "Two Earths — deeply stable but may stagnate without external stimulation."),
    ("Metal", "Metal"): ("same", "Double Metal — strong convictions on both sides can create stubborn standoffs."),
    ("Water", "Water"): ("same", "Two Waters — emotionally deep but may lack grounding and direction."),
}

# ═══════════════════════════════════════════════════════════════
# NUMEROLOGY TABLES
# ═══════════════════════════════════════════════════════════════

LIFE_PATH_PERSONALITY = {
    1: "The Leader — independent, ambitious, pioneering. In love, you need a partner who respects your autonomy.",
    2: "The Diplomat — sensitive, cooperative, intuitive. In love, you're the glue that holds partnerships together.",
    3: "The Creative — expressive, joyful, social. In love, you bring fun and inspiration but need space to create.",
    4: "The Builder — practical, disciplined, loyal. In love, you offer rock-solid commitment and expect the same.",
    5: "The Adventurer — restless, freedom-loving, magnetic. In love, you need excitement and resist routine.",
    6: "The Caretaker — responsible, nurturing, harmonious. In love, you create a beautiful home and deep bonds.",
    7: "The Seeker — introspective, analytical, spiritual. In love, you need alone time and intellectual connection.",
    8: "The Powerhouse — ambitious, material, authoritative. In love, you build empires together and value success.",
    9: "The Humanitarian — compassionate, idealistic, universal. In love, you give selflessly but may feel distant.",
    11: "The Intuitive — visionary, sensitive, inspiring. In love, you form intense spiritual connections.",
    22: "The Master Builder — visionary, practical, powerful. In love, you need a partner who shares your grand vision.",
    33: "The Master Teacher — selfless, healing, spiritual. In love, you give everything and need conscious boundaries.",
}

LIFE_PATH_COMPAT = {
    1: {1: 75, 2: 60, 3: 80, 4: 55, 5: 85, 6: 65, 7: 78, 8: 70, 9: 72},
    2: {1: 60, 2: 72, 3: 68, 4: 82, 5: 55, 6: 88, 7: 58, 8: 80, 9: 75},
    3: {1: 80, 2: 68, 3: 70, 4: 50, 5: 82, 6: 85, 7: 55, 8: 60, 9: 88},
    4: {1: 55, 2: 82, 3: 50, 4: 70, 5: 48, 6: 78, 7: 72, 8: 85, 9: 55},
    5: {1: 85, 2: 55, 3: 82, 4: 48, 5: 68, 6: 52, 7: 80, 8: 62, 9: 78},
    6: {1: 65, 2: 88, 3: 85, 4: 78, 5: 52, 6: 72, 7: 55, 8: 68, 9: 82},
    7: {1: 78, 2: 58, 3: 55, 4: 72, 5: 80, 6: 55, 7: 70, 8: 58, 9: 65},
    8: {1: 70, 2: 80, 3: 60, 4: 85, 5: 62, 6: 68, 7: 58, 8: 72, 9: 60},
    9: {1: 72, 2: 75, 3: 88, 4: 55, 5: 78, 6: 82, 7: 65, 8: 60, 9: 68},
}

# Best match life path numbers
BEST_MATCH_PATHS = {
    1: [5, 3, 7], 2: [6, 8, 4], 3: [9, 6, 5], 4: [8, 2, 6],
    5: [1, 3, 7], 6: [2, 3, 9], 7: [5, 1, 4], 8: [4, 2, 6],
    9: [3, 6, 5], 11: [2, 6, 9], 22: [4, 8, 6], 33: [6, 9, 3],
}

SOUL_URGE_STYLE = {
    1: "Desires independence and leadership in relationships.",
    2: "Craves harmony, partnership, and emotional closeness.",
    3: "Needs creative expression and joyful connection.",
    4: "Values security, routine, and a stable home life.",
    5: "Yearns for freedom, variety, and new experiences together.",
    6: "Desires a beautiful home, family, and deep responsibility.",
    7: "Needs solitude, spiritual connection, and intellectual depth.",
    8: "Driven by shared ambition, status, and material security.",
    9: "Motivated by compassion, idealism, and universal love.",
}

# ═══════════════════════════════════════════════════════════════
# VEDIC (KUTA) TABLES
# ═══════════════════════════════════════════════════════════════

NAKSHATRA_GANA = {
    "Ashwini": "Deva", "Bharani": "Manushya", "Krittika": "Rakshasa",
    "Rohini": "Manushya", "Mrigashira": "Deva", "Ardra": "Manushya",
    "Punarvasu": "Deva", "Pushya": "Deva", "Ashlesha": "Rakshasa",
    "Magha": "Rakshasa", "Purva Phalguni": "Manushya", "Uttara Phalguni": "Manushya",
    "Hasta": "Deva", "Chitra": "Rakshasa", "Swati": "Deva",
    "Vishakha": "Rakshasa", "Anuradha": "Deva", "Jyeshtha": "Rakshasa",
    "Mula": "Rakshasa", "Purva Ashadha": "Manushya", "Uttara Ashadha": "Manushya",
    "Shravana": "Deva", "Dhanishta": "Rakshasa", "Shatabhisha": "Rakshasa",
    "Purva Bhadrapada": "Manushya", "Uttara Bhadrapada": "Manushya", "Revati": "Deva",
}

NAKSHATRA_YONI = {
    "Ashwini": "Horse", "Bharani": "Elephant", "Krittika": "Goat",
    "Rohini": "Serpent", "Mrigashira": "Serpent", "Ardra": "Dog",
    "Punarvasu": "Cat", "Pushya": "Goat", "Ashlesha": "Cat",
    "Magha": "Rat", "Purva Phalguni": "Rat", "Uttara Phalguni": "Cow",
    "Hasta": "Buffalo", "Chitra": "Tiger", "Swati": "Buffalo",
    "Vishakha": "Tiger", "Anuradha": "Deer", "Jyeshtha": "Deer",
    "Mula": "Dog", "Purva Ashadha": "Monkey", "Uttara Ashadha": "Mongoose",
    "Shravana": "Monkey", "Dhanishta": "Lion", "Shatabhisha": "Horse",
    "Purva Bhadrapada": "Lion", "Uttara Bhadrapada": "Cow", "Revati": "Elephant",
}

YONI_COMPAT = {
    ("Horse", "Horse"): 4, ("Elephant", "Elephant"): 4, ("Goat", "Goat"): 4,
    ("Serpent", "Serpent"): 4, ("Dog", "Dog"): 4, ("Cat", "Cat"): 4,
    ("Rat", "Rat"): 4, ("Cow", "Cow"): 4, ("Buffalo", "Buffalo"): 4,
    ("Tiger", "Tiger"): 4, ("Deer", "Deer"): 4, ("Monkey", "Monkey"): 4,
    ("Lion", "Lion"): 4, ("Mongoose", "Mongoose"): 4,
    # Enemies
    ("Horse", "Buffalo"): 0, ("Elephant", "Lion"): 0, ("Goat", "Monkey"): 0,
    ("Serpent", "Mongoose"): 0, ("Dog", "Deer"): 0, ("Cat", "Rat"): 0,
    ("Tiger", "Cow"): 0,
}

GANA_COMPAT = {
    ("Deva", "Deva"): 6, ("Deva", "Manushya"): 5, ("Deva", "Rakshasa"): 1,
    ("Manushya", "Deva"): 6, ("Manushya", "Manushya"): 6, ("Manushya", "Rakshasa"): 0,
    ("Rakshasa", "Deva"): 1, ("Rakshasa", "Manushya"): 0, ("Rakshasa", "Rakshasa"): 6,
}

NAKSHATRA_LORD = {
    "Ashwini": "Ketu", "Bharani": "Venus", "Krittika": "Sun",
    "Rohini": "Moon", "Mrigashira": "Mars", "Ardra": "Rahu",
    "Punarvasu": "Jupiter", "Pushya": "Saturn", "Ashlesha": "Mercury",
    "Magha": "Ketu", "Purva Phalguni": "Venus", "Uttara Phalguni": "Sun",
    "Hasta": "Moon", "Chitra": "Mars", "Swati": "Rahu",
    "Vishakha": "Jupiter", "Anuradha": "Saturn", "Jyeshtha": "Mercury",
    "Mula": "Ketu", "Purva Ashadha": "Venus", "Uttara Ashadha": "Sun",
    "Shravana": "Moon", "Dhanishta": "Mars", "Shatabhisha": "Rahu",
    "Purva Bhadrapada": "Jupiter", "Uttara Bhadrapada": "Saturn", "Revati": "Mercury",
}

GRAHA_MAITRI = {
    ("Sun", "Sun"): 5, ("Sun", "Moon"): 5, ("Sun", "Mars"): 5, ("Sun", "Jupiter"): 5,
    ("Sun", "Venus"): 0, ("Sun", "Saturn"): 0, ("Sun", "Mercury"): 3,
    ("Moon", "Moon"): 5, ("Moon", "Sun"): 5, ("Moon", "Mercury"): 3,
    ("Moon", "Mars"): 3, ("Moon", "Jupiter"): 3, ("Moon", "Venus"): 3, ("Moon", "Saturn"): 3,
    ("Mars", "Mars"): 5, ("Mars", "Sun"): 5, ("Mars", "Moon"): 3, ("Mars", "Jupiter"): 5,
    ("Mars", "Venus"): 3, ("Mars", "Saturn"): 0, ("Mars", "Mercury"): 0,
    ("Jupiter", "Jupiter"): 5, ("Jupiter", "Sun"): 5, ("Jupiter", "Moon"): 5, ("Jupiter", "Mars"): 5,
    ("Jupiter", "Venus"): 0, ("Jupiter", "Saturn"): 3, ("Jupiter", "Mercury"): 3,
    ("Venus", "Venus"): 5, ("Venus", "Mercury"): 5, ("Venus", "Saturn"): 5,
    ("Venus", "Sun"): 0, ("Venus", "Moon"): 3, ("Venus", "Mars"): 3, ("Venus", "Jupiter"): 0,
    ("Saturn", "Saturn"): 5, ("Saturn", "Mercury"): 5, ("Saturn", "Venus"): 5,
    ("Saturn", "Sun"): 0, ("Saturn", "Moon"): 0, ("Saturn", "Mars"): 0, ("Saturn", "Jupiter"): 3,
    ("Mercury", "Mercury"): 5, ("Mercury", "Sun"): 3, ("Mercury", "Moon"): 0,
    ("Mercury", "Venus"): 5, ("Mercury", "Saturn"): 5, ("Mercury", "Mars"): 0, ("Mercury", "Jupiter"): 3,
}

# ═══════════════════════════════════════════════════════════════
# KABBALISTIC TABLES
# ═══════════════════════════════════════════════════════════════

SEFIRAH_LOVE = {
    1: ("Keter", "Crown — transcendent love. You connect at the soul level and seek divine meaning in partnership."),
    2: ("Chokhmah", "Wisdom — visionary love. You see your partner's potential and inspire growth."),
    3: ("Binah", "Understanding — deep love. You offer structure, patience, and emotional containment."),
    4: ("Chesed", "Kindness — expansive love. You give abundantly and create joy in relationships."),
    5: ("Gevurah", "Strength — boundary love. You set clear limits and demand integrity in partnership."),
    6: ("Tiferet", "Beauty — balanced love. You harmonize heart and mind, creating centered relationships."),
    7: ("Netzach", "Victory — passionate love. You pursue desire with artistic flair and emotional intensity."),
    8: ("Hod", "Splendor — communicative love. You connect through words, analysis, and mental clarity."),
    9: ("Yesod", "Foundation — bonding love. You create deep emotional and physical foundations."),
    10: ("Malkhut", "Kingdom — grounded love. You manifest love in the physical world through practical devotion."),
}

SEFIRAH_COMPAT = {
    (4, 5): 88, (5, 4): 88,  # Chesed/Gevurah — mercy/judgment balance
    (6, 9): 85, (9, 6): 85,  # Tiferet/Yesod — heart/foundation
    (7, 8): 82, (8, 7): 82,  # Netzach/Hod — passion/intellect
    (2, 3): 80, (3, 2): 80,  # Chokhmah/Binah — vision/understanding
    (4, 6): 78, (6, 4): 78,  # Chesed/Tiferet — giving/harmony
    (6, 7): 75, (7, 6): 75,  # Tiferet/Netzach — beauty/desire
    (1, 6): 80, (6, 1): 80,  # Keter/Tiferet — crown/heart axis
}

# ═══════════════════════════════════════════════════════════════
# PERSIAN TABLES
# ═══════════════════════════════════════════════════════════════

TEMPERAMENT_PERSONALITY = {
    "Choleric": "Hot and dry — passionate, decisive, and action-oriented. In love, you're intense and demanding.",
    "Sanguine": "Hot and moist — warm, social, and optimistic. In love, you're charming, affectionate, and expressive.",
    "Melancholic": "Cold and dry — thoughtful, analytical, and deep. In love, you're loyal but cautious and reserved.",
    "Phlegmatic": "Cold and moist — calm, patient, and nurturing. In love, you're steady, supportive, and conflict-averse.",
}

TEMPERAMENT_COMPAT = {
    ("Sanguine", "Sanguine"): (78, "Fun-loving and socially vibrant — but may lack depth without effort."),
    ("Sanguine", "Choleric"): (72, "Energetic and exciting — the Sanguine softens the Choleric's intensity."),
    ("Sanguine", "Melancholic"): (65, "The Sanguine lifts the Melancholic's mood — but may feel dismissed."),
    ("Sanguine", "Phlegmatic"): (82, "Classic complement — warmth meets calm, creating a balanced home."),
    ("Choleric", "Choleric"): (58, "Two fires — passionate but explosive. Requires conscious power-sharing."),
    ("Choleric", "Sanguine"): (72, "Dynamic and productive — the Sanguine brings joy to the Choleric's drive."),
    ("Choleric", "Melancholic"): (68, "Drive meets depth — effective if both respect each other's rhythm."),
    ("Choleric", "Phlegmatic"): (75, "Excellent balance — the Phlegmatic absorbs the Choleric's intensity calmly."),
    ("Melancholic", "Melancholic"): (70, "Deep and meaningful — but can spiral into shared pessimism without humor."),
    ("Melancholic", "Sanguine"): (65, "Light meets depth — growth-oriented but can frustrate both."),
    ("Melancholic", "Choleric"): (68, "Thoughtfulness tempers impulsiveness — mutual respect is key."),
    ("Melancholic", "Phlegmatic"): (78, "Peaceful and deep — both introverted, which builds trust but may lack spark."),
    ("Phlegmatic", "Phlegmatic"): (72, "Calm and comfortable — but may stagnate without external energy."),
    ("Phlegmatic", "Sanguine"): (82, "The ideal complement in many traditions — warmth + calm = lasting love."),
    ("Phlegmatic", "Choleric"): (75, "Steadiness grounds intensity — a naturally balancing pairing."),
    ("Phlegmatic", "Melancholic"): (78, "Quiet compatibility — both prefer peace, creating a stable bond."),
}

# ═══════════════════════════════════════════════════════════════
# GEMATRIA TABLES
# ═══════════════════════════════════════════════════════════════

ROOT_LOVE_MEANING = {
    1: "Independent love — you bring leadership and initiative into relationships.",
    2: "Partnership-oriented — your name vibrates with cooperative, bonding energy.",
    3: "Expressive love — your name carries creative, joyful relationship energy.",
    4: "Structured love — your name grounds relationships in stability and commitment.",
    5: "Free-spirited love — your name vibrates with adventure and variety in love.",
    6: "Harmonious love — your name carries the strongest nurturing and family vibration.",
    7: "Spiritual love — your name carries a seeking, mystical quality in relationships.",
    8: "Powerful love — your name vibrates with ambition and material partnership.",
    9: "Universal love — your name carries compassion and idealistic relationship energy.",
}

ROOT_COMPAT = {
    (1, 5): 85, (2, 6): 88, (3, 9): 85, (4, 8): 82, (5, 7): 80,
    (6, 2): 88, (7, 5): 80, (8, 4): 82, (9, 3): 85,
    (1, 1): 70, (2, 2): 72, (3, 3): 68, (4, 4): 70, (5, 5): 65,
    (6, 6): 72, (7, 7): 68, (8, 8): 70, (9, 9): 65,
}


# ═══════════════════════════════════════════════════════════════
# PER-SYSTEM COMPATIBILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def _safe_get(data: dict, *keys, default=None):
    """Nested safe dict access."""
    for k in keys:
        if not isinstance(data, dict):
            return default
        data = data.get(k, default)
    return data


def _western_compat(user: dict, partner: dict) -> dict[str, Any]:
    """Western astrology synastry."""
    u_pos = user.get("positions", {})
    p_pos = partner.get("positions", {})

    u_sun = _safe_get(u_pos, "Sun", "sign", default="Aries")
    p_sun = _safe_get(p_pos, "Sun", "sign", default="Aries")
    u_moon = _safe_get(u_pos, "Moon", "sign", default="Cancer")
    p_moon = _safe_get(p_pos, "Moon", "sign", default="Cancer")
    u_venus = _safe_get(u_pos, "Venus", "sign", default="Pisces")
    p_venus = _safe_get(p_pos, "Venus", "sign", default="Pisces")
    u_mars = _safe_get(u_pos, "Mars", "sign", default="Aries")
    p_mars = _safe_get(p_pos, "Mars", "sign", default="Aries")

    # Score components
    sun_score = _element_compat_score(SIGN_ELEMENT.get(u_sun, "Fire"), SIGN_ELEMENT.get(p_sun, "Fire"))
    moon_score = _element_compat_score(SIGN_ELEMENT.get(u_moon, "Water"), SIGN_ELEMENT.get(p_moon, "Water"))
    venus_score = _element_compat_score(SIGN_ELEMENT.get(u_venus, "Water"), SIGN_ELEMENT.get(p_venus, "Water"))
    # Venus-Mars cross (attraction)
    venus_mars_1 = _element_compat_score(SIGN_ELEMENT.get(u_venus, "Water"), SIGN_ELEMENT.get(p_mars, "Fire"))
    venus_mars_2 = _element_compat_score(SIGN_ELEMENT.get(p_venus, "Water"), SIGN_ELEMENT.get(u_mars, "Fire"))
    attraction = (venus_mars_1 + venus_mars_2) // 2

    # Same sign bonus
    bonus = 0
    if u_sun == p_sun:
        bonus += 5
    if u_moon == p_moon:
        bonus += 8  # Emotional resonance is huge
    if u_venus == p_venus:
        bonus += 6  # Same love language

    # Modality clash penalty
    if SIGN_MODALITY.get(u_sun) == SIGN_MODALITY.get(p_sun) == "Fixed":
        bonus -= 5  # Two fixed signs = stubborn standoff

    total = round((sun_score * 0.25 + moon_score * 0.3 + venus_score * 0.2 + attraction * 0.25) + bonus)
    total = max(20, min(95, total))

    # Dynamic description
    u_elem = SIGN_ELEMENT.get(u_sun, "Fire")
    p_elem = SIGN_ELEMENT.get(p_sun, "Fire")
    if u_elem == p_elem:
        dynamic = f"Both {u_elem} signs — you share the same elemental language. Communication is natural, though you may amplify each other's extremes."
    elif _element_compat_score(u_elem, p_elem) >= 80:
        dynamic = f"{u_elem} and {p_elem} are natural allies. Your energies complement each other beautifully, creating a relationship that feels effortless."
    elif _element_compat_score(u_elem, p_elem) >= 55:
        dynamic = f"{u_elem} and {p_elem} require conscious bridging. Your differences are the source of both friction and fascination."
    else:
        dynamic = f"{u_elem} meets {p_elem} — an unlikely pairing that, when it works, creates something neither element could alone."

    strengths = []
    challenges = []
    if moon_score >= 75:
        strengths.append("Strong emotional understanding — you naturally sense each other's needs.")
    if venus_score >= 75:
        strengths.append("Compatible love styles — you express and receive love in similar ways.")
    if attraction >= 75:
        strengths.append("Strong physical and romantic attraction — Venus-Mars chemistry is alive.")
    if sun_score >= 75:
        strengths.append("Core identity alignment — you admire who each other fundamentally is.")
    if moon_score < 55:
        challenges.append("Emotional disconnect — you may process feelings very differently.")
    if venus_score < 55:
        challenges.append("Different love languages — what feels loving to you may not register for your partner.")
    if attraction < 55:
        challenges.append("Attraction style mismatch — your desire and pursuit patterns differ.")
    if not strengths:
        strengths.append("Growth through difference — your contrasts push both of you to evolve.")
    if not challenges:
        challenges.append("Complacency — high compatibility can lead to taking each other for granted.")

    return {
        "score": total,
        "user_profile": {
            "sun": u_sun, "moon": u_moon, "venus": u_venus, "mars": u_mars,
            "archetype": SUN_LOVE_ARCHETYPE.get(u_sun, ""),
            "venus_style": VENUS_STYLE.get(u_venus, ""),
            "mars_style": MARS_STYLE.get(u_mars, ""),
        },
        "partner_profile": {
            "sun": p_sun, "moon": p_moon, "venus": p_venus, "mars": p_mars,
            "archetype": SUN_LOVE_ARCHETYPE.get(p_sun, ""),
            "venus_style": VENUS_STYLE.get(p_venus, ""),
            "mars_style": MARS_STYLE.get(p_mars, ""),
        },
        "dynamic": dynamic,
        "strengths": strengths,
        "challenges": challenges,
        "advice": f"Focus on Moon compatibility — your emotional connection ({u_moon} + {p_moon}) is the true foundation of this relationship, deeper than Sun sign chemistry alone. "
                  f"When conflicts arise, lean into your Venus signs ({u_venus} + {p_venus}) — they reveal exactly how each of you needs to feel loved and how to repair after disagreements. "
                  f"Your Mars placements ({u_mars} + {p_mars}) shape how you fight and how you desire — understanding this prevents small frictions from becoming lasting wounds. "
                  f"The strongest couples with your chart combination learn to celebrate their elemental differences rather than trying to change each other's core nature.",
        "best_matches": BEST_MATCH_SIGNS.get(u_sun, []),
        "details": [
            {"label": "Sun Signs", "value": f"{u_sun} + {p_sun}", "score": sun_score},
            {"label": "Moon Signs", "value": f"{u_moon} + {p_moon}", "score": moon_score},
            {"label": "Venus Signs", "value": f"{u_venus} + {p_venus}", "score": venus_score},
            {"label": "Venus-Mars Attraction", "value": f"{u_venus}/{p_mars} + {p_venus}/{u_mars}", "score": attraction},
        ],
    }


def _vedic_compat(user: dict, partner: dict) -> dict[str, Any]:
    """Vedic Ashtakuta-inspired compatibility."""
    u_nak = user.get("nakshatra", {}).get("name", "Ashwini")
    p_nak = partner.get("nakshatra", {}).get("name", "Ashwini")
    u_moon_sign = _safe_get(user, "positions", "Moon", "sign", default="Aries")
    p_moon_sign = _safe_get(partner, "positions", "Moon", "sign", default="Aries")

    # Gana (temperament)
    u_gana = NAKSHATRA_GANA.get(u_nak, "Manushya")
    p_gana = NAKSHATRA_GANA.get(p_nak, "Manushya")
    gana_pts = GANA_COMPAT.get((u_gana, p_gana), 3)

    # Yoni (sexual/physical)
    u_yoni = NAKSHATRA_YONI.get(u_nak, "Horse")
    p_yoni = NAKSHATRA_YONI.get(p_nak, "Horse")
    yoni_pts = YONI_COMPAT.get((u_yoni, p_yoni), YONI_COMPAT.get((p_yoni, u_yoni), 2))

    # Graha Maitri (planetary friendship)
    u_lord = NAKSHATRA_LORD.get(u_nak, "Moon")
    p_lord = NAKSHATRA_LORD.get(p_nak, "Moon")
    # Map Rahu/Ketu to their traditional equivalents
    lord_map = {"Rahu": "Saturn", "Ketu": "Mars"}
    u_lord_m = lord_map.get(u_lord, u_lord)
    p_lord_m = lord_map.get(p_lord, p_lord)
    maitri_pts = GRAHA_MAITRI.get((u_lord_m, p_lord_m), 3)

    # Total out of max 15 (simplified from 36-point system)
    raw_total = gana_pts + yoni_pts + maitri_pts
    max_pts = 15.0
    score = round((raw_total / max_pts) * 100)
    score = max(25, min(95, score))

    # Kuta text
    if score >= 80:
        kuta_text = "Excellent Kuta alignment — the nakshatras deeply harmonize. Traditional astrologers would consider this a blessed union."
    elif score >= 65:
        kuta_text = "Good Kuta compatibility — most factors align well. Minor differences add character to the bond."
    elif score >= 50:
        kuta_text = "Moderate Kuta score — some areas of natural harmony and some requiring conscious work."
    else:
        kuta_text = "Challenging Kuta alignment — traditional remedies (mantra, gemstone, timing) are recommended to smooth the path."

    # 7th lord
    u_seventh = user.get("house_lords", {}).get("7", "Venus")
    p_seventh = partner.get("house_lords", {}).get("7", "Venus")

    return {
        "score": score,
        "user_profile": {
            "nakshatra": u_nak,
            "moon_sign": u_moon_sign,
            "gana": u_gana,
            "yoni": u_yoni,
            "nakshatra_lord": u_lord,
            "seventh_lord": u_seventh,
            "love_style": f"Moon in {u_moon_sign}, Nakshatra {u_nak} ({u_gana} temperament). "
                         f"Your emotional nature is {u_gana.lower()}-type — "
                         + {"Deva": "gentle, spiritual, and idealistic in love.",
                            "Manushya": "practical, balanced, and emotionally grounded in love.",
                            "Rakshasa": "intense, independent, and fiercely loyal in love."}.get(u_gana, ""),
        },
        "partner_profile": {
            "nakshatra": p_nak,
            "moon_sign": p_moon_sign,
            "gana": p_gana,
            "yoni": p_yoni,
            "nakshatra_lord": p_lord,
            "seventh_lord": p_seventh,
            "love_style": f"Moon in {p_moon_sign}, Nakshatra {p_nak} ({p_gana} temperament). "
                         f"Their emotional nature is {p_gana.lower()}-type — "
                         + {"Deva": "gentle, spiritual, and idealistic in love.",
                            "Manushya": "practical, balanced, and emotionally grounded in love.",
                            "Rakshasa": "intense, independent, and fiercely loyal in love."}.get(p_gana, ""),
        },
        "dynamic": kuta_text,
        "strengths": [
            s for s in [
                f"Gana harmony — your {u_gana} and {p_gana} temperaments naturally understand each other" if gana_pts >= 5 else None,
                f"Strong physical chemistry — your {u_yoni} and {p_yoni} yoni energies align" if yoni_pts >= 3 else None,
                f"Mental wavelength match — your planetary lords ({u_lord} and {p_lord}) are natural allies" if maitri_pts >= 4 else None,
            ] if s
        ] or ["The relationship's strength lies in conscious spiritual practice together."],
        "challenges": [
            s for s in [
                f"Temperament friction — {u_gana} and {p_gana} natures can irritate each other without awareness" if gana_pts <= 1 else None,
                f"Physical disconnect — your {u_yoni} and {p_yoni} energies don't naturally sync" if yoni_pts <= 1 else None,
                f"Mental wavelength clash — {u_lord} and {p_lord} planetary lords create friction in how you think and communicate" if maitri_pts <= 1 else None,
            ] if s
        ] or ["No major Vedic red flags — focus on deepening your spiritual connection."],
        "advice": f"The nakshatra lords ({u_lord} and {p_lord}) reveal a karmic thread that drew you together — this is not a random meeting but an unfinished story from past lives. "
                  f"Honor each other's {u_gana}/{p_gana} temperament rather than trying to reshape what the stars have already written into your souls. "
                  f"In Vedic tradition, the Yoni pairing ({u_yoni} + {p_yoni}) governs physical intimacy — understanding this helps you meet each other's deepest unspoken needs. "
                  f"Performing small daily acts of devotion together, even lighting a candle or sharing silence, strengthens the bond that your nakshatras share.",
        "best_matches": [f"{u_gana}-compatible nakshatras"],
        "details": [
            {"label": "Gana (Temperament)", "value": f"{u_gana} + {p_gana}", "score": round(gana_pts / 6 * 100)},
            {"label": "Yoni (Physical)", "value": f"{u_yoni} + {p_yoni}", "score": round(yoni_pts / 4 * 100)},
            {"label": "Graha Maitri (Mental)", "value": f"{u_lord} + {p_lord}", "score": round(maitri_pts / 5 * 100)},
        ],
    }


def _chinese_compat(user: dict, partner: dict) -> dict[str, Any]:
    """Chinese zodiac animal compatibility."""
    u_animal = user.get("year_animal", "Dragon")
    p_animal = partner.get("year_animal", "Dragon")
    u_elem = user.get("element", "Wood")
    p_elem = partner.get("element", "Wood")

    # Animal relationship
    score = 60
    relationship = "Neutral"
    # Check trine
    for group in CHINESE_TRINES:
        if u_animal in group and p_animal in group:
            score = 88
            relationship = "Trine Harmony"
            break
    # Secret friend
    if CHINESE_SECRET_FRIENDS.get(u_animal) == p_animal:
        score = max(score, 85)
        relationship = "Secret Friends"
    # Same animal
    if u_animal == p_animal:
        score = max(score, 75)
        relationship = "Same Sign"
    # Clash
    if CHINESE_SIX_CLASHES.get(u_animal) == p_animal:
        score = 35
        relationship = "Six Clash"
    # Element cycle
    elem_bonus = 0
    u_cycle = CHINESE_ELEMENT_CYCLE.get(u_elem, {})
    p_cycle = CHINESE_ELEMENT_CYCLE.get(p_elem, {})
    if u_cycle.get("produces") == p_elem or p_cycle.get("produces") == u_elem:
        elem_bonus = 8
    elif u_cycle.get("controls") == p_elem or p_cycle.get("controls") == u_elem:
        elem_bonus = -5

    score = max(20, min(95, score + elem_bonus))

    # Best match animals for user
    best = []
    for group in CHINESE_TRINES:
        if u_animal in group:
            best = [a for a in group if a != u_animal]
            break
    sf = CHINESE_SECRET_FRIENDS.get(u_animal)
    if sf and sf not in best:
        best.append(sf)

    # Dynamic
    dynamics = {
        "Trine Harmony": f"The {u_animal} and {p_animal} form a trine — one of the strongest bonds in Chinese astrology. You share the same energy group and naturally understand each other.",
        "Secret Friends": f"The {u_animal} and {p_animal} are Secret Friends — a hidden, almost karmic bond that deepens over time. This is a connection others may not understand.",
        "Same Sign": f"Two {u_animal}s — you mirror each other perfectly. This creates deep understanding but also competition for the same resources.",
        "Six Clash": f"The {u_animal} and {p_animal} are in direct opposition. This is the most challenging pairing — it requires extraordinary patience, but the growth potential is immense.",
        "Neutral": f"The {u_animal} and {p_animal} have a neutral relationship — neither strongly drawn nor repelled. The connection depends on what you build together.",
    }

    return {
        "score": score,
        "user_profile": {
            "animal": u_animal,
            "element": u_elem,
            "love_style": ANIMAL_PERSONALITY.get(u_animal, ""),
        },
        "partner_profile": {
            "animal": p_animal,
            "element": p_elem,
            "love_style": ANIMAL_PERSONALITY.get(p_animal, ""),
        },
        "relationship_type": relationship,
        "dynamic": dynamics.get(relationship, dynamics["Neutral"]),
        "strengths": [
            f"Element synergy: {u_elem} and {p_elem}" if elem_bonus > 0 else None,
            f"Trine bond: natural trust and ease" if relationship == "Trine Harmony" else None,
            f"Secret Friend: deep intuitive understanding" if relationship == "Secret Friends" else None,
            f"Same Sign: instant recognition and familiarity" if relationship == "Same Sign" else None,
        ],
        "challenges": [
            f"Six Clash: fundamental opposition that requires conscious bridging" if relationship == "Six Clash" else None,
            f"Element tension: {u_elem} and {p_elem} require balance" if elem_bonus < 0 else None,
        ],
        "advice": f"The {u_animal}'s secret friend in the Chinese zodiac is the {CHINESE_SECRET_FRIENDS.get(u_animal, '?')}, which reveals what kind of hidden support you naturally seek in partnerships. "
                  f"Understanding your partner's animal nature is essential — the {p_animal} fundamentally needs " + {
                      "Rat": "mental stimulation, a sense of financial security, and a partner who appreciates their resourcefulness rather than calling it anxiety.",
                      "Ox": "patience, consistent loyalty, and a partner who respects their slow but unstoppable way of building something lasting.",
                      "Tiger": "freedom, adventure, and a partner brave enough to match their intensity without trying to cage their spirit.",
                      "Rabbit": "peace, emotional safety, and a home environment where beauty and harmony are treated as necessities, not luxuries.",
                      "Dragon": "genuine admiration, space to shine, and a partner secure enough not to compete with their natural magnetism.",
                      "Snake": "deep trust, sensual connection, and a partner who understands that their silence is depth, not distance.",
                      "Horse": "independence, excitement, and a partner who can keep up without trying to hold them back.",
                      "Goat": "gentleness, creative expression, and a partner who provides stability without stifling their artistic soul.",
                      "Monkey": "playfulness, mental challenge, and a partner clever enough to keep them interested for a lifetime.",
                      "Rooster": "respect, honest communication, and a partner who sees their perfectionism as love expressed through detail.",
                      "Dog": "unwavering loyalty, reassurance, and a partner who proves through actions that they will never abandon ship.",
                      "Pig": "generosity, warmth, and a partner who matches their open heart without taking advantage of their trusting nature.",
                  }.get(p_animal, "understanding and patience.")
                  + f" The {u_elem} and {p_elem} elemental pairing between you shapes the daily texture of your relationship — learn to work with this energy rather than against it.",
        "best_matches": best,
        "details": [
            {"label": "Animal Relationship", "value": relationship, "score": score},
            {"label": "Element Cycle", "value": f"{u_elem} → {p_elem}", "score": max(0, min(100, 60 + elem_bonus * 5))},
        ],
    }


def _bazi_compat(user: dict, partner: dict) -> dict[str, Any]:
    """BaZi Four Pillars compatibility."""
    u_dm = user.get("day_master", "Jia Wood")
    p_dm = partner.get("day_master", "Jia Wood")
    u_elem = user.get("day_master_element", "Wood")
    p_elem = partner.get("day_master_element", "Wood")
    u_profile = user.get("day_master_profile", {})
    p_profile = partner.get("day_master_profile", {})

    # Element relationship
    rel_key = (u_elem, p_elem)
    rel_type, rel_desc = ELEMENT_RELATION.get(rel_key, ("neutral", f"{u_elem} and {p_elem} coexist without strong pull."))

    # Score based on element cycle
    if rel_type == "productive":
        score = 82
    elif rel_type == "same":
        score = 68
    elif rel_type == "controlling":
        score = 52
    else:
        score = 60

    # Day branch interaction
    u_branches = user.get("branch_interactions", [])
    branch_bonus = 0
    for bi in u_branches:
        if bi.get("type") == "combination":
            branch_bonus += 4
        elif bi.get("type") == "clash":
            branch_bonus -= 5

    score = max(25, min(95, score + branch_bonus))

    # Day Master love profiles
    u_love = DAY_MASTER_LOVE.get(u_dm, DAY_MASTER_LOVE.get("Jia Wood"))
    p_love = DAY_MASTER_LOVE.get(p_dm, DAY_MASTER_LOVE.get("Jia Wood"))

    return {
        "score": score,
        "user_profile": {
            "day_master": u_dm,
            "element": u_elem,
            "personality": u_love["personality"],
            "strengths": u_love["strengths"],
            "needs": u_love["needs"],
            "relationships_text": u_profile.get("relationships", ""),
        },
        "partner_profile": {
            "day_master": p_dm,
            "element": p_elem,
            "personality": p_love["personality"],
            "strengths": p_love["strengths"],
            "needs": p_love["needs"],
            "relationships_text": p_profile.get("relationships", ""),
        },
        "element_dynamic": {"type": rel_type, "description": rel_desc},
        "dynamic": f"{u_dm} meets {p_dm}: {rel_desc}",
        "strengths": [
            f"Productive cycle: {u_elem} naturally supports {p_elem}" if rel_type == "productive" else None,
            f"Same element understanding" if rel_type == "same" else None,
            f"Your {u_love['strengths']} complement their {p_love['strengths']}" if u_love["strengths"] != p_love["strengths"] else None,
        ],
        "challenges": [
            f"Control dynamic: {u_elem} can overpower {p_elem} — requires conscious equality" if rel_type == "controlling" else None,
            f"Same element competition: both want the same resources" if rel_type == "same" else None,
            f"Your need for {u_love['needs']} may conflict with their need for {p_love['needs']}" if u_love["needs"] != p_love["needs"] else None,
        ],
        "advice": f"In BaZi, the Day Master is the single most important indicator of who you truly are in love. Your {u_dm} nature craves {u_love['needs'].lower()}, "
                  f"while their {p_dm} nature craves {p_love['needs'].lower()} — when these needs go unmet, resentment builds silently. "
                  f"The elemental relationship between your pillars ({rel_type}) tells you whether your energies naturally feed each other or compete for the same resources. "
                  f"To thrive together, the {u_dm} partner should consciously offer what {p_dm} needs most, and vice versa — this mutual giving creates a cycle of renewal rather than depletion. "
                  f"Pay special attention to years when either partner's Day Master element is under seasonal pressure, as these are the times when old friction resurfaces.",
        "best_matches": [e for e in u_love.get("best_elements", [])],
        "details": [
            {"label": "Day Masters", "value": f"{u_dm} + {p_dm}", "score": score},
            {"label": "Element Cycle", "value": rel_type.title(), "score": {
                "productive": 85, "same": 68, "controlling": 48, "neutral": 60,
            }.get(rel_type, 60)},
        ],
    }


def _numerology_compat(user: dict, partner: dict) -> dict[str, Any]:
    """Numerology Life Path, Soul Urge, Expression compatibility."""
    u_lp = user.get("life_path", 1)
    p_lp = partner.get("life_path", 1)
    u_su = user.get("soul_urge", 1)
    p_su = partner.get("soul_urge", 1)
    u_exp = user.get("expression", 1)
    p_exp = partner.get("expression", 1)

    # Normalize master numbers for compat lookup
    def _norm(n):
        return n if n in LIFE_PATH_COMPAT else (n % 10 or 9)

    lp_score = LIFE_PATH_COMPAT.get(_norm(u_lp), {}).get(_norm(p_lp), 60)

    # Soul urge harmony
    su_diff = abs(_norm(u_su) - _norm(p_su))
    su_score = max(40, 85 - su_diff * 6)

    # Expression harmony
    exp_diff = abs(_norm(u_exp) - _norm(p_exp))
    exp_score = max(40, 80 - exp_diff * 5)

    total = round(lp_score * 0.5 + su_score * 0.3 + exp_score * 0.2)
    total = max(25, min(95, total))

    u_su_key = _norm(u_su) if _norm(u_su) in SOUL_URGE_STYLE else 1
    p_su_key = _norm(p_su) if _norm(p_su) in SOUL_URGE_STYLE else 1

    return {
        "score": total,
        "user_profile": {
            "life_path": u_lp,
            "soul_urge": u_su,
            "expression": u_exp,
            "love_style": LIFE_PATH_PERSONALITY.get(u_lp, LIFE_PATH_PERSONALITY.get(_norm(u_lp), "")),
            "inner_desire": SOUL_URGE_STYLE.get(u_su_key, ""),
        },
        "partner_profile": {
            "life_path": p_lp,
            "soul_urge": p_su,
            "expression": p_exp,
            "love_style": LIFE_PATH_PERSONALITY.get(p_lp, LIFE_PATH_PERSONALITY.get(_norm(p_lp), "")),
            "inner_desire": SOUL_URGE_STYLE.get(p_su_key, ""),
        },
        "dynamic": f"Life Path {u_lp} meets Life Path {p_lp} — "
                   + (f"a natural, high-energy match." if lp_score >= 80
                      else f"complementary vibrations that balance each other." if lp_score >= 65
                      else f"contrasting frequencies that create growth through challenge." if lp_score >= 50
                      else f"very different vibrations requiring conscious effort to harmonize."),
        "strengths": [
            f"Life Path harmony — your core life purposes naturally align" if lp_score >= 70 else None,
            f"Soul Urge resonance: inner desires complement each other" if su_score >= 70 else None,
            f"Expression match: you present to the world in compatible ways" if exp_score >= 70 else None,
        ],
        "challenges": [
            f"Life Path tension — your core purposes pull in genuinely different directions" if lp_score < 55 else None,
            f"Soul Urge disconnect: your deepest desires pull in different directions" if su_score < 55 else None,
        ],
        "advice": f"Your Life Path {u_lp} is fundamentally about "
                  + LIFE_PATH_PERSONALITY.get(u_lp, LIFE_PATH_PERSONALITY.get(_norm(u_lp), "growth")).split("—")[0].strip().lower()
                  + f", while their Life Path {p_lp} is about "
                  + LIFE_PATH_PERSONALITY.get(p_lp, LIFE_PATH_PERSONALITY.get(_norm(p_lp), "growth")).split("—")[0].strip().lower()
                  + f". These two paths either weave together naturally or pull in different directions — the key is recognizing that neither path is wrong, just different. "
                  + f"In numerology, the strongest couples learn to walk their own path while holding space for their partner's journey without judgment or jealousy. "
                  + f"When tensions arise, look at the sum of your paths ({u_lp} + {p_lp}) — the combined vibration reveals what lesson this relationship is here to teach you both.",
        "best_matches": [f"Life Path {n}" for n in BEST_MATCH_PATHS.get(u_lp, BEST_MATCH_PATHS.get(_norm(u_lp), [1, 5, 7]))],
        "details": [
            {"label": "Life Path", "value": f"{u_lp} + {p_lp}", "score": lp_score},
            {"label": "Soul Urge", "value": f"{u_su} + {p_su}", "score": su_score},
            {"label": "Expression", "value": f"{u_exp} + {p_exp}", "score": exp_score},
        ],
    }


def _kabbalistic_compat(user: dict, partner: dict) -> dict[str, Any]:
    """Kabbalistic sefirah compatibility."""
    u_sef = user.get("birth_sefirah", 6)
    p_sef = partner.get("birth_sefirah", 6)
    u_soul = user.get("soul_sefirah", u_sef)
    p_soul = partner.get("soul_sefirah", p_sef)

    u_info = SEFIRAH_LOVE.get(u_sef, SEFIRAH_LOVE[6])
    p_info = SEFIRAH_LOVE.get(p_sef, SEFIRAH_LOVE[6])

    # Score
    base = SEFIRAH_COMPAT.get((u_sef, p_sef), None)
    if base is None:
        diff = abs(u_sef - p_sef)
        base = max(45, 80 - diff * 5)
    # Soul sefirah alignment bonus
    if u_soul == p_soul:
        base += 8
    elif abs(u_soul - p_soul) <= 1:
        base += 4

    base = max(25, min(95, base))

    # Pillar analysis
    u_pillar = "Right" if u_sef in (2, 4, 7) else "Left" if u_sef in (3, 5, 8) else "Middle"
    p_pillar = "Right" if p_sef in (2, 4, 7) else "Left" if p_sef in (3, 5, 8) else "Middle"

    if u_pillar == p_pillar:
        pillar_note = f"Both on the {u_pillar} Pillar — you share the same approach to love (mercy, severity, or balance)."
    elif {u_pillar, p_pillar} == {"Right", "Left"}:
        pillar_note = "Mercy meets Severity — a powerful polarity that creates wholeness when honored."
    else:
        pillar_note = f"{u_pillar} and {p_pillar} pillars — the Middle pillar partner helps balance the other."

    return {
        "score": base,
        "user_profile": {
            "sefirah": u_sef,
            "sefirah_name": u_info[0],
            "love_style": u_info[1],
            "pillar": u_pillar,
        },
        "partner_profile": {
            "sefirah": p_sef,
            "sefirah_name": p_info[0],
            "love_style": p_info[1],
            "pillar": p_pillar,
        },
        "dynamic": pillar_note,
        "strengths": [
            f"Soul alignment: both souls resonate at sefirah {u_soul}" if u_soul == p_soul else None,
            f"Pillar harmony: shared {u_pillar} pillar energy" if u_pillar == p_pillar else None,
            f"Polarity balance: {u_pillar} + {p_pillar} creates divine wholeness" if {u_pillar, p_pillar} == {"Right", "Left"} else None,
        ],
        "challenges": [
            f"Distant sefirot: {u_info[0]} and {p_info[0]} sit far apart on the Tree" if abs(u_sef - p_sef) > 4 else None,
        ],
        "advice": f"Your sefirah ({u_info[0]}) expresses love through {u_info[1].split('—')[0].strip().lower()}, "
                  f"while theirs ({p_info[0]}) flows through {p_info[1].split('—')[0].strip().lower()} — these are genuinely different languages of the soul. "
                  f"The Kabbalistic tradition teaches that every couple must find their meeting point in Tiferet (Beauty), the heart center of the Tree of Life, where all opposites reconcile. "
                  f"When you feel disconnected, return to shared acts of compassion and gratitude — these activate Tiferet regardless of which sefirah each partner naturally inhabits. "
                  f"The distance between your sefirot on the Tree is not a weakness but a measure of how much spiritual territory your love can illuminate together.",
        "best_matches": [SEFIRAH_LOVE[s][0] for s in (4, 5, 6, 7, 9) if s != u_sef][:3],
        "details": [
            {"label": "Sefirot", "value": f"{u_info[0]} + {p_info[0]}", "score": base},
            {"label": "Pillar", "value": f"{u_pillar} + {p_pillar}", "score": 85 if u_pillar != p_pillar else 70},
        ],
    }


def _gematria_compat(user: dict, partner: dict) -> dict[str, Any]:
    """Gematria name-root compatibility."""
    u_root = user.get("text_root", 5)
    p_root = partner.get("text_root", 5)
    u_total = user.get("total", 0)
    p_total = partner.get("total", 0)

    # Root compatibility
    base = ROOT_COMPAT.get((u_root, p_root), ROOT_COMPAT.get((p_root, u_root), 60))

    # Bridge number (combined)
    combined = u_total + p_total
    bridge = combined
    while bridge > 9 and bridge not in (11, 22, 33):
        bridge = sum(int(d) for d in str(bridge))
    if bridge == 0:
        bridge = 9  # reduce 0 to 9 (completion vibration)

    # Bridge bonus
    if bridge in (2, 6, 9):
        base += 5
    elif bridge in (4, 8):
        base += 2

    base = max(25, min(95, base))

    u_meaning = ROOT_LOVE_MEANING.get(u_root, ROOT_LOVE_MEANING.get(u_root % 10 or 9, ""))
    p_meaning = ROOT_LOVE_MEANING.get(p_root, ROOT_LOVE_MEANING.get(p_root % 10 or 9, ""))

    return {
        "score": base,
        "user_profile": {
            "name_root": u_root,
            "total": u_total,
            "love_meaning": u_meaning,
        },
        "partner_profile": {
            "name_root": p_root,
            "total": p_total,
            "love_meaning": p_meaning,
        },
        "bridge_number": bridge,
        "dynamic": f"Name roots {u_root} and {p_root} create bridge number {bridge} — "
                   + ROOT_LOVE_MEANING.get(bridge, ROOT_LOVE_MEANING.get(bridge % 10 or 9, "a unique vibration")).split("—")[0].strip().lower() + ".",
        "strengths": [
            f"Root harmony: {u_root} and {p_root} resonate" if base >= 70 else None,
            f"Bridge {bridge} carries {['partnership', 'harmony', 'nurturing'][bridge % 3]} energy" if bridge in (2, 6, 9) else None,
        ],
        "challenges": [
            f"Root tension: {u_root} and {p_root} vibrate at different frequencies" if base < 55 else None,
        ],
        "advice": f"Your combined name vibration creates a bridge number of {bridge}, which reveals the spiritual undertone of your entire partnership — this is the energy that hums beneath every conversation and shared silence. "
                  f"In Gematria, the names we carry are not accidents — they encode the lessons and gifts we bring into each other's lives. "
                  f"Speaking each other's names with genuine intention activates this bridge energy, which is why the way partners say each other's names matters more than most people realize. "
                  f"When your name roots ({u_root} and {p_root}) are in harmony, you feel understood at a level words cannot explain; when they clash, conscious verbal appreciation becomes the remedy.",
        "best_matches": [f"Root {n}" for n in sorted(ROOT_COMPAT.keys(), key=lambda k: ROOT_COMPAT.get((u_root, k[1] if isinstance(k, tuple) else k), 50), reverse=True) if isinstance(n, int)][:3] or [f"Root {(u_root + 4) % 9 + 1}"],
        "details": [
            {"label": "Name Roots", "value": f"{u_root} + {p_root}", "score": base},
            {"label": "Bridge Number", "value": str(bridge), "score": 80 if bridge in (2, 6, 9) else 60},
        ],
    }


def _persian_compat(user: dict, partner: dict) -> dict[str, Any]:
    """Persian temperament and lunar mansion compatibility."""
    u_temp = user.get("temperament", "Sanguine")
    p_temp = partner.get("temperament", "Sanguine")
    u_mansion = user.get("lunar_mansion", {}).get("name", "")
    p_mansion = partner.get("lunar_mansion", {}).get("name", "")

    temp_score, temp_note = TEMPERAMENT_COMPAT.get(
        (u_temp, p_temp),
        TEMPERAMENT_COMPAT.get((p_temp, u_temp), (65, f"{u_temp} and {p_temp} form a nuanced bond.")),
    )

    score = max(25, min(95, temp_score))

    return {
        "score": score,
        "user_profile": {
            "temperament": u_temp,
            "love_style": TEMPERAMENT_PERSONALITY.get(u_temp, ""),
            "lunar_mansion": u_mansion,
        },
        "partner_profile": {
            "temperament": p_temp,
            "love_style": TEMPERAMENT_PERSONALITY.get(p_temp, ""),
            "lunar_mansion": p_mansion,
        },
        "dynamic": temp_note,
        "strengths": [
            f"Temperament harmony: {u_temp} and {p_temp} balance each other" if score >= 72 else None,
            f"Shared warmth: both temperaments carry social energy" if u_temp in ("Sanguine", "Choleric") and p_temp in ("Sanguine", "Choleric") else None,
        ],
        "challenges": [
            f"Temperament clash: {u_temp} and {p_temp} may irritate each other" if score < 60 else None,
            f"Both cool: {u_temp} + {p_temp} may lack spontaneous passion" if u_temp in ("Melancholic", "Phlegmatic") and p_temp in ("Melancholic", "Phlegmatic") and u_temp != p_temp else None,
        ],
        "advice": f"In Persian astrology, the {u_temp} temperament thrives with "
                  + {"Choleric": "someone who calms without controlling — your fire needs a steady hand, not a wet blanket.",
                     "Sanguine": "someone who grounds without dimming their light — your warmth needs an anchor, not a cage.",
                     "Melancholic": "someone who brings warmth without forcing joy — your depth needs companionship, not a cheerleader.",
                     "Phlegmatic": "someone who energizes without creating chaos — your peace needs gentle momentum, not a storm."}.get(u_temp, "balance and understanding.")
                  + f" Your partner's {p_temp} nature "
                  + ("provides exactly that kind of balance, which is why this pairing feels natural even when life is difficult." if score >= 72
                     else "approaches this differently, which means you both must learn to translate love across temperamental languages.")
                  + f" The Persian sages taught that temperament compatibility shapes everything from how you argue to how you celebrate — knowing this transforms confusion into compassion. "
                  + f"Pay attention to seasonal shifts: the {u_temp} temperament is most vulnerable during its opposite season, and that is when your partner's support matters most.",
        "best_matches": [
            {"Choleric": "Phlegmatic", "Sanguine": "Phlegmatic", "Melancholic": "Sanguine", "Phlegmatic": "Sanguine"}.get(u_temp, "Sanguine"),
            {"Choleric": "Sanguine", "Sanguine": "Choleric", "Melancholic": "Phlegmatic", "Phlegmatic": "Choleric"}.get(u_temp, "Choleric"),
        ],
        "details": [
            {"label": "Temperaments", "value": f"{u_temp} + {p_temp}", "score": score},
        ],
    }


# ═══════════════════════════════════════════════════════════════
# MAIN ORCHESTRATION
# ═══════════════════════════════════════════════════════════════

SYSTEM_META = {
    "western": {"label": "Western Astrology", "icon": "\u2648", "color": "#6B8CFF", "tier": 1},
    "vedic": {"label": "Vedic Astrology", "icon": "\U0001faa7", "color": "#FF9B5E", "tier": 1},
    "chinese": {"label": "Chinese Zodiac", "icon": "\U0001f409", "color": "#FF6B6B", "tier": 2},
    "bazi": {"label": "BaZi", "icon": "\u67f1", "color": "#5ECC8F", "tier": 1},
    "numerology": {"label": "Numerology", "icon": "\U0001f522", "color": "#B47EFF", "tier": 2},
    "kabbalistic": {"label": "Kabbalistic", "icon": "\u2721", "color": "#FFD76B", "tier": 2},
    "gematria": {"label": "Gematria", "icon": "\u05d0", "color": "#7BE0E0", "tier": 3},
    "persian": {"label": "Persian", "icon": "\u263d", "color": "#E07BB4", "tier": 3},
}

SYSTEM_WEIGHT = {
    "western": 1.0, "vedic": 1.0, "bazi": 0.95, "chinese": 0.85,
    "numerology": 0.75, "persian": 0.70, "kabbalistic": 0.60, "gematria": 0.40,
}


def _build_couple_guide(
    systems: dict[str, Any],
    user_name: str,
    partner_name: str,
    overall_score: int,
) -> dict[str, Any]:
    """Synthesize a narrative couple guide from all 8 system results.

    Returns sections: who_you_are, who_they_are, how_you_clash,
    how_to_make_them_happy, how_they_make_you_happy, and living_together.
    """
    # Gather personality traits from each system's profiles
    u_traits: list[str] = []
    p_traits: list[str] = []
    clashes: list[str] = []
    u_joys: list[str] = []
    p_joys: list[str] = []
    coexist: list[str] = []

    # ── Western: Venus/Mars love & conflict styles ──
    w = systems.get("western", {})
    up = w.get("user_profile", {})
    pp = w.get("partner_profile", {})
    if up.get("archetype"):
        u_traits.append(f"In Western astrology, {user_name} is {up['archetype']}.")
    if pp.get("archetype"):
        p_traits.append(f"In Western astrology, {partner_name} is {pp['archetype']}.")
    if up.get("venus_style"):
        u_traits.append(f"In love, {user_name}: {up['venus_style']}")
    if pp.get("venus_style"):
        p_traits.append(f"In love, {partner_name}: {pp['venus_style']}")
    if up.get("mars_style") and pp.get("mars_style"):
        u_mars_elem = up.get("mars", "")
        p_mars_elem = pp.get("mars", "")
        if u_mars_elem != p_mars_elem:
            clashes.append(
                f"When conflict arises, {user_name} (Mars in {u_mars_elem}) {up['mars_style'].split('.')[0].lower()}. "
                f"{partner_name} (Mars in {p_mars_elem}) {pp['mars_style'].split('.')[0].lower()}. "
                f"These different fighting styles can escalate unless both learn to pause and translate."
            )
    if up.get("venus_style") and pp.get("venus_style"):
        u_venus = up.get("venus", "")
        p_venus = pp.get("venus", "")
        if u_venus != p_venus:
            p_joys.append(
                f"{user_name} has Venus in {u_venus} — to feel loved, they need "
                f"{_venus_need(u_venus)}."
            )
            u_joys.append(
                f"{partner_name} has Venus in {p_venus} — to feel loved, they need "
                f"{_venus_need(p_venus)}."
            )

    # ── Vedic: Gana temperament & Yoni physical chemistry ──
    v = systems.get("vedic", {})
    vup = v.get("user_profile", {})
    vpp = v.get("partner_profile", {})
    if vup.get("nakshatra") and vpp.get("nakshatra"):
        u_traits.append(f"Vedic birth star: {vup['nakshatra']} ({vup.get('gana', 'Human')} temperament).")
        p_traits.append(f"Vedic birth star: {vpp['nakshatra']} ({vpp.get('gana', 'Human')} temperament).")
    if vup.get("gana") and vpp.get("gana") and vup["gana"] != vpp["gana"]:
        clashes.append(
            f"Vedic temperament mismatch: {user_name} is {vup['gana']} ('{_gana_desc(vup['gana'])}') "
            f"while {partner_name} is {vpp['gana']} ('{_gana_desc(vpp['gana'])}'). "
            f"This means your instinctive reactions and emotional rhythms run at different speeds."
        )

    # ── Chinese: Animal compatibility & relating ──
    c = systems.get("chinese", {})
    cup = c.get("user_profile", {})
    cpp = c.get("partner_profile", {})
    if cup.get("animal") and cpp.get("animal"):
        u_traits.append(f"Chinese zodiac: {cup['animal']} ({cup.get('element', '')}) — {cup.get('trait', '')}.")
        p_traits.append(f"Chinese zodiac: {cpp['animal']} ({cpp.get('element', '')}) — {cpp.get('trait', '')}.")
        rel = c.get("relationship_type", "")
        if rel:
            coexist.append(f"In Chinese astrology, your animal pairing ({cup['animal']} + {cpp['animal']}) forms a '{rel}' bond — {c.get('dynamic', '')}.")

    # ── BaZi: Day Master interaction ──
    b = systems.get("bazi", {})
    bup = b.get("user_profile", {})
    bpp = b.get("partner_profile", {})
    if bup.get("day_master") and bpp.get("day_master"):
        u_dm = bup["day_master"]
        p_dm = bpp["day_master"]
        u_traits.append(f"BaZi Day Master: {u_dm} — {bup.get('personality', '')}.")
        p_traits.append(f"BaZi Day Master: {p_dm} — {bpp.get('personality', '')}.")
        rel = b.get("relationship_type", "")
        if rel:
            coexist.append(f"BaZi element cycle: {u_dm} and {p_dm} form a '{rel}' interaction — {b.get('dynamic', '')}.")

    # ── Numerology: Life Path personalities ──
    n = systems.get("numerology", {})
    nup = n.get("user_profile", {})
    npp = n.get("partner_profile", {})
    if nup.get("life_path"):
        u_traits.append(f"Life Path {nup['life_path']}: {nup.get('personality', '')}.")
    if npp.get("life_path"):
        p_traits.append(f"Life Path {npp['life_path']}: {npp.get('personality', '')}.")
    n_dynamic = n.get("dynamic", "")
    if n_dynamic:
        coexist.append(f"Numerology says: {n_dynamic}")

    # ── Kabbalistic: Sefirah archetypes ──
    k = systems.get("kabbalistic", {})
    kup = k.get("user_profile", {})
    kpp = k.get("partner_profile", {})
    if kup.get("sefirah") and kpp.get("sefirah"):
        u_traits.append(f"Kabbalistic path: {kup['sefirah']} — {kup.get('quality', '')}.")
        p_traits.append(f"Kabbalistic path: {kpp['sefirah']} — {kpp.get('quality', '')}.")
        if kup["sefirah"] != kpp["sefirah"]:
            coexist.append(
                f"On the Tree of Life, {user_name} walks through {kup['sefirah']} and {partner_name} through {kpp['sefirah']}. "
                f"Together you balance different spiritual energies — {k.get('dynamic', '')}."
            )

    # ── Gematria: Name resonance ──
    g = systems.get("gematria", {})
    g_dynamic = g.get("dynamic", "")
    if g_dynamic:
        coexist.append(f"Gematria (name vibration): {g_dynamic}")

    # ── Persian: Planetary lords & temperament ──
    pe = systems.get("persian", {})
    peup = pe.get("user_profile", {})
    pepp = pe.get("partner_profile", {})
    if peup.get("temperament") and pepp.get("temperament"):
        u_traits.append(f"Persian temperament: {peup['temperament']} — {peup.get('quality', '')}.")
        p_traits.append(f"Persian temperament: {pepp['temperament']} — {pepp.get('quality', '')}.")
        if peup["temperament"] != pepp["temperament"]:
            clashes.append(
                f"Persian astrology sees a {peup['temperament']} vs {pepp['temperament']} temperament pairing. "
                f"{_temperament_clash(peup['temperament'], pepp['temperament'], user_name, partner_name)}"
            )

    # ── Gather all strengths & challenges across systems ──
    all_strengths: list[str] = []
    all_challenges: list[str] = []
    for sid, sys_data in systems.items():
        for s in sys_data.get("strengths", []):
            if s and s != "No specific signals detected." and s not in all_strengths:
                all_strengths.append(s)
        for ch in sys_data.get("challenges", []):
            if ch and ch != "No specific signals detected." and ch not in all_challenges:
                all_challenges.append(ch)

    # Build "how to make each other happy" from advice fields
    for sid, sys_data in systems.items():
        adv = sys_data.get("advice", "")
        if adv and len(adv) > 20:
            # Split long advice into sentences and pick the most actionable
            sentences = [s.strip() for s in adv.replace(". ", ".\n").split("\n") if s.strip()]
            for sent in sentences[:2]:
                if sent not in u_joys and sent not in p_joys:
                    coexist.append(sent)

    # Dedupe and limit
    u_traits = u_traits[:8]
    p_traits = p_traits[:8]
    clashes = clashes[:5]
    if not clashes:
        clashes.append(
            f"No major clash points detected — but every couple benefits from understanding "
            f"that what feels like harmony can sometimes mask unspoken needs."
        )
    coexist = coexist[:6]

    # Build the "making each other happy" sections
    if not u_joys:
        u_joys.append(f"Pay attention to what makes {partner_name} light up — their system profiles suggest they value consistency, presence, and feeling genuinely heard.")
    if not p_joys:
        p_joys.append(f"Pay attention to what makes {user_name} light up — their system profiles suggest they value being seen for who they truly are beyond surface roles.")

    return {
        "who_you_are": u_traits,
        "who_they_are": p_traits,
        "how_you_clash": clashes,
        "how_to_make_them_happy": u_joys,
        "how_they_make_you_happy": p_joys,
        "living_together": coexist,
        "all_strengths": all_strengths[:8],
        "all_challenges": all_challenges[:6],
    }


def _venus_need(sign: str) -> str:
    """Short phrase for what a Venus sign needs to feel loved."""
    needs = {
        "Aries": "excitement, spontaneity, and someone who matches their energy",
        "Taurus": "physical comfort, reliability, and unhurried quality time",
        "Gemini": "stimulating conversation, variety, and mental surprises",
        "Cancer": "emotional safety, nurturing gestures, and loyalty",
        "Leo": "admiration, grand gestures, and being made to feel special",
        "Virgo": "thoughtful acts of service and someone who notices the details",
        "Libra": "beauty, fairness, romantic effort, and partnership equality",
        "Scorpio": "deep emotional intimacy, honesty, and unwavering commitment",
        "Sagittarius": "freedom, adventure, and a partner who grows alongside them",
        "Capricorn": "stability, ambition, and long-term commitment",
        "Aquarius": "intellectual connection, independence, and unconventional expression",
        "Pisces": "emotional depth, imagination, and unconditional empathy",
    }
    return needs.get(sign, "genuine presence and emotional honesty")


def _gana_desc(gana: str) -> str:
    """Brief description of Vedic Gana temperament."""
    return {
        "Deva": "gentle, spiritual, idealistic",
        "Manushya": "practical, balanced, worldly",
        "Rakshasa": "intense, independent, fiercely protective",
    }.get(gana, "balanced")


def _temperament_clash(t1: str, t2: str, n1: str, n2: str) -> str:
    """Narrative for how two Persian temperaments interact."""
    hot = {"Choleric", "Sanguine"}
    cold = {"Melancholic", "Phlegmatic"}
    if t1 in hot and t2 in cold:
        return f"{n1}'s fiery energy may overwhelm {n2}'s cooler nature. {n2} needs space to process while {n1} wants immediate engagement."
    if t1 in cold and t2 in hot:
        return f"{n2}'s intensity may feel like pressure to {n1}. {n1} processes slowly and deeply while {n2} runs hot and fast."
    if t1 == t2:
        return f"Same temperament — you understand each other instinctively, but may lack the contrast needed to balance extremes."
    return f"Your temperaments create a natural push-pull that, once understood, becomes a source of complementary strength."


def _synthesize_tier1(
    systems: dict[str, Any],
    user_name: str,
    partner_name: str,
    overall_score: int,
    intent: Intent = "serious",
) -> dict[str, str]:
    """Synthesize Tier 1 system outputs into a cohesive relationship narrative.

    Combines Western, Vedic, and BaZi insights by theme — not by system —
    producing flowing coach-tone prose with no system labels.
    """
    w = systems.get("western", {})
    v = systems.get("vedic", {})
    b = systems.get("bazi", {})

    w_score = w.get("score", 50)
    v_score = v.get("score", 50)
    b_score = b.get("score", 50)
    avg = round((w_score + v_score + b_score) / 3)

    # ── Extract signals ──
    w_strs = {s.lower()[:40] for s in w.get("strengths", []) if s}
    v_strs = {s.lower()[:40] for s in v.get("strengths", []) if s}

    emotional_strong = any("emotional" in s or "moon" in s for s in w_strs)
    gana_strong = any("gana" in s or "temperament" in s for s in v_strs)
    attraction_strong = any("attraction" in s or "venus-mars" in s for s in w_strs)
    yoni_strong = any("physical" in s or "yoni" in s for s in v_strs)

    b_type = b.get("element_dynamic", {}).get("type", "neutral")
    u_venus = w.get("user_profile", {}).get("venus", "")
    p_venus = w.get("partner_profile", {}).get("venus", "")
    u_needs = b.get("user_profile", {}).get("needs", "")
    p_needs = b.get("partner_profile", {}).get("needs", "")
    u_gana = v.get("user_profile", {}).get("gana", "")
    p_gana = v.get("partner_profile", {}).get("gana", "")

    paras: list[str] = []

    # ── Opening: overall dynamic (intent-aware) ──
    if intent == "healing":
        if avg >= 75:
            paras.append(
                f"Looking back, this connection held real depth. {user_name} and {partner_name} "
                f"shared an instinctive understanding that most people search for their whole lives "
                f"— the bond was never the problem, and recognizing that is where healing begins."
            )
        elif avg >= 60:
            paras.append(
                f"This connection carried genuine potential alongside real tension. "
                f"{user_name} and {partner_name} were never a simple match — "
                f"and understanding why helps you stop blaming yourself for what didn't work."
            )
        else:
            paras.append(
                f"This was always a relationship that asked both people to stretch beyond comfort. "
                f"{user_name} and {partner_name} approached love from very different angles — "
                f"the friction was not failure, it was the nature of the pairing."
            )
    elif intent == "dating":
        if avg >= 75:
            paras.append(
                f"The spark here is real. {user_name} and {partner_name} share a natural chemistry "
                f"that goes beyond surface attraction — you genuinely get each other, "
                f"and that kind of ease is rare early on."
            )
        elif avg >= 60:
            paras.append(
                f"There is something worth exploring here. {user_name} and {partner_name} "
                f"click in some ways and challenge each other in others — "
                f"the mix keeps things interesting if both of you stay curious."
            )
        else:
            paras.append(
                f"This connection is not instant magic, but that does not mean it is not worth pursuing. "
                f"{user_name} and {partner_name} come from different places — which means "
                f"the early dates will be fascinating if you both show up with real curiosity."
            )
    elif intent == "marriage":
        if avg >= 75:
            paras.append(
                f"This partnership has the foundation for lasting commitment. {user_name} and {partner_name} "
                f"share a deep structural compatibility — the kind that sustains a marriage through "
                f"seasons of change, not just the honeymoon."
            )
        elif avg >= 60:
            paras.append(
                f"This relationship has solid bones for a long-term commitment. {user_name} and {partner_name} "
                f"are not identical — and in marriage, that difference becomes the raw material "
                f"for a partnership stronger than either person alone."
            )
        else:
            paras.append(
                f"Marriage between {user_name} and {partner_name} would be a deliberate choice, "
                f"not a default. The differences here are real — but couples who consciously "
                f"choose each other despite friction often build the most resilient unions."
            )
    else:  # serious (default)
        if avg >= 75:
            paras.append(
                f"At its core, this is a relationship built on natural resonance. "
                f"{user_name} and {partner_name} share an instinctive understanding "
                f"that most couples spend years trying to develop — when you are together, "
                f"the connection feels obvious rather than constructed."
            )
        elif avg >= 60:
            paras.append(
                f"This relationship carries genuine potential, with areas of effortless connection "
                f"and others that require conscious navigation. {user_name} and {partner_name} are not identical — "
                f"and that difference is both the challenge and the gift."
            )
        else:
            paras.append(
                f"This is a relationship that demands growth from both people. {user_name} and {partner_name} "
                f"approach love from different angles — which creates friction, "
                f"but also the kind of transformation that comfortable pairings never achieve."
            )

    # ── Theme: Emotional landscape ──
    if emotional_strong and gana_strong:
        paras.append(
            f"Emotionally, you operate on a similar wavelength. Your inner rhythms align naturally, "
            f"which means you can read each other's moods without explanation and recover from "
            f"misunderstandings faster than most couples."
        )
    elif emotional_strong:
        paras.append(
            f"There is a genuine emotional understanding between you — your instinctive reactions "
            f"complement each other, even when your temperamental speeds differ."
        )
    elif gana_strong:
        paras.append(
            f"Your deeper temperaments harmonize well, creating an unspoken sense of ease "
            f"that anchors the relationship even during difficult stretches."
        )
    elif u_gana and p_gana and u_gana != p_gana:
        paras.append(
            f"Your emotional processing runs at different speeds — "
            f"{user_name} tends toward a {u_gana.lower()} rhythm while {partner_name} operates "
            f"from a {p_gana.lower()} one. Neither is wrong, but without awareness this becomes "
            f"the source of your most common misunderstandings."
        )
    else:
        paras.append(
            f"Emotionally, you both need to invest in understanding each other's inner landscape. "
            f"What feels natural to one may feel foreign to the other — patience here pays compound interest."
        )

    # ── Theme: Energy & passion ──
    energy = []
    if b_type == "productive":
        energy.append(
            f"Your energies feed each other in a natural cycle — what {user_name} generates, "
            f"{partner_name} can build upon, creating a bond that strengthens over time "
            f"rather than depleting either person."
        )
    elif b_type == "controlling":
        energy.append(
            f"There is a natural power dynamic in your energy exchange — one of you tends to lead "
            f"while the other absorbs. This works when both are conscious of it, "
            f"but turns corrosive the moment it becomes automatic."
        )
    elif b_type == "same":
        energy.append(
            f"You share the same elemental drive, which creates deep mutual recognition "
            f"but also competition. Learning to take turns in the spotlight becomes essential."
        )
    if attraction_strong or yoni_strong:
        energy.append(
            "The physical chemistry here is genuine and should not be underestimated — "
            "it acts as a bridge during periods when words fail."
        )
    if u_venus and p_venus and u_venus != p_venus:
        energy.append(
            f"In love, {user_name} speaks a {u_venus} language — needing "
            f"{_venus_need(u_venus).split(',')[0]} — while {partner_name} speaks {p_venus}, "
            f"needing {_venus_need(p_venus).split(',')[0]}. "
            f"The couples who thrive here learn to give love in their partner's language, not their own."
        )
    if energy:
        paras.append(" ".join(energy))

    # ── Theme: Conflict signature ──
    if u_needs and p_needs and u_needs != p_needs:
        paras.append(
            f"The most likely recurring tension: {user_name} fundamentally needs "
            f"{u_needs.lower()}, while {partner_name} needs {p_needs.lower()}. "
            f"When stress hits, both partners retreat to these core needs — and if unmet, "
            f"small irritations escalate into real arguments. Name this pattern early and it loses its power."
        )
    elif avg < 65:
        paras.append(
            "When conflict arises, the tendency is for both partners to double down on their own "
            "perspective rather than stepping into the other's experience first. The fix is simple "
            "but not easy: ask before you assume."
        )

    # ── Theme: Long-term path / closing (intent-aware) ──
    if intent == "dating":
        paras.append(
            f"For now, keep it light and keep it honest. The best thing {user_name} and {partner_name} "
            f"can do is stay present — enjoy the discovery phase without rushing to define everything."
        )
    elif intent == "healing":
        if avg >= 60:
            paras.append(
                f"The lesson here is not that the relationship failed — it is that two real people "
                f"tried to meet each other across a genuine divide. What you learned about yourself "
                f"in this bond is the part you get to keep."
            )
        else:
            paras.append(
                f"This was never going to be easy, and it was never your fault alone. "
                f"The patterns that played out between you were wired into the dynamic from the start "
                f"— recognizing that is how you stop carrying what was never yours to fix."
            )
    elif intent == "marriage":
        if avg >= 70:
            paras.append(
                f"Long-term, this union deepens with time. Protect it by never letting comfort "
                f"replace intention — schedule honest conversations, revisit shared goals, "
                f"and keep choosing each other deliberately."
            )
        elif avg >= 55:
            paras.append(
                f"A lasting marriage here depends on building shared systems for conflict "
                f"before you need them. Agree on how you fight, how you repair, "
                f"and how you check in — structure creates the safety that sustains love."
            )
        else:
            paras.append(
                f"If marriage is the goal, both people must commit to extraordinary intentionality. "
                f"This is not a pairing that coasts — it thrives only when both partners invest daily."
            )
    else:  # serious
        if avg >= 70:
            paras.append(
                f"Long-term, this pairing strengthens with time. The key is not to let natural harmony "
                f"breed complacency — continue investing in each other with the same intention you brought "
                f"to the beginning, and this bond becomes genuinely unshakeable."
            )
        elif avg >= 55:
            paras.append(
                f"This relationship's long-term success depends on choosing understanding over rightness. "
                f"Your differences are permanent features, not bugs to fix — the couples who make this work "
                f"embrace the contrast and use it as fuel for mutual growth."
            )
        else:
            paras.append(
                f"For the long term, both people must decide this relationship is worth the effort it demands. "
                f"If that commitment is genuine, the growth you catalyze in each other will be profound — "
                f"but it will never be effortless, and that is perfectly okay."
            )

    narrative = "\n\n".join(paras)
    # Hard cap at 2000 chars
    if len(narrative) > 2000:
        cut = narrative.rfind(".", 0, 2000)
        narrative = narrative[:cut + 1] if cut > 1500 else narrative[:2000]

    return {"narrative": narrative, "theme_count": len(paras)}


# ── Role data for relationship roles ──────────────────────────────

_ROLE_INFO: dict[str, tuple[str, str, str]] = {
    # element → (label, short_desc, overexpression_fix)
    "Wood": (
        "The Visionary",
        "leads through ideas, growth, and forward momentum",
        "becomes controlling and preachy — step back and let your partner find their own path",
    ),
    "Fire": (
        "The Inspirer",
        "energizes through warmth, generosity, and enthusiasm",
        "becomes attention-seeking and dramatic — make room for your partner's spotlight",
    ),
    "Earth": (
        "The Stabilizer",
        "anchors through patience, reliability, and calm presence",
        "becomes rigid and resistant to change — flex when your partner needs movement",
    ),
    "Metal": (
        "The Challenger",
        "pushes through honesty, high standards, and directness",
        "becomes critical and cold — soften the delivery without softening the truth",
    ),
    "Water": (
        "The Emotional Anchor",
        "holds through intuition, empathy, and emotional depth",
        "absorbs too much and loses boundaries — protect your own energy first",
    ),
}

# Western sign element → BaZi-equivalent element for cross-validation
_SIGN_TO_ELEMENT = SIGN_ELEMENT  # Fire/Earth/Air/Water → mapped below

_WESTERN_TO_BAZI: dict[str, str] = {
    "Fire": "Fire", "Earth": "Earth", "Water": "Water",
    "Air": "Metal",  # Air signs share Metal's intellectual/communicative nature
}

# Vedic Gana → element affinity for role cross-check
_GANA_ELEMENT: dict[str, str] = {
    "Deva": "Water",       # gentle, intuitive → Emotional Anchor
    "Manushya": "Earth",   # practical, grounded → Stabilizer
    "Rakshasa": "Fire",    # fierce, intense → Inspirer / Challenger
}

# Nuance phrases: (primary_element, secondary_element) → plain-English nuance
_NUANCE_PHRASE: dict[str, str] = {
    "Wood":  "a stabilizing, grounded side in emotional situations",
    "Fire":  "a warm, expressive side when feelings run high",
    "Earth": "a steady, anchoring quality under pressure",
    "Metal": "a sharper, more direct edge when things get serious",
    "Water": "a deeply intuitive, emotionally absorptive side in private",
}


def _cross_validate_role(
    primary_elem: str,
    western_profile: dict,
    vedic_profile: dict,
) -> str | None:
    """Check Western and Vedic signals against the BaZi primary element.

    Returns the strongest conflicting element if ≥ 2 secondary signals
    disagree with the primary, else None.
    """
    votes: dict[str, int] = {}

    # Western: Sun element
    sun_sign = western_profile.get("sun", "")
    sun_elem = _WESTERN_TO_BAZI.get(_SIGN_TO_ELEMENT.get(sun_sign, ""), "")
    if sun_elem and sun_elem != primary_elem:
        votes[sun_elem] = votes.get(sun_elem, 0) + 1

    # Western: Moon element (emotional core)
    moon_sign = western_profile.get("moon", "")
    moon_elem = _WESTERN_TO_BAZI.get(_SIGN_TO_ELEMENT.get(moon_sign, ""), "")
    if moon_elem and moon_elem != primary_elem:
        votes[moon_elem] = votes.get(moon_elem, 0) + 1

    # Western: Mars element (assertion style)
    mars_sign = western_profile.get("mars", "")
    mars_elem = _WESTERN_TO_BAZI.get(_SIGN_TO_ELEMENT.get(mars_sign, ""), "")
    if mars_elem and mars_elem != primary_elem:
        votes[mars_elem] = votes.get(mars_elem, 0) + 1

    # Vedic: Gana temperament
    gana = vedic_profile.get("gana", "")
    gana_elem = _GANA_ELEMENT.get(gana, "")
    if gana_elem and gana_elem != primary_elem:
        votes[gana_elem] = votes.get(gana_elem, 0) + 1

    if not votes:
        return None

    # Find the strongest dissenting element
    top_elem = max(votes, key=votes.__getitem__
                   )
    # Need ≥ 2 signals to override — single dissent is not enough
    if votes[top_elem] >= 2:
        return top_elem
    return None


def _build_relationship_roles(
    systems: dict[str, Any],
    user_name: str,
    partner_name: str,
    intent: Intent = "serious",
) -> dict[str, Any]:
    """Identify natural relationship roles from Tier 1 data.

    BaZi element is the primary source; Western Sun/Moon/Mars and Vedic Gana
    cross-validate.  When ≥ 2 secondary signals conflict with the primary role,
    a nuance line is added without changing the role label.

    Returns role labels plus a 5-7 sentence narrative covering assignment,
    complement/friction, and adjustment guidance.
    """
    b = systems.get("bazi", {})
    w = systems.get("western", {})
    v = systems.get("vedic", {})

    u_elem = b.get("user_profile", {}).get("element", "Earth")
    p_elem = b.get("partner_profile", {}).get("element", "Earth")

    u_label, u_desc, u_over = _ROLE_INFO.get(u_elem, _ROLE_INFO["Earth"])
    p_label, p_desc, p_over = _ROLE_INFO.get(p_elem, _ROLE_INFO["Earth"])

    # ── Cross-validate against Western & Vedic ──
    u_nuance_elem = _cross_validate_role(
        u_elem, w.get("user_profile", {}), v.get("user_profile", {}),
    )
    p_nuance_elem = _cross_validate_role(
        p_elem, w.get("partner_profile", {}), v.get("partner_profile", {}),
    )

    # Determine element relationship type
    rel_data = ELEMENT_RELATION.get((u_elem, p_elem)) or ELEMENT_RELATION.get((p_elem, u_elem))
    rel_type = rel_data[0] if rel_data else "neutral"

    sentences: list[str] = []

    # 1-2. Role assignment
    if u_elem == p_elem:
        sentences.append(
            f"{user_name} and {partner_name} both play {u_label} in this relationship "
            f"— someone who {u_desc}."
        )
    else:
        sentences.append(
            f"{user_name} naturally plays {u_label} — someone who {u_desc}."
        )
        sentences.append(
            f"{partner_name} is {p_label} — someone who {p_desc}."
        )

    # 2b. Nuance lines (only when cross-system signals disagree)
    if u_nuance_elem:
        nu_phrase = _NUANCE_PHRASE.get(u_nuance_elem, "a contrasting quality in certain situations")
        sentences.append(
            f"However, {user_name} also carries {nu_phrase} "
            f"— expect this to surface during stress or intimacy."
        )
    if p_nuance_elem:
        np_phrase = _NUANCE_PHRASE.get(p_nuance_elem, "a contrasting quality in certain situations")
        sentences.append(
            f"Similarly, {partner_name} shows {np_phrase} "
            f"— which may surprise you when emotions run deep."
        )

    # 3. Complement or competition
    if rel_type == "productive":
        sentences.append(
            f"These roles feed each other — what {user_name} generates, "
            f"{partner_name} can build on, creating a cycle where both grow stronger."
        )
    elif rel_type == "same":
        sentences.append(
            "Sharing the same role means instant recognition but also competition "
            "— you must learn when to lead and when to follow."
        )
    elif rel_type == "controlling":
        sentences.append(
            f"There is a natural power tilt — {user_name}'s {u_label} drive can overpower "
            f"{partner_name}'s {p_label} nature if left unchecked."
        )
    else:
        sentences.append(
            "Your roles sit in different spaces without a strong natural pull "
            "— you get to define the dynamic on your own terms."
        )

    # 4. Friction (intent-aware)
    if intent == "dating":
        if u_elem == p_elem:
            sentences.append(
                "Early on, you may notice you both reach for the same role in conversation "
                "— let it be playful, not competitive."
            )
        else:
            sentences.append(
                "You will notice your different speeds early — lean into the contrast "
                "as something to explore, not something to fix."
            )
    elif intent == "healing":
        if u_elem == p_elem:
            sentences.append(
                "The friction likely came from both of you needing the same thing at the same time "
                "— with neither willing to yield first."
            )
        else:
            sentences.append(
                "The imbalance you felt was structural, not personal — one role naturally "
                "dominated, and the other quietly withdrew."
            )
    else:  # serious / marriage
        if u_elem == p_elem:
            sentences.append(
                "Friction comes when both try to fill the same space at the same time "
                "— one must yield, or small disagreements become power struggles."
            )
        else:
            sentences.append(
                "Imbalance shows up when one role dominates and the other shrinks "
                "— watch for the quieter partner withdrawing instead of speaking up."
            )

    # 5-6. Adjustment guidance (intent-aware)
    if intent == "healing":
        sentences.append(
            f"Looking back, {user_name}'s pattern under pressure was to overexpress — "
            f"{user_name} {u_over}."
        )
        sentences.append(
            f"Meanwhile, {partner_name}'s pattern was similar: {partner_name} {p_over}."
        )
    elif intent == "dating":
        sentences.append(
            f"Something to watch: when {user_name} feels strongly, {user_name} {u_over}."
        )
        sentences.append(
            f"And when {partner_name} is stressed, {partner_name} {p_over}."
        )
    else:  # serious / marriage
        sentences.append(
            f"When {user_name} overexpresses, {user_name} {u_over}."
        )
        sentences.append(
            f"When {partner_name} overexpresses, {partner_name} {p_over}."
        )

    narrative = " ".join(sentences)
    # Hard cap — raised slightly to accommodate nuance lines
    if len(narrative) > 1000:
        cut = narrative.rfind(".", 0, 1000)
        narrative = narrative[:cut + 1] if cut > 750 else narrative[:1000]

    return {
        "user_role": u_label,
        "partner_role": p_label,
        "user_nuance": _ROLE_INFO[u_nuance_elem][0] if u_nuance_elem else None,
        "partner_nuance": _ROLE_INFO[p_nuance_elem][0] if p_nuance_elem else None,
        "narrative": narrative,
    }


# ── Stress behavior data for "When You Clash" ──────────────────────

_STRESS_BEHAVIOR: dict[str, str] = {
    "Aries": "attacks head-on, says things in the heat of the moment, and wants to resolve it right now",
    "Taurus": "shuts down, goes silent, and refuses to engage until they feel safe again",
    "Gemini": "talks circles around the issue, deflects with humor, and avoids the real feeling underneath",
    "Cancer": "retreats emotionally, brings up past hurts, and needs reassurance before re-engaging",
    "Leo": "gets louder, takes everything personally, and needs their dignity acknowledged before anything else",
    "Virgo": "picks apart every detail, criticizes to regain control, and struggles to let go of being right",
    "Libra": "avoids the conflict entirely, agrees to keep the peace, then builds resentment quietly",
    "Scorpio": "goes cold, tests loyalty, and watches carefully to see if the other person will fight for them",
    "Sagittarius": "becomes blunt to the point of cruelty, dismisses emotions as overreaction, and threatens to leave",
    "Capricorn": "walls off emotionally, becomes transactional, and treats the relationship like a problem to solve",
    "Aquarius": "detaches completely, intellectualizes feelings, and makes their partner feel invisible",
    "Pisces": "absorbs all the pain, plays the victim, and drowns in the emotion instead of addressing it",
}

_ELEMENT_TRIGGER: dict[str, str] = {
    "productive": "an imbalance in give-and-take — one person fuels the other but starts running on empty",
    "controlling": "a power struggle — one partner's natural intensity overwhelms the other's boundaries",
    "same": "competition for the same space — both want to lead, both want to be right, and neither yields",
    "neutral": "a slow drift apart — without strong natural tension, frustration builds quietly until it erupts",
}

_ELEMENT_BREAKING: dict[str, str] = {
    "productive": "the giver burns out and stops investing, while the receiver never notices until it's too late",
    "controlling": "the dominant partner stops listening entirely, and the other partner stops trying to be heard",
    "same": "both partners dig in on principle, and the fight becomes about winning rather than understanding",
    "neutral": "emotional distance hardens into indifference — by the time either speaks up, the gap feels permanent",
}


def _build_when_you_clash(
    systems: dict[str, Any],
    user_name: str,
    partner_name: str,
    roles: dict[str, Any],
    intent: Intent = "serious",
) -> dict[str, str]:
    """Simulate real conflict dynamics and provide de-escalation guidance.

    Uses Mars signs for stress behavior, BaZi element relationship for the
    trigger/escalation pattern, and role data for personalized de-escalation.

    Returns a dict with: trigger, user_stress, partner_stress, breaking_point,
    user_deescalation, partner_deescalation, narrative (5-7 sentence block).
    """
    w = systems.get("western", {})
    b = systems.get("bazi", {})

    u_mars = w.get("user_profile", {}).get("mars", "")
    p_mars = w.get("partner_profile", {}).get("mars", "")
    u_elem = b.get("user_profile", {}).get("element", "Earth")
    p_elem = b.get("partner_profile", {}).get("element", "Earth")

    # Element relationship type
    rel_data = ELEMENT_RELATION.get((u_elem, p_elem)) or ELEMENT_RELATION.get((p_elem, u_elem))
    rel_type = rel_data[0] if rel_data else "neutral"

    # ── Trigger ──
    trigger = _ELEMENT_TRIGGER.get(rel_type, _ELEMENT_TRIGGER["neutral"])

    # ── Stress behaviors from Mars sign ──
    u_stress = _STRESS_BEHAVIOR.get(u_mars, "pulls inward and becomes harder to reach")
    p_stress = _STRESS_BEHAVIOR.get(p_mars, "pulls inward and becomes harder to reach")

    # ── Breaking point ──
    breaking = _ELEMENT_BREAKING.get(rel_type, _ELEMENT_BREAKING["neutral"])

    # ── De-escalation: drawn from role overexpression fixes ──
    u_role = roles.get("user_role", "")
    p_role = roles.get("partner_role", "")

    # Map roles back to actionable de-escalation
    _DEESC: dict[str, str] = {
        "The Visionary": "stop trying to fix or direct — ask one open question and then genuinely listen",
        "The Inspirer": "lower the volume and match your partner's energy instead of demanding they match yours",
        "The Stabilizer": "say 'I hear you' before explaining your position — your silence feels like a wall, not calm",
        "The Challenger": "soften the delivery first — your partner cannot hear the truth if it arrives wrapped in criticism",
        "The Emotional Anchor": "name your own feeling out loud before absorbing theirs — you cannot hold both at once",
    }
    u_deesc = f"{user_name} should {_DEESC.get(u_role, 'pause, name what they feel, and ask what their partner needs')}"
    p_deesc = f"{partner_name} should {_DEESC.get(p_role, 'pause, name what they feel, and ask what their partner needs')}"

    # ── Build narrative (5-7 sentences) ──
    sentences: list[str] = []

    # 1. Trigger (intent-aware framing)
    if intent == "healing":
        sentences.append(
            f"The core conflict pattern between {user_name} and {partner_name} was {trigger}."
        )
    elif intent == "dating":
        sentences.append(
            f"If tension ever comes up between {user_name} and {partner_name}, "
            f"it will likely start with {trigger}."
        )
    elif intent == "marriage":
        sentences.append(
            f"Over time, the recurring conflict trigger between {user_name} and {partner_name} "
            f"will be {trigger}."
        )
    else:
        sentences.append(
            f"The most likely conflict trigger between {user_name} and {partner_name} is {trigger}."
        )

    # 2-3. Stress behaviors
    if intent == "healing":
        sentences.append(f"Under pressure, {user_name} tended to {u_stress.split(',')[0]}.")
        sentences.append(f"{partner_name}, in turn, tended to {p_stress.split(',')[0]}.")
    else:
        sentences.append(f"Under stress, {user_name} {u_stress}.")
        sentences.append(f"{partner_name}, on the other hand, {p_stress}.")

    # 4. Breaking point
    if intent == "healing":
        sentences.append(f"The real damage happened when {breaking}.")
    elif intent == "dating":
        sentences.append(f"Left unaddressed, things would escalate when {breaking}.")
    else:
        sentences.append(f"If this goes unchecked, the real damage happens when {breaking}.")

    # 5-6. De-escalation
    if intent == "healing":
        sentences.append(
            f"What {user_name} needed to hear was: {_DEESC.get(u_role, 'pause and name the real feeling')}."
        )
        sentences.append(
            f"And {partner_name} needed: {_DEESC.get(p_role, 'pause and name the real feeling')}."
        )
    else:
        sentences.append(f"{u_deesc}.")
        sentences.append(f"{p_deesc}.")

    # 7. Closing (intent-aware)
    if intent == "healing":
        sentences.append(
            "Understanding this pattern is not about assigning blame — "
            "it is about seeing clearly so you stop repeating it in the next chapter."
        )
    elif intent == "dating":
        sentences.append(
            "None of this needs to be a dealbreaker — knowing each other's stress patterns "
            "this early is a genuine advantage most couples never get."
        )
    elif intent == "marriage":
        if rel_type == "same":
            sentences.append(
                "In a marriage, the rule is simple: the first person to stop defending and start "
                "listening protects the relationship more than being right ever could."
            )
        else:
            sentences.append(
                "Build a repair ritual now — how you recover from conflict matters more "
                "for a lasting marriage than how rarely you fight."
            )
    else:
        if rel_type == "same":
            sentences.append(
                "The rule for this pairing: the first person to stop defending and start listening wins — "
                "not the argument, but the relationship."
            )
        elif rel_type == "controlling":
            sentences.append(
                "Remember: power in this relationship is not about who is right, "
                "but who is willing to make the other person feel safe first."
            )
        else:
            sentences.append(
                "Conflict here is never about the surface issue — name the real need underneath, "
                "and most fights dissolve before they escalate."
            )

    narrative = " ".join(sentences)
    # Hard cap at 1000 chars
    if len(narrative) > 1000:
        cut = narrative.rfind(".", 0, 1000)
        narrative = narrative[:cut + 1] if cut > 750 else narrative[:1000]

    return {
        "trigger": trigger,
        "user_stress": u_stress,
        "partner_stress": p_stress,
        "breaking_point": breaking,
        "user_deescalation": u_deesc,
        "partner_deescalation": p_deesc,
        "narrative": narrative,
    }


def _build_relationship_playbook(
    systems: dict[str, Any],
    user_name: str,
    partner_name: str,
    overall_score: int,
    intent: Intent = "serious",
) -> dict[str, Any]:
    """Generate the final Relationship Playbook — cohesive coaching narrative."""
    # ── Gather strongest signals for thematic weaving ──
    top_challenges: list[str] = []
    for sid in ("western", "vedic", "bazi", "chinese", "numerology", "kabbalistic"):
        s = systems.get(sid, {})
        for ch in s.get("challenges", []):
            if ch and ch != "No specific signals detected." and len(top_challenges) < 4:
                top_challenges.append(ch)

    # ── Extract system-specific data for personalization ──
    w = systems.get("western", {})
    b = systems.get("bazi", {})
    v = systems.get("vedic", {})
    u_venus = w.get("user_profile", {}).get("venus", "")
    p_venus = w.get("partner_profile", {}).get("venus", "")
    u_dm = b.get("user_profile", {}).get("day_master", "")
    p_dm = b.get("partner_profile", {}).get("day_master", "")
    u_needs = b.get("user_profile", {}).get("needs", "")
    p_needs = b.get("partner_profile", {}).get("needs", "")
    u_gana = v.get("user_profile", {}).get("gana", "")
    p_gana = v.get("partner_profile", {}).get("gana", "")
    w_dynamic = w.get("dynamic", "")

    # ── What makes it work (intent-aware) ──
    if intent == "dating":
        what_works = (
            f"What gives this connection its spark is genuine curiosity. {user_name} and {partner_name} "
            f"bring different energies to the table — keep exploring that difference, stay playful, "
            f"and let the chemistry develop without forcing it into a box."
        )
    elif intent == "healing":
        what_works = (
            f"What worked between {user_name} and {partner_name} was real — the connection, "
            f"the moments of understanding, the ways you made each other grow. "
            f"Honoring what was good does not mean you have to go back."
        )
    elif intent == "marriage":
        if overall_score >= 70:
            what_works = (
                f"The foundation for a lasting marriage is already here. {user_name} and {partner_name} "
                f"share a deep structural compatibility — protect it by staying intentional, "
                f"not by assuming it runs itself."
            )
        else:
            what_works = (
                f"This marriage thrives on deliberate investment. {user_name} and {partner_name} "
                f"bring complementary strengths — when both commit to learning the other's language, "
                f"the partnership you build will be stronger than any effortless match."
            )
    else:  # serious
        if overall_score >= 70:
            what_works = (
                f"The foundation here is natural resonance — {user_name} and {partner_name} "
                f"instinctively understand how the other person ticks. Lean into that ease. "
                f"Stop overanalyzing what already works and put your energy into protecting "
                f"what you have rather than fixing what isn't broken."
            )
        elif overall_score >= 55:
            what_works = (
                f"What makes this work is genuine complementary energy. {user_name} and {partner_name} "
                f"each bring something the other lacks — and when both partners commit to "
                f"learning the other's operating system instead of expecting them to change, "
                f"the harmony you build together is stronger than any natural match."
            )
        else:
            what_works = (
                f"This is a growth partnership — it works when both people choose curiosity over criticism. "
                f"The friction between {user_name} and {partner_name} is not a sign of failure "
                f"but a call to evolve. Couples who embrace this dynamic become extraordinary together."
            )

    # ── What breaks it (intent-aware) ──
    primary_clash = top_challenges[0] if top_challenges else "taking each other for granted"
    if intent == "dating":
        what_breaks = (
            f"Moving too fast or trying to lock things down before the connection has room to breathe. "
            f"The risk here is not incompatibility — it is pressure. Let things unfold."
        )
    elif intent == "healing":
        what_breaks = (
            f"What likely eroded the bond was {primary_clash.lower()}. Not because either person was wrong, "
            f"but because the pattern went unnamed for too long. Seeing it now is part of letting go."
        )
    elif intent == "marriage":
        what_breaks = (
            f"The long-term threat is {primary_clash.lower()} becoming normalized. In a marriage, "
            f"small unchecked friction compounds into emotional distance. Address patterns early "
            f"— repair is always cheaper than rebuilding."
        )
    else:  # serious
        if overall_score >= 70:
            what_breaks = (
                f"Complacency is the silent killer. Because things feel easy, both partners stop investing. "
                f"The moment either person assumes this runs on autopilot, the bond starts to erode. "
                f"Stay alert to {primary_clash.lower()} — it creeps in when comfort replaces intention."
            )
        else:
            what_breaks = (
                f"The biggest threat is letting frustration become contempt. When {primary_clash.lower()}, "
                f"resist the urge to see your partner as the problem — it is the pattern, not the person. "
                f"Unchecked criticism and emotional withdrawal will end this faster than any difference between you."
            )

    # ── Top 3 daily behaviors (personalized prescriptions) ──
    daily_behaviors = []

    if u_venus and p_venus and u_venus != p_venus:
        daily_behaviors.append(
            f"Give love in their language, not yours — {user_name} needs "
            f"{_venus_need(u_venus).split(',')[0]}, {partner_name} needs "
            f"{_venus_need(p_venus).split(',')[0]}. One gesture in their language "
            f"outweighs ten in yours."
        )
    else:
        daily_behaviors.append(
            "Name something specific you appreciate about your partner every day — "
            "not what they do, but who they are. Specific praise builds deeper trust "
            "than any grand gesture."
        )

    if u_needs and p_needs and u_needs != p_needs:
        daily_behaviors.append(
            f"Meet your partner's core need before they ask — {user_name} craves "
            f"{u_needs.lower()}, {partner_name} craves {p_needs.lower()}. "
            f"Proactively honoring this prevents most fights before they start."
        )
    else:
        daily_behaviors.append(
            "Check in with 'how are you feeling right now' instead of 'how was your day.' "
            "This builds emotional visibility that keeps resentment from growing underground."
        )

    if u_gana and p_gana and u_gana != p_gana:
        daily_behaviors.append(
            f"Respect that you process at different speeds — {user_name} runs a {u_gana.lower()} "
            f"rhythm, {partner_name} runs {p_gana.lower()}. Give each other space to arrive "
            f"at the same place in their own time."
        )
    else:
        daily_behaviors.append(
            "Build one daily ritual that belongs only to the two of you — shared tea, a walk, "
            "three minutes of silence together. Small rituals compound into unshakeable bonds."
        )

    # ── #1 mistake to avoid (intent-aware) ──
    if intent == "dating":
        mistake = (
            f"Overthinking compatibility before you have actually spent real time together. "
            f"Charts reveal patterns, not destiny — let the real-world experience lead."
        )
    elif intent == "healing":
        mistake = (
            f"Believing you could have fixed the pattern alone. The dynamic between "
            f"{user_name} and {partner_name} was co-created — no single person "
            f"could have changed it without the other meeting them halfway."
        )
    elif intent == "marriage":
        if overall_score >= 75:
            mistake = (
                f"Assuming this marriage runs itself. High compatibility creates a dangerous "
                f"illusion — even the strongest unions drift without intentional daily investment."
            )
        else:
            mistake = (
                f"Trying to reshape your partner into someone they are not. {user_name} and "
                f"{partner_name} are wired differently — in marriage, you must love the actual person, "
                f"not the version you wish they were."
            )
    else:  # serious
        if "unlikely" in w_dynamic.lower() or "friction" in w_dynamic.lower() or overall_score < 55:
            mistake = (
                f"Trying to reshape your partner into someone they are not. {user_name} and "
                f"{partner_name} are wired differently — that is a feature, not a flaw. "
                f"The moment you try to make them more like you, you destroy the very contrast "
                f"that gives this relationship its power."
            )
        elif overall_score >= 75:
            mistake = (
                f"Assuming this relationship runs itself. High compatibility creates a dangerous "
                f"illusion that love needs no maintenance. It does — even the best-matched couples "
                f"drift apart without intentional daily investment."
            )
        else:
            mistake = (
                f"Keeping score. The moment either partner starts tracking who gives more, "
                f"the relationship shifts from partnership to competition. Give freely or address "
                f"the imbalance directly — never silently tally."
            )

    # ── Long-term peace / closing (intent-aware) ──
    if intent == "dating":
        long_term = (
            f"Keep it simple: show up consistently, communicate honestly, and let the connection "
            f"reveal itself over time. The best early investment is genuine attention."
        )
    elif intent == "healing":
        long_term = (
            f"The path forward is not about forgetting — it is about integrating. Take the self-knowledge "
            f"this relationship gave you and let it make your next chapter clearer, not heavier."
        )
    elif intent == "marriage":
        if overall_score >= 70:
            long_term = (
                f"Schedule honest conversations about where you are both headed — individually and together. "
                f"The marriages that last are not the ones that never fight, but the ones that keep "
                f"choosing each other after every disagreement."
            )
        elif overall_score >= 50:
            long_term = (
                f"Build shared systems for conflict before you need them. Agree on the signal for "
                f"'I need space,' the rule about always coming back to the table, "
                f"and the commitment to fight the problem, not each other."
            )
        else:
            long_term = (
                f"If this marriage is the choice, go all in: couples therapy, shared goals, "
                f"regular check-ins. This pairing rewards extraordinary commitment and will not "
                f"sustain half-measures."
            )
    else:  # serious
        if overall_score >= 70:
            long_term = (
                f"Your long-term success depends on continued growth, not comfort. Keep scheduling "
                f"honest conversations about where you are both headed — individually and together. "
                f"The couples who last are not the ones who never fight, but the ones who keep choosing "
                f"each other after every disagreement."
            )
        elif overall_score >= 50:
            long_term = (
                f"Build a shared language for conflict before you need it. Agree on the signal for "
                f"'I need space,' the rule about always coming back to the table, the commitment to "
                f"fight the problem and not each other. Structure creates safety, and safety creates lasting love."
            )
        else:
            long_term = (
                f"Accept that this relationship will always require more effort than average — and decide "
                f"whether that effort is worth it. If yes, go all in: couples therapy, shared goals, "
                f"regular check-ins. Half-measures will not sustain this bond."
            )

    # ── Length guard: cap each section to 400 chars ──
    def _cap(text: str, limit: int = 400) -> str:
        if len(text) <= limit:
            return text
        cut = text.rfind(".", 0, limit)
        return (text[:cut + 1] if cut > limit * 0.6 else text[:limit]) + "..."

    what_works = _cap(what_works)
    what_breaks = _cap(what_breaks)
    mistake = _cap(mistake, 350)
    long_term = _cap(long_term)
    daily_behaviors = [_cap(b, 300) for b in daily_behaviors[:3]]

    # ── Dedup guard: ensure daily behaviors don't repeat each other ──
    seen_phrases: set[str] = set()
    deduped: list[str] = []
    for b in daily_behaviors:
        # Extract first 40 chars as a fingerprint
        fp = b[:40].lower()
        if fp not in seen_phrases:
            seen_phrases.add(fp)
            deduped.append(b)
    daily_behaviors = deduped

    return {
        "what_works": what_works,
        "what_breaks": what_breaks,
        "daily_behaviors": daily_behaviors,
        "top_mistake": mistake,
        "long_term": long_term,
    }


def compute(
    user_reading: dict[str, Any],
    partner_reading: dict[str, Any],
    user_name: str = "You",
    partner_name: str = "Partner",
    intent: Intent = "serious",
) -> dict[str, Any]:
    """Run full love compatibility analysis across all 8 systems.

    Parameters
    ----------
    user_reading : complete reading dict (from _generate_reading)
    partner_reading : complete reading dict
    user_name, partner_name : display names
    intent : relationship intent mode (dating/serious/marriage/healing)

    Returns
    -------
    dict with overall_score, verdict, per-system results, areas, and advice.
    """
    u_sys = user_reading.get("systems", {})
    p_sys = partner_reading.get("systems", {})

    # Run per-system compatibility
    compat_fns = {
        "western": _western_compat,
        "vedic": _vedic_compat,
        "chinese": _chinese_compat,
        "bazi": _bazi_compat,
        "numerology": _numerology_compat,
        "kabbalistic": _kabbalistic_compat,
        "gematria": _gematria_compat,
        "persian": _persian_compat,
    }

    systems = {}
    for sys_id, fn in compat_fns.items():
        try:
            result = fn(u_sys.get(sys_id, {}), p_sys.get(sys_id, {}))
        except Exception:
            result = {"score": 50, "dynamic": "System data unavailable.", "strengths": [], "challenges": [],
                      "advice": "", "best_matches": [], "details": [], "user_profile": {}, "partner_profile": {}}

        # Clean None from lists; use polished fallbacks instead of generic text
        _FALLBACK = {
            "strengths": {
                "western": "Your planetary placements create a foundation for mutual understanding.",
                "vedic": "The nakshatra connection offers spiritual growth potential for this bond.",
                "bazi": "Your elemental pairing carries the potential for complementary energy.",
                "chinese": "Your zodiac animals carry the potential for loyalty and shared adventure.",
                "numerology": "Your numbers suggest an underlying harmony worth nurturing.",
                "kabbalistic": "Your spiritual paths can illuminate each other when you stay curious.",
                "gematria": "Your name vibrations create a subtle resonance in this partnership.",
                "persian": "Your temperaments carry the seeds of mutual enrichment.",
            },
            "challenges": {
                "western": "Stay aware of how different emotional rhythms can create small frictions.",
                "vedic": "Be mindful that spiritual temperaments may need conscious bridging.",
                "bazi": "Watch for moments when both partners compete for the same energy.",
                "chinese": "Pay attention to when your natural instincts pull in different directions.",
                "numerology": "Notice when your core life desires drift out of alignment.",
                "kabbalistic": "Be conscious of when different spiritual needs create subtle distance.",
                "gematria": "Stay aware of how unspoken expectations can quietly build tension.",
                "persian": "Notice when temperamental differences show up as irritation rather than curiosity.",
            },
        }
        for key in ("strengths", "challenges"):
            result[key] = [s for s in result.get(key, []) if s]
            if not result[key]:
                result[key] = [_FALLBACK.get(key, {}).get(sys_id, "This tradition sees potential worth exploring.")]

        # Attach system metadata
        meta = SYSTEM_META.get(sys_id, {})
        result["label"] = meta.get("label", sys_id)
        result["icon"] = meta.get("icon", "")
        result["color"] = meta.get("color", "#888")
        result["system_id"] = sys_id
        result["tier"] = meta.get("tier", 2)

        systems[sys_id] = result

    # Weighted overall score
    total_w = 0.0
    weighted_sum = 0.0
    for sys_id, res in systems.items():
        w = SYSTEM_WEIGHT.get(sys_id, 0.5)
        weighted_sum += res["score"] * w
        total_w += w
    overall_score = round(weighted_sum / total_w) if total_w > 0 else 50

    # Area cross-reference
    areas = {}
    for area_key in ("love", "career", "health", "wealth", "mood"):
        u_vals = []
        p_vals = []
        for sid in compat_fns:
            u_bucket = u_sys.get(sid, {}).get("scores", u_sys.get(sid, {}).get("probabilities", {}))
            p_bucket = p_sys.get(sid, {}).get("scores", p_sys.get(sid, {}).get("probabilities", {}))
            u_v = u_bucket.get(area_key, {}).get("value") if isinstance(u_bucket.get(area_key), dict) else None
            p_v = p_bucket.get(area_key, {}).get("value") if isinstance(p_bucket.get(area_key), dict) else None
            if u_v is not None:
                u_vals.append(u_v)
            if p_v is not None:
                p_vals.append(p_v)
        u_avg = round(sum(u_vals) / len(u_vals)) if u_vals else 50
        p_avg = round(sum(p_vals) / len(p_vals)) if p_vals else 50
        synergy = round((u_avg + p_avg) / 2)
        diff = abs(u_avg - p_avg)
        if diff < 10:
            note = f"Closely aligned in {area_key} — this area flows naturally between you."
        elif diff < 20:
            note = f"Moderate differences in {area_key} create a healthy balance of perspectives."
        else:
            note = f"Significant contrast in {area_key} energy — conscious effort transforms friction into growth."
        areas[area_key] = {
            "user_score": u_avg,
            "partner_score": p_avg,
            "synergy": synergy,
            "note": note,
        }

    # Verdict
    if overall_score >= 82:
        verdict = "Celestial Union"
        verdict_prose = (
            f"{user_name} and {partner_name} share a rare cosmic alignment. All eight astrological traditions "
            f"point toward an extraordinarily deep and resonant bond — the kind ancient astrologers called destined."
        )
    elif overall_score >= 70:
        verdict = "Harmonious Match"
        verdict_prose = (
            f"The majority of traditions affirm the natural chemistry between {user_name} and {partner_name}. "
            f"Your charts resonate across planetary positions, elemental balance, and karmic cycles."
        )
    elif overall_score >= 58:
        verdict = "Promising Bond"
        verdict_prose = (
            f"{user_name} and {partner_name} hold genuine cosmic potential. Some systems sing in harmony "
            f"while others reveal areas for growth. The contrast is the engine of transformation."
        )
    elif overall_score >= 46:
        verdict = "Growth Partnership"
        verdict_prose = (
            f"The connection between {user_name} and {partner_name} is one of transformation. "
            f"Your differences are not obstacles — they are doorways to expanding each other."
        )
    elif overall_score >= 34:
        verdict = "Cosmic Tension"
        verdict_prose = (
            f"{user_name} and {partner_name} face significant cosmic friction across multiple systems. "
            f"This relationship demands conscious work, radical honesty, and willingness to grow."
        )
    else:
        verdict = "Opposite Forces"
        verdict_prose = (
            f"{user_name} and {partner_name} carry very different energies across most traditions. "
            f"This bond requires exceptional patience and devotion to understanding each other's nature."
        )

    # ── Couple Guide: narrative synthesis ──────────────────────────
    couple_guide = _build_couple_guide(systems, user_name, partner_name, overall_score)

    # ── Tier 1 Synthesis: combined insight narrative ──────────────
    tier1_synthesis = _synthesize_tier1(systems, user_name, partner_name, overall_score, intent)

    # ── Relationship Roles & Dynamics ────────────────────────────
    relationship_roles = _build_relationship_roles(systems, user_name, partner_name, intent)

    # ── When You Clash: conflict simulation ─────────────────────
    when_you_clash = _build_when_you_clash(systems, user_name, partner_name, relationship_roles, intent)

    # ── Relationship Playbook: coaching summary ──────────────────
    playbook = _build_relationship_playbook(systems, user_name, partner_name, overall_score, intent)

    return {
        "overall_score": overall_score,
        "verdict": verdict,
        "verdict_prose": verdict_prose,
        "user_name": user_name,
        "partner_name": partner_name,
        "systems": systems,
        "couple_guide": couple_guide,
        "tier1_synthesis": tier1_synthesis,
        "relationship_roles": relationship_roles,
        "when_you_clash": when_you_clash,
        "relationship_playbook": playbook,
        "intent": intent,
    }
