# Handoff - 2026-03-11

## Status

The app is in a solid local-development state, not a store-distribution state.

Backend daily guidance, Oracle Q&A, Android debug builds, and connected-device testing are working. The current product shape is Oracle-first, with Home merged into Oracle and the bottom navigation reduced to `Oracle | Systems | Combined | You`.

As of **March 13, 2026**, the current debug APK was reinstalled and relaunched successfully on two physical Android phones in this workspace:

- Samsung `SM_F900U`
- Vivo `V2337A`

The app still depends on the local backend at `http://127.0.0.1:8892`, and the practical failure mode on real devices is unchanged: if `adb reverse tcp:8892 tcp:8892` drops, the app may still open but reading generation will fail with a fetch/network-style error until the reverse mapping is restored.

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

## Current Navigation

- `Oracle`
- `Systems`
- `Combined`
- `You`

## Key Files Changed

- `backend/main.py`
- `backend/engines/oracle.py`
- `backend/engines/daily.py`
- `frontend/src/App.jsx`
- `frontend/src/app/constants.js`
- `frontend/src/app/storage.js`
- `frontend/src/app/helpers.js`
- `frontend/src/app/styles.js`
- `frontend/src/hooks/useMotionMode.js`
- `frontend/src/components/SplashScreen.jsx`
- `frontend/src/components/LoadingOverlay.jsx`
- `frontend/src/components/OnboardingScreen.jsx`
- `frontend/src/components/OracleScreen.jsx`
- `frontend/src/components/MainViews.jsx`
- `frontend/src/components/common.jsx`
- `frontend/package.json`
- `frontend/capacitor.config.ts`
- `frontend/src/app/helpers.test.js`
- `frontend/src/app/motion.test.js`
- `tests/test_api_validation.py`
- `tests/test_daily_content.py`
- `tests/test_fixes.py`
- `docs/superpowers/specs/2026-03-12-daily-content-engine-phase-a.md`
- `docs/superpowers/plans/2026-03-12-daily-content-engine-phase-a.md`
- `CLAUDE.md`

## Verification

Latest verified locally on **March 13, 2026**:

- `.venv\Scripts\python.exe -m pytest tests -q` passed: `56 passed`
- `frontend\npm run test` passed: `12 passed`
- `frontend\npm run build` passed
- `frontend\npx cap sync android` passed
- `frontend\android\gradlew.bat assembleDebug` passed when `JAVA_HOME` points to `Y:\android_studio\jbr` and Android SDK env vars are set
- `adb install -r frontend\android\app\build\outputs\apk\debug\app-debug.apk` passed previously in this workspace during Android verification
- `adb reverse tcp:8892 tcp:8892` and app relaunch were used repeatedly to refresh the connected phone during UI iteration
- `.venv\Scripts\python.exe -m uvicorn backend.main:app --host 0.0.0.0 --port 8892` was started locally for device testing and `/api/health` responded with `200`
- Reinstalled the current debug APK onto Samsung `SM_F900U` and Vivo `V2337A`
- Confirmed the Samsung device hit `POST /api/reading` successfully after `adb reverse tcp:8892 tcp:8892` was restored and the app was relaunched
- Confirmed the Vivo device had the APK installed, the app process running, and `adb reverse --list` showing `tcp:8892 tcp:8892`

## Current Reality / Not Done Yet

- The app is still configured like a development build for native device testing:
  - `frontend/capacitor.config.ts` includes `server.url = 'http://127.0.0.1:8892'`
  - Android generated config mirrors that dev server setting
  - This means the installed app depends on the local backend and, for a physical Android phone, `adb reverse`
  - if the USB/ADB session resets, the reverse mapping can disappear silently; in that state the app may launch but reading generation fails until `adb reverse tcp:8892 tcp:8892` is run again and the app is relaunched
- Store billing is not wired:
  - `Manage Subscription` is UI-only
  - no Google Play Billing / App Store subscription implementation yet
- `Rate This App` and `Share with Friends` are intentionally deferred until store-launch work
- No iOS native project is present in this workspace yet
- Production deployment work is still outstanding:
  - remove Capacitor dev `server.url`
  - serve bundled app assets in native builds
  - use a real hosted backend over HTTPS
  - create release signing / release config
  - prepare store metadata, assets, privacy disclosures, and submission requirements
- The workspace is still not a git repository, so normal branch/commit workflow is unavailable here

## Next Steps

1. Convert the native app from dev-server mode to production mode:
   - remove `server.url` from `frontend/capacitor.config.ts`
   - rebuild frontend assets
   - sync native projects again
2. Decide the production backend plan:
   - hosting target
   - HTTPS domain
   - environment config
   - mobile API base strategy
3. Implement real subscriptions:
   - Google Play Billing
   - Apple App Store subscriptions
   - account/state handling in app
4. Add iOS support:
   - install Capacitor iOS package
   - create `frontend/ios`
   - test on real iPhone / simulator
5. Run distribution QA:
   - Android release build
   - iOS archive/build
   - offline/error-state testing
   - legal/store copy review
