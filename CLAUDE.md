# All Star Astrology Reference

## Overview
All Star Astrology is a FastAPI + React/Vite application that generates multi-system astrology readings, a backend-owned daily guidance block, and an Oracle Q&A response grounded in the current reading.

The runtime flow is:

1. Build the frontend into `frontend/dist`.
2. Start FastAPI from `backend/main.py`.
3. Serve API routes under `/api/*` and the built SPA from the same backend on port `8892`.

## Current Navigation
- `Oracle`
- `Home`
- `Systems`
- `Combined`
- `You`

Oracle is the default post-onboarding tab.

## Project Layout

### Backend
- `backend/main.py` - FastAPI app, request validation, API routes, SPA asset serving
- `backend/engines/common.py` - shared date, time, geocoding, ephemeris, numerology, gematria, and snapshot helpers
- `backend/engines/western.py` - tropical natal chart and live transit scoring
- `backend/engines/vedic.py` - sidereal chart, nakshatra, dasha, and gochara scoring
- `backend/engines/chinese.py` - Chinese zodiac, lunar timing, and daily relation scoring
- `backend/engines/bazi.py` - Four Pillars / Day Master / current pillar scoring
- `backend/engines/numerology.py` - life path, personal year/month/day, pinnacles, challenges
- `backend/engines/kabbalistic.py` - sefirot, path, and symbolic cycle scoring
- `backend/engines/gematria.py` - Hebrew/Latin gematria and bridge-number scoring
- `backend/engines/persian.py` - Persian-inspired planetary day, lot, mansion, and temperament scoring
- `backend/engines/combined.py` - weighted consensus across all eight systems
- `backend/engines/oracle.py` - question classification and poetic Oracle response composer
- `backend/engines/daily.py` - Daily Content Engine Phase A for Home-screen guidance

### Frontend
- `frontend/src/App.jsx` - top-level app state, view routing, persisted theme/motion/result state
- `frontend/src/app/constants.js` - storage keys, area definitions, system metadata
- `frontend/src/app/storage.js` - guarded `localStorage` access and migration helpers
- `frontend/src/app/helpers.js` - UI formatting helpers, daily fallback logic, Oracle history helpers
- `frontend/src/app/styles.js` - shared application styles
- `frontend/src/hooks/useMotionMode.js` - reduced-motion preference persistence and resolution
- `frontend/src/components/SplashScreen.jsx` - splash / entry experience
- `frontend/src/components/LoadingOverlay.jsx` - loading overlay
- `frontend/src/components/OnboardingScreen.jsx` - guided birth-data entry flow
- `frontend/src/components/OracleScreen.jsx` - full-screen Oracle experience
- `frontend/src/components/MainViews.jsx` - Home, Systems, Combined, You, and bottom-nav views
- `frontend/src/components/common.jsx` - shared icons, accordion, cards, and toggle controls

### Tests and Docs
- `tests/test_fixes.py` - structural and regression coverage for the original fixes
- `tests/test_api_validation.py` - Pydantic request validation coverage
- `tests/test_daily_content.py` - Daily Content Engine Phase A coverage
- `frontend/src/app/helpers.test.js` - frontend helper tests
- `frontend/src/app/motion.test.js` - motion preference tests
- `docs/superpowers/specs/2026-03-10-oracle-redesign.md` - Oracle redesign spec
- `docs/superpowers/specs/2026-03-12-daily-content-engine-phase-a.md` - Daily Content spec
- `docs/superpowers/plans/2026-03-10-oracle-redesign.md` - Oracle implementation plan
- `docs/superpowers/plans/2026-03-12-daily-content-engine-phase-a.md` - Daily Content implementation plan

## API Contracts

### `POST /api/reading`
Request:

```json
{
  "birth_date": "1990-04-21",
  "birth_time": "14:30",
  "birth_location": "Los Angeles, CA",
  "full_name": "Optional Name",
  "hebrew_name": "Optional Hebrew or transliterated name"
}
```

Response contains:
- `meta` - resolved coordinates, timezone, birth timestamps, calculation timestamp, age
- `systems` - the eight individual system payloads
- `combined` - weighted consensus analysis across the eight systems
- `daily` - Phase A home-screen daily guidance payload with:
  - `date`
  - `date_label`
  - `message`
  - `dos`
  - `donts`
  - `focus`
  - `caution`
  - `anchor`

### `POST /api/ask`
Request:

```json
{
  "question": "Will I find love?",
  "reading_data": {}
}
```

Response contains:
- `answer` - poetic Oracle response
- `areas` - matched life areas
- `evidence` - short evidence rows derived from combined consensus

## Current Behavior Notes
- Request models forbid unexpected fields.
- Text fields are trimmed and length-bounded.
- Oracle `reading_data` is capped to reject oversized payloads.
- The Home tab now prefers backend-generated `result.daily` content and falls back to the legacy frontend heuristic for older cached readings that do not contain a `daily` block.
- Oracle history is persisted locally with dedupe and a cap of `12` items.
- Reduced-motion preference is persisted separately from theme.

## Development Workflow

### Backend
```powershell
$env:PYTHONPATH = "$PWD"
.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8892
```

### Frontend
```powershell
cd frontend
npm run dev
```

Vite proxies `/api` to `http://127.0.0.1:8892` during local dev.

### Mobile / Android
For this workspace, Android builds require both the Android SDK and a Java 11+ runtime:

```powershell
$env:JAVA_HOME = 'Y:\android_studio\jbr'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
```

Then run:

```powershell
cd frontend
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

For emulator or device testing:

```powershell
adb install -r app\build\outputs\apk\debug\app-debug.apk
adb reverse tcp:8892 tcp:8892
```

## Verification State
Verified on **March 12, 2026**:

- `.venv\Scripts\python.exe -m pytest tests -q` -> `56 passed`
- `frontend\npm run test` -> `11 passed`
- `frontend\npm run build` -> passed
- `frontend\npx cap sync android` -> passed
- `frontend\android\gradlew.bat assembleDebug` -> passed when `JAVA_HOME` points to `Y:\android_studio\jbr` and Android SDK env vars are set
- `adb install -r frontend\android\app\build\outputs\apk\debug\app-debug.apk` -> passed on emulator `emulator-5554`
- `adb reverse tcp:8892 tcp:8892` -> passed on emulator `emulator-5554`

## Notes
- The workspace still has no existing `.git` history checked in here, so if you need the original branch/remote workflow restored, that should be handled intentionally rather than by creating a fresh local repo ad hoc.
