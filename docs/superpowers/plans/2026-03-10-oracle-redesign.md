# Oracle Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform "Ask the Stars" into an immersive full-screen oracle with poetic responses, dramatic animations, and make it the app's default landing screen.

**Architecture:** New `backend/engines/oracle.py` module handles question classification, chart data extraction, and poetic response composition using a template system. Frontend adds a full-screen OracleScreen component as the first tab, with particle animations and dramatic reveal sequence. Existing tabs shift right in navigation.

**Tech Stack:** Python 3.12 (FastAPI backend), React 18 (single-file SPA), CSS keyframe animations.

**Spec:** `docs/superpowers/specs/2026-03-10-oracle-redesign.md`

---

## File Structure

### New Files
- `backend/engines/oracle.py` — Question classifier, chart extractor, poetic template engine, response composer
- `tests/test_oracle.py` — Unit tests for the oracle engine

### Modified Files
- `backend/main.py` — Rewire `/api/ask` to use new oracle engine
- `frontend/src/App.jsx` — Add OracleScreen component, update BottomNav to 5 tabs with Oracle as default, add subtle animations throughout

---

## Chunk 1: Backend Oracle Engine

### Task 1: Oracle engine — question classifier + chart extractor

**Files:**
- Create: `backend/engines/oracle.py`
- Create: `tests/test_oracle.py`

- [ ] **Step 1: Write failing tests for question classification**

```python
# tests/test_oracle.py
"""Tests for the oracle engine."""
from __future__ import annotations
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from backend.engines.oracle import classify_question, extract_chart_data


class TestClassifyQuestion:
    def test_yes_no_should(self):
        assert classify_question("Should I take the job?") == {
            "type": "yes_no",
            "areas": ["career"],
        }

    def test_yes_no_will(self):
        assert classify_question("Will I find love?") == {
            "type": "yes_no",
            "areas": ["love"],
        }

    def test_open_tell_me(self):
        result = classify_question("Tell me about my career")
        assert result["type"] == "open"
        assert "career" in result["areas"]

    def test_timing_when(self):
        result = classify_question("When will I get a promotion?")
        assert result["type"] == "timing"
        assert "career" in result["areas"]

    def test_no_keywords_defaults_to_mood_career(self):
        result = classify_question("What does the future hold?")
        assert result["type"] == "open"
        assert set(result["areas"]) == {"mood", "career"}

    def test_multiple_areas(self):
        result = classify_question("How will my love life and money be?")
        assert "love" in result["areas"]
        assert "wealth" in result["areas"]


class TestExtractChartData:
    def test_extracts_western_highlights(self):
        reading = {
            "systems": {
                "western": {
                    "highlights": [
                        {"label": "Sun sign", "value": "Gemini"},
                        {"label": "Moon sign", "value": "Pisces"},
                        {"label": "Rising sign", "value": "Libra"},
                    ]
                },
                "chinese": {
                    "highlights": [
                        {"label": "Animal sign", "value": "Earth Goat"},
                    ]
                },
                "bazi": {
                    "highlights": [
                        {"label": "Day Master", "value": "Water (Gui)"},
                    ]
                },
                "numerology": {
                    "highlights": [
                        {"label": "Life Path", "value": "5"},
                    ]
                },
                "vedic": {
                    "highlights": [
                        {"label": "Nakshatra", "value": "Rohini"},
                    ]
                },
            }
        }
        chart = extract_chart_data(reading)
        assert chart["sun"] == "Gemini"
        assert chart["moon"] == "Pisces"
        assert chart["rising"] == "Libra"
        assert chart["chinese"] == "Earth Goat"
        assert chart["day_master"] == "Water (Gui)"
        assert chart["life_path"] == "5"
        assert chart["nakshatra"] == "Rohini"

    def test_missing_systems_returns_empty(self):
        chart = extract_chart_data({})
        assert chart["sun"] is None
        assert chart["moon"] is None
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd Y:/Astrology_App && PYTHONPATH="$PWD" .venv/Scripts/python.exe -m pytest tests/test_oracle.py -v`
Expected: ImportError — `oracle` module doesn't exist

- [ ] **Step 3: Implement question classifier and chart extractor**

```python
# backend/engines/oracle.py
"""Poetic oracle engine — classifies questions, extracts chart data, composes mystical responses."""
from __future__ import annotations

import hashlib
from typing import Any


# ---------------------------------------------------------------------------
# Question classification
# ---------------------------------------------------------------------------
AREA_KEYWORDS: dict[str, set[str]] = {
    "love": {"love", "relationship", "partner", "dating", "marriage", "romance", "heart",
             "soulmate", "crush", "text", "ex", "boyfriend", "girlfriend", "wife", "husband",
             "feelings", "attraction", "romantic", "chemistry", "him", "her", "them"},
    "career": {"career", "work", "job", "promotion", "boss", "business", "professional",
               "interview", "project", "colleague", "office", "hire", "fired", "raise",
               "success", "freelance", "quit", "resign"},
    "health": {"health", "body", "exercise", "sick", "energy", "sleep", "diet", "stress",
               "anxiety", "wellness", "tired", "pain", "healing", "recovery", "medical",
               "weight", "fitness"},
    "wealth": {"money", "wealth", "invest", "financial", "savings", "budget", "rich", "income",
               "spend", "buy", "afford", "debt", "loan", "fortune", "abundance", "prosperity",
               "rent", "house", "apartment"},
    "mood": {"mood", "happy", "sad", "feel", "emotion", "vibe", "spirit", "mental", "joy",
             "depression", "motivation", "inspired", "creative", "purpose", "meaning",
             "direction", "lost", "confused", "peace"},
}

YES_NO_STARTERS = {"should", "will", "can", "is", "am", "do", "does", "would", "could", "are"}
TIMING_STARTERS = {"when", "how long", "how soon"}


def classify_question(question: str) -> dict[str, Any]:
    """Classify a question into type (yes_no/open/timing) and matched life areas."""
    q = question.lower().strip().rstrip("?!.")
    words = set(q.replace("?", "").replace("!", "").replace(".", "").replace(",", "").split())
    first_word = q.split()[0] if q.split() else ""

    # Determine question type
    if any(q.startswith(ts) for ts in TIMING_STARTERS):
        q_type = "timing"
    elif first_word in YES_NO_STARTERS:
        q_type = "yes_no"
    else:
        q_type = "open"

    # Match areas
    matched: list[str] = []
    for area, keywords in AREA_KEYWORDS.items():
        if words & keywords:
            matched.append(area)
    if not matched:
        matched = ["mood", "career"]

    return {"type": q_type, "areas": matched}


# ---------------------------------------------------------------------------
# Chart data extraction
# ---------------------------------------------------------------------------
def _find_highlight(systems: dict, sys_id: str, *patterns: str) -> str | None:
    """Search a system's highlights for a matching label pattern."""
    hl = systems.get(sys_id, {}).get("highlights", [])
    for h in hl:
        lb = h.get("label", "").lower()
        if any(p in lb for p in patterns):
            return str(h.get("value", ""))
    return None


def extract_chart_data(reading: dict) -> dict[str, str | None]:
    """Pull key chart placements from the full reading data."""
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd Y:/Astrology_App && PYTHONPATH="$PWD" .venv/Scripts/python.exe -m pytest tests/test_oracle.py -v`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add backend/engines/oracle.py tests/test_oracle.py
git commit -m "feat(oracle): add question classifier and chart data extractor"
```

---

### Task 2: Oracle engine — poetic response composer

**Files:**
- Modify: `backend/engines/oracle.py`
- Modify: `tests/test_oracle.py`

- [ ] **Step 1: Write failing tests for response composition**

Append to `tests/test_oracle.py`:

```python
from backend.engines.oracle import compose_response


class TestComposeResponse:
    SAMPLE_READING = {
        "systems": {
            "western": {
                "highlights": [
                    {"label": "Sun sign", "value": "Gemini"},
                    {"label": "Moon sign", "value": "Pisces"},
                ]
            },
            "chinese": {"highlights": [{"label": "Animal sign", "value": "Earth Goat"}]},
            "bazi": {"highlights": [{"label": "Day Master", "value": "Water (Gui)"}]},
            "numerology": {"highlights": [{"label": "Life Path", "value": "5"}]},
            "vedic": {"highlights": [{"label": "Nakshatra", "value": "Rohini"}]},
        },
        "combined": {
            "probabilities": {
                "love": {
                    "value": 72, "sentiment": "positive", "confidence": 75,
                    "agreeing_systems": ["Western", "Vedic", "BaZi", "Chinese", "Numerology", "Persian"],
                },
                "career": {
                    "value": 45, "sentiment": "mixed", "confidence": 50,
                    "agreeing_systems": ["Western", "Vedic", "BaZi", "Kabbalistic"],
                },
                "health": {
                    "value": 38, "sentiment": "challenging", "confidence": 62,
                    "agreeing_systems": ["Western", "Vedic", "BaZi", "Chinese", "Numerology"],
                },
            }
        }
    }

    def test_returns_string(self):
        result = compose_response("Should I text him?", self.SAMPLE_READING)
        assert isinstance(result["answer"], str)
        assert len(result["answer"]) > 50

    def test_returns_areas(self):
        result = compose_response("Should I text him?", self.SAMPLE_READING)
        assert "love" in result["areas"]

    def test_includes_chart_reference(self):
        result = compose_response("Tell me about my love life", self.SAMPLE_READING)
        answer = result["answer"]
        # Should reference at least one chart placement
        has_ref = any(term in answer for term in ["Gemini", "Pisces", "Goat", "Water", "Rohini"])
        assert has_ref, f"No chart reference found in: {answer}"

    def test_uses_mystical_framing(self):
        result = compose_response("Will I find love?", self.SAMPLE_READING)
        answer = result["answer"].lower()
        # Should NOT contain raw percentages or clinical language
        assert "72%" not in answer
        assert "probability" not in answer

    def test_returns_evidence(self):
        result = compose_response("Should I take the job?", self.SAMPLE_READING)
        assert "evidence" in result
        assert isinstance(result["evidence"], list)

    def test_empty_reading_still_responds(self):
        result = compose_response("Will things get better?", {})
        assert isinstance(result["answer"], str)
        assert len(result["answer"]) > 30

    def test_different_questions_get_different_answers(self):
        r1 = compose_response("Should I take the job?", self.SAMPLE_READING)
        r2 = compose_response("Will I find love?", self.SAMPLE_READING)
        assert r1["answer"] != r2["answer"]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd Y:/Astrology_App && PYTHONPATH="$PWD" .venv/Scripts/python.exe -m pytest tests/test_oracle.py::TestComposeResponse -v`
Expected: ImportError — `compose_response` not defined

- [ ] **Step 3: Implement poetic response templates and composer**

Add to `backend/engines/oracle.py`:

```python
# ---------------------------------------------------------------------------
# Poetic template system
# ---------------------------------------------------------------------------
def _hash_seed(text: str) -> int:
    """Deterministic seed from text for varied but reproducible template selection."""
    return int(hashlib.md5(text.encode()).hexdigest()[:8], 16)


OPENINGS: dict[tuple[str, str], list[str]] = {
    ("yes_no", "positive"): [
        "The celestial currents speak with quiet certainty.",
        "The stars align in your favor — their answer is clear.",
        "The cosmos leans toward yes, and the evidence is written across your chart.",
    ],
    ("yes_no", "mixed"): [
        "The heavens hold their breath — the answer is neither simple nor final.",
        "The stars offer no easy verdict, only wisdom for the willing.",
        "The cosmic scales hover in delicate balance.",
    ],
    ("yes_no", "challenging"): [
        "The celestial currents urge patience, not retreat.",
        "The stars counsel waiting — not because the answer is no, but because the timing is unripe.",
        "The cosmos whispers: not yet. And 'not yet' is not 'never.'",
    ],
    ("open", "positive"): [
        "The cosmic tapestry weaves a luminous thread through this part of your life.",
        "The stars see warmth and momentum where you are looking.",
        "The celestial picture here is rich with promise.",
    ],
    ("open", "mixed"): [
        "The starlight here is filtered — present, but diffused.",
        "The cosmos reveals a landscape of nuance, not certainty.",
        "The heavens show movement, but the path curves where you cannot yet see.",
    ],
    ("open", "challenging"): [
        "The stars see a passage, not a dead end — but the passage is narrow.",
        "The cosmos asks you to be still before it reveals the way forward.",
        "The celestial patterns here are complex, and complexity demands patience.",
    ],
    ("timing", "positive"): [
        "The celestial clock ticks in your favor — the rhythm is building.",
        "Time is your ally here. The cosmic currents are accelerating.",
        "The stars sense proximity — what you seek moves toward you.",
    ],
    ("timing", "mixed"): [
        "The cosmic timing is in flux — the moment has not yet crystallized.",
        "The heavens speak of seasons, not deadlines. This answer unfolds slowly.",
        "Time bends strangely here. The stars see movement, but not when it arrives.",
    ],
    ("timing", "challenging"): [
        "The celestial rhythms ask for patience. What you want requires its own season.",
        "The stars do not refuse — they delay. And their delays carry wisdom.",
        "The cosmic clock moves differently than the one on your wall.",
    ],
}

AREA_BODIES: dict[tuple[str, str], list[str]] = {
    ("love", "positive"): [
        "The energy flowing through your heart space is warm and magnetic. Connection deepens where you allow vulnerability.",
        "Love moves like a river in your chart — steady, nourishing, drawing what belongs to you closer.",
        "Your emotional field is radiant. Those who matter can feel it, even across distance.",
    ],
    ("love", "mixed"): [
        "The heart asks for honesty more than certainty right now. What feels unclear will sharpen with patience.",
        "Love is present but asks to be met halfway. The cosmos cannot do the reaching for you.",
        "The romantic currents carry both warmth and caution. Feel deeply, but choose wisely.",
    ],
    ("love", "challenging"): [
        "The heart needs tending more than searching right now. Turn the love inward before sending it outward.",
        "The emotional weather is turbulent — not dangerous, but demanding of stillness.",
        "Love is not absent. It is waiting for you to clear the space where it can land.",
    ],
    ("career", "positive"): [
        "Your professional energy carries real momentum. The work you do now echoes forward.",
        "The career currents are strong and swift. Trust your instincts — they are calibrated well.",
        "Ambition and alignment meet in your chart. What you build now has lasting foundations.",
    ],
    ("career", "mixed"): [
        "The professional landscape is shifting — not collapsing, but rearranging. Stay alert to opportunities in unexpected corners.",
        "Your career path is at a crossroads, and the cosmos does not choose for you. It illuminates the options.",
        "Work energy is present but scattered. Focus on one thing deeply rather than many things lightly.",
    ],
    ("career", "challenging"): [
        "The professional winds blow against you — not to stop you, but to test your direction. If this path still calls after resistance, it is yours.",
        "The career sky is overcast. This is not failure; it is the darkness before clarity arrives.",
        "Your professional energy needs rest and recalibration. Pushing harder is not the answer the stars give.",
    ],
    ("health", "positive"): [
        "Your vitality runs strong. The body and spirit move in concert, each feeding the other.",
        "The health currents are clean and nourishing. This is a time to build, to move, to invest in your physical self.",
        "Energy is abundant in your chart. Use it — but use it wisely, for abundance is not infinite.",
    ],
    ("health", "mixed"): [
        "The body speaks in whispers before it shouts. The stars say: listen now, while the message is gentle.",
        "Your health is stable but not thriving. Small, consistent changes carry more power than dramatic ones.",
        "The vitality chart shows both strength and strain. Balance is not found; it is practiced daily.",
    ],
    ("health", "challenging"): [
        "Your vitality chart reads like a candle burning at both ends — bright, but finite. Honor the body that carries you.",
        "Rest is not retreat. The stars see a body that needs tending, a spirit that needs stillness.",
        "The cosmos urges gentleness with yourself. What feels like slowing down is actually healing.",
    ],
    ("wealth", "positive"): [
        "The financial currents carry warmth. Abundance is not arriving — it is already here, waiting to be noticed.",
        "Your material path is blessed with momentum. Trust your instincts on the decisions ahead.",
        "Prosperity flows where attention goes. Your chart says: the soil is fertile. Plant.",
    ],
    ("wealth", "mixed"): [
        "The financial picture is nuanced — neither feast nor famine, but a season of careful cultivation.",
        "Money energy is present but asks for discipline over impulse. The cosmos rewards patience here.",
        "Your wealth path winds rather than runs straight. Each turn reveals something the last one hid.",
    ],
    ("wealth", "challenging"): [
        "The material currents ask for restraint. This is a season of conservation, not expansion.",
        "Financial pressure is temporary — the stars see it lifting, but not today. Hold steady.",
        "Abundance is not denied; it is delayed. Use this pause to clarify what wealth truly means to you.",
    ],
    ("mood", "positive"): [
        "Your inner landscape is luminous. Joy is not arriving from outside — it is rising from within.",
        "The emotional compass points true. Trust what you feel, even when you cannot explain it.",
        "Your spirit is aligned with the cosmic rhythm. This clarity is rare — savor it.",
    ],
    ("mood", "mixed"): [
        "The inner weather shifts between light and shadow. Both are necessary; both will pass.",
        "Your emotional landscape is complex — not troubled, but layered. Sit with it rather than solving it.",
        "The spirit asks for presence more than answers right now. Be where you are.",
    ],
    ("mood", "challenging"): [
        "The inner skies are heavy, but heavy skies bring rain, and rain brings growth.",
        "What you feel is real, but it is not permanent. The stars see this weather breaking.",
        "Darkness is not the absence of light — it is the soil where the next light grows.",
    ],
}

CHART_REFS: dict[str, list[str]] = {
    "sun": [
        "As a {value} Sun, this resonates with the core of who you are.",
        "Your {value} Sun brings its own gravity to this question — trust its pull.",
        "The {value} Sun in your chart illuminates this from a particular angle that is uniquely yours.",
    ],
    "moon": [
        "Your {value} Moon feels this question deeply, beneath the surface of logic.",
        "With your Moon in {value}, the emotional undertow here is powerful and true.",
        "The {value} Moon whispers what your mind may not yet admit.",
    ],
    "chinese": [
        "Your {value} year energy adds an ancient dimension — patient, grounded, seeing the longer arc.",
        "The {value} in your chart carries wisdom from an older tradition, and it says: trust the cycle.",
    ],
    "day_master": [
        "Your Day Master — {value} — shapes how you move through this. Honor its nature.",
        "As a {value} Day Master, your element flows through this question like water through stone: slowly, but surely.",
    ],
    "nakshatra": [
        "Your Vedic nakshatra {value} speaks of destiny patterns that echo through this very question.",
        "In the Vedic sky, {value} holds the key — its lunar mansion illuminates what others miss.",
    ],
    "life_path": [
        "Life Path {value} carries a specific frequency here — one that the numbers do not lie about.",
        "Your numerological path — {value} — resonates with this question in ways that go beyond coincidence.",
    ],
}

CLOSINGS: dict[str, list[str]] = {
    "positive": [
        "Trust the current. It knows where to take you.",
        "The path is lit. Walk it.",
        "What the stars confirm, your heart already knew.",
    ],
    "mixed": [
        "Sit with the uncertainty. It is not your enemy — it is your teacher.",
        "The answer will arrive. But not on your schedule — on the cosmos's.",
        "Hold the question loosely. The tighter you grip, the less you see.",
    ],
    "challenging": [
        "Patience is not passive. It is the quiet strength the stars ask of you now.",
        "What feels like stillness is actually preparation. Trust the process.",
        "The darkest sky reveals the most stars. Look up.",
    ],
}

AGREEMENT_PHRASES = {
    1: "a single ancient voice speaks clearly",
    2: "two celestial traditions align",
    3: "three ancient voices speak in unison",
    4: "four traditions echo the same truth",
    5: "five of eight celestial traditions whisper the same truth",
    6: "six cosmic systems converge — a powerful consensus",
    7: "seven of eight traditions speak as one — a rare alignment",
    8: "all eight celestial traditions align — an extraordinary consensus",
}

FALLBACK_RESPONSE = (
    "The cosmos holds many possibilities, and your question touches something deep. "
    "Your chart shows a period of transition and quiet growth — the kind that happens "
    "beneath the surface before it blooms. Stay present. Trust the unfolding. "
    "The answers you seek are already moving toward you."
)


def _pick(templates: list[str], seed: int) -> str:
    """Pick a template using a deterministic seed."""
    return templates[seed % len(templates)] if templates else ""


def _simplify_sentiment(sentiment: str) -> str:
    """Collapse 5-tier sentiment to 3 for template lookup."""
    if sentiment in ("strong positive", "positive"):
        return "positive"
    if sentiment == "mixed":
        return "mixed"
    return "challenging"


def compose_response(question: str, reading: dict) -> dict[str, Any]:
    """Compose a poetic oracle response from question + reading data."""
    seed = _hash_seed(question)
    classified = classify_question(question)
    q_type = classified["type"]
    areas = classified["areas"]
    chart = extract_chart_data(reading)
    combined = reading.get("combined", {})
    probs = combined.get("probabilities", {})

    # Get primary area info
    primary_area = areas[0] if areas else "mood"
    area_info = probs.get(primary_area, {})
    sentiment_raw = area_info.get("sentiment", "mixed")
    sentiment = _simplify_sentiment(sentiment_raw)
    agreeing = area_info.get("agreeing_systems", [])
    num_agreeing = len(agreeing)

    # Build evidence list
    evidence: list[dict[str, Any]] = []
    for area in areas[:2]:
        info = probs.get(area, {})
        if info:
            evidence.append({
                "area": area,
                "sentiment": info.get("sentiment", "mixed"),
                "agreeing": len(info.get("agreeing_systems", [])),
            })

    # No reading data — return fallback
    if not probs:
        return {"answer": FALLBACK_RESPONSE, "areas": areas, "evidence": []}

    # Compose response from template parts
    parts: list[str] = []

    # 1. Opening
    opening_key = (q_type, sentiment)
    openings = OPENINGS.get(opening_key, OPENINGS.get(("open", sentiment), [""]))
    parts.append(_pick(openings, seed))

    # 2. Agreement phrase
    if num_agreeing > 0:
        phrase = AGREEMENT_PHRASES.get(num_agreeing, f"{num_agreeing} systems align")
        parts.append(f"Across your chart, {phrase}.")

    # 3. Area body
    body_key = (primary_area, sentiment)
    bodies = AREA_BODIES.get(body_key, [])
    if bodies:
        parts.append(_pick(bodies, seed + 1))

    # 4. Second area if present
    if len(areas) > 1:
        second_area = areas[1]
        second_info = probs.get(second_area, {})
        second_sentiment = _simplify_sentiment(second_info.get("sentiment", "mixed"))
        second_bodies = AREA_BODIES.get((second_area, second_sentiment), [])
        if second_bodies:
            parts.append(_pick(second_bodies, seed + 2))

    # 5. Chart-specific reference (pick the most interesting available)
    chart_priority = ["sun", "moon", "day_master", "chinese", "nakshatra", "life_path"]
    for key in chart_priority:
        value = chart.get(key)
        if value and key in CHART_REFS:
            ref = _pick(CHART_REFS[key], seed + 3)
            parts.append(ref.format(value=value))
            break

    # 6. Closing
    closings = CLOSINGS.get(sentiment, CLOSINGS["mixed"])
    parts.append(_pick(closings, seed + 4))

    answer = " ".join(parts)
    return {"answer": answer, "areas": areas[:2], "evidence": evidence}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd Y:/Astrology_App && PYTHONPATH="$PWD" .venv/Scripts/python.exe -m pytest tests/test_oracle.py -v`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add backend/engines/oracle.py tests/test_oracle.py
git commit -m "feat(oracle): add poetic response composer with template system"
```

---

### Task 3: Wire oracle engine to /api/ask endpoint

**Files:**
- Modify: `backend/main.py:89-156` (replace entire `ask_stars` function)

- [ ] **Step 1: Write failing test for the endpoint**

Append to `tests/test_oracle.py`:

```python
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


class TestAskEndpoint:
    def test_ask_returns_200(self):
        resp = client.post("/api/ask", json={
            "question": "Will I find love?",
            "reading_data": TestComposeResponse.SAMPLE_READING,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "answer" in data
        assert "areas" in data
        assert "evidence" in data

    def test_ask_empty_question_still_works(self):
        resp = client.post("/api/ask", json={
            "question": "hmm",
            "reading_data": {},
        })
        assert resp.status_code == 200
        assert len(resp.json()["answer"]) > 20
```

- [ ] **Step 2: Run to verify current behavior (may pass or fail depending on response shape)**

Run: `cd Y:/Astrology_App && PYTHONPATH="$PWD" .venv/Scripts/python.exe -m pytest tests/test_oracle.py::TestAskEndpoint -v`

- [ ] **Step 3: Rewire the endpoint**

Replace the `ask_stars` function in `backend/main.py` (lines 89-156):

```python
from backend.engines.oracle import compose_response as oracle_compose

@app.post("/api/ask")
def ask_stars(payload: AskRequest) -> dict[str, Any]:
    return oracle_compose(payload.question, payload.reading_data)
```

Remove the old keyword matching code and all area_keywords/parts logic.

- [ ] **Step 4: Run all tests**

Run: `cd Y:/Astrology_App && PYTHONPATH="$PWD" .venv/Scripts/python.exe -m pytest tests/ -v`
Expected: All tests pass (existing test_fixes.py + new test_oracle.py)

- [ ] **Step 5: Commit**

```bash
git add backend/main.py tests/test_oracle.py
git commit -m "feat(api): rewire /api/ask to use oracle engine"
```

---

## Chunk 2: Frontend — Oracle Screen + Navigation + Animations

### Task 4: Add Oracle screen and update navigation

**Files:**
- Modify: `frontend/src/App.jsx`

This is a single-file SPA so all changes go into App.jsx. The changes are:

1. Add `IconOracle` SVG component (crystal ball)
2. Add `OracleScreen` component with:
   - Full-screen layout with floating particles (CSS keyframe, 15-20 dots)
   - Centered prompt text in Playfair Display
   - Text input with gradient border
   - "Ask the Stars" gold button
   - On submit: dramatic reveal (input fades, orb pulses 2.5s, answer fades in line-by-line)
   - Answer card with question echoed above
   - "The Celestial Evidence" expandable section with colored sentiment dots
   - "Ask Another" + "Share" buttons
   - Session history of previous Q&As
3. Update `BottomNav` to 5 tabs: Oracle | Home | Systems | Combined | You
4. Update `App` component: default tab changes from `'home'` to `'oracle'`
5. Remove "Ask the Stars" section from `HomeContent`

- [ ] **Step 1: Add IconOracle SVG component**

After the existing `IconSend` function (~line 228), add:

```jsx
function IconOracle({ active }) {
  const c = active ? 'var(--gold)' : 'var(--muted)';
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="7"/><path d="M8.5 20h7"/><path d="M9.5 18h5"/><path d="M9 14c0 0 1 2 3 2s3-2 3-2"/><circle cx="12" cy="10" r="3" fill={active ? 'rgba(212,165,116,.2)' : 'none'} stroke="none"/></svg>;
}
```

- [ ] **Step 2: Add OracleScreen component**

After the `LoadingOverlay` component, add the new `OracleScreen` component. It needs:
- State: `question`, `answer`, `loading`, `revealing`, `history` array
- Particle background (20 floating dots via CSS)
- Input area that fades out during reveal
- Reveal sequence: 2.5s orb pulse, then answer fades in
- Answer split into sentences, each with stagger delay
- "Celestial Evidence" section with colored dots per system vote
- "Ask Another" resets, "Share" copies to clipboard
- History stack below

```jsx
function OracleScreen({ result }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [history, setHistory] = useState([]);

  async function handleAsk() {
    if (!question.trim() || loading || revealing) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, reading_data: result }),
      });
      const data = await res.json();
      if (res.ok && data.answer) {
        setLoading(false);
        setRevealing(true);
        setTimeout(() => {
          setAnswer(data);
          setHistory(h => [{ q: question, a: data.answer, areas: data.areas, evidence: data.evidence }, ...h]);
          setRevealing(false);
        }, 2500);
      } else {
        setAnswer({ answer: 'The stars are veiled tonight. Ask again when the clouds part.', areas: [], evidence: [] });
        setLoading(false);
      }
    } catch {
      setAnswer({ answer: 'The celestial connection falters. Try once more.', areas: [], evidence: [] });
      setLoading(false);
    }
  }

  function handleReset() {
    setQuestion('');
    setAnswer(null);
  }

  function handleShare() {
    if (answer?.answer) {
      try { navigator.clipboard.writeText(`"${question}"\n\n${answer.answer}\n\n— All Star Astrology`); } catch {}
    }
  }

  const sentences = answer?.answer ? answer.answer.match(/[^.!?]+[.!?]+/g) || [answer.answer] : [];

  return (
    <div className="oracle-screen">
      {/* Particles */}
      <div className="oracle-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="oracle-particle" style={{
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            animationDelay: `${(i * 0.7) % 5}s`,
            animationDuration: `${4 + (i % 3)}s`,
            width: `${1.5 + (i % 3)}px`,
            height: `${1.5 + (i % 3)}px`,
          }} />
        ))}
      </div>

      {/* Orb */}
      <div className={`oracle-orb ${revealing ? 'oracle-orb--active' : ''}`} />

      {/* Input area — hidden when answer showing */}
      {!answer && !revealing && (
        <div className={`oracle-input-area ${loading ? 'oracle-input-area--loading' : ''} fade-in`}>
          <p className="oracle-prompt serif">Speak your question into the cosmos\u2026</p>
          <div className="oracle-input-wrap">
            <input
              type="text"
              className="oracle-input"
              placeholder="Ask anything\u2026"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              disabled={loading}
            />
          </div>
          <button className="btn-gold oracle-cta" onClick={handleAsk} disabled={loading || !question.trim()}>
            {loading ? 'Consulting the stars\u2026' : 'Ask the Stars'}
          </button>
        </div>
      )}

      {/* Reveal phase */}
      {revealing && (
        <div className="oracle-revealing fade-in">
          <p className="oracle-reveal-text serif">The stars are speaking\u2026</p>
        </div>
      )}

      {/* Answer */}
      {answer && !revealing && (
        <div className="oracle-answer-area fade-in">
          <p className="oracle-q-echo">\u201c{question}\u201d</p>
          <div className="oracle-answer-text">
            {sentences.map((s, i) => (
              <span key={i} className="oracle-sentence" style={{ animationDelay: `${i * 0.15}s` }}>
                {s.trim()}{' '}
              </span>
            ))}
          </div>

          {answer.evidence?.length > 0 && (
            <Accordion title="The Celestial Evidence">
              <div className="oracle-evidence">
                {answer.evidence.map((e, i) => (
                  <div key={i} className="oracle-ev-row">
                    <span className="oracle-ev-area">{e.area}</span>
                    <span className={`oracle-ev-dot oracle-ev-dot--${e.sentiment?.includes('positive') ? 'positive' : e.sentiment === 'mixed' ? 'mixed' : 'challenging'}`} />
                    <span className="oracle-ev-agree">{e.agreeing} of 8 align</span>
                  </div>
                ))}
              </div>
            </Accordion>
          )}

          <div className="oracle-actions">
            <button className="btn-gold" onClick={handleReset}>Ask Another</button>
            <button className="btn-ghost oracle-share" onClick={handleShare}>Share</button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && !revealing && answer && (
        <div className="oracle-history">
          <h4 className="oracle-history-title serif">Previous Questions</h4>
          {history.slice(1).map((h, i) => (
            <div key={i} className="oracle-history-item glass">
              <p className="oracle-hq">\u201c{h.q}\u201d</p>
              <p className="oracle-ha">{h.a.length > 120 ? h.a.slice(0, 120) + '\u2026' : h.a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update BottomNav — add Oracle as first tab**

Change `BottomNav` tabs array to:

```jsx
const tabs = [
  { id: 'oracle', label: 'Oracle', Icon: IconOracle },
  { id: 'home', label: 'Home', Icon: IconHome },
  { id: 'systems', label: 'Systems', Icon: IconGrid },
  { id: 'combined', label: 'Combined', Icon: IconStar },
  { id: 'you', label: 'You', Icon: IconUser },
];
```

- [ ] **Step 4: Update App component — default tab + routing**

In `App()`:
1. Change default tab: `const [tab, setTab] = useState('oracle');`
2. After `handleGenerate`: change `setTab('home')` to `setTab('oracle')`
3. Add oracle to the tab routing in the JSX:

```jsx
{detailSystem ? <SystemDetail data={detailData} onBack={() => setDetailSystem(null)} />
: tab === 'oracle' ? <OracleScreen result={result} />
: tab === 'home' ? <HomeContent result={result} form={form} onTabChange={handleTab} />
: tab === 'systems' ? <SystemsContent result={result} onSystemTap={setDetailSystem} />
: tab === 'combined' ? <CombinedContent data={result?.combined} />
: tab === 'you' ? <ProfileContent form={form} result={result} onEdit={handleEdit} onReset={handleReset} theme={theme} setTheme={setTheme} />
: null}
```

- [ ] **Step 5: Remove "Ask the Stars" section from HomeContent**

Delete the entire `{/* ASK THE STARS */}` section (lines ~611-627) from `HomeContent`. Also remove the `askQ`, `askA`, `askLoading` state variables and the `handleAsk` function from `HomeContent` since that's now handled by `OracleScreen`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(frontend): add Oracle screen as default tab, remove Ask from Home"
```

---

### Task 5: Oracle CSS + animations

**Files:**
- Modify: `frontend/src/App.jsx` (styles constant at bottom)

- [ ] **Step 1: Add Oracle screen CSS to the styles constant**

Append before the closing backtick of the `styles` constant:

```css
/* ── Oracle Screen ── */
.oracle-screen {
  min-height: calc(100vh - var(--nav-h));
  min-height: calc(100dvh - var(--nav-h));
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 24px 28px 32px; position: relative; overflow: hidden;
}
.oracle-particles { position: absolute; inset: 0; pointer-events: none; }
.oracle-particle {
  position: absolute; border-radius: 50%; background: var(--gold); opacity: 0;
  animation: oracleDrift ease-in-out infinite;
}
@keyframes oracleDrift {
  0%, 100% { opacity: .15; transform: translate(0, 0) scale(1); }
  25% { opacity: .5; transform: translate(3px, -5px) scale(1.2); }
  50% { opacity: .3; transform: translate(-2px, 4px) scale(1); }
  75% { opacity: .6; transform: translate(4px, 2px) scale(1.3); }
}
.oracle-orb {
  width: 60px; height: 60px; border-radius: 50%; position: relative; z-index: 1; margin-bottom: 32px;
  background: radial-gradient(circle, rgba(212,165,116,.15), rgba(123,140,222,.05));
  animation: orbPulse 5s ease-in-out infinite;
  transition: all .5s ease;
}
.oracle-orb--active {
  width: 100px; height: 100px;
  background: radial-gradient(circle, rgba(212,165,116,.35), rgba(123,140,222,.15));
  animation: orbPulse 1.2s ease-in-out infinite;
}
.oracle-input-area {
  display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%;
  max-width: 360px; position: relative; z-index: 1; transition: opacity .4s ease;
}
.oracle-input-area--loading { opacity: .5; pointer-events: none; }
.oracle-prompt { color: var(--muted); font-size: 1.15rem; text-align: center; line-height: 1.5; }
.oracle-input-wrap {
  width: 100%; position: relative; border-radius: 16px; padding: 1px;
  background: linear-gradient(135deg, var(--gold), var(--accent));
}
.oracle-input {
  width: 100%; min-height: 52px; background: var(--bg); color: var(--text);
  border: none; border-radius: 15px; padding: 14px 18px; font-size: 1.05rem; outline: none;
  text-align: center; font-family: var(--sans);
}
.oracle-input::placeholder { color: var(--muted); text-align: center; }
.oracle-cta { max-width: 280px; }
.oracle-revealing { display: flex; align-items: center; justify-content: center; position: relative; z-index: 1; }
.oracle-reveal-text { color: var(--muted); font-size: 1.1rem; font-style: italic; animation: msgFade .5s ease both; }
.oracle-answer-area {
  display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 400px;
  position: relative; z-index: 1;
}
.oracle-q-echo { color: var(--muted); font-size: .85rem; text-align: center; font-style: italic; }
.oracle-answer-text { color: var(--text); font-size: 1rem; line-height: 1.75; text-align: center; font-family: var(--serif); }
@keyframes sentenceReveal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.oracle-sentence { display: inline; animation: sentenceReveal .4s ease both; }
.oracle-actions { display: flex; gap: 12px; }
.oracle-actions .btn-gold { flex: 1; }
.oracle-share { flex: 0; min-width: 80px; }
.oracle-evidence { display: flex; flex-direction: column; gap: 8px; }
.oracle-ev-row { display: flex; align-items: center; gap: 10px; font-size: .88rem; }
.oracle-ev-area { text-transform: capitalize; font-weight: 600; min-width: 60px; }
.oracle-ev-dot { width: 10px; height: 10px; border-radius: 50%; }
.oracle-ev-dot--positive { background: #4ADE80; }
.oracle-ev-dot--mixed { background: #FBBF24; }
.oracle-ev-dot--challenging { background: #F87171; }
.oracle-ev-agree { color: var(--muted); font-size: .82rem; }
.oracle-history { width: 100%; max-width: 400px; margin-top: 32px; position: relative; z-index: 1; }
.oracle-history-title { font-size: .95rem; color: var(--muted); margin-bottom: 12px; text-align: center; }
.oracle-history-item { border-radius: 14px; padding: 14px; margin-bottom: 8px; }
.oracle-hq { font-size: .82rem; color: var(--muted); font-style: italic; margin-bottom: 6px; }
.oracle-ha { font-size: .85rem; color: var(--text); line-height: 1.5; opacity: .7; }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(frontend): add Oracle screen CSS with particles and reveal animations"
```

---

### Task 6: Subtle animations across the app

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Add breathing animation to system detail icons**

In the `SystemDetail` component, add a className to the system icon. First, in the component's render, the headline area can show the system icon with animation. Add to the detail-hd rendering, or more practically, add animated system icons on the system grid tiles.

In the CSS `styles` constant, add:

```css
/* ── Subtle app animations ── */
@keyframes iconBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
@keyframes twinkle { 0%, 100% { opacity: .4; } 50% { opacity: .9; } }
@keyframes gradientRotate { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

.sys-tile-icon { animation: iconBreathe 3s ease-in-out infinite; }
.sys-tile:nth-child(odd) .sys-tile-icon { animation-delay: 0.5s; }
.sys-tile:nth-child(even) .sys-tile-icon { animation-delay: 1.2s; }

.sys-tile::after { animation: twinkle 4s ease-in-out infinite; }
.sys-tile:nth-child(2)::after { animation-delay: 0.7s; }
.sys-tile:nth-child(3)::after { animation-delay: 1.4s; }
.sys-tile:nth-child(4)::after { animation-delay: 0.3s; }
.sys-tile:nth-child(5)::after { animation-delay: 1.8s; }
.sys-tile:nth-child(6)::after { animation-delay: 0.9s; }
.sys-tile:nth-child(7)::after { animation-delay: 1.6s; }
.sys-tile:nth-child(8)::after { animation-delay: 0.5s; }

.cosmic-msg::before { background-size: 200% 200%; animation: gradientRotate 6s ease infinite; }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(frontend): add subtle breathing and twinkle animations across app"
```

---

### Task 7: Build + deploy

- [ ] **Step 1: Run all backend tests**

```bash
cd Y:/Astrology_App && PYTHONPATH="$PWD" .venv/Scripts/python.exe -m pytest tests/ -v
```
Expected: All tests pass

- [ ] **Step 2: Build frontend**

```bash
cd Y:/Astrology_App/frontend && npm run build
```

- [ ] **Step 3: Sync + build APK + install**

```bash
cd Y:/Astrology_App/frontend && npx cap sync android
cd android && export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk" JAVA_HOME="Y:/android_studio/jbr" && ./gradlew assembleDebug
ADB="$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe" && "$ADB" install -r app/build/outputs/apk/debug/app-debug.apk
"$ADB" reverse tcp:8892 tcp:8892
```

- [ ] **Step 4: Commit final state**

```bash
git add -A
git commit -m "chore: build and deploy oracle redesign v1.1.0"
```
