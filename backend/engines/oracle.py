"""Multi-system Oracle engine.

Classifies the user's question, queries each astrology system for an opinion,
aggregates weighted signals, and composes an answer grounded in actual chart data.
"""

from __future__ import annotations

import hashlib
import re
from typing import Any


# ═══════════════════════════════════════════════════════
#  Question classification
# ═══════════════════════════════════════════════════════

DOMAIN_KEYWORDS: dict[str, set[str]] = {
    "love": {
        "love", "relationship", "partner", "dating", "marriage", "romance", "heart",
        "soulmate", "crush", "text", "ex", "boyfriend", "girlfriend", "wife", "husband",
        "feelings", "attraction", "romantic", "chemistry", "him", "her", "them",
        "breakup", "divorce", "propose", "commitment",
    },
    "career": {
        "career", "work", "job", "promotion", "boss", "business", "professional",
        "interview", "project", "colleague", "office", "hire", "fired", "raise",
        "success", "freelance", "quit", "resign", "position", "startup", "company",
    },
    "health": {
        "health", "body", "exercise", "sick", "energy", "sleep", "diet", "stress",
        "anxiety", "wellness", "tired", "pain", "healing", "recovery", "medical",
        "weight", "fitness", "vitality", "rest", "insomnia", "gym",
    },
    "wealth": {
        "money", "wealth", "invest", "financial", "savings", "budget", "rich", "income",
        "spend", "buy", "afford", "debt", "loan", "fortune", "abundance", "prosperity",
        "rent", "house", "apartment", "crypto", "stocks", "purchase",
    },
    "mood": {
        "mood", "happy", "sad", "feel", "emotion", "vibe", "spirit", "mental", "joy",
        "depression", "motivation", "inspired", "creative", "purpose", "meaning",
        "direction", "lost", "confused", "peace", "spiritual", "growth",
    },
}

YES_NO_STARTERS = {"should", "will", "can", "is", "am", "do", "does", "would", "could", "are"}
TIMING_WORDS = {"when", "how long", "how soon", "what time", "tonight", "today", "tomorrow", "this week", "this month"}
BINARY_MARKERS = {"or", "versus", "vs"}
RELATIONSHIP_MARKERS = {"love", "partner", "relationship", "date", "dating", "marry", "marriage", "crush", "ex", "boyfriend", "girlfriend", "husband", "wife"}
CAREER_MARKERS = {"career", "job", "work", "business", "promotion", "interview", "quit", "resign", "hire"}


def _tokenize(text: str) -> tuple[str, set[str]]:
    normalized = re.sub(r"[^a-z0-9\s]", " ", text.lower()).strip()
    tokens = {part for part in normalized.split() if part}
    return normalized, tokens


def _extract_binary_options(text: str) -> list[str]:
    """Try to extract two options from a binary question like 'A or B'."""
    lower = text.lower().strip().rstrip("?").strip()
    for splitter in [" or ", " versus ", " vs "]:
        if splitter in lower:
            parts = lower.split(splitter, 1)
            if len(parts) == 2:
                a = parts[0].split()[-3:]  # last 3 words before 'or'
                b = parts[1].split()[:4]   # first 4 words after 'or'
                return [" ".join(a).strip(), " ".join(b).strip()]
    return []


def classify_question(question: str) -> dict[str, Any]:
    """Classify the user's question into type and domains."""
    normalized, words = _tokenize(question or "")
    first_word = normalized.split()[0] if normalized else ""

    # Detect binary choices
    options = _extract_binary_options(question)
    if options:
        q_type = "binary_decision"
    elif any(normalized.startswith(prefix) for prefix in TIMING_WORDS):
        q_type = "timing_question"
    elif words & RELATIONSHIP_MARKERS:
        q_type = "relationship_question"
    elif words & CAREER_MARKERS:
        q_type = "career_question"
    elif words & {"energy", "sleep", "tired", "rest", "health", "exercise", "gym", "sick"}:
        q_type = "health_energy_question"
    elif words & {"feel", "feeling", "sad", "happy", "anxious", "depressed", "confused", "lost", "peace"}:
        q_type = "emotional_state_question"
    elif first_word in YES_NO_STARTERS:
        q_type = "binary_decision"
    else:
        q_type = "general_guidance_question"

    # Detect domains
    domains: list[str] = []
    for domain, keywords in DOMAIN_KEYWORDS.items():
        if words & keywords:
            domains.append(domain)

    if not domains:
        # Default based on question type
        if q_type in ("relationship_question",):
            domains = ["love"]
        elif q_type in ("career_question",):
            domains = ["career"]
        elif q_type in ("health_energy_question",):
            domains = ["health"]
        else:
            domains = ["mood", "career"]

    return {
        "type": q_type,
        "domains": domains[:3],
        "options": options,
    }


# ═══════════════════════════════════════════════════════
#  System adapters
# ═══════════════════════════════════════════════════════

SYSTEM_META = {
    "western": {"name": "Western Astrology", "weight": 1.0},
    "vedic": {"name": "Vedic Astrology", "weight": 1.0},
    "chinese": {"name": "Chinese Zodiac", "weight": 0.8},
    "bazi": {"name": "BaZi (Four Pillars)", "weight": 1.0},
    "numerology": {"name": "Numerology", "weight": 0.8},
    "kabbalistic": {"name": "Kabbalistic", "weight": 0.7},
    "gematria": {"name": "Gematria", "weight": 0.7},
    "persian": {"name": "Persian Astrology", "weight": 0.85},
}

# Which domains each system is strongest at
SYSTEM_DOMAIN_STRENGTHS: dict[str, dict[str, float]] = {
    "western": {"love": 1.0, "career": 0.9, "health": 0.8, "wealth": 0.8, "mood": 0.9},
    "vedic": {"love": 0.9, "career": 1.0, "health": 1.0, "wealth": 0.9, "mood": 0.8},
    "chinese": {"love": 0.7, "career": 0.8, "health": 0.6, "wealth": 0.8, "mood": 0.7},
    "bazi": {"love": 0.7, "career": 1.0, "health": 0.9, "wealth": 1.0, "mood": 0.8},
    "numerology": {"love": 0.6, "career": 0.8, "health": 0.5, "wealth": 0.7, "mood": 0.9},
    "kabbalistic": {"love": 0.5, "career": 0.5, "health": 0.4, "wealth": 0.4, "mood": 1.0},
    "gematria": {"love": 0.3, "career": 0.3, "health": 0.2, "wealth": 0.3, "mood": 0.5},
    "persian": {"love": 0.7, "career": 0.8, "health": 0.8, "wealth": 0.7, "mood": 0.7},
}


def _sentiment_label(score: float) -> str:
    if score >= 70:
        return "strongly favorable"
    if score >= 58:
        return "favorable"
    if score >= 42:
        return "mixed"
    if score >= 30:
        return "unfavorable"
    return "strongly unfavorable"


def _direction_label(score: float) -> str:
    """For binary decisions: which direction does this system lean?"""
    if score >= 60:
        return "supports"
    if score >= 45:
        return "leans toward"
    if score >= 35:
        return "neutral on"
    return "cautions against"


def _extract_system_detail(system_id: str, system_data: dict) -> str:
    """Extract a meaningful detail from a system's highlights for the reason text."""
    highlights = system_data.get("highlights", [])
    scores = system_data.get("scores", {})

    key_labels = {
        "western": ["sun", "moon", "rising", "transit"],
        "vedic": ["nakshatra", "moon", "lagna", "dasha"],
        "chinese": ["animal", "element", "relation"],
        "bazi": ["day master", "strength", "favorable"],
        "numerology": ["life path", "personal day", "personal year"],
        "kabbalistic": ["sephir", "sefirah", "path"],
        "gematria": ["total", "hebrew", "bridge"],
        "persian": ["ruler", "mansion", "temperament"],
    }

    patterns = key_labels.get(system_id, [])
    for h in highlights:
        label = str(h.get("label", "")).lower()
        for pattern in patterns:
            if pattern in label:
                return f"{h.get('label', '')}: {h.get('value', '')}"
    return ""


def query_system(system_id: str, system_data: dict, domains: list[str], question_type: str) -> dict[str, Any]:
    """Query a single astrology system for its opinion on the question domains."""
    scores = system_data.get("scores", {})
    if not scores:
        return {
            "system": system_id,
            "name": SYSTEM_META[system_id]["name"],
            "relevant": False,
            "domains": [],
            "avg_score": 0,
            "sentiment": "unknown",
            "reason": "No score data available from this system.",
            "confidence": 0.0,
            "detail": "",
        }

    # Compute domain-weighted average score
    total_weight = 0.0
    weighted_score = 0.0
    relevant_domains = []
    domain_scores = {}

    for domain in domains:
        score_info = scores.get(domain, {})
        raw_score = score_info.get("value", 50) if isinstance(score_info, dict) else 50
        domain_strength = SYSTEM_DOMAIN_STRENGTHS.get(system_id, {}).get(domain, 0.5)

        if domain_strength >= 0.4:  # Only include if system has meaningful domain coverage
            w = domain_strength * SYSTEM_META[system_id]["weight"]
            weighted_score += raw_score * w
            total_weight += w
            relevant_domains.append(domain)
            domain_scores[domain] = round(raw_score)

    if total_weight == 0:
        return {
            "system": system_id,
            "name": SYSTEM_META[system_id]["name"],
            "relevant": False,
            "domains": [],
            "avg_score": 0,
            "sentiment": "no signal",
            "reason": "This system has weak relevance to the question domains.",
            "confidence": 0.0,
            "detail": "",
        }

    avg = weighted_score / total_weight
    confidence = min(total_weight / len(domains), 1.0) if domains else 0.0
    detail = _extract_system_detail(system_id, system_data)

    # Build human-readable reason
    sentiment = _sentiment_label(avg)
    domain_parts = []
    for d in relevant_domains[:2]:
        s = domain_scores.get(d, 50)
        domain_parts.append(f"{d} at {s}%")
    score_summary = ", ".join(domain_parts)

    reason_map = {
        "strongly favorable": f"Strong positive signals across {score_summary}. This system sees clear support.",
        "favorable": f"Positive lean across {score_summary}. Conditions look supportive.",
        "mixed": f"Mixed signals across {score_summary}. Some support, some tension.",
        "unfavorable": f"Cautious signals across {score_summary}. This system advises patience.",
        "strongly unfavorable": f"Strong caution across {score_summary}. This system urges restraint.",
    }

    return {
        "system": system_id,
        "name": SYSTEM_META[system_id]["name"],
        "relevant": True,
        "domains": relevant_domains,
        "domain_scores": domain_scores,
        "avg_score": round(avg, 1),
        "sentiment": sentiment,
        "reason": reason_map.get(sentiment, f"Signals at {score_summary}."),
        "confidence": round(confidence, 2),
        "detail": detail,
    }


# ═══════════════════════════════════════════════════════
#  Aggregation engine
# ═══════════════════════════════════════════════════════

def aggregate_opinions(
    opinions: list[dict[str, Any]],
    question_type: str,
    options: list[str],
) -> dict[str, Any]:
    """Combine system opinions into a weighted final result."""
    relevant = [o for o in opinions if o["relevant"]]
    if not relevant:
        return {
            "direction": "mixed",
            "strength": "weak",
            "score": 50.0,
            "contributing_systems": [],
            "system_count": 0,
            "options_result": None,
        }

    # Weighted average across relevant systems
    total_w = 0.0
    weighted_sum = 0.0
    for o in relevant:
        w = o["confidence"] * SYSTEM_META.get(o["system"], {}).get("weight", 0.5)
        weighted_sum += o["avg_score"] * w
        total_w += w

    final_score = weighted_sum / total_w if total_w > 0 else 50.0

    # Direction
    if final_score >= 65:
        direction = "strongly_positive"
    elif final_score >= 55:
        direction = "positive"
    elif final_score >= 45:
        direction = "mixed"
    elif final_score >= 35:
        direction = "cautious"
    else:
        direction = "strongly_cautious"

    # Strength based on agreement
    sentiments = [o["sentiment"] for o in relevant]
    positive_count = sum(1 for s in sentiments if "favorable" in s)
    cautious_count = sum(1 for s in sentiments if "unfavorable" in s)
    total = len(relevant)

    if positive_count >= total * 0.7 or cautious_count >= total * 0.7:
        strength = "strong"
    elif positive_count >= total * 0.5 or cautious_count >= total * 0.5:
        strength = "moderate"
    else:
        strength = "weak"

    # Binary decision handling
    options_result = None
    if question_type == "binary_decision" and len(options) == 2:
        # First option is favored when score is high (positive alignment = go for it)
        # Second option is favored when score is low (caution = the alternative)
        score_a = final_score
        score_b = 100 - final_score
        options_result = {
            "options": {options[0]: round(score_a, 1), options[1]: round(score_b, 1)},
            "winner": options[0] if score_a >= score_b else options[1],
        }

    contributing = sorted(relevant, key=lambda o: o["avg_score"], reverse=True)

    return {
        "direction": direction,
        "strength": strength,
        "score": round(final_score, 1),
        "contributing_systems": [
            {
                "system": o["system"],
                "name": o["name"],
                "sentiment": o["sentiment"],
                "score": o["avg_score"],
                "reason": o["reason"],
                "detail": o["detail"],
                "confidence": o["confidence"],
            }
            for o in contributing
        ],
        "system_count": len(relevant),
        "options_result": options_result,
    }


# ═══════════════════════════════════════════════════════
#  Answer composer
# ═══════════════════════════════════════════════════════

def _hash_seed(text: str) -> int:
    return int(hashlib.md5(text.encode("utf-8")).hexdigest()[:8], 16)


def _pick(options: list[str], seed: int) -> str:
    return options[seed % len(options)] if options else ""


def compose_answer_text(
    question: str,
    classification: dict[str, Any],
    aggregation: dict[str, Any],
    chart_data: dict[str, str | None],
) -> str:
    """Build a direct, astrology-grounded answer from aggregated system signals."""
    q_type = classification["type"]
    domains = classification["domains"]
    options = classification.get("options", [])
    direction = aggregation["direction"]
    strength = aggregation["strength"]
    score = aggregation["score"]
    systems = aggregation["contributing_systems"]
    count = aggregation["system_count"]
    options_result = aggregation.get("options_result")

    parts: list[str] = []

    # ── 1. Direct answer ──
    if q_type == "binary_decision" and options_result:
        winner = options_result["winner"]
        winner_score = options_result["options"].get(winner, 50)
        if strength == "strong":
            parts.append(f"The strongest alignment clearly favors: {winner}.")
        elif strength == "moderate":
            parts.append(f"The signals lean toward: {winner}.")
        else:
            parts.append(f"The signals are mixed, but tilt slightly toward: {winner}.")
    elif direction in ("strongly_positive", "positive"):
        if q_type == "timing_question":
            parts.append("The timing looks favorable — the systems see supportive energy building now.")
        else:
            parts.append("The astrology signals are positive on this.")
    elif direction == "mixed":
        parts.append("The signals are genuinely mixed — some systems see support while others urge caution.")
    else:
        if q_type == "timing_question":
            parts.append("The timing signals suggest patience — the conditions aren't fully ripe yet.")
        else:
            parts.append("The systems lean toward caution here.")

    # ── 2. System evidence summary ──
    if count >= 4:
        positive_systems = [s["name"] for s in systems if "favorable" in s["sentiment"]]
        cautious_systems = [s["name"] for s in systems if "unfavorable" in s["sentiment"]]

        if positive_systems and len(positive_systems) >= 3:
            names = ", ".join(positive_systems[:4])
            parts.append(f"{names} all point in a supportive direction.")
        elif cautious_systems and len(cautious_systems) >= 3:
            names = ", ".join(cautious_systems[:4])
            parts.append(f"{names} advise holding back or adjusting your approach.")
        elif positive_systems and cautious_systems:
            pos = ", ".join(positive_systems[:2])
            cau = ", ".join(cautious_systems[:2])
            parts.append(f"{pos} see opportunity, while {cau} signal caution.")
    elif count >= 1:
        top = systems[0]
        parts.append(f"{top['name']} shows the clearest signal: {top['reason']}")

    # ── 3. Domain-specific insight ──
    primary_domain = domains[0] if domains else "mood"
    domain_insights = {
        "love": {
            "strongly_positive": "Your emotional and relational energy is running high — connection, attraction, and openness are all amplified right now.",
            "positive": "The relational energy is warm and receptive. Honest communication is especially powerful now.",
            "mixed": "Romance and connection energy is present but complex. Move with awareness, not assumptions.",
            "cautious": "The heart space needs gentleness right now. Protect your energy before extending it.",
            "strongly_cautious": "This is a period for emotional self-care rather than big relationship moves.",
        },
        "career": {
            "strongly_positive": "Professional momentum is strong. Your actions now carry more weight than usual.",
            "positive": "Career energy supports initiative. Decisions made now have solid footing.",
            "mixed": "Work energy is active but scattered. Focus on one clear priority rather than many.",
            "cautious": "Professional timing is off. Consolidate rather than expand right now.",
            "strongly_cautious": "This is a period for observation and preparation, not bold career moves.",
        },
        "health": {
            "strongly_positive": "Your vitality and energy levels are well-supported. Physical activity and new habits land well now.",
            "positive": "Energy is steady and supportive. Good time for building consistent routines.",
            "mixed": "Your energy fluctuates. Listen to your body's signals — it knows what it needs.",
            "cautious": "Rest and recovery matter more than pushing through right now.",
            "strongly_cautious": "The systems strongly favor rest, gentleness, and slowing your pace.",
        },
        "wealth": {
            "strongly_positive": "Financial energy is strong. Investments and decisions have solid cosmic backing.",
            "positive": "Material conditions support careful growth. Discipline amplifies returns.",
            "mixed": "Financial signals are split. Avoid big risks; small, informed moves are better.",
            "cautious": "Preservation matters more than growth right now. Tighten, don't expand.",
            "strongly_cautious": "This is a time for financial caution and conservation, not speculation.",
        },
        "mood": {
            "strongly_positive": "Your inner landscape is bright and clear. Creativity, purpose, and clarity are all elevated.",
            "positive": "Emotional energy is steady and constructive. Trust what feels right.",
            "mixed": "Your inner weather is shifting. Some clarity, some fog — be patient with yourself.",
            "cautious": "The emotional atmosphere is heavy. This is a season for self-compassion.",
            "strongly_cautious": "Inner stillness matters most now. Don't force clarity — let it arrive.",
        },
    }
    insight = domain_insights.get(primary_domain, domain_insights["mood"]).get(direction, "")
    if insight:
        parts.append(insight)

    # ── 4. Chart personalization ──
    chart_refs = []
    if chart_data.get("sun"):
        chart_refs.append(f"Your {chart_data['sun']} Sun")
    if chart_data.get("day_master"):
        chart_refs.append(f"your {chart_data['day_master']} Day Master")
    if chart_data.get("nakshatra"):
        chart_refs.append(f"your {chart_data['nakshatra']} nakshatra")
    if chart_data.get("life_path"):
        chart_refs.append(f"Life Path {chart_data['life_path']}")

    if chart_refs:
        refs = " and ".join(chart_refs[:2])
        if direction in ("strongly_positive", "positive"):
            parts.append(f"{refs} reinforce this supportive alignment.")
        elif direction == "mixed":
            parts.append(f"{refs} add nuance to the mixed signals.")
        else:
            parts.append(f"{refs} suggest patience is your wisest move here.")

    # ── 5. Closing directive ──
    if q_type == "binary_decision" and options_result:
        winner = options_result["winner"]
        parts.append(f"→ Go with: {winner}.")
    elif direction in ("strongly_positive", "positive"):
        parts.append("→ Move forward with intention.")
    elif direction == "mixed":
        parts.append("→ Proceed with awareness. The path is open but requires attention.")
    else:
        parts.append("→ Pause and reassess before committing.")

    return "\n\n".join(parts)


# ═══════════════════════════════════════════════════════
#  Chart data extractor (reused from old engine)
# ═══════════════════════════════════════════════════════

def _find_highlight(systems: dict[str, Any], system_id: str, *patterns: str) -> str | None:
    highlights = systems.get(system_id, {}).get("highlights", [])
    for item in highlights:
        label = str(item.get("label", "")).lower()
        if any(pattern in label for pattern in patterns):
            return str(item.get("value", ""))
    return None


def extract_chart_data(reading: dict[str, Any]) -> dict[str, str | None]:
    """Extract chart placements used in personalization."""
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


# ═══════════════════════════════════════════════════════
#  Main entry point (API-compatible)
# ═══════════════════════════════════════════════════════

def compose_response(question: str, reading: dict[str, Any]) -> dict[str, Any]:
    """Compose an Oracle answer from multi-system astrology signals."""
    # 1. Classify
    classification = classify_question(question)
    domains = classification["domains"]
    q_type = classification["type"]
    options = classification.get("options", [])

    # 2. Query each system
    systems_data = reading.get("systems", {})
    opinions: list[dict[str, Any]] = []
    for sys_id in SYSTEM_META:
        sys_data = systems_data.get(sys_id, {})
        opinion = query_system(sys_id, sys_data, domains, q_type)
        opinions.append(opinion)

    # 3. Aggregate
    aggregation = aggregate_opinions(opinions, q_type, options)

    # 4. Compose answer
    chart_data = extract_chart_data(reading)
    answer_text = compose_answer_text(question, classification, aggregation, chart_data)

    # 5. Build response
    # Convert contributing systems into the evidence format the frontend expects,
    # plus the new system_signals format
    contributing = aggregation["contributing_systems"]

    # New: system signals for the UI
    system_signals = []
    for sys in contributing[:6]:
        system_signals.append({
            "name": sys["name"],
            "system_id": sys["system"],
            "sentiment": sys["sentiment"],
            "score": sys["score"],
            "reason": sys["reason"],
            "detail": sys.get("detail", ""),
            "confidence": sys["confidence"],
        })

    # Legacy evidence format (kept for backward compat)
    probabilities = reading.get("combined", {}).get("probabilities", {})
    legacy_evidence = _build_legacy_evidence(domains[:2], probabilities)

    return {
        "answer": answer_text,
        "areas": domains,
        "evidence": legacy_evidence,
        # New fields
        "classification": {
            "type": q_type,
            "domains": domains,
            "options": options,
        },
        "aggregation": {
            "direction": aggregation["direction"],
            "strength": aggregation["strength"],
            "score": aggregation["score"],
            "system_count": aggregation["system_count"],
            "options_result": aggregation.get("options_result"),
        },
        "system_signals": system_signals,
    }


def _build_legacy_evidence(areas: list[str], probabilities: dict[str, Any]) -> list[dict[str, Any]]:
    """Build the old evidence format for backward compatibility."""
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
        seen: set[str] = set()
        unique_dissenting: list[str] = []
        for n in dissenting:
            if n not in seen:
                seen.add(n)
                unique_dissenting.append(n)

        sentiment = str(info.get("sentiment", "mixed"))
        if sentiment in {"strong positive", "positive"}:
            s = "positive"
        elif sentiment in {"strong challenging", "challenging"}:
            s = "challenging"
        else:
            s = "mixed"

        evidence.append({
            "area": area,
            "sentiment": s,
            "score": round(info.get("value", 0)),
            "label": info.get("label", ""),
            "agreeing": len(agreeing_names),
            "systems": agreeing_names,
            "dissenting": unique_dissenting[:3],
            "leaders": [{"name": item["name"], "score": round(item["value"])} for item in leaders[:3]],
            "laggards": [{"name": item["name"], "score": round(item["value"])} for item in laggards[:3]],
            "voices": f"{len(agreeing_names)} of 8 systems aligned",
        })
    return evidence
