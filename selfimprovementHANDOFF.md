# Self Improvement Handoff

## Current State

- The self-improvement lane is Jarvis-only and explicitly non-trading.
- Candidate artifacts are stored under `artifacts/self_improve`.
- The backend now supports candidate creation, bundle generation, smoke runs, regression runs, benchmark scoring, backlog discovery, autopilot execution, auto-approval, isolated worktree execution, and automatic rollback after bad post-activation checks.
- The frontend `Improve` tab now exposes candidate creation, backlog visibility, bundle review, smoke runs, regression runs, autopilot, promotion scoring, worktree isolation state, and activation/post-activation status.
- The self-improvement loop can now generate real code edits through Ollama, apply them, retry on failures, validate the result, promote a passing candidate, and roll back if post-activation checks degrade.
- The self-improve lane now also supports evt-backed opportunity sensing, eng-memory summaries, policy audits, tournament history, staged activation (`canary` -> `probation` -> `fully_active` / `demoted`), delayed activation checks, and queueable autopilot runs.
- The BE self-improve surface has been split into a dedicated pkg under `backend/self_improve/` with `router.py`, `service.py`, `compiler.py`, `scheduler.py`, and `store.py` shimmed over the legacy store.
- The FE Improve entrypoint now mounts from `frontend/src/self_improve/SelfImprovePage.tsx` while keeping the existing page component behavior intact.

## Recent Progress

- Refactor:
  - Moved active BE self-improve routing/orchestration into `backend/self_improve/`.
  - Added compat wrapper at `backend/routers/self_improve.py`.
  - Added FE entrypoint at `frontend/src/self_improve/SelfImprovePage.tsx`.
- Evt / sensing:
  - Added DB evt recording for create / bundle / status / smoke / reg / benchmark / autopilot / activation-check flows.
  - Added evt compiler for failure clusters, rollback clusters, slow-cmd hotspots, and operator-correction signals.
  - Backlog now merges store-driven opps with evt-driven opps.
- Tournament / queue:
  - Added queueable autopilot endpoint and BG scheduler worker pool.
  - Added tournament metadata for plan history, winner plan, archived plans, blast radius, and plan score.
  - Added learned plan-biasing from prior winning strategies in eng memory.
- Eval / approval:
  - Added failure replay tracking, subsystem eval packs, adversarial / negative / mutation checks, and approval-evidence summaries.
  - Added touched-file / symbol / dep-surface summaries, risk lvl, rollback confidence, and before/after metric tracking.
- Canary / demotion:
  - Added staged activation state and delayed activation checks.
  - Added BG canary loop that can run due delayed checks for active candidates.
- Scope / policy:
  - Added target scope audit and deny-token rejection for protected trading-like paths.
  - Autopilot promotion is blocked if touched scope escapes the approved Jarvis-only lane.
- Tests / validation:
  - Added focused API coverage for evt logging, backlog evt compiler output, queue metadata, staged activation checks, scope rejection, and new artifact paths.
  - Verified `tests/test_api.py -k self_improve`, full `tests/test_api.py`, and FE prod build.

## Self-Improve File Inventory

These are the files currently involved in the self-improvement system and should be treated as the active self-improve surface area:

- `backend/self_improve_store.py`
- `backend/routers/self_improve.py`
- `backend/main.py`
- `frontend/src/components/SelfImprovePage.tsx`
- `frontend/src/App.tsx`
- `frontend/src/styles/globals.css`
- `tests/test_api.py`
- `artifacts/self_improve/`
- `selfimprovementHANDOFF.md`

## Clean Folder Direction

For cleanliness, the self-improvement files should be consolidated into dedicated self-improve folders instead of remaining spread across generic locations.

Target organization:

- `backend/self_improve/`
- `backend/self_improve/store.py`
- `backend/self_improve/router.py`
- `backend/self_improve/profiles.py`
- `backend/self_improve/backlog.py`
- `backend/self_improve/autopilot.py`
- `frontend/src/self_improve/`
- `frontend/src/self_improve/SelfImprovePage.tsx`
- `frontend/src/self_improve/selfImprove.css`
- `tests/self_improve/`
- `tests/self_improve/test_api.py`
- `artifacts/self_improve/`

Notes:

- `backend/main.py` will still need to import and register the self-improve router, but the feature logic should live under `backend/self_improve/`.
- `frontend/src/App.tsx` will still need to mount the self-improve page, but the page and related helpers/styles should live under `frontend/src/self_improve/`.
- `tests/test_api.py` currently contains the self-improve coverage, but that coverage should be split into `tests/self_improve/` for cleaner ownership.

## Highest-Leverage Next Steps

### 1. Build Real Opportunity Sensing

The system needs to autonomously discover the best next improvement opportunities instead of depending mainly on candidate templates and current candidate state.

Work to do:

- Mine repeated smoke failures, regression failures, and rollback events from self-improve artifacts.
- Track latency hotspots, slow commands, and frequently failing validation packs.
- Detect repeated manual edits to the same Jarvis-only files and convert those patterns into candidate suggestions.
- Inspect TODO and FIXME clusters in allowed non-trading files and convert them into ranked opportunities.
- Persist opportunity history so the system can learn which opportunity classes produce strong improvements versus wasted work.

Outcome:

- The backlog becomes evidence-driven instead of template-driven.

### 2. Replace Single-Path Generation With Improvement Tournaments

The current variant ranking is useful, but the next tier requires multi-plan search, not just trying a few patch variants from one plan.

Work to do:

- Generate multiple improvement plans per opportunity.
- Generate multiple candidate patches per plan.
- Execute plans in isolated worktrees in parallel or in scheduled batches.
- Score each plan on validation strength, blast radius, and promotion confidence.
- Promote only the highest-scoring validated plan and archive the losing plans for future learning.

Outcome:

- The system stops acting like a single-attempt fixer and starts acting like a search engine over possible upgrades.

### 3. Strengthen Evaluation Beyond Smoke and Regression Packs

The existing smoke, regression, and post-activation command packs are a solid baseline, but they are not yet strong enough to justify high-confidence autonomous evolution.

Work to do:

- Add subsystem-specific validation packs for Jarvis memory, browser orchestration, voice, desktop, and UI behavior.
- Add failure replay so the system can rerun exact historical failures against new patches.
- Add adversarial prompt/eval suites for assistant behavior quality.
- Add negative testing so the model cannot satisfy evals by overfitting to one happy-path case.
- Add mutation-style checks to ensure the tests actually detect broken behavior.

Outcome:

- Passing validation becomes meaningful, not just locally green.

### 4. Make Approval Evidence-Based

Auto-approval should be driven by a structured proof bundle instead of mainly a passed run state.

Work to do:

- Require before/after metrics for the capability being improved.
- Record touched-file scope, touched-symbol scope, and dependency surface changed by the candidate.
- Add a risk summary that explains why the change is low, medium, or high risk.
- Add rollback confidence scoring based on reversibility and validation depth.
- Require benchmark evidence that is specific to the stated improvement goal, not just a generic score average.

Outcome:

- Promotion becomes explainable and defensible.

### 5. Add Continuous Canarying and Delayed Demotion

The current rollback catches immediate post-activation degradation, but the next tier needs monitoring that continues after activation.

Work to do:

- Introduce staged activation states such as `canary`, `probation`, and `fully_active`.
- Run delayed post-activation checks after additional runs, time windows, or interaction counts.
- Automatically demote or roll back candidates that drift downward after initially passing.
- Feed demotion reasons back into opportunity discovery and plan ranking.
- Store activation history so the system can detect fragile improvement patterns.

Outcome:

- The system becomes resilient to changes that look good initially but decay in real usage.

### 6. Give It Persistent Engineering Memory

The self-improve lane should remember what kinds of fixes worked, where they worked, and under what failure signatures.

Work to do:

- Store repair history keyed by subsystem, file path, failure signature, and validation outcome.
- Save the prompt strategies and patch patterns that produced successful improvements.
- Penalize strategies that repeatedly fail or trigger rollbacks.
- Bias future generation toward patterns that have already shown durable wins.
- Build searchable memory over prior candidates, bundles, failures, and activations.

Outcome:

- The system compounds experience instead of relearning the same lessons.

### 7. Add Architectural Self-Improvement

The current loop is strongest at scoped code edits. The next tier requires the ability to improve structure, tests, and the self-improve machinery itself.

Work to do:

- Allow the system to propose refactors that split modules, reduce complexity, and improve maintainability in allowed non-trading areas.
- Allow test-first candidate creation where the system adds missing coverage before changing behavior.
- Allow self-improve-on-self-improve upgrades so the pipeline can improve its own planning, validation, and rollback logic.
- Add impact analysis so larger changes are broken into safe staged upgrades instead of one oversized patch.
- Preserve the non-trading guardrails while expanding the types of allowed Jarvis-only improvements.

Outcome:

- The system can evolve architecture, not just patch local defects.

### 8. Enforce Policy and Scope at Every Stage

Non-trading protection should not rely only on prompts. It should be enforced in file scope, symbol scope, validation scope, and activation scope.

Work to do:

- Add deny lists for trading-related files, modules, symbols, and directories.
- Reject candidate creation if requested targets overlap trading or execution-sensitive paths.
- Block autopilot promotion if the touched-file set escapes the allowed self-improve surface.
- Add explicit audit records showing why a candidate was considered in-scope.
- Validate that generated diffs only affect approved self-improve and Jarvis-only areas.

Outcome:

- The system scales autonomous operation without weakening the non-trading boundary.

## Immediate Refactor Priority

Before expanding too much further, the self-improve code should be reorganized into dedicated folders so the system can grow without becoming messy.

Recommended near-term refactor:

1. Move backend self-improve logic from `backend/self_improve_store.py` into `backend/self_improve/`.
2. Move router logic from `backend/routers/self_improve.py` into `backend/self_improve/router.py`.
3. Move frontend self-improve UI into `frontend/src/self_improve/`.
4. Split self-improve tests out of `tests/test_api.py` into `tests/self_improve/`.
5. Keep `artifacts/self_improve/` as the runtime artifact root.
6. Update imports only after the folder move is complete and tested.

## Verification Baseline

The current self-improve lane has already been validated with:

- focused backend API tests for self-improve flows
- frontend production build validation
- live Ollama-backed autopilot execution in the Jarvis-only lane
- focused API tests for evt-backed backlog sensing, scope policy rejection, queue metadata, and staged activation checks
- full `tests/test_api.py` pass after the pkg / router / scheduler refactor

## What I Did Not Verify:

- BG scheduler soak:
  - No long-run soak / endurance test for queued tournaments or delayed canary loop.
- Live autopilot queue:
  - No live multi-candidate queue drain with real Ollama + real worktree contention.
- Delayed canary timing:
  - No wall-clock validation of repeated delayed checks over hrs/days.
- Full repo suite:
  - No full project test run beyond `tests/test_api.py`.
- Live prod behavior:
  - No live operator session to confirm FE polling / UX behavior under active BG scheduler updates.

## Non-Negotiable Scope Rule

- Do not let self-improve touch trading strategy, order placement, execution logic, market behavior, or risk logic.
- Keep the self-improvement lane strictly limited to Jarvis-only capabilities and its own internal improvement infrastructure.
