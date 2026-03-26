"""Intent Classifier — converts a user question into a ClassifiedIntent.

Pure rule-based (no LLM).  Detects question type, domain tags, binary
options, temporal scope, feasibility, specificity, negation, and
emotional charge so downstream components can route and score.
"""

from __future__ import annotations

import datetime as dt
import re

from .schemas import ClassifiedIntent


# ── Domain keyword sets ───────────────────────────────────────────

DOMAIN_KEYWORDS: dict[str, set[str]] = {
    "love": {
        "love", "relationship", "partner", "dating", "marriage", "romance",
        "heart", "soulmate", "crush", "text", "ex", "boyfriend", "girlfriend",
        "wife", "husband", "feelings", "attraction", "romantic", "chemistry",
        "him", "her", "them", "breakup", "divorce", "propose", "commitment",
    },
    "career": {
        "career", "work", "job", "promotion", "boss", "business",
        "professional", "interview", "project", "colleague", "office", "hire",
        "fired", "raise", "success", "freelance", "quit", "resign",
        "position", "startup", "company",
    },
    "health": {
        "health", "body", "exercise", "sick", "energy", "sleep", "diet",
        "stress", "anxiety", "wellness", "tired", "pain", "healing",
        "recovery", "medical", "weight", "fitness", "vitality", "rest",
        "insomnia", "gym",
    },
    "wealth": {
        "money", "wealth", "invest", "investing", "financial", "savings",
        "budget", "rich", "income", "spend", "buy", "afford", "debt", "loan",
        "fortune", "abundance", "prosperity", "rent", "house", "apartment",
        "crypto", "stocks", "purchase",
    },
    "mood": {
        "mood", "happy", "sad", "feel", "emotion", "vibe", "spirit", "mental",
        "joy", "depression", "motivation", "inspired", "creative", "purpose",
        "meaning", "direction", "lost", "confused", "peace", "spiritual",
        "growth",
    },
}

DOMAIN_ALIASES: dict[str, str] = {
    "romance": "love",
    "partner": "love",
    "soulmate": "love",
    "dating": "love",
    "promotion": "career",
    "interview": "career",
    "startup": "career",
    "salary": "wealth",
    "budget": "wealth",
    "rent": "wealth",
    "anxiety": "health",
    "sleep": "health",
    "stress": "health",
    "purpose": "mood",
    "meaning": "mood",
    "peace": "mood",
}

YES_NO_STARTERS = {
    "should", "will", "can", "is", "am", "do", "does", "would", "could", "are",
}

TIMING_PREFIXES = [
    "when", "how long", "how soon", "what time",
]

TIMING_WORDS = {
    "when", "tonight", "today", "tomorrow", "this week", "this month",
    "this year", "next week", "next month",
}

BINARY_MARKERS = {"or", "versus", "vs"}

GOAL_LEAD_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"^(?:should|will|can|could|would|do|does|is|are|am)\s+i\s+(.+)$"),
    re.compile(r"^(?:when|how soon|how long)\s+(?:should|will|can)\s+i\s+(.+)$"),
]

ACTION_WORDS = {
    "go", "leave", "move", "start", "launch", "take", "accept", "reach", "call",
    "text", "ask", "buy", "sell", "invest", "quit", "break", "sign", "commit",
}

REST_WORDS = {
    "wait", "stay", "pause", "rest", "hold", "delay", "decline", "avoid",
    "protect", "conserve", "slow", "stop",
}

DATE_TOKENS = {
    "today", "tonight", "tomorrow", "monday", "tuesday", "wednesday", "thursday",
    "friday", "saturday", "sunday", "week", "month", "year", "january", "february",
    "march", "april", "may", "june", "july", "august", "september", "october",
    "november", "december",
}

TIME_HORIZON_MAP: list[tuple[set[str], str]] = [
    ({"tonight", "today"}, "today"),
    ({"tomorrow"}, "tomorrow"),
    ({"this week", "next week"}, "this_week"),
    ({"this month", "next month"}, "this_month"),
    ({"this year", "next year"}, "this_year"),
]

# ── Emotion detection keyword tiers ─────────────────────────────

EMOTION_HIGH: dict[str, float] = {
    "scared": 0.85, "terrified": 0.95, "desperate": 0.90,
    "heartbroken": 0.90, "devastated": 0.95, "panicking": 0.90,
    "hopeless": 0.85, "crying": 0.80,
}

EMOTION_MEDIUM: dict[str, float] = {
    "worried": 0.50, "anxious": 0.55, "confused": 0.45,
    "frustrated": 0.55, "lonely": 0.50, "stressed": 0.55,
    "overwhelmed": 0.60, "lost": 0.45, "stuck": 0.45,
}

EMOTION_LOW: dict[str, float] = {
    "wondering": 0.15, "curious": 0.10, "thinking": 0.15,
    "considering": 0.20, "hoping": 0.25,
}


# ── Upgrade 6: Negation keywords ────────────────────────────────

_NEGATION_PATTERNS: list[str] = [
    r"\bshould(?:n't| not)\b",
    r"\bshouldn t\b",
    r"\bdon t\b",
    r"\bdon't\b",
    r"\bnot\b",
    r"\bnever\b",
    r"\bavoid\b",
    r"\bstop\b",
    r"\bwithout\b",
    r"\brefrain\b",
]

# ── Upgrade 1: Feasibility — unfeasible question indicators ─────

_UNFEASIBLE_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"\bwill i (ever|always) be (happy|rich|famous|successful|loved)\b"),
    re.compile(r"\bwhat is my (destiny|purpose|fate|meaning)\b"),
    re.compile(r"\bwhat does (the|my) (universe|life|future) (hold|have)\b"),
    re.compile(r"\bwhat should i do with my life\b"),
    re.compile(r"\bam i (going to|gonna) (die|live forever)\b"),
    re.compile(r"\bwill everything (be|work out) (ok|okay|fine|alright)\b"),
    re.compile(r"\bwhat happens (when|after) i die\b"),
    re.compile(r"\btell me (everything|my whole|my entire)\b"),
]

_FEASIBLE_MARKERS: set[str] = {
    "today", "tomorrow", "tonight", "this", "next", "should",
    "tuesday", "wednesday", "monday", "thursday", "friday", "saturday", "sunday",
    "job", "offer", "interview", "date", "move", "sign", "lease",
    "call", "text", "apply", "accept", "decline", "buy", "sell",
    "invest", "start", "quit", "break", "propose",
}

# ── Upgrade 2: Specificity indicators ───────────────────────────

_SPECIFIC_MARKERS: set[str] = {
    "today", "tomorrow", "tonight", "tuesday", "wednesday", "monday",
    "thursday", "friday", "saturday", "sunday", "january", "february",
    "march", "april", "may", "june", "july", "august", "september",
    "october", "november", "december",
    "job", "offer", "interview", "lease", "contract", "deal",
    "him", "her", "boyfriend", "girlfriend", "wife", "husband",
    "boss", "company", "position", "apartment", "house",
}

_VAGUE_MARKERS: set[str] = {
    "destiny", "purpose", "meaning", "fate", "universe", "life",
    "everything", "anything", "whatever", "somehow", "someday",
    "general", "overall", "broad",
}

# ── Upgrade 4: Semantic similarity normalization ────────────────

_SEMANTIC_GROUPS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\b(is he|is she|are they) (a good|the right) (match|fit|one|person)\b"), "compatibility question"),
    (re.compile(r"\bshould i (date|go out with|see|be with|pursue)\b"), "compatibility question"),
    (re.compile(r"\bwill (he|she|they) (come back|return|call|text|reach out)\b"), "reconnection question"),
    (re.compile(r"\bshould i (reach out|call|text|contact|message)\b"), "reconnection question"),
    (re.compile(r"\bshould i (take|accept|go for) (the|this) (job|offer|position|role)\b"), "career opportunity question"),
    (re.compile(r"\bis (this|the) (job|offer|position|role) (right|good|worth)\b"), "career opportunity question"),
    (re.compile(r"\bshould i (move|relocate|leave|go) (to|from)\b"), "relocation question"),
    (re.compile(r"\bis (this|it) (a good|the right) time (to|for)\b"), "timing question"),
    (re.compile(r"\bwhen (should|can|will) i\b"), "timing question"),
]


# ── Helpers ───────────────────────────────────────────────────────

def _tokenize(text: str) -> tuple[str, set[str]]:
    normalized = re.sub(r"[^a-z0-9\s]", " ", text.lower()).strip()
    tokens = {part for part in normalized.split() if part}
    return normalized, tokens


def _extract_options(text: str) -> list[str]:
    lower = text.lower().strip().rstrip("?").strip()
    candidate = lower
    for prefix in [
        "should i ", "will i ", "can i ", "could i ", "would i ", "do i ",
        "is it better to ", "is it better if i ", "which should i ",
    ]:
        if candidate.startswith(prefix):
            candidate = candidate[len(prefix):]
            break

    split = re.split(r"\s+(?:or|versus|vs)\s+|,\s*", candidate)
    cleaned = [part.strip(" ?.").strip() for part in split if part.strip(" ?.").strip()]
    if 2 <= len(cleaned) <= 4:
        return cleaned

    for splitter in [" or ", " versus ", " vs "]:
        if splitter in lower:
            parts = lower.split(splitter, 1)
            if len(parts) == 2:
                a = parts[0].split()[-3:]
                b = parts[1].split()[:4]
                return [" ".join(a).strip(), " ".join(b).strip()]
    return []


def _detect_time_horizon(normalized: str) -> str:
    for triggers, horizon in TIME_HORIZON_MAP:
        for trigger in triggers:
            if trigger in normalized:
                return horizon
    return "general"


def _detect_time_window(normalized: str) -> dict[str, str | int]:
    today = dt.date.today()

    def _same_day(day: dt.date, label: str) -> dict[str, str | int]:
        return {"label": label, "start": day.isoformat(), "end": day.isoformat(), "days": 1}

    if "today" in normalized or "tonight" in normalized:
        return _same_day(today, "today")
    if "tomorrow" in normalized:
        return _same_day(today + dt.timedelta(days=1), "tomorrow")
    if "this week" in normalized:
        end = today + dt.timedelta(days=(6 - today.weekday()))
        return {"label": "this_week", "start": today.isoformat(), "end": end.isoformat(), "days": (end - today).days + 1}
    if "next week" in normalized:
        start = today + dt.timedelta(days=(7 - today.weekday()))
        end = start + dt.timedelta(days=6)
        return {"label": "next_week", "start": start.isoformat(), "end": end.isoformat(), "days": 7}
    if "this month" in normalized:
        next_month = (today.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
        end = next_month - dt.timedelta(days=1)
        return {"label": "this_month", "start": today.isoformat(), "end": end.isoformat(), "days": (end - today).days + 1}
    if "next month" in normalized:
        start = (today.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
        following = (start.replace(day=28) + dt.timedelta(days=4)).replace(day=1)
        end = following - dt.timedelta(days=1)
        return {"label": "next_month", "start": start.isoformat(), "end": end.isoformat(), "days": (end - start).days + 1}

    weekdays = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6,
    }
    for name, target in weekdays.items():
        if name in normalized:
            delta = (target - today.weekday()) % 7
            if delta == 0:
                delta = 7
            day = today + dt.timedelta(days=delta)
            return _same_day(day, name)
    return {}


def _detect_emotional_charge(words: set[str]) -> float:
    """Return the highest emotional charge found in *words* (0.0-1.0)."""
    best = 0.0
    for tier in (EMOTION_HIGH, EMOTION_MEDIUM, EMOTION_LOW):
        for word, score in tier.items():
            if word in words and score > best:
                best = score
    return best


def _extract_entities(question: str, normalized: str, words: set[str]) -> dict[str, list[str]]:
    entities: dict[str, list[str]] = {}

    time_hits: list[str] = []
    for phrase in (
        "today", "tonight", "tomorrow", "this week", "next week",
        "this month", "next month", "this year", "next year",
    ):
        if phrase in normalized:
            time_hits.append(phrase)
    if not time_hits:
        time_hits = sorted({token for token in DATE_TOKENS if token in normalized})
    if time_hits:
        entities["time"] = time_hits

    capitalized = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", question)
    capitalized = [item for item in capitalized if item.lower() not in {"i"}]
    if capitalized:
        entities["named"] = sorted(dict.fromkeys(capitalized))

    pronouns = [token for token in ("he", "she", "they", "him", "her", "them", "it", "this", "that") if token in words]
    if pronouns:
        entities["references"] = pronouns

    targets = [
        token for token in
        ("job", "offer", "interview", "lease", "contract", "apartment", "house", "relationship", "date", "investment")
        if token in words
    ]
    if targets:
        entities["targets"] = targets

    return entities


def _extract_goal_intent(question: str, q_type: str, options: list[str], domains: list[str]) -> str:
    lower = question.strip().rstrip("?").strip().lower()
    if options:
        return " vs ".join(options)
    for pattern in GOAL_LEAD_PATTERNS:
        match = pattern.match(lower)
        if match:
            return match.group(1).strip()
    if domains:
        if q_type == "timing_question":
            return f"find timing for {domains[0]}"
        if q_type in {"binary_decision", "relationship_question", "career_question"}:
            return f"decide what to do about {domains[0]}"
    return lower[:80]


# ── Upgrade 6: Negation detection ───────────────────────────────

def _detect_negation(normalized: str) -> bool:
    """Return True if the question contains negation that inverts polarity.

    "Should I NOT take the job?" → True
    "Should I take the job?" → False
    "Will I never find love?" → True
    """
    for pattern in _NEGATION_PATTERNS:
        if re.search(pattern, normalized):
            return True
    return False


def _detect_contradictions(normalized: str, words: set[str], options: list[str], negated: bool) -> list[str]:
    contradictions: list[str] = []
    if bool(words & ACTION_WORDS) and bool(words & REST_WORDS):
        contradictions.append("mixed_action_and_rest_language")
    if negated and bool(words & ACTION_WORDS):
        contradictions.append("negated_action_request")
    if len(options) >= 2 and any("not" in option for option in options) and any("not" not in option for option in options):
        contradictions.append("option_set_contains_negated_and_positive_paths")
    if "stay" in words and "go" in words:
        contradictions.append("stay_vs_go")
    if "wait" in words and ("now" in words or "immediately" in words):
        contradictions.append("wait_vs_now")
    return contradictions


# ── Upgrade 1: Question feasibility scoring ─────────────────────

def _score_feasibility(
    normalized: str,
    words: set[str],
    q_type: str,
    time_horizon: str,
) -> tuple[float, list[str]]:
    """Rate 0.0-1.0 how answerable the question is by astrological systems.

    "Will I be happy?" (existential, no specifics) → ~0.2
    "Should I take the Friday job offer?" (specific, actionable) → ~0.9
    """
    score = 0.5  # neutral baseline

    reasons: list[str] = []

    # Unfeasible pattern matching — heavy penalty
    for pat in _UNFEASIBLE_PATTERNS:
        if pat.search(normalized):
            score -= 0.35
            reasons.append("contains_existential_or_totalizing_request")

    # Feasible markers — boost per marker found
    feasible_hits = len(words & _FEASIBLE_MARKERS)
    score += min(feasible_hits * 0.1, 0.35)
    if feasible_hits:
        reasons.append("includes_actionable_context")

    # Binary decisions with explicit options are highly feasible
    if q_type == "binary_decision":
        score += 0.15
        reasons.append("decision_question")

    # Timing questions with specific horizon are feasible
    if q_type == "timing_question":
        score += 0.10
        reasons.append("timing_question")
    if time_horizon in ("today", "tomorrow"):
        score += 0.10
        reasons.append("short_horizon")
    elif time_horizon in ("this_week", "this_month"):
        score += 0.05

    # Very short questions tend to be vague
    word_count = len(words)
    if word_count <= 3:
        score -= 0.10
        reasons.append("too_short")
    elif word_count >= 8:
        score += 0.05

    # General guidance with no domain hits is harder to answer
    if q_type == "general_guidance_question":
        score -= 0.10
        reasons.append("general_guidance_is_harder_to_ground")

    return round(max(0.05, min(1.0, score)), 2), reasons


# ── Upgrade 2: Question specificity scoring ─────────────────────

def _score_specificity(
    normalized: str,
    words: set[str],
    q_type: str,
    options: list[str],
    time_horizon: str,
) -> float:
    """Rate 0.0-1.0 how specific the question is.

    "What's my purpose?" → ~0.15
    "Should I sign the lease on this apartment Tuesday?" → ~0.90
    """
    score = 0.3  # baseline

    # Specific markers found in question
    specific_hits = len(words & _SPECIFIC_MARKERS)
    score += min(specific_hits * 0.12, 0.40)

    # Vague markers penalize
    vague_hits = len(words & _VAGUE_MARKERS)
    score -= min(vague_hits * 0.15, 0.30)

    # Explicit binary options = very specific
    if options and q_type == "binary_decision":
        score += 0.20

    # Named time horizon = specific
    if time_horizon in ("today", "tomorrow"):
        score += 0.15
    elif time_horizon in ("this_week", "this_month"):
        score += 0.10
    elif time_horizon == "this_year":
        score += 0.05

    # Longer questions tend to be more specific
    word_count = len(words)
    if word_count >= 10:
        score += 0.10
    elif word_count <= 3:
        score -= 0.10

    # Numbers in the question suggest specificity (dates, amounts)
    if re.search(r"\d", normalized):
        score += 0.08

    return round(max(0.05, min(1.0, score)), 2)


# ── Upgrade 4: Semantic similarity normalization ────────────────

def _semantic_group(normalized: str) -> str | None:
    """Return a semantic group label if the question matches a known pattern.

    "Should I date him?" and "Is he a good match?" both → "compatibility question"
    """
    for pattern, group in _SEMANTIC_GROUPS:
        if pattern.search(normalized):
            return group
    return None


def _domain_hits(normalized: str, words: set[str]) -> list[tuple[str, int]]:
    hits: dict[str, int] = {}
    for domain, keywords in DOMAIN_KEYWORDS.items():
        hit_count = len(words & keywords)
        if hit_count > 0:
            hits[domain] = hits.get(domain, 0) + hit_count

    for alias, canonical in DOMAIN_ALIASES.items():
        if alias in normalized:
            hits[canonical] = hits.get(canonical, 0) + 1

    return sorted(hits.items(), key=lambda pair: pair[1], reverse=True)


# ── Main entry point ──────────────────────────────────────────────

def classify(question: str) -> ClassifiedIntent:
    """Classify a user question into structured intent."""
    normalized, words = _tokenize(question or "")
    first_word = normalized.split()[0] if normalized else ""

    # Upgrade 4: Semantic normalization — detect question groups
    # that should classify identically regardless of phrasing
    sem_group = _semantic_group(normalized)

    # Question type
    options = _extract_options(question)
    if options:
        q_type = "binary_decision"
    elif sem_group == "timing question":
        q_type = "timing_question"
    elif any(normalized.startswith(prefix) for prefix in TIMING_PREFIXES):
        q_type = "timing_question"
    elif sem_group == "compatibility question":
        q_type = "relationship_question"
    elif sem_group == "reconnection question":
        q_type = "relationship_question"
    elif sem_group == "career opportunity question":
        q_type = "career_question"
    elif sem_group == "relocation question":
        q_type = "binary_decision"
    elif words & DOMAIN_KEYWORDS["love"]:
        q_type = "relationship_question"
    elif words & DOMAIN_KEYWORDS["career"]:
        q_type = "career_question"
    elif words & {"energy", "sleep", "tired", "rest", "health", "exercise", "gym", "sick"}:
        q_type = "health_energy_question"
    elif words & {"feel", "feeling", "sad", "happy", "anxious", "depressed", "confused", "lost", "peace"}:
        q_type = "emotional_state_question"
    elif first_word in YES_NO_STARTERS:
        q_type = "binary_decision"
    else:
        q_type = "general_guidance_question"

    # Domain tags — ordered by keyword match strength (most hits first)
    domain_hits = _domain_hits(normalized, words)

    # Upgrade 4: Inject domain from semantic group when keyword hits miss
    if sem_group in ("compatibility question", "reconnection question"):
        # Ensure love is present
        if not any(d == "love" for d, _ in domain_hits):
            domain_hits.append(("love", 2))  # synthetic hits
    elif sem_group == "career opportunity question":
        if not any(d == "career" for d, _ in domain_hits):
            domain_hits.append(("career", 2))
    elif sem_group == "relocation question":
        if not any(d == "mood" for d, _ in domain_hits):
            domain_hits.append(("mood", 1))

    domain_hits.sort(key=lambda pair: pair[1], reverse=True)
    domains: list[str] = [d for d, _ in domain_hits]
    if not domains:
        if q_type == "relationship_question":
            domains = ["love"]
        elif q_type == "career_question":
            domains = ["career"]
        elif q_type == "health_energy_question":
            domains = ["health"]
        else:
            domains = ["mood", "career"]

    # For binary questions without explicit options, use favorable/cautious
    if q_type == "binary_decision" and not options:
        options = ["favorable", "cautious"]

    decision_style = (
        "multi_option" if len(options) > 2 else
        "binary" if len(options) == 2 else
        "open"
    )

    # Time horizon
    time_horizon = _detect_time_horizon(normalized)
    time_window = _detect_time_window(normalized)

    # Emotional charge (Upgrade 17 from prior round)
    emotional_charge = _detect_emotional_charge(words)

    # Upgrade 6: Negation detection
    negated = _detect_negation(normalized)
    contradictions = _detect_contradictions(normalized, words, options, negated)

    # Upgrade 1: Feasibility scoring
    feasibility, feasibility_reasons = _score_feasibility(normalized, words, q_type, time_horizon)

    # Upgrade 2: Specificity scoring
    specificity = _score_specificity(normalized, words, q_type, options, time_horizon)
    entities = _extract_entities(question, normalized, words)
    goal_intent = _extract_goal_intent(question, q_type, options, domains)

    return ClassifiedIntent(
        question_type=q_type,
        domain_tags=domains[:3],
        options=options,
        time_horizon=time_horizon,
        emotional_charge=emotional_charge,
        feasibility=feasibility,
        specificity=specificity,
        negated=negated,
        semantic_group=sem_group,
        decision_style=decision_style,
        goal_intent=goal_intent,
        entities=entities,
        contradictions=contradictions,
        feasibility_reasons=feasibility_reasons,
        time_window=time_window,
    )
