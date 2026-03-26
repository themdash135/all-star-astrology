You are upgrading an astrology mobile app into a NEURO-SYMBOLIC AI ENGINE.

STRICT REQUIREMENTS:
- The AI MUST NOT generate generic astrology responses
- ALL answers must be derived from structured system outputs
- The LLM is ONLY allowed to translate computed results into natural language

--------------------------------
CORE ARCHITECTURE
--------------------------------

Build the following pipeline:

1. IntentClassifier
2. SystemRouter
3. SystemAdapters (one per astrology system)
4. Aggregator
5. AnswerComposer

--------------------------------
DATA CONTRACT (MANDATORY)
--------------------------------

Every astrology system MUST return this exact JSON:

{
  "system_id": "string",
  "relevant": true,
  "stance": {
    "option_a": number,
    "option_b": number
  },
  "confidence": number,
  "reason": "short explanation",
  "evidence": [
    {
      "feature": "string",
      "value": "string",
      "weight": number
    }
  ]
}

--------------------------------
STEP 1: INTENT CLASSIFIER
--------------------------------

Convert user question into structured format:

Example input:
"Should I go to sleep early or late tonight?"

Output:

{
  "question_type": "binary_decision",
  "domain_tags": ["sleep", "health", "timing"],
  "options": ["sleep_early", "sleep_late"],
  "time_horizon": "tonight"
}

--------------------------------
STEP 2: SYSTEM ROUTER
--------------------------------

Select ONLY relevant systems (max 4):

Rules:
- timing → Vedic, Persian
- personality → Western
- structure/life path → BaZi
- numeric cycles → Numerology
- spiritual meaning → Kabbalistic
- symbolic language → Gematria

--------------------------------
STEP 3: SYSTEM ADAPTERS
--------------------------------

Implement adapters for:

- Western
- Vedic
- Chinese
- BaZi
- Numerology
- Kabbalistic
- Gematria
- Persian

Each adapter must:
- analyze input
- compute stance scores
- return structured JSON (NO TEXT OUTPUT)

--------------------------------
STEP 4: AGGREGATOR
--------------------------------

Combine system outputs:

- normalize scores
- weight by confidence
- compute final decision

Output:

{
  "winner": "option_a",
  "scores": {
    "option_a": number,
    "option_b": number
  },
  "contributors": ["vedic", "western"]
}

--------------------------------
STEP 5: ANSWER COMPOSER
--------------------------------

CRITICAL RULES:
- MUST USE aggregator output
- MUST reference at least one system
- MUST explain reasoning
- MUST NOT hallucinate or generalize

FORMAT:

Short answer first:
"Sleep early tonight."

Then reasoning:
"Vedic timing and BaZi balance both favor restoration over stimulation..."

--------------------------------
UI REQUIREMENTS
--------------------------------

Update result screen to show:

1. FINAL ANSWER (large text)
2. WHY (1–2 sentences)
3. CONTRIBUTING SYSTEMS (chips)
4. SYSTEM BREAKDOWN (expandable cards)
5. CONFIDENCE SCORE

--------------------------------
FAIL CONDITIONS (DO NOT ALLOW)
--------------------------------

- Generic advice like "trust yourself"
- Answers without system attribution
- No structured reasoning
- LLM answering without system data

--------------------------------
GOAL
--------------------------------

Transform this app from:
❌ Generic astrology responses

Into:
✅ Multi-system reasoning engine with traceable logic

Start by:
1. Defining shared interfaces
2. Implementing 4 systems first (Western, Vedic, BaZi, Numerology)
3. Then expand to all 8

Return code structure + implementation plan.










Use the following as the primary implementation direction.

FIRST PRIORITY:
Design the real backend structure first.
Do not start by hardcoding scoring formulas across all systems.
Lock the architecture first so scoring formulas can plug into a stable engine.

Reason:
- 8 systems will become messy without a shared backend contract
- scoring formulas should be modular, not scattered
- the system needs a stable orchestration layer before deeper astrology logic is added

Build the backend skeleton first:
- question classifier
- system router
- shared SystemOpinion schema
- system adapter interface
- aggregator
- answer composer
- traceable evidence output
- API/service boundaries

Preferred architecture:
- iOS app remains frontend
- backend orchestrator in Node/TypeScript
- symbolic/calculation engines in Python

Node/TypeScript handles:
- API routes
- orchestration
- request validation
- user/session flow
- routing to systems
- aggregation
- final response assembly

Python handles:
- astrology calculations
- symbolic rules
- scoring logic
- system-level evaluators

Only after backend structure is defined should you implement real scoring formulas system by system.

Now use this implementation brief:

You are upgrading an astrology mobile app into a NEURO-SYMBOLIC AI ENGINE.

STRICT REQUIREMENTS:
- The AI MUST NOT generate generic astrology responses
- ALL answers must be derived from structured system outputs
- The LLM is ONLY allowed to translate computed results into natural language

--------------------------------
CORE ARCHITECTURE
--------------------------------

Build the following pipeline:

1. IntentClassifier
2. SystemRouter
3. SystemAdapters (one per astrology system)
4. Aggregator
5. AnswerComposer

--------------------------------
DATA CONTRACT (MANDATORY)
--------------------------------

Every astrology system MUST return this exact JSON:

{
  "system_id": "string",
  "relevant": true,
  "stance": {
    "option_a": number,
    "option_b": number
  },
  "confidence": number,
  "reason": "short explanation",
  "evidence": [
    {
      "feature": "string",
      "value": "string",
      "weight": number
    }
  ]
}

--------------------------------
STEP 1: INTENT CLASSIFIER
--------------------------------

Convert user question into structured format.

Example input:
"Should I go to sleep early or late tonight?"

Output:

{
  "question_type": "binary_decision",
  "domain_tags": ["sleep", "health", "timing"],
  "options": ["sleep_early", "sleep_late"],
  "time_horizon": "tonight"
}

--------------------------------
STEP 2: SYSTEM ROUTER
--------------------------------

Select ONLY relevant systems (max 4).

Rules:
- timing → Vedic, Persian
- personality → Western
- structure/life path → BaZi
- numeric cycles → Numerology
- spiritual meaning → Kabbalistic
- symbolic language → Gematria

--------------------------------
STEP 3: SYSTEM ADAPTERS
--------------------------------

Implement adapters for:
- Western
- Vedic
- Chinese
- BaZi
- Numerology
- Kabbalistic
- Gematria
- Persian

Each adapter must:
- analyze input
- compute stance scores
- return structured JSON
- not directly generate final user-facing prose

--------------------------------
STEP 4: AGGREGATOR
--------------------------------

Combine system outputs:
- normalize scores
- weight by confidence
- compute final decision

Output:

{
  "winner": "option_a",
  "scores": {
    "option_a": number,
    "option_b": number
  },
  "contributors": ["vedic", "western"]
}

--------------------------------
STEP 5: ANSWER COMPOSER
--------------------------------

CRITICAL RULES:
- MUST USE aggregator output
- MUST reference at least one system
- MUST explain reasoning
- MUST NOT hallucinate or generalize

FORMAT:
Short answer first:
"Sleep early tonight."

Then reasoning:
"Vedic timing and BaZi balance both favor restoration over stimulation..."

--------------------------------
UI REQUIREMENTS
--------------------------------

Update result screen to show:
1. FINAL ANSWER
2. WHY
3. CONTRIBUTING SYSTEMS
4. SYSTEM BREAKDOWN
5. CONFIDENCE SCORE

--------------------------------
FAIL CONDITIONS
--------------------------------

Do NOT allow:
- generic advice like "trust yourself"
- answers without system attribution
- no structured reasoning
- LLM answering without system data

--------------------------------
GOAL
--------------------------------

Transform this app from generic astrology responses into a multi-system reasoning engine with traceable logic.

IMPLEMENTATION ORDER:
1. Define shared interfaces and backend architecture
2. Implement 4 systems first: Western, Vedic, BaZi, Numerology
3. Add placeholder stubs for the remaining 4 systems
4. Then expand scoring formulas system by system

Return:
- backend architecture
- folder structure
- service boundaries
- API contract
- implementation plan
- then begin code changes