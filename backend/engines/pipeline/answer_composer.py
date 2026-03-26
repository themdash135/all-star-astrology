"""Answer Composer — translates aggregated output into a personalized Oracle voice.

The answer MUST:
  - Reference the user's actual chart placements ("Your Taurus Sun", "Your Fire Day Master")
  - Explain WHY in plain language, not technical jargon
  - Feel like advice from a knowledgeable astrologer, not a data dump
  - Vary in phrasing — no two identical answers for the same question
"""

from __future__ import annotations

import hashlib
import json
import random

from .context_memory import UserContext
from .pattern_analyzer import PatternResult
from .schemas import AggregatedResult, ClassifiedIntent, ComposedAnswer, SystemOpinion

SYSTEM_NAMES: dict[str, str] = {
    "western":     "Western Astrology",
    "vedic":       "Vedic Astrology",
    "bazi":        "BaZi",
    "numerology":  "Numerology",
    "chinese":     "Chinese Zodiac",
    "persian":     "Persian Astrology",
    "kabbalistic": "Kabbalistic",
    "gematria":    "Gematria",
}

SYSTEM_FOCUS: dict[str, str] = {
    "western":     "planetary transits",
    "vedic":       "Vedic timing",
    "bazi":        "elemental structure",
    "numerology":  "number cycles",
    "chinese":     "zodiac cycles",
    "persian":     "timing windows",
    "kabbalistic": "symbolic balance",
    "gematria":    "symbolic language",
}

CLOSE_GAP = 0.10


# ═══════════════════════════════════════════════════════════════════
#  Transit raw text → plain-language interpretation
# ═══════════════════════════════════════════════════════════════════

_TRANSIT_PLAIN: dict[str, str] = {
    "identity pressure": "you may feel like the world is questioning who you are — patience, not force, is the answer",
    "structured growth": "disciplined effort is paying off quietly behind the scenes",
    "emotional restriction": "emotional decisions carry extra weight right now — tread carefully",
    "emotional maturity": "this is a grounding phase for your inner life — serious feelings solidify",
    "relationship testing": "existing bonds face honest scrutiny — what's real will survive",
    "stable affection": "loyalty deepens — a good time to invest in the people who matter",
    "frustrated action": "your efforts may hit resistance — redirect rather than force through",
    "disciplined effort": "controlled, steady action produces results that last",
    "self-image pressure": "you're carrying more responsibility than usual — it's temporary",
    "grounded presence": "others see your steadiness and trust it",
    "career pressure": "professional demands are intense — play the long game",
    "career advancement": "recognition is building — stay consistent",
    "emotional volatility": "feelings are running high — give yourself room before reacting",
    "intuitive surge": "your instincts are sharper than usual — trust them",
    "romantic intensity": "attraction and desire are amplified — enjoy it, but stay aware",
    "creative inspiration": "a burst of creative energy wants to express itself through you",
    "assertive drive": "your energy is high and directed — channel it into action, not conflict",
    "competitive edge": "you have an edge right now — use it decisively",
    "impulse control": "impulsive energy is strong — pause before committing to anything major",
    "expansion opportunity": "doors are opening — say yes to what feels genuinely exciting",
    "financial expansion": "material growth energy is present — make moves with confidence",
    "philosophical growth": "your perspective is widening — seek teachers and new ideas",
    "romantic expansion": "love is generous right now — open your heart wider",
    "social abundance": "connections and opportunities multiply through people",
    "transformation pressure": "something old is ending to make room — let it go",
    "deep healing": "powerful healing energy is available if you're willing to look inward",
    "power struggle": "control dynamics are heightened — choose your battles wisely",
    "spiritual awakening": "subtle shifts in awareness are reshaping how you see everything",
    "unexpected change": "surprises are likely — flexibility serves you better than plans",
    "romantic idealism": "love feels dreamy and idealized — enjoy it, but stay grounded",
    "creative dissolution": "old creative patterns dissolve to make way for something more authentic",
}


def _humanize_transit(feature: str, value: str) -> str:
    """Convert raw transit text into conversational interpretation."""
    vl = value.lower()
    # Try to match a known transit meaning phrase
    for key, plain in _TRANSIT_PLAIN.items():
        if key in vl:
            # Extract the transit name (e.g., "Saturn Trine Venus")
            transit_name = value.split("—")[0].strip() if "—" in value else feature.replace("transit ", "")
            return f"{transit_name} is active in your chart — {plain}"
    # Fallback: strip the raw dash-separated format into something readable
    if "—" in value:
        parts = value.split("—", 1)
        aspect = parts[0].strip()
        meaning = parts[1].strip().lower()
        return f"{aspect} is active — {meaning}"
    return f"a transit is shaping your energy: {value}"


# ═══════════════════════════════════════════════════════════════════
#  Nakshatra → plain-language nature descriptions
# ═══════════════════════════════════════════════════════════════════

_NAKSHATRA_NATURE: dict[str, str] = {
    "Ashwini": "a swift, healing energy that thrives on fresh starts",
    "Bharani": "an intense, transformative force tied to birth and rebirth",
    "Krittika": "a sharp, purifying fire that cuts through illusion",
    "Rohini": "a fertile, magnetic energy that attracts beauty and comfort",
    "Mrigashira": "a curious, searching spirit always seeking something new",
    "Ardra": "a stormy, transformative energy that clears the way for growth",
    "Punarvasu": "a renewing, optimistic force that always bounces back",
    "Pushya": "a nurturing, protective energy that builds lasting foundations",
    "Ashlesha": "a penetrating, intuitive force that sees beneath surfaces",
    "Magha": "a regal, ancestral energy connected to legacy and authority",
    "Purva Phalguni": "a creative, pleasure-loving spirit that radiates warmth",
    "Uttara Phalguni": "a generous, service-oriented energy focused on partnership",
    "Hasta": "a skillful, detail-oriented force with healing hands",
    "Chitra": "a brilliant, artistic energy that creates beauty from raw material",
    "Swati": "an independent, adaptable spirit that moves with the wind",
    "Vishakha": "a determined, goal-driven force that never loses focus",
    "Anuradha": "a devoted, friendship-oriented energy that builds deep bonds",
    "Jyeshtha": "a protective, elder energy with natural authority",
    "Mula": "a root-cutting force that destroys what no longer serves you",
    "Purva Ashadha": "an invincible, water-like energy that wears down all resistance",
    "Uttara Ashadha": "an unstoppable, righteous force that achieves lasting victory",
    "Shravana": "a listening, learning energy that absorbs wisdom from everywhere",
    "Dhanishta": "a rhythmic, prosperous energy that attracts abundance",
    "Shatabhisha": "a healing, secretive force connected to hidden knowledge",
    "Purva Bhadrapada": "a fierce, visionary energy that burns with spiritual intensity",
    "Uttara Bhadrapada": "a deep, contemplative force with oceanic emotional wisdom",
    "Revati": "a gentle, compassionate energy that guides others safely home",
}


# ═══════════════════════════════════════════════════════════════════
#  Evidence → human language translator
# ═══════════════════════════════════════════════════════════════════

def _humanize_evidence(feature: str, value: str, domain: str = "") -> str:
    """Convert a raw evidence item into interpretive prose.

    The domain parameter allows context-aware interpretation — explaining
    WHY a placement matters for the user's specific question.
    """
    fl = feature.lower()
    vl = value.lower()
    _theme = value.split("—")[1].strip() if "—" in value else ""
    _num = value.split("—")[0].strip() if "—" in value else value

    # ── Transit interpretations (must come before planet-name checks) ──
    if fl.startswith("transit"):
        return _humanize_transit(feature, value)

    # ── Venus placement (key for love) ────────────────────────────
    if fl == "venus" or ("venus" in fl and "condition" not in fl):
        sign = value.split("in")[0].strip() if "in" in value else value.split()[0]
        house_part = ""
        if "house" in vl:
            h = value.split("House")[-1].split("—")[0].strip()
            house_part = f" in your {_ordinal(h)} house"
            house_meaning = {
                "1": " of self and identity",
                "2": " of resources and self-worth",
                "5": " of romance and creativity",
                "7": " of partnerships and marriage",
                "8": " of deep bonds and transformation",
                "10": " of public life and ambition",
                "11": " of friendships and aspirations",
            }
            h_num = h.split()[0] if h else ""
            house_part += house_meaning.get(h_num, "")
        exalted = "exalted" in vl
        if exalted:
            return f"Venus sits in {sign}{house_part} — exalted here, meaning your capacity for love and connection is at its peak"
        return f"Venus is placed in {sign}{house_part}, shaping how you attract and express affection"

    # ── Planet conditions (with interpretation) ───────────────────
    if "condition" in fl:
        planet = feature.replace(" condition", "").strip()
        # Extract sign placement from value like "Venus in Pisces - Exalted"
        sign_part = ""
        if " in " in value:
            raw_sign = value.split(" in ")[1].split("-")[0].split("—")[0].strip()
            sign_part = f" in {raw_sign}"
        if "exalted" in vl:
            return f"{planet} is exalted{sign_part}, operating at full strength in your chart"
        if "dignified" in vl or "ruler" in vl:
            return f"{planet} is dignified{sign_part}, comfortable and effective in its position"
        if "detriment" in vl or "fall" in vl:
            return f"{planet} is weakened{sign_part}, struggling to express its natural gifts"
        return f"{planet}'s condition is {value}"

    # Moon phase
    if "moon phase" in fl:
        phase_name = _num
        if _theme:
            return f"the Moon is in its {phase_name} phase — a time to {_theme}"
        return f"the Moon is in its {phase_name} phase"

    # Sun/Moon sign with house interpretation
    if fl in ("sun sign", "moon sign"):
        body = "Sun" if "sun" in fl else "Moon"
        sign = value.split()[0] if value else value
        house_info = ""
        if "house" in vl:
            h = value.split("House")[-1].strip()
            h_num = h.split()[0] if h else ""
            body_house = {
                "1": "identity and self-expression",
                "4": "home and emotional foundations",
                "5": "creativity and romance",
                "7": "partnerships and relationships",
                "10": "career and public reputation",
                "12": "the subconscious and hidden strengths",
            }
            meaning = body_house.get(h_num, f"house {h_num}")
            house_info = f", placed in the realm of {meaning}"
        return f"your {body} is in {sign}{house_info}"

    # Day Master with elemental interpretation
    if "day master" in fl and "strength" not in fl:
        if "(" in value and ")" in value:
            element = value.split("(")[1].split(")")[0]
            traits = {
                "Fire": "passion, visibility, and decisive action",
                "Water": "adaptability, intuition, and emotional depth",
                "Wood": "growth, planning, and steady expansion",
                "Metal": "precision, determination, and structure",
                "Earth": "stability, nurturing, and grounded wisdom",
            }
            trait = traits.get(element, "its unique elemental nature")
            return f"your Day Master is {element}, giving you a core nature of {trait}"
        return f"your Day Master is {value}"

    # Day Master strength
    if "strength" in fl:
        if "weak" in vl:
            return f"your Day Master runs weak right now, meaning external support and favorable timing matter more"
        if "strong" in vl:
            return f"your Day Master is strong, giving you the internal resources to push forward"
        return f"your Day Master is {value.lower()}"

    # Favorable/unfavorable elements
    if "favorable element" in fl:
        return f"your chart thrives when supported by {value} energy"
    if "unfavorable element" in fl:
        return f"{value} energy creates resistance in your chart right now"

    # ── Numerology with meaning ───────────────────────────────────
    if "personal day" in fl:
        if _theme:
            return f"today's Personal Day vibration is {_num}, channeling {_theme}"
        return f"your Personal Day is {_num}"
    if "personal month" in fl:
        if _theme:
            return f"this month's vibration is {_num}, creating a field of {_theme}"
        return f"your Personal Month is {_num}"
    if "personal year" in fl:
        if _theme:
            return f"you're in a {_num} Personal Year — a year of {_theme}"
        return f"your Personal Year is {_num}"

    # Life Path
    if "life path" in fl:
        if _theme:
            return f"your Life Path {_num} naturally draws you toward {_theme}"
        return f"your Life Path is {_num}"

    # Transit interpretation
    if "transit" in fl:
        return _humanize_transit(feature, value)

    # Planetary hour / day ruler
    if "planetary hour" in fl:
        return f"the current {value}"
    if "day ruler" in fl:
        return f"today is ruled by {value}, coloring the day's energy"

    # Tithi
    if fl == "tithi":
        paksha = "waxing" if "shukla" in vl else "waning" if "krishna" in vl else ""
        if paksha:
            return f"the lunar day is {paksha} ({value}), favoring {'growth and new beginnings' if paksha == 'waxing' else 'reflection and release'}"
        return f"the lunar day is {value}"

    # Yoga
    if fl == "yoga":
        return f"the Vedic yoga active today is {value}"

    # Gochara
    if "gochara" in fl:
        return f"{feature.replace('Gochara ', '')} is currently transiting through {value}, activating that area of your chart"

    # Temperament domain fit (e.g. "Melancholic is 60% relevant to career")
    if "temperament" in fl and "domain" in fl:
        temp_name = value.split(" is ")[0].strip() if " is " in value else value
        temp_meaning = {
            "choleric": "decisive action and bold moves",
            "sanguine": "social warmth and optimistic momentum",
            "melancholic": "introspection and analytical clarity",
            "phlegmatic": "calm stability and patient endurance",
        }
        meaning = temp_meaning.get(temp_name.lower(), "its natural energy")
        return f"your {temp_name} temperament supports {meaning} in this area"

    # Temperament
    if "temperament" in fl:
        temp_meaning = {
            "choleric": "driving you toward decisive action and bold moves",
            "sanguine": "giving you social warmth and optimistic momentum",
            "melancholic": "deepening your introspection and analytical clarity",
            "phlegmatic": "offering calm stability and patient endurance",
        }
        meaning = temp_meaning.get(vl, "shaping your energy")
        return f"your temperament is {value}, {meaning}"

    # Year animal / relation
    if "year animal" in fl and "current" in fl:
        return f"the current year animal is {value}, setting the backdrop for this period"
    if "year animal" in fl:
        return f"you were born under the {value} in the Chinese zodiac"
    if "year relation" in fl:
        return f"the zodiac cycle reveals {value}"

    # Sefirah with interpretation
    if "sefirah" in fl:
        sefirah_meanings = {
            "keter": "divine will and highest aspiration",
            "chokmah": "creative spark and raw wisdom",
            "binah": "understanding and the power of form",
            "chesed": "abundance, mercy, and expansion",
            "gevurah": "discipline, boundaries, and focused strength",
            "tiferet": "harmony, beauty, and balanced integration",
            "netzach": "desire, persistence, and emotional drive",
            "hod": "intellect, communication, and strategy",
            "yesod": "foundation, dreams, and inner truth",
            "malkuth": "manifestation and grounded reality",
        }
        sefirah_name = vl.split("—")[0].strip().split()[0] if vl else ""
        meaning = sefirah_meanings.get(sefirah_name, "")
        if meaning:
            return f"your {feature.lower()} is {_num}, the sphere of {meaning}"
        return f"your {feature.lower()} is {value}"

    # Text/bridge root
    if "root" in fl:
        if _theme:
            return f"your {feature.lower()} ({_num}) resonates with {_theme}"
        return f"your {feature.lower()} is {_num}"

    # Retrograde
    if "retrograde" in fl:
        return f"{feature} signals a period of review — {value}"

    # ── BaZi expanded ───────────────────────────────────────────
    # Symbolic stars
    if "symbolic star" in fl or feature in (
        "Nobleman Star", "Peach Blossom", "Academic Star",
        "Traveling Horse", "Sky Happiness", "Lonely Star",
        "Fortune Star", "Authority Star", "Disaster Star", "Void Star",
    ):
        return f"your chart activates the {feature} — {value}"
    # Branch interactions
    if "branch" in fl and any(w in vl for w in ("clash", "combination", "harm", "destruction")):
        return f"your pillars show a {value}"
    # Element balance
    if "element balance" in fl:
        return f"your element composition is {value}"
    # Na Yin
    if "na yin" in fl:
        return f"your day pillar melody is {value}"
    # Luck period
    if "luck period" in fl or "da yun" in fl:
        return f"your current luck period is {value}"
    # Current pillar ten god
    if "ten god" in fl:
        return f"today's Ten God relation is {value}"

    # ── Vedic expanded ──────────────────────────────────────────
    # Nakshatra detail — strip parenthetical jargon, add meaning
    if "nakshatra" in fl:
        name = value.split("(")[0].strip() if "(" in value else value.strip()
        nature = _NAKSHATRA_NATURE.get(name, "")
        if fl == "moon nakshatra":
            if nature:
                return f"your Moon nakshatra is {name} — {nature}, revealing your emotional instincts and inner nature"
            return f"your Moon nakshatra is {name}, revealing your emotional instincts and inner nature"
        if nature:
            return f"your {feature.lower()} is {name} — {nature}"
        return f"your {feature.lower()} is {name}"
    # Lagna lord
    if "lagna lord" in fl:
        return f"your ascendant lord sits in {value}, directing the trajectory of your personal growth"
    # Graha dignity
    if "dignity" in fl:
        planet = feature.replace(" dignity", "").strip()
        if "exalted" in vl:
            return f"{planet} is exalted — operating with exceptional clarity and force"
        return f"{feature}: {value}"
    if "graha" in fl:
        return f"{feature}: {value}"
    # Strong yogas
    if "yoga" in fl and "strong" in fl:
        if "none" in vl or not value.strip():
            return "no standout planetary yogas are active right now, keeping the field neutral"
        return f"your chart forms {value} — a significant planetary combination that amplifies your potential here"
    # Mahadasha / Antardasha
    if "mahadasha" in fl:
        return f"you're in a {value} Mahadasha period, which colors everything in your life right now"
    if "antardasha" in fl:
        return f"your current sub-period is ruled by {value}, fine-tuning the energy of this chapter"
    # Dasha domain
    if "dasha" in fl and "domain" in fl:
        return f"your {feature.lower()} activates {value}"

    # ── Chinese expanded ────────────────────────────────────────
    # Month/Hour animal
    if "month animal" in fl:
        return f"your Chinese month animal is {value}"
    if "hour animal" in fl:
        return f"your Chinese hour animal is {value}"
    # Secret friend
    if "secret friend" in fl:
        return f"your secret friend animal is {value}"
    # San He / Liu He
    if "san he" in fl or "three harmony" in fl:
        return f"you share a Three Harmony trine — {value}"
    if "liu he" in fl or "six harmony" in fl:
        return f"a Six Harmony bond is active — {value}"
    # Six Clash
    if "six clash" in fl or ("clash" in fl and "animal" in fl):
        return f"a zodiac clash is active — {value}"
    # Element cycle
    if "element cycle" in fl:
        return f"the element flow shows {value}"
    # Compatibility
    if "compatibility" in fl and "delta" in fl:
        return f"the zodiac harmony score is {value}"
    # Day animal
    if "day animal" in fl and "current" in fl:
        return f"today's zodiac animal is {value}"

    # ── Kabbalistic expanded ────────────────────────────────────
    # Pillar balance
    if "pillar balance" in fl:
        return f"your Tree of Life {value}"
    # Path theme
    if "path" in fl and "theme" in fl:
        return f"your {feature.lower()} speaks of {value}"
    # World layer
    if "world" in fl and ("atzilut" in vl or "briah" in vl or "yetzirah" in vl or "assiah" in vl):
        return f"your current world is {value}"
    # Name sefirah
    if "name sefirah" in fl:
        return f"your name resonates with {value}"

    # ── Gematria expanded ───────────────────────────────────────
    # Ordinal root
    if "ordinal root" in fl:
        num = value.split("—")[0].strip() if "—" in value else value
        theme = value.split("—")[1].strip() if "—" in value else ""
        if theme:
            return f"your ordinal root ({num}) signals {theme}"
        return f"your ordinal root is {num}"
    # Root alignment/harmony
    if "root" in fl and ("alignment" in fl or "harmony" in fl):
        return f"your symbolic roots show {value}"
    # Word convergence
    if "word" in fl and ("convergence" in fl or "divergence" in fl):
        return f"the words in your question {value}"
    # Hebrew letter
    if "hebrew letter" in fl:
        return f"the Hebrew letter correspondence is {value}"
    # Source type
    if "source type" in fl:
        return f"gematria computed from {value}"

    # ── Persian expanded ────────────────────────────────────────
    # Triplicity ruler chain
    if "triplicity" in fl:
        if "strong" in vl:
            import re
            m = re.search(r"(\d+)\s*strong", value)
            strong_count = int(m.group(1)) if m else 0
            if strong_count >= 2:
                return "your triplicity rulers are well-placed, supporting this area of your chart"
            elif strong_count == 1:
                return "one of your triplicity rulers holds strength, offering partial support here"
            else:
                return "your triplicity rulers lack strength right now, suggesting patience"
        return f"your triplicity ruler alignment is {value}"
    # Lunar mansion
    if "lunar mansion" in fl and "current" in fl:
        return f"the current lunar mansion is {value}"
    if "lunar mansion" in fl and "natal" in fl:
        return f"your natal lunar mansion is {value}"
    if "mansion" in fl and ("harmoni" in vl or "tense" in vl or "alignment" in vl):
        return f"the mansion alignment is {value}"
    # Ascendant (Persian)
    if fl == "ascendant" or "rising" in vl:
        return f"your rising sign is {value}"
    # Planet condition
    if "condition" in fl and any(p in feature for p in ("Sun", "Moon", "Mars", "Venus", "Mercury", "Jupiter", "Saturn")):
        return f"{feature}: {value}"
    # Humor balance
    if "humor" in fl or ("hot" in fl and "cold" in fl):
        return f"your humor balance shows {value}"
    # Lot of Fortune / Fortune house domain
    if "fortune" in fl and "house" in fl:
        # Extract the meaning part: "House 12 (hidden matters...)" → "hidden matters..."
        if "(" in value and ")" in value:
            meaning = value.split("(")[1].split(")")[0]
            return f"your Lot of Fortune falls in the house of {meaning}, adding a layer of context"
        return f"your Lot of Fortune is in {value}"
    if "lot" in fl and "meaning" in fl:
        return f"your {feature.lower()}: {value}"
    if "lot" in fl and "fortune" in fl:
        return f"your Lot of Fortune is in {value}"
    # Sect
    if fl == "sect":
        return f"yours is a {value.lower()}, shaping which planets work strongest for you"
    # Current Moon/Sun sign
    if "current moon" in fl:
        return f"the Moon is currently in {value}"
    if "current sun" in fl:
        return f"the Sun is currently in {value}"

    # ── Numerology expanded ─────────────────────────────────────
    # Expression number
    if "expression" in fl:
        num = value.split("—")[0].strip() if "—" in value else value
        theme = value.split("—")[1].strip() if "—" in value else ""
        if theme:
            return f"your Expression number is {num}, reflecting {theme}"
        return f"your Expression number is {num}"
    # Soul Urge
    if "soul urge" in fl:
        if _theme:
            return f"your Soul Urge is {_num} — at your deepest level, you crave {_theme}"
        return f"your Soul Urge is {_num}"
    # Personality number
    if "personality" in fl and "sefirah" not in fl:
        num = value.split("—")[0].strip() if "—" in value else value
        theme = value.split("—")[1].strip() if "—" in value else ""
        if theme:
            return f"your Personality number is {num}, projecting {theme}"
        return f"your Personality number is {num}"
    # Birthday number
    if "birthday" in fl:
        num = value.split("—")[0].strip() if "—" in value else value
        theme = value.split("—")[1].strip() if "—" in value else ""
        if theme:
            return f"your Birthday number {num} carries {theme}"
        return f"your Birthday number is {num}"
    # Attitude number
    if "attitude" in fl:
        num = value.split("—")[0].strip() if "—" in value else value
        theme = value.split("—")[1].strip() if "—" in value else ""
        if theme:
            return f"your Attitude number {num} suggests {theme}"
        return f"your Attitude number is {num}"
    # Harmony/dissonance
    if "harmony" in fl and "day" in fl:
        return f"your day-year cycle shows {value}"
    # Universal Year
    if "universal year" in fl:
        return f"the Universal Year is {value}"

    # ── Western expanded ────────────────────────────────────────
    # Venus/Mars sign
    if fl == "venus":
        return f"your Venus is in {value}"
    if fl == "mars":
        return f"your Mars is in {value}"
    # Midheaven
    if "midheaven" in fl:
        return f"your Midheaven is in {value}"
    # Dominant modality
    if "modality" in fl:
        return f"your dominant modality is {value}"
    # Planet dignity/condition
    if "dignified" in vl or "exalted" in vl:
        return f"{feature} is strong — {value}"
    if "detriment" in vl or "fall" in vl:
        return f"{feature} is weakened — {value}"
    # Aspect tension
    if "aspect" in fl and ("tension" in fl or "balance" in fl):
        return f"your natal chart shows {value}"

    # Fallback
    return f"{feature}: {value}"


def _ordinal(s: str) -> str:
    """Convert '12' to '12th', '1' to '1st', etc."""
    s = s.strip()
    try:
        n = int(s)
    except ValueError:
        return s
    if 11 <= n % 100 <= 13:
        return f"{n}th"
    return f"{n}{['th','st','nd','rd','th','th','th','th','th','th'][n % 10]}"


# ═══════════════════════════════════════════════════════════════════
#  Variation pools — no two answers should read identically
# ═══════════════════════════════════════════════════════════════════

# ── Opening pools by stance × tone ───────────────────────────────

# ── Yes/No pools (only for actual yes/no questions) ─────────────
_OPEN_YESNO_FAV_FIRM = [
    "Yes — your chart is clear on this.",
    "The answer is yes, and your systems say it with conviction.",
    "The stars say yes. Trust what you're hearing.",
]
_OPEN_YESNO_FAV_GUIDED = [
    "Your chart leans toward yes.",
    "More systems favor yes than not. The lean is real.",
    "The reading tilts toward yes. Not a shout, but a steady voice.",
]
_OPEN_YESNO_FAV_EXPLORATORY = [
    "A slight lean toward yes — but listen closely, not loudly.",
    "Not a decisive signal, but the lean is toward yes.",
    "There's a quiet yes in your chart. Whether to follow it is yours to decide.",
]
_OPEN_YESNO_CAUT_FIRM = [
    "Not now. The systems are unusually clear on this.",
    "Your chart says no — at least for this moment.",
    "Hold off. The stars counsel patience here.",
]
_OPEN_YESNO_CAUT_GUIDED = [
    "Your chart leans toward no — or at least, not yet.",
    "The reading suggests patience over action right now.",
    "Most of your chart favors holding steady for now.",
]
_OPEN_YESNO_CAUT_EXPLORATORY = [
    "Your chart hesitates. Not a hard no, but not a green light.",
    "A gentle caution runs through the reading.",
    "The systems are divided, but patience has a slight edge.",
]

# ── Guidance pools (for open-ended "How is...", "What energy...", etc.) ──
_OPEN_FAV_FIRM = [
    "Your chart shows strong, clear energy in this area right now.",
    "This is one of the clearer signals in your reading.",
    "The stars are aligned here — the signal is unusually strong.",
    "Your systems converge with conviction on this.",
    "There's powerful energy moving through your chart on this front.",
]
_OPEN_FAV_GUIDED = [
    "The signals are encouraging — most of your systems see promise here.",
    "There's genuine support in your chart, though not without nuance.",
    "Your reading shows a positive current running through this area.",
    "The energy around this is favorable — your systems agree more than they differ.",
    "Your chart has something meaningful to say about this.",
]
_OPEN_FAV_EXPLORATORY = [
    "Your chart offers cautious encouragement in this area.",
    "The signals tip toward openness, though the margin is slim.",
    "There's a gentle but real signal in your chart here.",
    "Your systems see potential here, but the picture isn't fully formed.",
    "The energy is there, but it's subtle — worth watching.",
]
_OPEN_CAUT_FIRM = [
    "Your chart urges you to pause and reflect here.",
    "The stars counsel patience in this area.",
    "Your systems see friction — this is a period for restraint, not action.",
    "Hold steady. Your chart sees something that calls for caution.",
    "This is a pause period, not an action period.",
]
_OPEN_CAUT_GUIDED = [
    "Your chart leans toward caution in this area.",
    "There's a cautionary thread running through your systems here.",
    "The reading suggests taking a step back before moving forward.",
    "Most of your chart favors holding steady.",
    "The timing calls for restraint more than motion.",
]
_OPEN_CAUT_EXPLORATORY = [
    "The signals lean slightly toward caution, though it's close.",
    "A gentle caution runs through the reading.",
    "The systems are divided, but patience has a slight edge.",
    "Neither a strong push nor pull — but caution edges ahead.",
    "Your chart doesn't have a clear direction here, which itself is a message.",
]

_OPEN_TIMING_FAV = [
    "The timing window is opening.",
    "Conditions are aligning — this period supports action.",
    "Your chart favors movement in this window.",
    "The stars say: the timing is ripe.",
]
_OPEN_TIMING_CAUT = [
    "Not yet. The timing signals aren't aligned.",
    "Your chart says wait for a better window.",
    "Hold steady — the right moment hasn't arrived.",
    "The timing leans unfavorable. Patience will serve you.",
]

_OPEN_EMOTIONAL_POS = [
    "Your energy reads as steady right now.",
    "The emotional weather in your chart looks calm.",
    "There's a groundedness in your current cycle.",
    "Your systems see resilience in your emotional state.",
]
_OPEN_EMOTIONAL_NEG = [
    "Your chart sees some heaviness right now — and honors it.",
    "This is a rest period. The weight you feel is real, and temporary.",
    "The systems acknowledge turbulence in your emotional sky.",
    "Be gentle with yourself. Your chart shows this is a demanding phase.",
]

# ── Evidence connectors ───────────────────────────────────────────

_EVIDENCE_LEAD = [
    "Your {focus} chart shows {detail}.",
    "Drawing from {focus}, {detail}.",
    "In the {focus} reading, {detail}.",
    "Looking at {focus}, {detail}.",
    "Through the lens of {focus}, {detail}.",
    "Starting with {focus} — {detail}.",
]
_EVIDENCE_FOLLOW = [
    "{name} adds to this — {detail}.",
    "From {focus}, {detail}.",
    "{name} echoes the signal: {detail}.",
    "Meanwhile, {detail} ({name}).",
    "And from {focus}, {detail}.",
]
_COUNTERPOINT = [
    "Not every voice agrees — {name} notes that {detail}.",
    "A counterpoint from {name}: {detail}.",
    "But {name} urges caution — {detail}.",
    "There's tension here: {detail} ({name}), suggesting restraint.",
    "On the other hand, {name} notes that {detail}.",
]

# ── Agreement summaries ───────────────────────────────────────────

_AGREE_ALL = [
    "All {n} systems point the same way — a rare, clear signal.",
    "Every system consulted agrees. That kind of alignment is uncommon.",
    "{n} of {n} in unison. The chart speaks with one voice.",
]
_AGREE_MAJORITY = [
    "The majority of your chart leans this way ({n_for} of {n_total}).",
    "{n_for} of {n_total} systems agree, with {n_against} offering counterpoints.",
    "Most of your systems support this ({n_for} of {n_total}), though the minority has a voice too.",
]
_AGREE_DIVIDED = [
    "Your chart is genuinely split on this — {n_for} of {n_total} lean this way.",
    "The systems don't strongly agree. {n_for} of {n_total} favor it; the rest diverge.",
    "An honest divide: {n_for} of {n_total} support it, the rest hold back.",
]
_CLOSE_BINARY = [
    "The margin is razor-thin — both paths are genuinely viable.",
    "Either option is defensible here. Your instinct should be the tiebreaker.",
    "It's close enough that the chart alone can't decide for you.",
]
_CLOSE_NONBINARY = [
    "With signals this close, your own intuition carries extra weight.",
    "The margin is slim — trust what your gut already knows.",
    "When the stars whisper instead of shout, listen to yourself too.",
]

# ── Closings by tone ──────────────────────────────────────────────

_CLOSE_FIRM = [
    "Trust this reading.",
    "The chart has spoken clearly. Let it guide you.",
    "Act on this with confidence.",
    "You have the stars behind you here.",
]
_CLOSE_GUIDED = [
    "Let this guide you, but stay present.",
    "Follow the lean — and keep your eyes open.",
    "Move with this energy, not against it.",
    "The direction is there. Walk it at your own pace.",
]
_CLOSE_EXPLORATORY = [
    "Stay open. The picture will sharpen with time.",
    "Sit with this — not every answer arrives on demand.",
    "Let clarity come to you rather than chasing it.",
    "Hold the question gently. Answers have their own timing.",
]

# ── Upgrade 101: Emotion-aware opening pools ─────────────────────

_OPEN_EMPATHETIC = [
    "I hear you — and your chart has something to say about this.",
    "This clearly matters to you, and the stars have been watching.",
    "Take a breath first. What your chart shows may offer some relief.",
    "You're carrying a lot right now. Let's see what the stars reveal.",
    "Your feelings are valid. Let's see what guidance your chart offers.",
]

_OPEN_DIRECT = [
    "Straight to it.",
    "Here's what your chart says.",
    "Let's look at the signals.",
    "The reading is clear.",
    "No hedging needed — the chart speaks.",
]

# ── Upgrade 103: Question-type-specific opening pools ────────────

_OPEN_RELATIONSHIP = [
    "Your chart speaks to the heart of this connection.",
    "When it comes to matters of the heart, your systems have perspective.",
    "Love is complex — here's what your chart sees.",
    "The relationship signals in your chart are worth hearing.",
]
_OPEN_CAREER = [
    "Your chart has insight into this professional crossroads.",
    "Career moves show up clearly in your systems.",
    "When it comes to your path, the stars have an opinion.",
    "Your professional instincts find backing in the chart.",
]
_OPEN_HEALTH = [
    "Your chart reflects something about your energy right now.",
    "Health questions show up as patterns across your systems.",
    "Your body and the stars share a language. Here's what they're saying.",
    "The vitality signals in your chart are telling.",
]
_OPEN_WEALTH = [
    "Financial questions get a unique reading from your chart.",
    "Money moves show up distinctly across your systems.",
    "Your chart has perspective on the material side of this.",
    "Wealth signals come through clearly here.",
]

# ── Upgrade 104: Flowing narrative connectors ────────────────────

_TRANSITIONS = [
    "This aligns with what {name} reveals — {detail}.",
    "Deeper still, {detail} ({name}).",
    "Adding nuance, {name} shows {detail}.",
    "Looking through another lens, {detail} ({name}).",
    "Beneath the surface, {name} finds {detail}.",
    "There's more — {detail}, according to {name}.",
    "Reinforcing this, {name} highlights {detail}.",
    "Another thread: {detail} ({name}).",
    "From {focus}, a complementary signal — {detail}.",
    "Interestingly, {name} picks up {detail}.",
]

# ── Upgrade 105: Confidence strength qualifiers ──────────────────

_QUALIFIER: dict[str, list[str]] = {
    "high":   ["strongly", "clearly", "decisively", "with conviction"],
    "medium": ["gently", "with moderate conviction", "steadily"],
    "low":    ["tentatively", "with some hesitation", "softly", "quietly"],
}

# ── Upgrade 106: Domain metaphor layer ───────────────────────────

_DOMAIN_METAPHORS: dict[str, list[str]] = {
    "love":   ["the garden of your connections", "the emotional current between you", "the heart's compass"],
    "career": ["the architecture of your path", "the compass of ambition", "the road you're building"],
    "health": ["the weather of your vitality", "the rhythm of your body", "your inner tides"],
    "wealth": ["the currents of abundance", "the soil of your resources", "the harvest ahead"],
    "mood":   ["the inner sky", "your emotional weather", "the landscape of your spirit"],
}

# ── Upgrade 108: Domain-specific closings ────────────────────────

_CLOSE_DOMAIN: dict[str, list[str]] = {
    "love":   [
        "Trust what your heart already knows.",
        "The heart's timing has its own logic.",
        "Love asks for presence more than certainty.",
        "Let connection guide you more than calculation.",
    ],
    "career": [
        "The path forward will crystallize with your next move.",
        "Professional instincts and celestial signals point the same way.",
        "Career clarity often arrives in motion, not in waiting.",
        "Your next step is the one that matters most.",
    ],
    "health": [
        "Honor your body's rhythm above all external pressures.",
        "Health flows from alignment with your natural cycles.",
        "Listen to what your body is telling you alongside the stars.",
        "Wellbeing is a rhythm, not a destination.",
    ],
    "wealth": [
        "Financial seeds planted now will show their nature in time.",
        "Abundance follows alignment — the chart suggests where to invest energy.",
        "Material flow mirrors inner readiness.",
        "Patience with resources tends to be rewarded in this cycle.",
    ],
    "mood":   [
        "Your emotional weather will shift. Give it space.",
        "Feelings are data, not destiny. The chart confirms this.",
        "Inner storms pass. The underlying current is what matters.",
        "Be gentle with yourself through this phase.",
    ],
}

# ── Upgrade 107: System specialization for deep contradiction ────

_SYSTEM_SPECIALIZATION: dict[str, str] = {
    "western":     "timing and planetary cycles",
    "vedic":       "karmic patterns and spiritual readiness",
    "bazi":        "elemental strength and structural alignment",
    "numerology":  "vibrational cycles and numeric resonance",
    "chinese":     "relational harmony and seasonal energy",
    "persian":     "real-time celestial conditions",
    "kabbalistic": "symbolic and spiritual alignment",
    "gematria":    "hidden numeric patterns",
}


# ═══════════════════════════════════════════════════════════════════
#  Tone (adjusted thresholds — less hedging)
# ═══════════════════════════════════════════════════════════════════

def _tone(confidence: float, gap: float, emotional_charge: float = 0.0) -> str:
    # Upgrade 101: high emotional charge softens tone one level
    if emotional_charge > 0.70:
        if confidence >= 0.50 and gap >= 0.10:
            return "guided"  # firm → guided when emotional
        return "exploratory"
    if confidence >= 0.50 and gap >= 0.10:
        return "firm"
    if confidence >= 0.28:
        return "guided"
    return "exploratory"


# ═══════════════════════════════════════════════════════════════════
#  Layer 1: Opening — direct, varied, question-appropriate
# ═══════════════════════════════════════════════════════════════════

def _chart_lead(top_opinions: list[SystemOpinion]) -> str | None:
    """Extract the most impactful chart detail from the top contributing system.

    Prefers natal/personal placements over transits for the opening detail,
    since transits read better in the body than as an opening "Specifically".
    """
    if not top_opinions:
        return None
    # Try all top opinions, preferring non-transit evidence
    for op in top_opinions[:3]:
        sorted_ev = sorted(op.evidence, key=lambda e: e.weight, reverse=True)
        # First pass: skip transits
        for ev in sorted_ev[:4]:
            if not ev.feature.lower().startswith("transit"):
                return _humanize_evidence(ev.feature, ev.value)
        # Second pass: accept anything
        if sorted_ev:
            return _humanize_evidence(sorted_ev[0].feature, sorted_ev[0].value)
    return None


def _opening(
    winner: str,
    intent: ClassifiedIntent,
    tone: str,
    gap: float,
    top_opinions: list[SystemOpinion] | None = None,
) -> str:
    base: str
    emotional_charge = getattr(intent, "emotional_charge", 0.0)
    negated = getattr(intent, "negated", False)
    domain_tags = intent.domain_tags or []

    # ── Upgrade 101: empathetic opening for high emotional charge ──
    if emotional_charge > 0.70:
        base = random.choice(_OPEN_EMPATHETIC)
        chart_detail = _chart_lead(top_opinions) if top_opinions else None
        if chart_detail:
            return f"{base} {chart_detail}."
        return base

    # ── Upgrade 101: direct opening for low emotional charge ──────
    if emotional_charge < 0.15 and emotional_charge > 0:
        base = random.choice(_OPEN_DIRECT)
        chart_detail = _chart_lead(top_opinions) if top_opinions else None
        if chart_detail:
            return f"{base} {chart_detail}."
        return base

    # ── Upgrade 110: negation-aware framing ───────────────────────
    # When the question is negated, flip the favorable/cautious pools
    effective_winner = winner
    if negated and winner in ("favorable", "cautious"):
        effective_winner = "cautious" if winner == "favorable" else "favorable"

    # ── Upgrade 103: domain-specific openings ─────────────────────
    primary_domain = domain_tags[0] if domain_tags else None
    domain_pool = None
    if intent.question_type == "relationship_question" or primary_domain == "love":
        domain_pool = _OPEN_RELATIONSHIP
    elif intent.question_type == "career_question" or primary_domain == "career":
        domain_pool = _OPEN_CAREER
    elif intent.question_type == "health_energy_question" or primary_domain == "health":
        domain_pool = _OPEN_HEALTH
    elif primary_domain == "wealth":
        domain_pool = _OPEN_WEALTH

    # Use domain pool only for non-binary, non-firm tones
    is_named_binary = (
        intent.question_type == "binary_decision"
        and len(intent.options) == 2
        and effective_winner not in ("favorable", "cautious")
    )
    if domain_pool and tone != "firm" and not is_named_binary:
        base = random.choice(domain_pool)
        chart_detail = _chart_lead(top_opinions) if top_opinions else None
        if chart_detail:
            return f"{base} {chart_detail}."
        return base

    # Timing questions
    if intent.question_type == "timing_question":
        if effective_winner in ("favorable", "positive"):
            base = random.choice(_OPEN_TIMING_FAV)
        else:
            base = random.choice(_OPEN_TIMING_CAUT)

    # Emotional state
    elif intent.question_type == "emotional_state_question":
        if effective_winner in ("favorable", "positive"):
            base = random.choice(_OPEN_EMOTIONAL_POS)
        elif effective_winner in ("cautious", "negative"):
            base = random.choice(_OPEN_EMOTIONAL_NEG)
        else:
            base = random.choice(_OPEN_EMOTIONAL_POS + _OPEN_EMOTIONAL_NEG)

    # Binary decisions — name the actual options (skip if default favorable/cautious)
    elif (
        intent.question_type == "binary_decision"
        and len(intent.options) == 2
        and effective_winner not in ("favorable", "cautious")
    ):
        # Clean and capitalize option labels
        _STRIP_PREFIXES = {
            "i", "you", "we", "they", "he", "she", "it", "my", "to",
            "should", "will", "can", "do", "does", "would", "could", "am", "is", "are",
        }
        def _clean_option(raw: str) -> str:
            words = raw.strip().split()
            while words and words[0].lower() in _STRIP_PREFIXES:
                words = words[1:]
            return " ".join(w.capitalize() for w in words) if words else raw.title()
        named = _clean_option(effective_winner)
        loser_key = [o for o in intent.options if o != effective_winner]
        loser = _clean_option(loser_key[0]) if loser_key else ""
        if tone == "firm":
            pool = [
                f"Your chart clearly favors {named}.",
                f"The systems lean decisively toward {named}.",
                f"Between the two, {named} has strong backing in your chart.",
            ]
            if loser:
                pool.append(f"Between {named} and {loser}, your chart points firmly at {named}.")
        elif tone == "guided":
            pool = [
                f"The lean is toward {named}, though it's not overwhelming.",
                f"Your chart edges toward {named}.",
                f"Between the two, {named} has more support in your reading.",
            ]
        else:
            pool = [
                f"Slight edge to {named} — but it's close.",
                f"Your chart tips toward {named} by a thin margin.",
                f"Neither option dominates, but {named} has a slight lead.",
            ]
        base = random.choice(pool)

    # Detect if the question is actually yes/no (not open-ended guidance)
    elif effective_winner in ("favorable", "positive", "cautious", "negative"):
        # A question is yes/no only if it's binary with NAMED options
        # (not the default favorable/cautious fallback)
        has_named_options = (
            intent.options
            and set(intent.options) != {"favorable", "cautious"}
        )
        is_yesno = has_named_options
        # Use yes/no pools for actual yes/no questions, guidance pools otherwise
        fav = effective_winner in ("favorable", "positive")
        if is_yesno and fav:
            pool = (
                _OPEN_YESNO_FAV_FIRM if tone == "firm"
                else _OPEN_YESNO_FAV_GUIDED if tone == "guided"
                else _OPEN_YESNO_FAV_EXPLORATORY
            )
        elif is_yesno and not fav:
            pool = (
                _OPEN_YESNO_CAUT_FIRM if tone == "firm"
                else _OPEN_YESNO_CAUT_GUIDED if tone == "guided"
                else _OPEN_YESNO_CAUT_EXPLORATORY
            )
        elif fav:
            pool = (
                _OPEN_FAV_FIRM if tone == "firm"
                else _OPEN_FAV_GUIDED if tone == "guided"
                else _OPEN_FAV_EXPLORATORY
            )
        else:
            pool = (
                _OPEN_CAUT_FIRM if tone == "firm"
                else _OPEN_CAUT_GUIDED if tone == "guided"
                else _OPEN_CAUT_EXPLORATORY
            )
        base = random.choice(pool)

    # Fallback
    else:
        base = random.choice(_OPEN_FAV_GUIDED + _OPEN_CAUT_GUIDED)

    # ── Upgrade 1: Weave chart-specific detail into opening ───
    chart_detail = _chart_lead(top_opinions) if top_opinions else None
    if chart_detail:
        return f"{base} Specifically, {chart_detail}."
    return base


# ═══════════════════════════════════════════════════════════════════
#  Cross-system convergence detection (Upgrade 2)
# ═══════════════════════════════════════════════════════════════════

# Domain keywords to scan in evidence features/values
_CONVERGENCE_THEMES: dict[str, set[str]] = {
    "love":   {"venus", "peach blossom", "soul urge", "7th", "house 7", "netzach", "love", "romance", "libra", "taurus", "relationship", "secret friend"},
    "career": {"saturn", "midheaven", "10th", "house 10", "career", "officer", "nobleman", "gevurah", "capricorn", "profession", "mars"},
    "wealth": {"jupiter", "fortune", "2nd", "house 2", "wealth", "8th", "house 8", "direct wealth", "chesed", "money", "financial"},
    "health": {"mars", "ascendant", "6th", "house 6", "health", "vitality", "strength", "temperament", "moon phase"},
    "mood":   {"moon", "neptune", "sefirah", "yoga", "personal day", "pisces", "cancer", "emotional", "water", "nakshatra"},
}


_CONVERGENCE_TEMPLATES = [
    "{sys_list} all independently highlight {label} in your chart right now.",
    "Across {sys_list}, the theme of {label} keeps surfacing.",
    "Multiple systems — {sys_list} — converge on {label} as a key thread.",
    "There's a clear echo across {sys_list}, all pointing to {label}.",
]


def _detect_convergence(
    opinions: list[SystemOpinion],
    intent: ClassifiedIntent,
) -> str | None:
    """Detect when 4+ systems independently point to the same domain theme.

    Returns a convergence sentence or None.
    """
    if len(opinions) < 4:
        return None

    # For each theme, count how many systems have matching evidence
    theme_systems: dict[str, list[str]] = {t: [] for t in _CONVERGENCE_THEMES}
    for op in opinions:
        if not op.relevant:
            continue
        evidence_text = " ".join(
            f"{e.feature} {e.value}".lower() for e in op.evidence[:6]
        )
        for theme, keywords in _CONVERGENCE_THEMES.items():
            if any(kw in evidence_text for kw in keywords):
                sys_name = SYSTEM_NAMES.get(op.system_id, op.system_id)
                if sys_name not in theme_systems[theme]:
                    theme_systems[theme].append(sys_name)

    # Find themes with 4+ systems converging
    # Only consider themes that match the question's domain tags —
    # otherwise "mood" (via "moon") wins every question
    domain_tags = set(intent.domain_tags or [])
    best_theme = None
    best_count = 0
    for theme, systems in theme_systems.items():
        if len(systems) < 4:
            continue
        if domain_tags and theme not in domain_tags:
            continue  # skip themes irrelevant to the question
        if len(systems) > best_count:
            best_count = len(systems)
            best_theme = theme

    if best_theme is None:
        return None

    systems = theme_systems[best_theme]
    if len(systems) >= 4:
        sys_list = f"{', '.join(systems[:3])}, and {systems[3]}"
    else:
        sys_list = f"{systems[0]}, {systems[1]}, and {systems[2]}"

    theme_labels = {
        "love": "love and connection",
        "career": "career and ambition",
        "wealth": "financial matters",
        "health": "health and vitality",
        "mood": "emotional well-being",
    }
    label = theme_labels.get(best_theme, best_theme)

    return random.choice(_CONVERGENCE_TEMPLATES).format(
        sys_list=sys_list, label=label,
    )


# ═══════════════════════════════════════════════════════════════════
#  Layer 2: Evidence narrative — flowing, personalized
# ═══════════════════════════════════════════════════════════════════

def _weave_body(
    top_opinions: list[SystemOpinion],
    aggregation: AggregatedResult,
    winner: str,
    intent: ClassifiedIntent,
    confidence: float = 0.5,
    skip_feature: str | None = None,
) -> str:
    """Weave system evidence into flowing prose instead of a mechanical list."""
    parts: list[str] = []

    # Classify opinions by stance toward winner
    supporters: list[SystemOpinion] = []
    cautioners: list[SystemOpinion] = []
    for op in top_opinions:
        stance_for_winner = op.stance.get(winner, 0.5)
        if stance_for_winner >= 0.6:
            supporters.append(op)
        elif stance_for_winner <= 0.4:
            cautioners.append(op)

    # ── Upgrade 6: Scan ALL opinions for cautioners, not just top ─
    if not cautioners:
        for op in aggregation.opinions:
            if not op.relevant:
                continue
            if op.system_id in {o.system_id for o in top_opinions}:
                continue  # already checked
            stance_for_winner = op.stance.get(winner, 0.5)
            if stance_for_winner < 0.43:
                cautioners.append(op)

    # ── Upgrade 9: Evidence count tied to confidence ─────────────
    if confidence >= 0.65:
        max_supporters = 3
    elif confidence < 0.35:
        max_supporters = 1
    else:
        max_supporters = 2

    # ── Upgrade 109: Track all features used (opening + body) ──────
    used_features: set[str] = set()
    if skip_feature:
        used_features.add(skip_feature)

    # ── Upgrade 105: confidence qualifier ─────────────────────────
    if confidence >= 0.65:
        qualifier = random.choice(_QUALIFIER["high"])
    elif confidence >= 0.40:
        qualifier = random.choice(_QUALIFIER["medium"])
    else:
        qualifier = random.choice(_QUALIFIER["low"])

    # Build evidence sentences from supporters
    evidence_ops = supporters[:max_supporters] if supporters else top_opinions[:max_supporters]
    for i, op in enumerate(evidence_ops):
        name = SYSTEM_NAMES.get(op.system_id, op.system_id)
        focus = SYSTEM_FOCUS.get(op.system_id, "your chart")
        # Upgrade 109: skip features already used in opening or prior sentences
        # Also skip features that share a root concept (e.g. "Temperament" and "Temperament domain fit")
        def _feature_used(feat: str) -> bool:
            if feat in used_features:
                return True
            fl = feat.lower()
            return any(fl.startswith(u.lower()) or u.lower().startswith(fl) for u in used_features)
        ev_pool = [e for e in op.evidence if not _feature_used(e.feature)]
        if not ev_pool:
            ev_pool = list(op.evidence)
        # Pick top 2, but skip items that share a root concept with already-picked items
        sorted_pool = sorted(ev_pool, key=lambda e: e.weight, reverse=True)
        top_ev = []
        for e in sorted_pool:
            if len(top_ev) >= 2:
                break
            if any(e.feature.lower().startswith(p.feature.lower()) or p.feature.lower().startswith(e.feature.lower()) for p in top_ev):
                continue
            top_ev.append(e)
        if not top_ev:
            continue

        # Track used features
        for e in top_ev:
            used_features.add(e.feature)

        primary_domain = intent.domain_tags[0] if intent and intent.domain_tags else ""
        human = [_humanize_evidence(e.feature, e.value, primary_domain) for e in top_ev]
        detail = human[0] if len(human) == 1 else f"{human[0]}, and {human[1]}"

        # ── Upgrade 104: Use flowing transitions for follow-up ────
        if i == 0:
            # Upgrade 105: inject qualifier into first evidence lead
            sentence = random.choice(_EVIDENCE_LEAD).format(
                name=name, focus=focus, detail=detail,
            )
            # Context-aware intro instead of generic "points this way"
            q_type = intent.question_type if intent else ""
            if q_type == "binary_decision":
                intro = f"The chart points {qualifier} this way."
            elif q_type in ("general_guidance_question", "emotional_state_question"):
                domain_word = intent.domain_tags[0] if intent and intent.domain_tags else "this area"
                intros = [
                    f"Here's what your chart reveals about {domain_word}.",
                    f"Looking deeper into {domain_word}, the chart speaks {qualifier}.",
                    f"Your systems have something specific to say about {domain_word}.",
                ]
                intro = random.choice(intros)
            else:
                intro = f"The chart speaks {qualifier} here."
            parts.append(f"{intro} {sentence}")
        else:
            pool = _TRANSITIONS if i >= 1 else _EVIDENCE_FOLLOW
            parts.append(random.choice(pool).format(
                name=name, focus=focus, detail=detail,
            ))

    # ── Upgrade 9: Low-confidence honesty line ───────────────────
    if confidence < 0.35:
        parts.append("Your chart doesn't have a strong answer here — treat this as a gentle lean, not a verdict.")

    # Counterpoint from cautioner (at most 1) — Upgrade 6 ensures
    # we always find one if it exists anywhere in the opinions.
    if cautioners:
        op = cautioners[0]
        name = SYSTEM_NAMES.get(op.system_id, op.system_id)
        focus = SYSTEM_FOCUS.get(op.system_id, "your chart")
        top_ev = sorted(op.evidence, key=lambda e: e.weight, reverse=True)[:1]
        if top_ev:
            detail = _humanize_evidence(top_ev[0].feature, top_ev[0].value)
            parts.append(random.choice(_COUNTERPOINT).format(
                name=name, focus=focus, detail=detail,
            ))

    # Agreement summary
    relevant = [o for o in aggregation.opinions if o.relevant]
    n_total = len(relevant)
    n_for = aggregation.system_agreement.get(winner, 0)

    if n_total >= 3:
        if n_for == n_total:
            parts.append(random.choice(_AGREE_ALL).format(n=n_total))
        elif n_for > n_total // 2:
            n_against = n_total - n_for
            parts.append(random.choice(_AGREE_MAJORITY).format(
                n_for=n_for, n_total=n_total, n_against=n_against,
            ))
        else:
            parts.append(random.choice(_AGREE_DIVIDED).format(
                n_for=n_for, n_total=n_total,
            ))

    # Close-gap note — only for actual binary decisions
    if aggregation.score_gap < CLOSE_GAP:
        is_binary = (
            intent.question_type == "binary_decision"
            and len(intent.options) == 2
        )
        parts.append(
            random.choice(_CLOSE_BINARY if is_binary else _CLOSE_NONBINARY)
        )

    return " ".join(parts)


# ═══════════════════════════════════════════════════════════════════
#  Closing — tone-appropriate final word
# ═══════════════════════════════════════════════════════════════════

_CLOSE_LOW_CONFIDENCE = [
    "Take this as food for thought, not a directive.",
    "When the signal is this soft, your own instincts matter most.",
    "The chart whispers here. Listen, but decide for yourself.",
    "Consider this a starting point, not a final word.",
]


def _closing(tone: str, confidence: float = 0.5, domain_tags: list[str] | None = None) -> str:
    # Upgrade 9: more tentative closing at low confidence
    if confidence < 0.35:
        return random.choice(_CLOSE_LOW_CONFIDENCE)

    # ── Upgrade 108: domain-specific closings ─────────────────────
    primary = domain_tags[0] if domain_tags else None
    if primary and primary in _CLOSE_DOMAIN and tone in ("firm", "guided"):
        return random.choice(_CLOSE_DOMAIN[primary])

    if tone == "firm":
        return random.choice(_CLOSE_FIRM)
    if tone == "guided":
        return random.choice(_CLOSE_GUIDED)
    return random.choice(_CLOSE_EXPLORATORY)


# ═══════════════════════════════════════════════════════════════════
#  Contradiction narratives
# ═══════════════════════════════════════════════════════════════════

def _contradiction_narrative(aggregation: AggregatedResult) -> str | None:
    relevant = [o for o in aggregation.opinions if o.relevant]
    if len(relevant) < 3:
        return None

    winner = aggregation.winner
    supporters = [o for o in relevant if o.stance.get(winner, 0) > 0.58]
    dissenters = [o for o in relevant if o.stance.get(winner, 0) < 0.42]

    if not supporters or not dissenters:
        return None
    if aggregation.score_gap >= 0.15:
        return None

    sup = supporters[0]
    dis = dissenters[0]
    sup_name = SYSTEM_NAMES.get(sup.system_id, sup.system_id)
    dis_name = SYSTEM_NAMES.get(dis.system_id, dis.system_id)

    sup_ev = sorted(sup.evidence, key=lambda e: e.weight, reverse=True)[:1]
    dis_ev = sorted(dis.evidence, key=lambda e: e.weight, reverse=True)[:1]

    sup_human = _humanize_evidence(sup_ev[0].feature, sup_ev[0].value) if sup_ev else "supportive signals"
    dis_human = _humanize_evidence(dis_ev[0].feature, dis_ev[0].value) if dis_ev else "cautious signals"

    # ── Upgrade 107: deep contradiction with system specializations ─
    sup_spec = _SYSTEM_SPECIALIZATION.get(sup.system_id, "its perspective")
    dis_spec = _SYSTEM_SPECIALIZATION.get(dis.system_id, "its perspective")

    narrative = (
        f"There's a tension in your chart: {sup_name} ({sup_spec}) sees support "
        f"because {sup_human}, but {dis_name} ({dis_spec}) urges caution because "
        f"{dis_human}. This suggests your {sup_spec.split(' and ')[0]} is ready, "
        f"but your {dis_spec.split(' and ')[0]} calls for patience."
    )
    if aggregation.clustered:
        narrative += " The disagreement is clustered, which usually means different systems are responding to genuinely different layers of the question."
    elif aggregation.polarized:
        narrative += " The signals are polarized rather than mildly mixed, so this is a real split, not just noise."
    return narrative


def _confidence_boosters(
    intent: ClassifiedIntent,
    aggregation: AggregatedResult,
    ctx: UserContext | None = None,
) -> list[str]:
    boosters: list[str] = []
    if not intent.entities.get("time") and intent.question_type in {"timing_question", "binary_decision"}:
        boosters.append("Add a concrete time window like today, next week, or a named date.")
    if not intent.entities.get("named") and intent.question_type == "relationship_question":
        boosters.append("Name the specific person or relationship context you mean.")
    if intent.decision_style == "open" and intent.question_type == "binary_decision":
        boosters.append("Give the actual options you are choosing between.")
    if intent.specificity < 0.4:
        boosters.append("Describe the exact situation instead of asking in broad terms.")
    if aggregation.abstained or aggregation.near_split:
        boosters.append("Share what changed recently so the systems can anchor the question to a real event.")
    if ctx and ctx.recurring_entities:
        boosters.append(f"Clarify whether this is still about {ctx.recurring_entities[0]}.")
    return boosters[:3]


def _technical_reasoning(
    aggregation: AggregatedResult,
    top_opinions: list[SystemOpinion],
) -> str:
    lines = [
        f"Winner={aggregation.winner}",
        f"epistemic_confidence={aggregation.epistemic_confidence:.2f}",
        f"advice_strength={aggregation.advice_strength:.2f}",
        f"score_gap={aggregation.score_gap:.2f}",
    ]
    for opinion in top_opinions[:3]:
        lines.append(
            f"{SYSTEM_NAMES.get(opinion.system_id, opinion.system_id)}: "
            f"stance={opinion.stance} confidence={opinion.confidence:.2f} "
            f"support={opinion.strongest_support or opinion.reason}"
        )
    return " | ".join(lines)


# ═══════════════════════════════════════════════════════════════════
#  Layer 3: Personal insight
# ═══════════════════════════════════════════════════════════════════

def _personal_insight(
    pattern: PatternResult | None,
    ctx: UserContext | None,
    intent: ClassifiedIntent,
) -> str | None:
    if not pattern or not ctx or ctx.total_questions < 2:
        return None
    if pattern.pattern == "first_question":
        return None

    if pattern.pattern in ("hesitation", "hesitant_timing", "stuck_on_topic") and pattern.strength >= 0.5:
        return (
            "You've been weighing a lot of decisions lately — "
            "this suggests you're in a deliberation phase. "
            "Sometimes the best move is to commit to either path and adjust."
        )
    if pattern.pattern in ("timing_focus", "timing_obsession") and pattern.strength >= 0.4:
        return (
            "You've been focused on timing recently — "
            "your instinct is seeking the right moment rather than the right direction."
        )
    if pattern.pattern in ("domain_loop", "anxious_fixation") and ctx.repeated_domain:
        domain = ctx.repeated_domain
        if intent.domain_tags and domain == intent.domain_tags[0]:
            return (
                f"Your questions keep returning to {domain} — "
                f"this area is clearly active for you. "
                f"Pay attention to what's unresolved here."
            )
        return (
            f"You've been focused on {domain} recently, "
            f"but this question shifts to a different area — "
            f"that shift itself may be meaningful."
        )
    if pattern.pattern in ("exploration", "early_exploration") and pattern.strength >= 0.3:
        return "You're exploring broadly across life areas — a sign of awareness, not indecision."
    return None


# ═══════════════════════════════════════════════════════════════════
#  Main compose
# ═══════════════════════════════════════════════════════════════════

def compose(
    intent: ClassifiedIntent,
    aggregation: AggregatedResult,
    user_ctx: UserContext | None = None,
    pattern: PatternResult | None = None,
    response_mode: str = "reflective",
    trace_seed: str = "",
) -> ComposedAnswer:
    seed_payload = json.dumps(
        {
            "trace_seed": trace_seed,
            "intent": intent.model_dump(),
            "winner": aggregation.winner,
            "contributors": aggregation.contributors,
            "response_mode": response_mode,
        },
        sort_keys=True,
        default=str,
    )
    random_state = random.getstate()
    random.seed(int(hashlib.md5(seed_payload.encode("utf-8")).hexdigest(), 16))
    try:
        winner = aggregation.winner
        gap = aggregation.score_gap
        confidence = aggregation.confidence
        relevant = [o for o in aggregation.opinions if o.relevant]
        top_ids = aggregation.contributors[:3]

        top_opinions: list[SystemOpinion] = []
        for sid in top_ids:
            op = next((o for o in relevant if o.system_id == sid), None)
            if op and op.confidence > 0.2:
                top_opinions.append(op)

        # Upgrade 101: pass emotional_charge to tone
        emotional_charge = getattr(intent, "emotional_charge", 0.0)
        answer_tone = _tone(confidence, gap, emotional_charge)
        if aggregation.abstained:
            opening = "The signal is too mixed to give a clean yes or no."
        else:
            opening = _opening(winner, intent, answer_tone, gap, top_opinions)

        # Track which evidence the opening used, so the body doesn't repeat it
        _used_feature = None
        if top_opinions:
            _top_ev = sorted(top_opinions[0].evidence, key=lambda e: e.weight, reverse=True)[:1]
            if _top_ev:
                _used_feature = _top_ev[0].feature
        convergence = _detect_convergence(relevant, intent)
        body = _weave_body(top_opinions, aggregation, winner, intent, confidence, _used_feature)
        close = _closing(answer_tone, confidence, intent.domain_tags)
        insight = _personal_insight(pattern, user_ctx, intent)
        conflict = _contradiction_narrative(aggregation)
        system_names = [SYSTEM_NAMES.get(sid, sid) for sid in top_ids]
        boosters = _confidence_boosters(intent, aggregation, user_ctx)

        reasoning_parts = []
        if convergence:
            reasoning_parts.append(convergence)
        reasoning_parts.append(body)
        if conflict and response_mode != "direct":
            reasoning_parts.append(conflict)
        reasoning_parts.append(close)

        deep_rationale = " ".join(reasoning_parts)
        short_rationale = opening if aggregation.abstained else f"{opening} {close}"

        if response_mode == "direct":
            reasoning = f"{body} {close}".strip()
        elif response_mode == "technical":
            technical = _technical_reasoning(aggregation, top_opinions)
            reasoning = f"{technical}. {deep_rationale}"
        else:
            reasoning = deep_rationale

        return ComposedAnswer(
            short_answer=opening,
            reasoning=reasoning,
            personal_insight=insight,
            conflict_note=conflict,
            tone=answer_tone,
            contributing_systems=system_names,
            confidence_score=confidence,
            response_mode=response_mode,
            short_rationale=short_rationale,
            deep_rationale=deep_rationale,
            confidence_boosters=boosters,
        )
    finally:
        random.setstate(random_state)
