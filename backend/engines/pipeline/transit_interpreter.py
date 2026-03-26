"""Deep transit interpretation — maps transit planet + aspect + natal point
to specific meanings instead of generic "Saturn = delay".

Structure: TRANSIT_MEANINGS[transit_planet][natal_point][aspect_type]
  → {polarity, meaning}

aspect_type is "hard" (Square, Opposition) or "soft" (Conjunction, Trine, Sextile).
Conjunction is treated as soft for benefics, hard for malefics.
"""

from __future__ import annotations

from typing import Any

from .schemas import EvidenceItem

# Aspect classification
SOFT_ASPECTS = {"Trine", "Sextile"}
HARD_ASPECTS = {"Square", "Opposition"}
# Conjunction: depends on planet nature
BENEFIC_PLANETS = {"Venus", "Jupiter"}
MALEFIC_PLANETS = {"Saturn", "Mars", "Pluto"}


def _aspect_type(aspect_name: str, transit_planet: str) -> str:
    if aspect_name in SOFT_ASPECTS:
        return "soft"
    if aspect_name in HARD_ASPECTS:
        return "hard"
    if aspect_name == "Conjunction":
        return "soft" if transit_planet in BENEFIC_PLANETS else "hard"
    return "soft"


# ── Transit meaning database ─────────────────────────────────────
# {transit_planet: {natal_point: {hard: {...}, soft: {...}}}}

_M: dict[str, dict[str, dict[str, dict[str, Any]]]] = {
    "Saturn": {
        "Sun": {
            "hard": {"polarity": -0.7, "meaning": "identity pressure — slow down, don't force recognition"},
            "soft": {"polarity": -0.2, "meaning": "structured growth — discipline pays off now"},
        },
        "Moon": {
            "hard": {"polarity": -0.8, "meaning": "emotional restriction — avoid vulnerable decisions"},
            "soft": {"polarity": -0.3, "meaning": "emotional maturity — good for serious commitments"},
        },
        "Venus": {
            "hard": {"polarity": -0.6, "meaning": "relationship testing — existing bonds face reality checks"},
            "soft": {"polarity": -0.1, "meaning": "stable affection — loyalty and commitment deepening"},
        },
        "Mars": {
            "hard": {"polarity": -0.7, "meaning": "frustrated action — efforts meet resistance, redirect energy"},
            "soft": {"polarity": -0.2, "meaning": "disciplined effort — controlled action produces lasting results"},
        },
        "Ascendant": {
            "hard": {"polarity": -0.5, "meaning": "self-image pressure — heavy responsibility period"},
            "soft": {"polarity": -0.1, "meaning": "grounded presence — others see you as reliable"},
        },
        "Midheaven": {
            "hard": {"polarity": -0.6, "meaning": "career pressure — authority figures scrutinize, don't cut corners"},
            "soft": {"polarity": 0.1, "meaning": "professional recognition through sustained effort"},
        },
    },
    "Jupiter": {
        "Sun": {
            "hard": {"polarity": 0.2, "meaning": "overconfidence risk — opportunity is real but don't overextend"},
            "soft": {"polarity": 0.7, "meaning": "confidence boost — excellent window for bold moves"},
        },
        "Moon": {
            "hard": {"polarity": 0.1, "meaning": "emotional excess — generous but watch overcommitting"},
            "soft": {"polarity": 0.6, "meaning": "emotional abundance — relationships and mood flourish"},
        },
        "Venus": {
            "hard": {"polarity": 0.3, "meaning": "indulgence temptation — enjoy but set limits"},
            "soft": {"polarity": 0.7, "meaning": "love and pleasure amplified — strong for romance and socializing"},
        },
        "Mars": {
            "hard": {"polarity": 0.3, "meaning": "restless ambition — channel energy carefully"},
            "soft": {"polarity": 0.7, "meaning": "energized action — physical and professional drive at peak"},
        },
        "Ascendant": {
            "hard": {"polarity": 0.2, "meaning": "expanding presence — may take on too much"},
            "soft": {"polarity": 0.6, "meaning": "magnetic presence — people respond positively to you"},
        },
        "Midheaven": {
            "hard": {"polarity": 0.3, "meaning": "career growth with growing pains"},
            "soft": {"polarity": 0.8, "meaning": "career peak window — promotions, recognition, opportunities"},
        },
    },
    "Mars": {
        "Sun": {
            "hard": {"polarity": 0.3, "meaning": "conflict energy — assertiveness may tip into aggression"},
            "soft": {"polarity": 0.6, "meaning": "strong drive — excellent for physical effort and competition"},
        },
        "Moon": {
            "hard": {"polarity": -0.4, "meaning": "emotional volatility — impulse control matters now"},
            "soft": {"polarity": 0.3, "meaning": "emotional courage — good for confronting what you've avoided"},
        },
        "Venus": {
            "hard": {"polarity": 0.1, "meaning": "passion vs harmony tension — attraction high but friction too"},
            "soft": {"polarity": 0.5, "meaning": "passionate connection — strong romantic and creative energy"},
        },
        "Mars": {
            "hard": {"polarity": 0.4, "meaning": "high tension energy — avoid rash decisions, channel into exercise"},
            "soft": {"polarity": 0.7, "meaning": "peak physical energy — act decisively"},
        },
        "Ascendant": {
            "hard": {"polarity": 0.2, "meaning": "combative energy — others may perceive you as pushy"},
            "soft": {"polarity": 0.5, "meaning": "assertive presence — leadership energy is accessible"},
        },
        "Midheaven": {
            "hard": {"polarity": 0.1, "meaning": "workplace tension — conflicts with authority possible"},
            "soft": {"polarity": 0.6, "meaning": "career ambition firing — push for what you want professionally"},
        },
    },
    "Venus": {
        "Sun": {
            "hard": {"polarity": -0.1, "meaning": "vanity vs values — superficial attractions distract"},
            "soft": {"polarity": 0.4, "meaning": "charm activated — social grace and attractiveness peak"},
        },
        "Moon": {
            "hard": {"polarity": -0.2, "meaning": "emotional indulgence — comfort-seeking may avoid real issues"},
            "soft": {"polarity": 0.5, "meaning": "emotional warmth — excellent for nurturing and connecting"},
        },
        "Venus": {
            "hard": {"polarity": 0.0, "meaning": "relationship mirror — old patterns resurface for review"},
            "soft": {"polarity": 0.6, "meaning": "love amplified — peak window for romance and beauty"},
        },
        "Mars": {
            "hard": {"polarity": 0.1, "meaning": "desire vs aggression — attraction with edge"},
            "soft": {"polarity": 0.5, "meaning": "passion and grace aligned — go after what you want"},
        },
        "Ascendant": {
            "hard": {"polarity": -0.1, "meaning": "appearance concerns — don't make big changes based on insecurity"},
            "soft": {"polarity": 0.4, "meaning": "attractive aura — others are drawn to you naturally"},
        },
        "Midheaven": {
            "hard": {"polarity": 0.0, "meaning": "career diplomacy needed — charm your way through obstacles"},
            "soft": {"polarity": 0.4, "meaning": "professional charm — networking and partnerships favored"},
        },
    },
    "Mercury": {
        "Sun": {
            "hard": {"polarity": 0.1, "meaning": "mental overload — too many ideas, not enough focus"},
            "soft": {"polarity": 0.4, "meaning": "clear thinking — excellent for communication and decisions"},
        },
        "Moon": {
            "hard": {"polarity": -0.2, "meaning": "overthinking emotions — logic and feeling at odds"},
            "soft": {"polarity": 0.3, "meaning": "emotional clarity — good for expressing what you feel"},
        },
        "Venus": {
            "hard": {"polarity": 0.0, "meaning": "mixed signals in love — words and feelings don't match"},
            "soft": {"polarity": 0.4, "meaning": "sweet communication — flirting and love talk flow naturally"},
        },
        "Mars": {
            "hard": {"polarity": 0.2, "meaning": "sharp tongue risk — arguments and hasty words likely"},
            "soft": {"polarity": 0.5, "meaning": "mental agility — quick thinking and persuasive speech"},
        },
        "Ascendant": {
            "hard": {"polarity": 0.1, "meaning": "scattered presence — others may misread your intentions"},
            "soft": {"polarity": 0.3, "meaning": "articulate presence — you express yourself well to others"},
        },
        "Midheaven": {
            "hard": {"polarity": -0.1, "meaning": "workplace miscommunication — double-check emails and contracts"},
            "soft": {"polarity": 0.4, "meaning": "career communication peak — pitches and proposals favored"},
        },
    },
    "Uranus": {
        "Sun": {
            "hard": {"polarity": 0.3, "meaning": "identity disruption — sudden urge to break free from constraints"},
            "soft": {"polarity": 0.5, "meaning": "liberating insight — breakthroughs in self-understanding"},
        },
        "Moon": {
            "hard": {"polarity": -0.3, "meaning": "emotional volatility — sudden mood shifts and restlessness"},
            "soft": {"polarity": 0.2, "meaning": "emotional freedom — releasing old emotional patterns"},
        },
        "Venus": {
            "hard": {"polarity": 0.1, "meaning": "relationship upheaval — sudden attractions or splits possible"},
            "soft": {"polarity": 0.3, "meaning": "unconventional love — openness to new relationship dynamics"},
        },
        "Mars": {
            "hard": {"polarity": 0.4, "meaning": "explosive energy — sudden action impulses, accident-prone"},
            "soft": {"polarity": 0.6, "meaning": "innovative drive — channel restless energy into something new"},
        },
        "Ascendant": {
            "hard": {"polarity": 0.2, "meaning": "identity shake-up — reinventing how you present yourself"},
            "soft": {"polarity": 0.4, "meaning": "authentic presence — freedom to be your true self"},
        },
        "Midheaven": {
            "hard": {"polarity": 0.1, "meaning": "career disruption — unexpected changes in professional life"},
            "soft": {"polarity": 0.5, "meaning": "career innovation — unconventional paths open up"},
        },
    },
    "Neptune": {
        "Sun": {
            "hard": {"polarity": -0.5, "meaning": "identity fog — confusion about who you are and what you want"},
            "soft": {"polarity": -0.1, "meaning": "spiritual awakening — heightened intuition and compassion"},
        },
        "Moon": {
            "hard": {"polarity": -0.6, "meaning": "emotional confusion — boundaries dissolve, vulnerability high"},
            "soft": {"polarity": -0.2, "meaning": "deep empathy — psychic sensitivity and creative inspiration"},
        },
        "Venus": {
            "hard": {"polarity": -0.4, "meaning": "romantic illusion — seeing what you want to see, not what is"},
            "soft": {"polarity": 0.1, "meaning": "spiritual love — transcendent romantic or artistic experiences"},
        },
        "Mars": {
            "hard": {"polarity": -0.5, "meaning": "weakened drive — actions feel ineffective, motivation dissolves"},
            "soft": {"polarity": -0.1, "meaning": "inspired action — creative and spiritual pursuits energized"},
        },
        "Ascendant": {
            "hard": {"polarity": -0.4, "meaning": "lost boundaries — others may take advantage of your openness"},
            "soft": {"polarity": 0.0, "meaning": "chameleon presence — heightened adaptability and empathy"},
        },
        "Midheaven": {
            "hard": {"polarity": -0.3, "meaning": "career confusion — unclear direction, avoid major commitments"},
            "soft": {"polarity": 0.1, "meaning": "inspired vocation — creative and healing professions highlighted"},
        },
    },
    "Pluto": {
        "Sun": {
            "hard": {"polarity": -0.3, "meaning": "power struggle — transformation through crisis, ego death and rebirth"},
            "soft": {"polarity": 0.3, "meaning": "deep empowerment — accessing hidden strength and authority"},
        },
        "Moon": {
            "hard": {"polarity": -0.5, "meaning": "emotional purge — buried feelings surface, intense but healing"},
            "soft": {"polarity": 0.1, "meaning": "emotional depth — profound emotional insights and healing"},
        },
        "Venus": {
            "hard": {"polarity": -0.3, "meaning": "obsessive attraction — jealousy or manipulation in relationships"},
            "soft": {"polarity": 0.2, "meaning": "transformative love — deep bonding and soul-level connection"},
        },
        "Mars": {
            "hard": {"polarity": 0.2, "meaning": "ruthless drive — immense power but risk of burning bridges"},
            "soft": {"polarity": 0.6, "meaning": "unstoppable force — concentrated willpower for major goals"},
        },
        "Ascendant": {
            "hard": {"polarity": -0.2, "meaning": "identity transformation — who you were is dying; who you will be is forming"},
            "soft": {"polarity": 0.3, "meaning": "magnetic presence — others sense your depth and power"},
        },
        "Midheaven": {
            "hard": {"polarity": -0.1, "meaning": "career transformation — old structures destroyed, new ones forming"},
            "soft": {"polarity": 0.4, "meaning": "career power — rise to positions of influence and authority"},
        },
    },
}

# Default for unmatched combinations
_DEFAULT = {"hard": {"polarity": -0.2, "meaning": "tension"}, "soft": {"polarity": 0.2, "meaning": "support"}}


# Domain-specific reframings: when a transit has a love-specific meaning but the
# question is about wealth/career, provide the financial interpretation instead.
_DOMAIN_REFRAME: dict[str, dict[str, dict[str, str]]] = {
    "Jupiter": {
        "Venus": {
            "wealth": "financial expansion — good conditions for investment and returns",
            "career": "professional charm — partnerships and negotiations favored",
        },
        "Moon": {
            "wealth": "generous instincts — trust your financial intuition now",
            "career": "public goodwill — favorable for pitches and presentations",
        },
        "Sun": {
            "career": "leadership opportunity — confidence attracts promotions and recognition",
            "health": "vitality boost — physical energy and immune strength elevated",
        },
        "Mars": {
            "health": "physical peak — excellent for starting fitness or recovery programs",
            "wealth": "ambitious expansion — bold financial moves likely to pay off",
        },
        "Midheaven": {
            "love": "social status attracts — your public success makes you more appealing",
            "wealth": "professional windfall — raises, bonuses, or new income streams",
        },
    },
    "Venus": {
        "Mars": {
            "career": "creative drive — passion projects gain traction",
            "wealth": "spending temptation — attractive deals may not be as solid as they seem",
        },
        "Moon": {
            "health": "self-care activated — nurturing your body feels natural now",
            "career": "workplace harmony — team bonding and positive office dynamics",
        },
        "Sun": {
            "career": "likability peak — charm helps in interviews and negotiations",
            "wealth": "luxury appeal — eye for quality, but watch impulse spending",
        },
    },
    "Saturn": {
        "Midheaven": {
            "wealth": "financial discipline pays — long-term investments solidify",
            "love": "relationship maturity test — only real bonds survive this transit",
        },
        "Venus": {
            "career": "professional boundaries tighten — loyalty tested at work",
            "wealth": "financial reality check — debts or obligations demand attention",
        },
        "Mars": {
            "health": "physical limitation — rest and recovery more important than pushing",
            "wealth": "effort without reward — patience required before returns materialize",
        },
    },
    "Mars": {
        "Venus": {
            "career": "assertive negotiation — pursue what you want professionally",
            "health": "physical intensity — channel energy into exercise, not arguments",
        },
        "Sun": {
            "love": "bold attraction — courage to pursue romantic interest",
            "wealth": "competitive edge — fight for your financial interests",
        },
        "Midheaven": {
            "love": "public assertiveness may overwhelm romantic partners",
            "health": "work stress manifesting physically — watch for burnout",
        },
    },
    "Mercury": {
        "Venus": {
            "career": "negotiation skill peak — close deals and sign contracts",
            "wealth": "financial analysis clear — trust your research and calculations",
        },
        "Mars": {
            "love": "direct communication — courage to say what you feel",
            "health": "mental restlessness — channel nervous energy into exercise",
        },
        "Midheaven": {
            "love": "social networking — meet people through professional connections",
            "wealth": "business communication — proposals and pitches land well",
        },
    },
    "Pluto": {
        "Venus": {
            "career": "power dynamics at work — navigate office politics carefully",
            "wealth": "financial transformation — old income sources end, new ones begin",
        },
        "Sun": {
            "love": "magnetic intensity — deep attraction but power imbalances possible",
            "career": "leadership transformation — stepping into real authority",
        },
        "Mars": {
            "career": "unstoppable ambition — use power responsibly",
            "health": "regenerative phase — old health issues may resolve through intensity",
        },
    },
    "Neptune": {
        "Venus": {
            "career": "creative inspiration — artistic and imaginative work flourishes",
            "wealth": "financial fog — avoid risky investments, things aren't as they seem",
        },
        "Moon": {
            "career": "intuitive leadership — trust gut feelings about people and projects",
            "health": "immune sensitivity — protect your energy and avoid exhaustion",
        },
    },
    "Uranus": {
        "Venus": {
            "career": "unexpected opportunities — unconventional career moves pay off",
            "wealth": "financial surprise — sudden gains or losses, stay adaptable",
        },
        "Mars": {
            "career": "breakthrough innovation — disruptive ideas get traction",
            "health": "accident-prone energy — be careful with physical activities",
        },
        "Midheaven": {
            "love": "life changes affect relationship stability — communicate openly",
            "wealth": "career pivot — new direction may bring different income level",
        },
    },
}


def interpret_transit(
    transit_planet: str,
    aspect_name: str,
    natal_point: str,
    domains: list[str] | None = None,
) -> dict[str, Any]:
    """Look up the specific meaning of a transit aspect.

    When ``domains`` is provided and a domain-specific reframing exists,
    the meaning is adjusted to match the question context.
    """
    a_type = _aspect_type(aspect_name, transit_planet)
    planet_data = _M.get(transit_planet, {})
    point_data = planet_data.get(natal_point, _DEFAULT)
    result = point_data.get(a_type, point_data.get("soft", _DEFAULT["soft"]))

    meaning = result["meaning"]

    # Reframe if a domain-specific interpretation exists
    if domains:
        reframes = _DOMAIN_REFRAME.get(transit_planet, {}).get(natal_point, {})
        for domain in domains:
            if domain in reframes:
                meaning = reframes[domain]
                break

    return {
        "transit": transit_planet,
        "aspect": aspect_name,
        "natal": natal_point,
        "polarity": result["polarity"],
        "meaning": meaning,
    }


def interpret_all_transits(
    system_data: dict[str, Any],
    domains: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Interpret all transit contacts from the Western engine table."""
    results: list[dict[str, Any]] = []
    for tbl in system_data.get("tables", []):
        if "transit" not in tbl.get("title", "").lower():
            continue
        for row in tbl.get("rows", []):
            if len(row) < 3:
                continue
            transit_planet = str(row[0]).strip()
            aspect_name = str(row[1]).strip()
            natal_point = str(row[2]).strip()
            if transit_planet in _M or transit_planet in {"Saturn", "Jupiter", "Mars", "Venus", "Mercury", "Uranus", "Neptune", "Pluto"}:
                results.append(interpret_transit(transit_planet, aspect_name, natal_point, domains))
    return results


# Transits that are domain-relevant (natal point → domains it matters for)
_NATAL_DOMAIN: dict[str, set[str]] = {
    "Sun":       {"career", "health", "mood"},
    "Moon":      {"mood", "health", "love"},
    "Venus":     {"love", "mood", "wealth"},
    "Mars":      {"career", "health", "love"},
    "Mercury":   {"career", "wealth", "mood"},
    "Jupiter":   {"wealth", "career", "mood"},
    "Saturn":    {"career", "health"},
    "Ascendant": {"health", "mood", "love"},
    "Midheaven": {"career", "wealth"},
}


def transit_evidence(
    interpretations: list[dict[str, Any]],
    max_items: int = 4,
    domains: list[str] | None = None,
) -> list[EvidenceItem]:
    """Build evidence items from transit interpretations.

    When ``domains`` is provided, transits relevant to those domains are
    prioritized and scored higher.
    """
    # Score each interpretation by relevance
    scored: list[tuple[float, dict[str, Any]]] = []
    for t in interpretations:
        base_score = abs(t["polarity"])
        # Boost if the natal point is relevant to the question domain
        if domains:
            natal_domains = _NATAL_DOMAIN.get(t["natal"], set())
            if natal_domains & set(domains):
                base_score += 0.3  # domain-relevant boost
            else:
                base_score -= 0.1  # penalise off-domain
        scored.append((base_score, t))

    scored.sort(key=lambda x: x[0], reverse=True)

    items: list[EvidenceItem] = []
    for relevance, t in scored[:max_items]:
        items.append(EvidenceItem(
            feature=f"Transit {t['transit']} {t['aspect']} {t['natal']}",
            value=t["meaning"],
            weight=round(min(max(relevance, 0.2) + 0.2, 1.0), 2),
        ))
    return items
