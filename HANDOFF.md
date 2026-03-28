# Handoff - 2026-03-26

## Status

The app backend is **live on Google Cloud Run** and the Android release AAB is built and ready for Google Play upload. iOS CI/CD is configured and waiting for 2 remaining secrets.

**Cloud Run URL:** `https://allstar-astrology-816912350023.us-central1.run.app`
- Health check returns `{"status":"ok"}`
- Full end-to-end tested: onboarding → reading generation → all tabs working
- Project: `allstar-astrology-ci` (GCP project ID: `816912350023`)
- Region: `us-central1`, Memory: 1Gi, Port: 8080

**Capacitor config** now points to Cloud Run (no more localhost dependency):
```
server: { url: 'https://allstar-astrology-816912350023.us-central1.run.app' }
```

**Android release AAB** built and signed at:
`frontend/android/app/build/outputs/bundle/release/app-release.aab` (3.8MB)

## Completed Work

- Added the Oracle engine in `backend/engines/oracle.py` and wired `POST /api/ask` in `backend/main.py`.
- Added the Daily Content Engine Phase A in `backend/engines/daily.py` and wired backend-owned `daily` output into `POST /api/reading`.
- Refactored the frontend out of the old single-file structure into shared components, helpers, storage, styles, and a motion hook.
- Merged the old Home experience into `frontend/src/components/OracleScreen.jsx`:
  - Oracle is the primary landing tab after onboarding
  - Home tab was removed
  - Daily guidance now lives on the Oracle screen
  - Cosmic DNA now lives on the Oracle screen
- Updated the Oracle UX:
  - persisted Oracle history with dedupe and cap
  - tappable history entries that reopen prior answers
  - share/copy feedback
  - starter prompt chips
  - clear draft action
  - live character counter
  - retry current question
  - clear history action
  - recent layout cleanup for tighter mobile spacing
- Updated the You tab:
  - Privacy Policy screen
  - Terms of Use screen
  - Manage Subscription screen placeholder
- Hardened API request validation in `backend/main.py`:
  - trims input text
  - bounds request field lengths
  - forbids unexpected extra fields
  - rejects oversized Oracle `reading_data`
- Added frontend tests without new dependencies using Node's built-in test runner.
- Added backend coverage for API validation and Daily Content.
- Added Daily Content spec/plan docs and updated `CLAUDE.md`.
- Fixed the Android local build path by using Java 11+ (`Y:\android_studio\jbr`) and syncing the Capacitor Android project.
- Verified USB-connected device refresh flow using `adb reverse` plus app relaunch.

## Admin Area + UX Fixes (added 2026-03-27)

### Admin Area V1
Built a full internal admin system at 5 pages, accessible via hidden route `#a9fK3x7q`:
- **Health Dashboard** — generation counts (24h/7d), error counts, response times, success rate
- **Quality Monitor** — quality flags (missing sections, short content, fallback detection, repetition), per-session status (healthy/review/poor)
- **Feedback Admin** — view all user feedback tickets, reply inline, filter by category/status
- **Usage Analytics** — event counts, section views, period filtering (24h/7d/30d)
- **Session Inspector** — browse stored readings/compatibility reports, expand sections, view quality flags

**Files:**
- `backend/admin.py` — storage, quality heuristics, health aggregation, analytics, session listing (all file-based JSON/JSONL in `Saved/admin/`)
- `frontend/src/components/Admin*.jsx` — 6 admin components (AdminApp, AdminHealth, AdminQuality, AdminFeedback, AdminAnalytics, AdminSessions)
- `tests/test_admin.py` — 75 backend tests

**Access:** Settings → tap version text 5 times within 4 seconds → enter `BACKEND_API_KEY` at gate. All admin API endpoints require `X-Backend-Key` header.

**Admin API endpoints:**
- `GET /api/admin/health` — health stats
- `GET /api/admin/quality` — quality summary
- `GET /api/admin/analytics` — usage analytics (accepts `?hours=`)
- `GET /api/admin/sessions` — session list (accepts `?type=`, `?limit=`, `?offset=`)
- `GET /api/admin/sessions/{id}` — session detail
- `POST /api/admin/analytics/event` — frontend event tracking (no auth required)

### Onboarding UX Fixes
- **Hospital search** — switched from Photon/Komoot to Google Places API for reliable hospital/location autocomplete. Backend proxy at `GET /api/places/autocomplete?input=` (avoids CORS). API key: `AIzaSyCewcS7wNiDXGyWrjqjkHfyZoY0I3OhzfY` (project: `allstar-astrology-ci`)
- **DOB picker** — replaced native `<input type="date">` with 3 separate Month/Day/Year dropdown selects (fixes Android date picker year selection bug)
- **Birth location heading** — changed to "What hospital were you born in?" with hint text
- **Partner step labels** — added visible labels ("Partner's date of birth", "Partner's birth time (optional)") and hospital accuracy hint above location field
- **Replay protection** — increased from 30s to 120s (`_MAX_REQUEST_AGE_SECONDS`) to handle mobile clock skew

### Feedback Fix
- Removed `mailto:` redirect that opened email client after submission
- Feedback now submits purely via backend API with in-app confirmation
- Added SMTP email notification support (configurable via `FEEDBACK_EMAIL_TO`, `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT` env vars)

### Dependencies Added
- `httpx==0.28.1` in `requirements.txt` (async HTTP client for Google Places proxy)

## Neuro-Symbolic AI Engine (added 2026-03-24)

### Pipeline Architecture (`backend/engines/pipeline/`)
- 5-stage pipeline: IntentClassifier → SystemRouter → SystemAdapters → Aggregator → AnswerComposer
- All 8 astrology systems participate in every question as one unified engine
- Pydantic data contracts enforce `SystemOpinion` shape on every adapter
- `POST /api/ask` now runs through the pipeline (legacy oracle kept for backward compat)

### 8 System Adapters (deep astrological data, expanded 2026-03-24)
- **Western** — planet dignities (7 planets), house domain meanings (12 houses), Venus/Mars/Jupiter/Saturn domain extraction, modality balance, planet conditions from table, natal aspect tension analysis, moon phase, retrograde detection, deep transit interpretation
- **Vedic** — full 27 nakshatra table with domain weights, 7-level graha dignity system, dasha lord domain associations (9 lords × 5 domains), planet-specific gochara favorable houses, lagna lord placement analysis, tithi, yoga, strong yogas extraction
- **BaZi** — Ten God domain meanings (10 gods × 5 domains), symbolic star effects (10 stars), branch interaction effects (clash/combination/harm/destruction), element productive/destructive cycles, luck period (Da Yun) analysis, Na Yin melody, element balance percentages
- **Numerology** — domain-specific number meanings (12 numbers × 5 domains), Expression/Soul Urge/Personality numbers (name-based), harmonic/dissonant pairs, Birthday/Attitude numbers, Universal Year overlay, number harmony analysis
- **Chinese** — San He (Three Harmonies), Liu He (Six Harmonies), Six Clashes, element production/destruction cycles, animal domain strengths (12 animals), month/hour animal analysis, secret friend, full 12-animal compatibility with numeric deltas
- **Kabbalistic** — sefirah domain associations (10 sefirot × 5 domains), pillar balance analysis (Right/Left/Middle), World (Olam) layer mapping, path domain associations (22 paths), Personal Day/Month sefirah from cycle table, path gate themes
- **Gematria** — root domain associations, ordinal root analysis, harmonic/dissonant root pairs, Hebrew letter correspondences, word-level convergence/divergence analysis, root correspondence themes from table
- **Persian** — full 28 lunar mansions with meanings, planet condition effects from table, temperament-domain analysis, lot house domain meanings (12 houses), natal-current mansion comparison, ascendant influence, current Moon/Sun sign

### Astronomical Modules (expanded 2026-03-24)
- `moon_phase.py` — computes phase from Sun/Moon sign+degree, 8 named phases with polarity
- `planetary_hours.py` — Chaldean order planetary hour calculator
- `retrograde.py` — detects Mercury/Venus/Mars/Jupiter/Saturn Rx from engine tables
- `transit_interpreter.py` — 9 transit planets (Saturn/Jupiter/Mars/Venus/Mercury/Uranus/Neptune/Pluto) × 6 natal points, ~25 domain reframes, domain-relevant natal point mapping

### Intelligence Features
- **Domain-aware transit reframing** — Jupiter Trine Venus says "financial expansion" for wealth questions, "romance amplified" for love questions
- **Dynamic evidence weighting** — graduated 3-tier boost/penalty based on domain keyword matches (+0.15/+0.08/-0.05)
- **Question decomposition** — "quit my job and start a business" splits into sub-queries
- **Follow-up resolution** — "what about next week?" inherits context from previous question; short questions (<30 chars) auto-inherit previous domains
- **Confidence scoring** — gap-dominant formula: score_gap ×0.30 + agreement ×0.25 + data_quality ×0.15 - weighted_dissent ×0.20 + 0.08 floor, then unanimous boost/near-split penalty/question clarity multiplier/moon phase modifier
- **Agreement threshold** — systems must exceed 55% to count as "agreeing" (lowered from 57%)
- **Emotional charge detection** — 3-tier keyword analysis (high/medium/low) on questions, stored on ClassifiedIntent
- **Evidence deduplication** — features appearing in 3+ systems get weight-reduced to prevent inflation
- **Near-split detection** — boolean flag when gap < 0.08 or bare-majority agreement with 6+ systems
- **Domain-aware system weighting** — question type determines per-system weight multipliers (e.g., Persian ×1.4 for timing, BaZi ×1.3 for career)
- **Temporal triple-layer modulation** — planetary day ruler + Moon sign element + planetary hour ruler, clamped to ±0.12

### Personalization Layer
- `context_memory.py` — classifies past 10 questions, tracks dominant domain, timing/binary ratios
- `pattern_analyzer.py` — detects hesitation, timing focus, domain loop, exploration patterns
- Personal insight appears in answer when patterns detected (e.g. "You keep asking about love...")

### Answer Quality (rewritten 2026-03-24)
- Human-readable evidence translation (not raw labels) via `_humanize_evidence()` — 330+ lines covering all 8 systems
- Answers reference user's actual chart ("your Day Master is Fire", "your Moon is in its Last Quarter phase")
- Tone adjustment: firm / guided / exploratory based on confidence (firm ≥ 0.50 + gap ≥ 0.10, guided ≥ 0.28, exploratory otherwise)
- Contradiction narratives explain WHY systems disagree (triggers when gap < 0.25 and both supporters and dissenters exist)
- **Variation pools** — `random.choice()` across 80+ phrasings ensures no two identical answers for the same question
- **Three-layer answer structure**: opening (varied, question-appropriate) → evidence body (flowing prose with varied connectors) → closing (tone-matched)
- **No raw "favorable"/"cautious"** in user-facing text — mapped to natural language
- **Binary framing removed from non-binary questions** — "either choice is defensible" only appears for actual binary decisions
- **Counterpoint always included** when a cautioning system exists — scans ALL opinions, not just top contributors
- **Convergence sentences** — when 4+ systems independently highlight the same domain theme matching the question, a convergence sentence is inserted (4 varied templates)
- **Evidence dedup between opening and body** — chart lead feature tracked via `skip_feature`, body won't repeat it
- **Confidence-based answer length** — high confidence: 3 supporters cited; medium: 2; low: 1 + honesty language
- **Low-confidence closing pool** — 5 tentative closings used when confidence < 0.35 ("The chart whispers here", "Consider this a starting point")

### Premium Oracle Result UI (`OracleScreen.jsx`)
- `OracleResult` component with 5-stage staged reveal (answer → confidence → systems → conflict → insight)
- Confidence badge with teal/gold/coral coloring
- System cards with supports/neutral/cautions sentiment
- Conflict card explaining system tensions
- Personal insight card (gold gradient, appears last)
- Glow backdrop animation, staggered card entry
- `.or-blurred` CSS class ready for paywall gating
- Oracle history now persists full pipeline fields

### API Changes
- `POST /api/ask` accepts `question_history: list[str]` (validated, max 10 items, 280 chars each)
- Response includes: `confidence`, `confidence_label`, `tone`, `personal_insight`, `conflict_note`, `system_agreement`, `top_systems`, `system_signals`

### Answer Composer Smoke Test Results (2026-03-24)
- Ran the same question ("Will I find love this year?") 3 times with identical birth data — all 3 answers are different (varied openings, evidence bridges, agreement summaries, closings)
- Before Round 1 upgrades: confidence was 38%–41% (always Medium)
- After Round 1 upgrades (10): confidence rose to 72% (always High) — showed the formula was over-inflated
- After confidence formula redesign + Round 2 upgrades (20): confidence ranges 30%–75% across question types, producing realistic High/Medium/Low distribution
- Convergence detection now correctly identifies career themes for career questions (was showing "emotional well-being" for everything due to "moon" keyword matching 5+ systems)

### 10 Engine Upgrades — Round 1 (all completed 2026-03-24)

- **Upgrade 1 — Chart-Specific Opening Lines**: `_chart_lead()` in `answer_composer.py` pulls the highest-weight evidence from the top contributing system and weaves it into the opening via `_humanize_evidence()`
- **Upgrade 2 — Cross-System Convergence Detection**: `_detect_convergence()` in `answer_composer.py` scans all opinions for 4+ systems pointing to the same domain theme (love, career, wealth, health, mood) and inserts a convergence sentence into reasoning
  - Convergence threshold raised from 3 to 4 systems to avoid false positives
  - Only considers themes that match the question's `domain_tags` — prevents "emotional well-being" (via moon keyword) from appearing on every question
  - 4 varied convergence sentence templates with `random.choice()`
- **Upgrade 3 — Bolder Adapter Scoring**: Amplification blocks added to `western.py` (Venus/Mars/Jupiter/Saturn dignity + domain → up to +0.25), `vedic.py` (Mahadasha lord push + exalted grahas → up to +0.35), `bazi.py` (element strength, symbolic stars → up to +0.12)
- **Upgrade 4 — Real Transit Integration**: In `western.py`, transit evidence weight boosted by +0.20 and inserted at front of evidence list; transit weight in stance calculation raised from 1.0 to 2.5 for timing questions
- **Upgrade 5 — House-Domain Mapping**: `HOUSE_DOMAIN_MAP` in `western.py` maps domains to houses (love→5,7; career→6,10; etc.); dignified planets in domain-relevant houses boost +0.3, malefics penalize -0.15
- **Upgrade 6 — Counterpoint Always Present**: `_weave_body()` now scans ALL `aggregation.opinions` for cautioners (stance < 0.43) when none found in top contributors
- **Upgrade 7 — Dasha-Aware Timing**: `DASHA_DOMAIN_BOOST` table in `vedic.py` maps 9 dasha lords to 5 domains; applied with 2.0× weight before raw score calculation
- **Upgrade 8 — Gematria Weight Reduction**: `SYSTEM_WEIGHT["gematria"]` lowered from 0.65 to 0.40 in `schemas.py`
- **Upgrade 9 — Answer Length Tied to Confidence**: `_weave_body()` varies `max_supporters` (3/2/1) by confidence; low confidence adds honesty line; `_closing()` uses `_CLOSE_LOW_CONFIDENCE` pool when confidence < 0.35
- **Upgrade 10 — Temporal Variation Layer**: New file `backend/engines/pipeline/temporal.py` computes daily domain modulation from planetary day ruler + current Moon sign element, clamped to [-0.08, +0.08]; applied in `engine.py` between adapter evaluation and aggregation

### 20 Engine Upgrades — Round 2 (all completed 2026-03-24)

#### Adapter Base Class Upgrades (`backend/engines/pipeline/adapters/base.py`)

- **Upgrade 1 — Graduated 3-Tier Evidence Weighting**
  - `_adjust_evidence_weights()` rewritten with graduated boost logic
  - 2+ domain keyword matches → +0.15 weight boost (was flat +0.10)
  - 1 keyword match → +0.08 boost
  - 0 matches → -0.05 penalty (was no penalty)
  - All weights clamped to [0.1, 1.0]
- **Upgrade 2 — Confidence Scaling by Time Horizon**
  - `_compute_confidence()` now applies time_horizon multiplier
  - "today" / "tomorrow" → ×1.15 (short-term questions get higher confidence)
  - "this_week" → ×1.05
  - "this_month" / "this_year" / "general" → ×0.90 (long-term uncertainty acknowledged)
- **Upgrade 3 — Evidence Diversity Bonus**
  - 18 evidence category keywords: planet, house, sign, aspect, transit, number, element, star, nakshatra, dasha, sefirah, mansion, root, pillar, animal, yoga, tithi, temperament
  - 4+ distinct categories found → +0.08 confidence bonus
  - 3 categories → +0.05 bonus
  - Rewards adapters that draw from varied astrological features
- **Upgrade 4 — Minor System Stance Capping**
  - `STANCE_CAP` dict: gematria=0.78, kabbalistic=0.80, numerology=0.82
  - Prevents minor/symbolic systems from producing extreme stances (0.90+) that distort aggregation
  - Stance is clamped then renormalized to sum to 1.0
- **Upgrade 5 — Coverage Divisor Rebalanced**
  - Evidence coverage divisor changed from 5.0 to 8.0
  - Systems with few evidence items no longer saturate coverage at 100%
  - 4 items → 50% coverage (was 80%), 8 items → 100%
- **Upgrade 6 — Expanded Polarity Keyword Vocabulary**
  - 30+ new keywords added to `_ACTIVE_KW`: accept, advance, bold, build, challenge, commit, confront, create, dare, embrace, engage, expand, explore, fight, forge, grab, grow, hustle, initiate, join, jump, leap, open, seize, shift, strike, switch, try, venture, yes
  - 30+ new keywords added to `_REST_KW`: avoid, careful, cautious, defer, endure, guard, hibernate, linger, maintain, pass, patience, postpone, preserve, protect, refuse, relax, remain, resist, retreat, settle, shelter, sit, steady, still, tolerate, weather, yield
  - Improves binary question polarity analysis for nuanced option wording
- **Upgrade 7 — Adapter-Specific Confidence Scaling**
  - New `confidence_scale` class attribute on `BaseAdapter` (default 1.0)
  - Applied after `_compute_confidence()` as a multiplier
  - Per-adapter values: Western=1.0, Vedic=1.0, BaZi=1.0, Chinese=0.95, Persian=0.95, Numerology=0.90, Kabbalistic=0.85, Gematria=0.80
  - Ensures symbolic/numerological systems can't produce the same confidence as data-rich astronomical systems

#### Aggregator Upgrades (`backend/engines/pipeline/aggregator.py`)

- **Upgrade 8 — Weighted Dissent**
  - New `DISSENT_WEIGHT` dict assigns importance to each system's disagreement
  - Western/Vedic=2.0, BaZi=1.5, Persian=1.2, Chinese=1.0, Numerology=0.8, Kabbalistic=0.7, Gematria=0.5
  - Dissent from Western or Vedic drags confidence down more than dissent from Gematria
  - `weighted_dissent = dissent_w_sum / total_dissent_w` applied as -0.20 in the confidence formula
- **Upgrade 9 — Near-Split Detection**
  - New `near_split` boolean field on `AggregatedResult`
  - Triggers when score_gap < 0.08 (very close race) OR when the winner has barely-majority agreement (≤ n_total//2 + 1) with 6+ systems
  - Exposed to the answer composer for honesty language
- **Upgrade 10 — Unanimous Consensus Boost**
  - When every relevant system agrees on the winner (system_agreement[winner] == n_total), confidence gets +0.05
  - Rare reward for genuine unanimity across all 8 systems
- **Upgrade 11 — Near-Split Penalty**
  - When `near_split` is True, confidence gets -0.04
  - Prevents "High" confidence on questions where the systems are genuinely divided
- **Upgrade 12 — Cross-System Evidence Deduplication**
  - `_deduplicate_evidence_weight()` scans all relevant opinions for evidence features appearing in 3+ systems
  - Keeps full weight only on the instance with the highest weight
  - All other instances get -0.20 weight reduction
  - Prevents a common feature like "Moon phase" from inflating scores across 6+ systems
- **Upgrade 13 — Question Clarity Scoring**
  - `_question_clarity()` returns 0.0–1.0 based on question type
  - Clarity values: binary_decision=1.0, timing=0.9, relationship/career/health=0.85, emotional=0.7, general_guidance=0.5
  - Binary decisions with <2 options get reduced to 0.8
  - 3+ domain tags trigger -0.1 scatter penalty
  - Applied as multiplier: `confidence *= 0.7 + 0.3 * clarity`
  - Vague "what should I do with my life" questions get lower confidence than "should I take the job offer?"

#### Confidence Formula Redesign (`aggregator.py`)

- **Old formula** (pre-upgrade): lean_ratio-dominant with 0.10 floor — always produced 68%+ (High)
- **New formula** — gap-dominant with 5 components:
  - `gap_confidence = min(score_gap / 0.30, 1.0)` × 0.30 — score gap is the strongest signal
  - `agree_ratio` × 0.25 — fraction of systems with stance ≥ 0.57 for winner
  - `data_signal` × 0.15 — mean adapter confidence, capped at 0.60 to prevent inflation
  - `weighted_dissent` × -0.20 — penalizes disagreement from important systems
  - `0.08` minimal floor — much lower than the old 0.10
- **Confidence label thresholds** changed: High ≥ 0.58 (was 0.65), Medium ≥ 0.35, Low < 0.35
- **Tone thresholds** changed: firm when confidence ≥ 0.50 AND gap ≥ 0.10, guided when confidence ≥ 0.28, exploratory otherwise
- **Result**: Confidence now realistically ranges 30%–75% across question types instead of always 68%+

#### Domain-Aware Weight Overrides (`aggregator.py`)

- `DOMAIN_WEIGHT_OVERRIDES` dict: 5 question types × per-system multipliers
  - timing_question: Persian ×1.4, Vedic ×1.2, Western ×1.1, Kabbalistic ×0.6, Gematria ×0.5
  - relationship_question: Western ×1.3, Chinese ×1.1, Gematria ×0.5
  - career_question: BaZi ×1.3, Kabbalistic ×0.9, Gematria ×0.5, Chinese ×0.7
  - health_energy_question: Vedic ×1.2, Persian ×1.1, BaZi ×1.1, Kabbalistic ×0.5, Gematria ×0.4
  - emotional_state_question: Kabbalistic ×1.2, Western ×1.1, Gematria ×0.8
- Applied on top of base `SYSTEM_WEIGHT` in `_effective_weight()`

#### Intent Classifier Upgrades (`backend/engines/pipeline/intent_classifier.py`)

- **Upgrade 14 — Domain Tag Ranking by Match Strength**
  - Domain tags now sorted by keyword hit count (descending) instead of arbitrary dict order
  - A question with 3 career keywords and 1 love keyword → `["career", "love"]` not `["love", "career"]`
  - Ensures the primary domain drives routing, weighting, and convergence detection
- **Upgrade 17 — Emotional Charge Detection**
  - New `emotional_charge` field on `ClassifiedIntent` (0.0–1.0)
  - 3 keyword tiers:
    - HIGH (0.80–0.95): scared, terrified, desperate, heartbroken, devastated, panicking, hopeless, crying
    - MEDIUM (0.45–0.60): worried, anxious, confused, frustrated, lonely, stressed, overwhelmed, lost, stuck
    - LOW (0.10–0.25): wondering, curious, thinking, considering, hoping
  - `_detect_emotional_charge()` scans question words and returns the highest match
  - Available for tone adjustment in the answer composer

#### System Router Upgrade (`backend/engines/pipeline/system_router.py`)

- **Upgrade 15 — Time-Sensitive Routing Boost**
  - For short time horizons (today/tomorrow/this_week), Persian and Vedic are guaranteed to rank near the top
  - If their score falls below `max_score - 1.0`, it gets boosted to `max_score - 1.0`
  - Ensures the strongest timing systems are always consulted for "what should I do today?" questions

#### Pipeline Engine Upgrades (`backend/engines/pipeline/engine.py`)

- **Upgrade 16 — Follow-Up Context Enrichment**
  - Detects follow-up questions: short questions (<30 chars) or questions that classified to the default fallback domains (mood + career)
  - Moves previous question's domain tags to front of current domain list
  - Preserves unique current domains, caps at 4 total
  - "What about next week?" after a love question → domains become `["love", "mood", "career"]` instead of `["mood", "career"]`
- **Upgrade 20 — Moon Phase Confidence Modifier**
  - `moon_phase_confidence_modifier()` in `temporal.py` extracts current moon phase from Western/Persian system data
  - New Moon / Full Moon → +0.03 confidence (clear-signal phases)
  - Waxing/Waning Crescent → +0.01
  - First/Last Quarter → -0.03 (transition phases, less clarity)
  - Waxing/Waning Gibbous → 0.0 (neutral)
  - Applied via `model_copy()` after aggregation, confidence label recalculated

#### Temporal Module Upgrades (`backend/engines/pipeline/temporal.py`)

- **Upgrade 18 — Amplified Temporal Modulation Range**
  - Clamp range increased from ±0.08 to ±0.12
  - Temporal effects now have 50% more influence on adapter stances
  - Venus day (Friday) love bonus can now reach +0.12 instead of capping at +0.08
- **Upgrade 19 — Planetary Hour Stance Integration**
  - New `PLANET_HOUR_DOMAIN` dict: 7 planets × 2-3 domain modifiers each
  - `compute_planetary_hour_modifier()` extracts current planetary hour ruler from Persian system data, falls back to computing from current time via Chaldean order
  - Merged into `compute_temporal_modulation()` as a third signal alongside day ruler and Moon sign
  - Jupiter hour boosts wealth +0.05 and career +0.03; Saturn hour penalizes career -0.03, health -0.02, mood -0.03

### Supabase Fallback Fix (2026-03-24)

- **Root cause**: `apiPost()` in `frontend/src/app/api.js` silently fell back to Supabase edge functions when local backend was unreachable, producing generic answers and 0% confidence
- **Diagnosis**: Supabase oracle function (`supabase/functions/_shared/engines.ts`) had 5 hardcoded template answers and returned only `{ answer, areas, evidence }` — no confidence, tone, or pipeline fields
- **Fix — Supabase edge function**: Added fallback fields to the Supabase oracle response: `confidence: 0.35`, `confidence_label: "Medium"`, `tone: "guided"`, `personal_insight: null`, `conflict_note: null`, `system_agreement: {}`, `top_systems: []`, `system_signals: []`
- **Fix — API layer**: Added `console.warn()` when falling back to Supabase, and tags the result with `_source: 'supabase'` for debugging
- **Result**: Phone no longer shows "Medium 0%" — shows "Medium 35%" when hitting Supabase, and real pipeline confidence when hitting local backend

### Answer Prose Quality — Identified Issues (not yet implemented)

- Opening chart leads state facts without explaining relevance ("your Day Master is Fire" → should say "Fire Day Masters thrive on change — a new city could ignite your energy")
- Evidence sentences are mechanical data dumps ("BaZi confirms — your Day Master is weak" reads like a report, not advice)
- Raw transit text appears unprocessed in openings ("emotional volatility — impulse control matters now")
- Technical jargon not translated for the user ("Purva Bhadrapada (fierce, ruler Jupiter)")
- Contradiction threshold too strict (gap ≥ 0.25 means conflicts almost never appear) — should be lowered to ≥ 0.15
- No emotion-aware tone adjustment (Upgrade 17 added emotional_charge field but composer doesn't use it yet)
- Need interpretive evidence-to-meaning mapping (what does "Fire Day Master" MEAN for this specific question)
- Need flowing narrative connectors instead of mechanical "{System Name} confirms — {detail}"
- Need question-type-specific framing and closings
- Need strength qualifiers ("strongly", "slightly", "clearly") based on confidence level

### Kundli White Screen Bug Fix (2026-03-24)

- Added `KdBoundary` React ErrorBoundary class component wrapping all Kundli sub-pages
- Added `KdError` graceful fallback UI (warning icon + message + back button)
- Wrapped all 10 sub-page `useMemo` engine calls with try/catch + null guard
- Any engine crash now shows "Unable to generate this section" instead of white screen

### Test Coverage (verified 2026-03-24)
- `tests/test_pipeline.py` — covers all 8 adapters, router, aggregator, composer, context memory, pattern analyzer, 6 example questions, personalization integration, plus dedicated upgrade tests:
  - Round 1 upgrade tests (34 tests):
    - Upgrade 1: `_chart_lead` unit tests + compose integration (4 tests)
    - Upgrade 2: convergence detection positive/negative cases + composed output (5 tests)
    - Upgrade 3: stance spread, validity, normalisation for Western/Vedic/BaZi (4 tests)
    - Upgrade 4: transit evidence presence, timing vs general stance difference (2 tests)
    - Upgrade 5: HOUSE_DOMAIN_MAP existence, Venus-in-H7 love test (2 tests)
    - Upgrade 6: counterpoint from non-top system in composed answer (1 test)
    - Upgrade 7: DASHA_DOMAIN_BOOST table, Venus→love boost, Saturn→health penalty (3 tests)
    - Upgrade 8: gematria weight value check, ordering vs major systems (2 tests)
    - Upgrade 9: high vs low confidence length, uncertainty language, low-confidence closing pool (3 tests)
    - Upgrade 10: domain coverage, moon sign modulation, stance shift, skip logic, clamping, full pipeline integration, day ruler coverage (8 tests)
  - Round 2 upgrade tests (15 tests):
    - Upgrade 18: temporal clamp range verification, modulation magnitude check (2 tests)
    - Upgrade 19: planetary hour modifier returns dict, hour domain coverage, planetary hour integration into temporal modulation, Venus hour love boost (4 tests)
    - Upgrade 20: moon phase modifier returns float, New Moon positive modifier, Last Quarter negative modifier, phase extraction from Western data, phase extraction from Persian data, neutral when no phase found, Waxing Gibbous neutral, confidence adjustment in pipeline, confidence label recalculation (9 tests)
- Total: **210 backend tests pass** (0.94s), **12 frontend tests pass**, frontend builds clean

## Current Navigation

- `Today` (default tab — v2 Agreement Spectrum, Score Dot-Plot, daily guidance)
- `Systems` (v2 system list with Reading/Evidence/Data detail overlay)
- `Oracle` (with Recent Questions expandable)
- `Games`
- `Readings`
- `You` / Settings (accessible via gear icon — includes Your Patterns section)

## Key Files Changed

- `backend/main.py`
- `backend/engines/oracle.py`
- `backend/engines/daily.py`
- `backend/engines/pipeline/engine.py` — temporal modulation, follow-up context enrichment (R2 Upgrade 16), moon phase confidence modifier (R2 Upgrade 20)
- `backend/engines/pipeline/temporal.py` — daily domain modulation (R1 Upgrade 10), amplified clamp (R2 Upgrade 18), planetary hour integration (R2 Upgrade 19), moon phase modifier (R2 Upgrade 20)
- `backend/engines/pipeline/schemas.py` — gematria weight reduction (R1 Upgrade 8), near_split field (R2 Upgrade 9), emotional_charge field (R2 Upgrade 17)
- `backend/engines/pipeline/aggregator.py` — confidence formula redesign, domain-aware weight overrides, weighted dissent (R2 Upgrade 8), near-split detection (R2 Upgrade 9), unanimous boost (R2 Upgrade 10), near-split penalty (R2 Upgrade 11), evidence deduplication (R2 Upgrade 12), question clarity scoring (R2 Upgrade 13)
- `backend/engines/pipeline/answer_composer.py` — chart-specific openings, convergence detection with domain filtering, counterpoint scanning, confidence-based length (R1 Upgrades 1, 2, 6, 9)
- `backend/engines/pipeline/intent_classifier.py` — domain tag ranking by match strength (R2 Upgrade 14), emotional charge detection (R2 Upgrade 17)
- `backend/engines/pipeline/system_router.py` — time-sensitive routing boost (R2 Upgrade 15)
- `backend/engines/pipeline/adapters/base.py` — graduated evidence weighting (R2 Upgrade 1), confidence scaling (R2 Upgrade 2), diversity bonus (R2 Upgrade 3), stance capping (R2 Upgrade 4), coverage rebalance (R2 Upgrade 5), expanded polarity keywords (R2 Upgrade 6), confidence_scale attribute (R2 Upgrade 7)
- `backend/engines/pipeline/adapters/western.py` — bolder scoring, transit integration, house-domain mapping (R1 Upgrades 3, 4, 5), confidence_scale=1.0
- `backend/engines/pipeline/adapters/vedic.py` — bolder scoring, dasha-aware timing (R1 Upgrades 3, 7), confidence_scale=1.0
- `backend/engines/pipeline/adapters/bazi.py` — bolder scoring (R1 Upgrade 3), confidence_scale=1.0
- `backend/engines/pipeline/adapters/chinese.py` — confidence_scale=0.95
- `backend/engines/pipeline/adapters/persian.py` — confidence_scale=0.95
- `backend/engines/pipeline/adapters/numerology.py` — confidence_scale=0.90
- `backend/engines/pipeline/adapters/kabbalistic.py` — confidence_scale=0.85
- `backend/engines/pipeline/adapters/gematria.py` — confidence_scale=0.80
- `supabase/functions/_shared/engines.ts` — added fallback confidence/tone/pipeline fields to oracle response
- `frontend/src/app/api.js` — added console.warn + _source tag on Supabase fallback
- `frontend/src/App.jsx`
- `frontend/src/app/constants.js`
- `frontend/src/app/storage.js`
- `frontend/src/app/helpers.js`
- `frontend/src/app/styles.js`
- `frontend/src/app/kundli-engine.js` — Kundli engine (10 functions)
- `frontend/src/hooks/useMotionMode.js`
- `frontend/src/components/SplashScreen.jsx`
- `frontend/src/components/LoadingOverlay.jsx`
- `frontend/src/components/OnboardingScreen.jsx`
- `frontend/src/components/OracleScreen.jsx`
- `frontend/src/components/MainViews.jsx`
- `frontend/src/components/ReadingsScreen.jsx` — Kundli ErrorBoundary + try/catch fix
- `frontend/src/components/common.jsx`
- `frontend/package.json`
- `frontend/capacitor.config.ts`
- `frontend/src/app/helpers.test.js`
- `frontend/src/app/motion.test.js`
- `tests/test_api_validation.py`
- `tests/test_daily_content.py`
- `tests/test_fixes.py`
- `tests/test_pipeline.py` — 34 new upgrade tests
- `docs/superpowers/specs/2026-03-12-daily-content-engine-phase-a.md`
- `docs/superpowers/plans/2026-03-12-daily-content-engine-phase-a.md`
- `CLAUDE.md`

## Verification

Latest verified locally on **March 24, 2026**:

- `.venv\Scripts\python.exe -m pytest tests -q` passed: **210 passed** (0.94s)
- `frontend\npm run test` passed: **12 passed**
- `frontend\npm run build` passed
- Backend smoke test: 7 questions across love/career/health/timing/binary/emotional/general — confidence ranges 30%–75% (High/Medium/Low) after 30 total upgrades, all answers personalized with chart data, convergence detection working with domain filtering, no duplicate answers on repeat

### V2 Feature Port (2026-03-25)

Ported select features from `frontend-v2/` ("The Ephemeris") into the main All Star Astrology app.

#### New Tabs Added
- **Today tab** (`frontend/src/components/TodayTab.jsx` — new file)
  - Status line showing current moon phase, planetary hour ruler, and day ruler
  - Agreement Spectrum — 8 colored system dots positioned on a cautious/supportive track
  - Life Area Score Dot-Plot — Career, Love, Health, Money, Mood with +/- scores and system agreement counts
  - Daily pull-quote with left accent bar, focus/caution/anchor metadata
  - Do/Don't columns
  - Fetches data from `/api/v2/temporal` and `/api/v2/scores` (endpoints already existed)
- **Systems tab** (`frontend/src/components/SystemsTabV2.jsx` — new file)
  - Clean row list of all 8 systems with icon, headline, mini score bar, and percentage
  - Tap any system for a full-screen overlay with 3 sub-tabs: Reading, Evidence, Data
  - Reading sub-tab: domain score bars, highlight pills, insight rows
  - Evidence sub-tab: extracted feature tags, data tables
  - Data sub-tab: flattened key-value pairs from raw system data

#### Navigation Changes
- **Tab order changed** to: Today | Systems | Oracle | Games | Readings
- **Combined tab removed** — the old `CombinedSystemsContent` is no longer in the nav
- **Default tab** changed from Oracle to Today (post-onboarding and on back button)
- Bottom nav icons: Today uses star icon, Systems uses grid icon

#### Oracle Tab Additions
- **Recent Questions** — collapsible expandable section at bottom of Oracle screen
  - Shows when no active answer and history exists
  - Toggle button with question count
  - Tap any item to re-view the full Oracle answer
  - Clear History button
  - Uses `v2-oracle-hist-*` CSS classes

#### You/Settings Tab Additions
- **Your Patterns** section added under "Your Signs"
  - `PatternDashboard` component analyzes Oracle question history
  - Detects: Domain Focus (repeated topic), Timing Seeker (when/timing questions), Confidence Trend (rising/falling/steady), Decision Maker (binary questions)
  - Shows "Ask more Oracle questions to reveal your patterns" when insufficient data

#### CSS & Variable Changes (`frontend/src/app/styles.js`)
- Added v2 bridge CSS variables to both dark and light themes:
  - `--surface`, `--text-secondary`, `--text-muted`, `--positive`, `--negative`, `--neutral`
  - `--border`, `--border-light`, `--v2-r`, `--v2-r-lg`, `--mono` font
  - System accent colors: `--sys-western` through `--sys-persian`
- All new component styles prefixed with `v2-` to avoid collisions with existing CSS

#### App.jsx Changes
- Added `temporal` and `scores` state with `useEffect` data fetching
- Imported `TodayTab` and `SystemsTabV2` components
- Imported `apiGet` from api.js (was only using `apiPost` before)
- Removed `CombinedSystemsContent` import
- Updated routing: added `today` and `systems` cases, removed `combined-systems`
- Games tab `onNavigate` now routes to `systems` instead of `combined-systems`
- Reset handler clears `temporal` and `scores` state

#### Files Changed
| File | Action |
|------|--------|
| `frontend/src/components/TodayTab.jsx` | **Created** |
| `frontend/src/components/SystemsTabV2.jsx` | **Created** |
| `frontend/src/App.jsx` | Modified — new imports, state, routing |
| `frontend/src/components/MainViews.jsx` | Modified — PatternDashboard, BottomNav tabs |
| `frontend/src/components/OracleScreen.jsx` | Modified — Recent Questions section |
| `frontend/src/app/styles.js` | Modified — v2 bridge vars + all new CSS |

#### Verification (2026-03-25)
- `pytest tests -q` → **352 passed** (1.92s)
- `npm run build` → passed
- `npx cap sync android` → passed
- `gradlew assembleDebug` → passed (BUILD SUCCESSFUL)
- APK installed on Vivo `10AE6E24TK0011K`
- `adb reverse tcp:8892 tcp:8892` set

## Cloud Run Deployment (completed 2026-03-26)

### Dockerfile
Multi-stage build at `Dockerfile`:
- **Stage 1**: `node:20-slim` — `npm ci` + `npm run build` (builds frontend from source)
- **Stage 2**: `python:3.12-slim` — `build-essential` for pyswisseph C compilation, `pip install` requirements, copies backend + frontend dist from stage 1
- `frontend/dist/` is gitignored, so the multi-stage approach is necessary — Cloud Build uploads source via `.gitignore` rules

### Deployment Command
```
gcloud run deploy allstar-astrology --source . --region us-central1 --allow-unauthenticated --port 8080 --memory 1Gi
```
Run from the repo root in Cloud Shell (`shell.cloud.google.com`), project `allstar-astrology-ci`.

### Build Issues Resolved
1. `pyswisseph` needs `build-essential` (not just `gcc`) on `python:3.12-slim`
2. `frontend/dist/` excluded by `.gitignore` → fixed with multi-stage Docker build
3. `lunardate` missing from `requirements.txt` → added

## CI/CD & Store Submission (in progress 2026-03-26)

### GitHub Secrets Configured (10/12)
| Secret | Status |
|--------|--------|
| `ANDROID_KEYSTORE_BASE64` | Set |
| `ANDROID_KEYSTORE_PASSWORD` | Set |
| `ANDROID_KEY_ALIAS` | Set |
| `ANDROID_KEY_PASSWORD` | Set |
| `BUILD_CERTIFICATE_BASE64` | Set (from `.certs/distribution_b64.txt`) |
| `BUILD_PROVISION_PROFILE_BASE64` | Set (from `.certs/provision_b64.txt`) |
| `ASC_KEY_ID` | Set (`MGU3RYR43W`) |
| `ASC_API_KEY` | Set (from `.certs/AuthKey_MGU3RYR43W.p8`) |
| `KEYCHAIN_PASSWORD` | Set (`ci-build-temp`) |
| `APPLE_TEAM_ID` | Set (`HLYD7FGZVU`) |
| `P12_PASSWORD` | **NOT SET** — password for `distribution.p12` |
| `ASC_ISSUER_ID` | **NOT SET** — from App Store Connect > Users & Access > Integrations |

### Android (Google Play)
- **Signed release AAB** already built locally: `frontend/android/app/build/outputs/bundle/release/app-release.aab`
- **Keystore**: `frontend/android/upload-keystore.jks` (alias: `upload`, password: `changeit`)
- **CI workflow**: `.github/workflows/android-build.yml` — builds AAB + uploads to Play Store internal track
- **Missing for automated upload**: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` secret (service account from Play Console > API access)
- **Manual upload alternative**: Upload the AAB directly at Google Play Console

### iOS (App Store)
- **CI workflow**: `.github/workflows/ios-build.yml` — full pipeline: Xcode 26, cap add ios, pod install, archive, export IPA, upload to TestFlight
- **Certs on disk**: `.certs/` has distribution.p12, provisioning profile, App Store Connect API key
- **No local iOS project** — generated on-the-fly in CI via `npx cap add ios`
- **Remaining**: Set `P12_PASSWORD` and `ASC_ISSUER_ID` secrets, then trigger workflow via `gh workflow run ios-build.yml`

## Current Reality / Not Done Yet

- Store billing is not wired:
  - `Manage Subscription` is UI-only
  - no Google Play Billing / App Store subscription implementation yet
- `Rate This App` and `Share with Friends` are intentionally deferred until store-launch work
- The workspace is a git repository (main branch, public at `github.com/themdash135/all-star-astrology`)

## Full Combined Analysis (2026-03-25)

New immersive page accessed from Today tab CTA and Games CTA:

- **Component:** `frontend/src/components/FullCombinedAnalysis.jsx` (~350 lines)
- **Entry points:**
  - Today tab → "View Full Cosmic Intelligence Report" CTA button
  - Games tab → "View Full Combined Analysis" CTA after game results
- **Routing:** `tab === 'analysis'` in App.jsx; Games `onNavigate` maps `combined-systems` → `setTab('analysis')`
- **Sections (scroll-driven with IntersectionObserver reveals):**
  - Hero — star field + 8 color-coded system orbs converge into glowing nexus
  - Score Nexus — animated arc-sweep ring showing overall alignment %
  - Neural Constellation — SVG with 8 color-coded nodes + agreement lines
  - Life Area Intelligence — 5 expandable cards with per-system bar breakdowns
  - Eight Ancient Voices — 8 system cards with colored borders + headlines
  - System × Area Matrix — color-coded heatmap (8 systems × 5 areas)
  - Key Insights — highlights grid + expandable insight accordions
  - Footer — orbiting particle badge, "NEURO-SYMBOLIC AI ENGINE" branding
- **CSS:** all `fca2-*` classes in `styles.js` with 12+ custom keyframe animations
- **Data:** uses `result.systems[id].scores[area].value` (not `.probabilities`)
- **Back button:** Android hardware back from analysis returns to Today tab

## Love Compatibility — AI Narrative Synthesis & Roles (2026-03-26)

### Backend (`backend/engines/compatibility.py`)
- Added `_synthesize_tier1()` — combines Western, Vedic, and BaZi outputs into a single theme-based narrative organized by emotional landscape, energy/passion, conflict signature, and long-term path
- Rewrote `_build_relationship_playbook()` — removed all "The systems agree/show/are clear" template language; now reads as direct coaching prose
- Added `_build_relationship_roles()` — assigns each person one of 5 roles based on BaZi Day Master element: The Visionary (Wood), The Inspirer (Fire), The Stabilizer (Earth), The Challenger (Metal), The Emotional Anchor (Water)
- Added `_cross_validate_role()` — validates BaZi-derived roles against Western Sun/Moon/Mars elements and Vedic Gana temperament; if ≥2 secondary signals conflict with the primary element, a nuance line is added without changing the role label
- Added `_ROLE_INFO`, `_WESTERN_TO_BAZI`, `_GANA_ELEMENT`, `_NUANCE_PHRASE`, `_ELEMENT_RELATION` data structures
- Added deduplication guards (40-char fingerprint matching) for daily behaviors
- `compute()` return dict now includes `tier1_synthesis`, `relationship_roles`, and `relationship_playbook` keys
- Tier 1 narrative hard-capped at 2000 chars; roles narrative capped at 1000 chars

### Frontend (`frontend/src/components/FullCombinedAnalysis.jsx`)
- Added `Tier1Synthesis` component — renders synthesized narrative with `\n\n` paragraph splitting, gradient background, centered header with "The Full Picture" title
- Added `RelationshipRoles` component — displays role badges for each person with flex layout, nuance lines in italic teal, and a narrative paragraph
- Both components use `useReveal` (IntersectionObserver) for scroll-driven animations
- Section order: Tier 1 cards → Tier1Synthesis → RelationshipRoles → Tier 2 → Tier 3 → RelationshipPlaybook

### Frontend (`frontend/src/app/styles.js`)
- Added `.lc-synthesis-*` styles (gradient bg, centered header, paragraph layout)
- Added `.lc-roles-*` styles (badge layout with flex, nuance italic teal text)
- Added light theme overrides for both sections

### Tests (`tests/test_compatibility.py`)
- Added `TestTier1Synthesis` class (9 tests): presence, non-empty, length ≤2000, ≥3 themes, no system labels, paragraph cap, empty readings, high-score resonance, low-score friction
- Added `TestRelationshipRoles` class (13 tests): presence, valid labels, length ≤1000, no system labels, empty readings, same/different elements, productive cycle, adjustment guidance, nuance fields, nuance-none-when-agree, nuance-added-when-conflict, label-unchanged-on-conflict
- Total compatibility tests grew from 36 to 58

### Verification (2026-03-26)
- `pytest tests -q` → **410 passed**
- `npm run build` → passed

## Phone Testing Toolkit (2026-03-25)

- `_phone_screenshot.py` — screenshot + auto-resize (strips Vivo multi-display warning prefix)
- `_phone_smoke.py` — functional smoke test via JS DOM inspection (no screenshots)
- `_cdp_eval.py auto "<js>"` — execute JS in phone WebView via Chrome DevTools Protocol
- `_phone.sh <cmd>` — unified ADB operations (screenshot, tap, swipe, deploy, js)

## Live Device Validation (2026-03-28, in progress)

Ran automated CDP-based audit on Vivo X Fold 3 Pro via `_audit_tabs.py` and `_inject_reading.py`. 58 screenshots captured in `_audit_shots/`.

### Completed Testing
- **Onboarding flow (screenshots 00–08):**
  - Splash screen loads
  - DOB picker: month/day/year dropdown selects render and accept input
  - Birth time step renders with input
  - Birth location step: Google Places autocomplete works (typed hospital, results populated, selected)
  - Name step renders with input field
  - Partner step renders with labels and hints visible
  - Theme picker screen renders
  - Loading screen appears during reading generation
  - Reading completes successfully — no "Request expired" or 500 errors
- **Today tab (screenshots 09, 20):**
  - Agreement Spectrum renders with 8 colored system dots
  - Life Area Score Dot-Plot shows Career/Love/Health/Money/Mood rows with scores and agreement counts
  - Daily pull-quote with focus/caution/anchor metadata
  - Do/Don't columns populate
  - Status line shows moon phase, planetary hour, day ruler
  - "View Full Cosmic Intelligence Report" CTA button present
- **Systems tab (screenshots 10, 21):**
  - All 8 system rows render with icons, headlines, mini score bars
  - Tapped into a system detail view — overlay with Reading/Evidence/Data sub-tabs loads
  - Back button from detail works
- **Oracle tab (screenshots 11, 22):**
  - Textarea and submit button render
  - Starter prompt chips visible
- **Games tab (screenshots 12, 23):**
  - Game buttons render and are scrollable
- **Readings tab (screenshots 13, 24):**
  - Content renders, scrollable through multiple sections
- **Feedback tab (screenshots 14, 25):**
  - Input fields render (no mailto: redirect confirmed in earlier testing)
- **Settings (screenshots 15, 26):**
  - Settings page loads from gear icon
  - Buttons visible, scrollable
- **Full Combined Analysis (screenshots 16, 27):**
  - CTA from Today tab navigates to analysis page
  - Hero, Score Nexus, Neural Constellation, Life Area Intelligence sections render
  - Scrollable through all sections including deep scroll

### Not Yet Completed
- **Oracle ask test** — did not submit a question and verify response on device
- **Games play-through** — did not tap into a game and verify it works
- **Readings detail** — did not tap into a specific reading section
- **Feedback submit** — did not submit feedback and verify in-app confirmation
- **Settings actions** — did not test Reset, Privacy Policy, Terms, Manage Subscription
- **Admin access** — did not test 5-tap version → admin gate → admin pages on device
- **UX audit** — not started (Phase 3): evaluate clarity, labels, trust, friction across all screens
- **Fix pass** — not started (Phase 4): fix highest-value issues found
- **Re-validation** — not started (Phase 5): confirm fixes on device, check regressions

## Next Steps

1. **Finish store submission** (immediate):
   - Set 2 remaining iOS secrets: `P12_PASSWORD`, `ASC_ISSUER_ID`
   - Optionally set `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` for automated Play Store upload, or upload AAB manually
   - Trigger iOS workflow: `gh workflow run ios-build.yml`
   - Upload Android AAB to Google Play Console internal testing track
2. **Implement real subscriptions**:
   - Google Play Billing
   - Apple App Store subscriptions
   - account/state handling in app
3. **Post-launch polish**:
   - `Rate This App` and `Share with Friends` deep links
   - offline/error-state testing
   - analytics/crash reporting
