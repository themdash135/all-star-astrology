"""Question decomposer — breaks multi-part questions into sub-queries
and resolves follow-up questions by inheriting context.

Decomposition: "Should I quit my job and start a business?"
  → ["career change timing", "entrepreneurship readiness"]

Follow-up resolution: previous="Should I ask her out?"
  current="What about next week instead?"
  → resolved="Should I ask her out next week?"
"""

from __future__ import annotations

import re

from .intent_classifier import classify
from .schemas import ClassifiedIntent

# ── Conjunctions that split compound questions ────────────────────

SPLIT_PATTERNS = [
    r"\band\b",
    r"\bor also\b",
    r"\bbut also\b",
    r"\bplus\b",
]

# ── Follow-up indicators ─────────────────────────────────────────

FOLLOWUP_INDICATORS = {
    "what about", "how about", "and what if", "instead",
    "but what if", "what if i", "should i instead",
    "ok but", "okay but", "and if",
}

PRONOUN_REFS = {"he", "she", "they", "him", "her", "them", "it", "this", "that"}


def decompose(question: str) -> list[str]:
    """Split a compound question into sub-questions.

    Returns a list of 1-3 sub-questions.  If the question is simple,
    returns [question] unchanged.
    """
    q = question.strip()
    if not q:
        return [q]

    # Check if question contains compound structure
    for pattern in SPLIT_PATTERNS:
        parts = re.split(pattern, q, maxsplit=1, flags=re.IGNORECASE)
        if len(parts) == 2:
            a = parts[0].strip().rstrip("?.,").strip()
            b = parts[1].strip().rstrip("?.,").strip()
            if len(a) >= 10 and len(b) >= 8:
                # Both parts are substantive — treat as compound
                return [a + "?", b + "?"]

    return [q]


def resolve_followup(
    current_question: str,
    previous_question: str | None,
    previous_domains: list[str] | None = None,
) -> tuple[str, bool]:
    """Resolve a follow-up question by inheriting context from the previous one.

    Returns (resolved_question, was_followup).
    """
    if not previous_question:
        return current_question, False

    current_lower = current_question.lower().strip()

    # Check for follow-up indicators
    is_followup = False
    for indicator in FOLLOWUP_INDICATORS:
        if current_lower.startswith(indicator):
            is_followup = True
            break

    # Check for pronoun references without a clear subject
    words = set(current_lower.split())
    has_pronouns = bool(words & PRONOUN_REFS)
    has_question_word = current_lower.startswith(("what", "how", "when", "should", "will", "can", "is"))

    if has_pronouns and has_question_word and len(current_lower.split()) <= 8:
        is_followup = True

    if not is_followup:
        return current_question, False

    # Merge: prepend context from previous question
    # Extract the topic from previous question
    prev_clean = previous_question.strip().rstrip("?").strip()

    # Simple merge: "What about next week?" + prev "Should I ask her out?"
    # → "Should I ask her out next week?"
    for indicator in FOLLOWUP_INDICATORS:
        if current_lower.startswith(indicator):
            remainder = current_question[len(indicator):].strip().lstrip(",").strip()
            if remainder:
                resolved = f"{prev_clean} — {remainder}?"
                return resolved, True
            break

    # Pronoun-only followup: just prepend context
    resolved = f"Regarding '{prev_clean}': {current_question}"
    return resolved, True


def classify_with_decomposition(
    question: str,
    previous_question: str | None = None,
    previous_domains: list[str] | None = None,
) -> tuple[ClassifiedIntent, list[ClassifiedIntent]]:
    """Classify a question, decomposing if compound and resolving follow-ups.

    Returns (primary_intent, sub_intents).
    sub_intents is empty for simple questions, or contains 1+ additional intents
    for compound questions.  The primary_intent is always the main/first question.
    """
    # Resolve follow-ups first
    resolved, was_followup = resolve_followup(question, previous_question, previous_domains)

    # Decompose
    parts = decompose(resolved)

    # Classify each part
    intents = [classify(p) for p in parts]

    primary = intents[0]

    # If follow-up, inherit domains from previous question if current has defaults
    if was_followup and previous_domains:
        if set(primary.domain_tags) == {"mood", "career"}:  # default fallback
            primary = primary.model_copy(update={"domain_tags": previous_domains})

    sub_intents = intents[1:] if len(intents) > 1 else []

    return primary, sub_intents
