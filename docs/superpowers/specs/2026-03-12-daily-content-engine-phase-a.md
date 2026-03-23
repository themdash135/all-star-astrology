# Daily Content Engine Phase A

## Summary
Add a backend-owned Daily Content engine that turns the already-calculated system and combined scores into a short home-screen guidance payload. Phase A is deterministic, local-only, and generated during `POST /api/reading`; it does not introduce scheduling, storage, or external APIs.

## Problem
The Home tab currently invents "today" guidance entirely in the frontend from `combined.probabilities`. That creates two issues:

- The product has no explicit backend daily-content contract.
- Older and newer clients cannot share a stable daily-content shape.

## Goals
- Introduce a dedicated backend engine at `backend/engines/daily.py`.
- Include a `daily` block in the `POST /api/reading` response.
- Make the Home tab prefer backend daily content and fall back gracefully for older cached readings.
- Keep the implementation deterministic for the same user and local day.
- Reuse existing chart/system data only; no new dependencies.

## Non-Goals
- Push notifications
- Persisted daily archives
- Separate `/api/daily` endpoint
- LLM or remote content generation
- Per-hour resynthesis outside the normal reading flow

## Inputs
Phase A consumes:

- `context` from `build_context(...)`
- `systems` from the eight existing engines
- `combined` from `backend/engines/combined.py`

## Output Contract
`POST /api/reading` gains:

```json
{
  "daily": {
    "id": "daily",
    "date": "2026-03-12",
    "date_label": "Thursday, March 12",
    "message": "Love carries the clearest momentum today...",
    "dos": ["...", "...", "..."],
    "donts": ["...", "...", "..."],
    "focus": {
      "area": "love",
      "label": "Love",
      "score": 72,
      "sentiment": "positive",
      "confidence": 63,
      "agreeing_systems": ["Western", "Vedic", "BaZi"],
      "leaders": ["Western", "BaZi", "Vedic"]
    },
    "caution": {
      "area": "health",
      "label": "Health",
      "score": 43,
      "sentiment": "challenging",
      "confidence": 63,
      "agreeing_systems": ["Western", "Vedic", "BaZi"],
      "leaders": ["Chinese", "Numerology", "Kabbalistic"]
    },
    "anchor": {
      "key": "sun",
      "label": "Sun",
      "value": "Gemini"
    }
  }
}
```

## Generation Rules
1. Choose `focus` as the highest combined probability area.
2. Choose `caution` as the lowest combined probability area.
3. Build a short `message` from:
   - focus sentiment
   - number of agreeing systems
   - top contributing systems for the focus area
   - a caution sentence for the weakest area
   - one available chart anchor, prioritized as Sun, Moon, Day Master, Chinese sign, Life Path, Nakshatra, Rising
4. Select exactly three `dos` from the focus-area action bank.
5. Select exactly three `donts` from the caution-area restraint bank.
6. Seed template selection deterministically from birth date, full name, and local date.

## Frontend Consumption
- `frontend/src/components/MainViews.jsx` should prefer `result.daily`.
- If `result.daily` is absent, continue using the old helper-based fallback so previously stored readings still render.

## Verification
- Unit tests for the daily engine
- API test confirming `/api/reading` returns `daily`
- Frontend unit test confirming the Home helper prefers backend `daily`
