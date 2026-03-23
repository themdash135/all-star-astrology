# Daily Content Engine Phase A Plan

> Small-scope implementation plan for adding a backend-owned daily-content payload without changing the existing reading engines' score behavior.

## Scope
- Add `backend/engines/daily.py`
- Attach `daily` to the `POST /api/reading` response
- Update the Home tab to consume `result.daily` with fallback behavior
- Add backend and frontend tests

## Steps
- [x] Define the Phase A response contract in a spec file
- [x] Implement a deterministic daily-content engine over `context`, `systems`, and `combined`
- [x] Wire the engine into `backend/main.py`
- [x] Add backend tests for engine shape and API response coverage
- [x] Update frontend helpers and Home view to prefer backend daily content
- [x] Add frontend test coverage for the new preference/fallback path
- [ ] Run backend tests
- [ ] Run frontend tests
- [ ] Run frontend build and Capacitor sync
- [ ] Re-run Android `assembleDebug` with Java 11+
- [ ] Attempt device install / `adb reverse` if a device is available
- [ ] Update `CLAUDE.md` with the new structure and verification state
