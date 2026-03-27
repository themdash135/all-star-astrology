# Admin Area V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lean internal admin system for monitoring product health, output quality, user feedback, and session behavior.

**Architecture:** File-based JSON/JSONL persistence in `Saved/admin/` (consistent with existing telemetry pattern). Single `backend/admin.py` module for all admin logic + API endpoints. Frontend admin as a separate view in `App.jsx` gated by admin key, with 5 tab pages (Health, Quality, Feedback, Analytics, Sessions).

**Tech Stack:** FastAPI (existing), React 18 (existing), file-based JSON/JSONL storage, CSS-in-JS (existing pattern)

---

## File Structure

### Backend
- **Create:** `backend/admin.py` — Storage, quality heuristics, health aggregation, analytics events, all admin API endpoints
- **Modify:** `backend/main.py` — Mount admin router, hook into reading/compatibility/ask endpoints to persist results and log errors

### Frontend
- **Create:** `frontend/src/components/AdminApp.jsx` — Admin shell with auth gate and tab navigation
- **Create:** `frontend/src/components/AdminHealth.jsx` — Health dashboard page
- **Create:** `frontend/src/components/AdminQuality.jsx` — Quality monitor page
- **Create:** `frontend/src/components/AdminFeedback.jsx` — Feedback admin page
- **Create:** `frontend/src/components/AdminAnalytics.jsx` — Usage analytics page
- **Create:** `frontend/src/components/AdminSessions.jsx` — Session inspector + detail view
- **Modify:** `frontend/src/app/styles.js` — Admin-specific CSS
- **Modify:** `frontend/src/App.jsx` — Add admin view routing (hash-based: `#admin`)

### Tests
- **Create:** `tests/test_admin.py` — Backend admin module tests

### Storage Directories (auto-created)
- `Saved/admin/readings/` — persisted reading results
- `Saved/admin/compatibility/` — persisted compatibility results
- `Saved/admin/errors.jsonl` — error log
- `Saved/admin/analytics.jsonl` — event log

---

## Task 1: Backend Admin Storage + Quality Heuristics

**Files:**
- Create: `backend/admin.py`

- [ ] **Step 1: Create admin.py with storage helpers**

```python
"""Admin module — storage, quality heuristics, health aggregation, analytics."""
from __future__ import annotations

import datetime
import json
import os
import re
import time
import uuid
from collections import Counter
from pathlib import Path
from typing import Any

_ADMIN_DIR = Path(os.getenv("ADMIN_STORAGE_DIR", "Saved/admin"))
_READINGS_DIR = _ADMIN_DIR / "readings"
_COMPAT_DIR = _ADMIN_DIR / "compatibility"
_ERRORS_FILE = _ADMIN_DIR / "errors.jsonl"
_ANALYTICS_FILE = _ADMIN_DIR / "analytics.jsonl"

def _ensure_dirs():
    for d in [_READINGS_DIR, _COMPAT_DIR, _ADMIN_DIR]:
        d.mkdir(parents=True, exist_ok=True)

_ensure_dirs()


# ── Persistence ──────────────────────────────────────────────────

def save_reading(result: dict, request_meta: dict | None = None) -> str:
    ts = datetime.datetime.now(datetime.timezone.utc)
    rid = f"r-{ts.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8]}"
    record = {
        "id": rid,
        "type": "reading",
        "created": ts.isoformat(),
        "duration_ms": request_meta.get("duration_ms") if request_meta else None,
        "input_summary": _safe_input_summary(result.get("meta", {})),
        "quality": score_reading(result),
        "result": result,
    }
    (_READINGS_DIR / f"{rid}.json").write_text(json.dumps(record, default=str), encoding="utf-8")
    return rid


def save_compatibility(result: dict, request_meta: dict | None = None) -> str:
    ts = datetime.datetime.now(datetime.timezone.utc)
    cid = f"c-{ts.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8]}"
    record = {
        "id": cid,
        "type": "compatibility",
        "created": ts.isoformat(),
        "duration_ms": request_meta.get("duration_ms") if request_meta else None,
        "user_name": result.get("user_name", ""),
        "partner_name": result.get("partner_name", ""),
        "overall_score": result.get("overall_score"),
        "verdict": result.get("verdict", ""),
        "intent": result.get("intent", ""),
        "input_summary": {
            "user": _safe_input_summary(result.get("user_meta", {})),
            "partner": _safe_input_summary(result.get("partner_meta", {})),
        },
        "quality": score_compatibility(result),
        "result": result,
    }
    (_COMPAT_DIR / f"{cid}.json").write_text(json.dumps(record, default=str), encoding="utf-8")
    return cid


def log_error(endpoint: str, error: str, details: dict | None = None) -> None:
    entry = {
        "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "endpoint": endpoint,
        "error": str(error)[:500],
        "details": details or {},
    }
    with open(_ERRORS_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, default=str) + "\n")


def log_event(event: str, props: dict | None = None) -> None:
    entry = {
        "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "event": event,
        **(props or {}),
    }
    with open(_ANALYTICS_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, default=str) + "\n")


def _safe_input_summary(meta: dict) -> dict:
    return {
        "location": meta.get("birth_location", meta.get("resolved_location", "")),
        "timezone": meta.get("timezone", ""),
        "birth_date": meta.get("birth_date", ""),
        "data_complete": bool(meta.get("birth_date") and meta.get("birth_time") and meta.get("timezone")),
    }


# ── Quality Heuristics ──────────────────────────────────────────

_FALLBACK_PHRASES = [
    "the stars suggest", "cosmic energy", "universal forces",
    "trust the process", "everything happens for a reason",
    "the universe has a plan", "stay open to possibilities",
]

def _check_section(data: dict, key: str, min_chars: int = 80) -> dict:
    val = data.get(key)
    if val is None:
        return {"present": False, "chars": 0, "flag": f"missing_{key}"}
    if isinstance(val, str):
        chars = len(val)
    elif isinstance(val, dict):
        chars = sum(len(str(v)) for v in val.values())
    elif isinstance(val, list):
        chars = sum(len(str(v)) for v in val)
    else:
        chars = len(str(val))
    flag = f"short_{key}" if chars < min_chars else None
    return {"present": True, "chars": chars, "flag": flag}


def _count_fallbacks(text: str) -> int:
    lower = text.lower()
    return sum(1 for phrase in _FALLBACK_PHRASES if phrase in lower)


def _detect_repetition(texts: list[str], threshold: int = 3) -> bool:
    phrases = []
    for t in texts:
        words = t.lower().split()
        for i in range(len(words) - 3):
            phrases.append(" ".join(words[i:i+4]))
    counts = Counter(phrases)
    return any(c >= threshold for c in counts.values())


def score_reading(result: dict) -> dict:
    flags = []
    sections = {}
    systems = result.get("systems", {})
    combined = result.get("combined", {})
    daily = result.get("daily", {})

    for sys_id in ["western", "vedic", "chinese", "bazi", "numerology", "kabbalistic", "gematria", "persian"]:
        s = _check_section(systems, sys_id, min_chars=50)
        sections[sys_id] = s
        if s.get("flag"):
            flags.append(s["flag"])

    c = _check_section({"combined": combined}, "combined", min_chars=100)
    sections["combined"] = c
    if c.get("flag"):
        flags.append(c["flag"])

    d = _check_section({"daily": daily}, "daily", min_chars=40)
    sections["daily"] = d
    if d.get("flag"):
        flags.append(d["flag"])

    all_text = json.dumps(result, default=str)
    fallback_count = _count_fallbacks(all_text)
    if fallback_count >= 5:
        flags.append("fallback_heavy")

    status = "healthy" if not flags else ("review" if len(flags) <= 2 else "poor")
    return {"status": status, "flags": flags, "fallback_count": fallback_count, "sections": sections}


def score_compatibility(result: dict) -> dict:
    flags = []
    sections = {}

    checks = [
        ("tier1_synthesis", 100),
        ("relationship_roles", 80),
        ("when_you_clash", 80),
        ("relationship_playbook", 100),
        ("couple_guide", 100),
    ]
    for key, min_c in checks:
        s = _check_section(result, key, min_chars=min_c)
        sections[key] = s
        if s.get("flag"):
            flags.append(s["flag"])

    # Check per-system results
    systems = result.get("systems", {})
    for sys_id, sys_data in systems.items():
        if not sys_data or not isinstance(sys_data, dict):
            flags.append(f"missing_system_{sys_id}")

    # Repetition check across narrative sections
    narratives = []
    for key in ["tier1_synthesis", "relationship_roles", "when_you_clash", "relationship_playbook"]:
        val = result.get(key)
        if isinstance(val, dict):
            narratives.extend(str(v) for v in val.values() if isinstance(v, str) and len(v) > 20)
        elif isinstance(val, str):
            narratives.append(val)
    if _detect_repetition(narratives):
        flags.append("repetitive_language")

    all_text = json.dumps(result, default=str)
    fallback_count = _count_fallbacks(all_text)
    if fallback_count >= 5:
        flags.append("fallback_heavy")

    if len(all_text) > 1000 and all_text.rstrip().endswith("..."):
        flags.append("possible_truncation")

    status = "healthy" if not flags else ("review" if len(flags) <= 2 else "poor")
    return {"status": status, "flags": flags, "fallback_count": fallback_count, "sections": sections}


# ── Health Aggregation ───────────────────────────────────────────

def get_health_stats() -> dict:
    now = datetime.datetime.now(datetime.timezone.utc)
    day_ago = now - datetime.timedelta(hours=24)
    week_ago = now - datetime.timedelta(days=7)

    readings_24h, readings_7d = 0, 0
    compat_24h, compat_7d = 0, 0
    failed_count = 0
    durations = []

    for f in _READINGS_DIR.glob("*.json"):
        try:
            rec = json.loads(f.read_text(encoding="utf-8"))
            created = datetime.datetime.fromisoformat(rec["created"])
            if created >= week_ago:
                readings_7d += 1
                if rec.get("duration_ms"):
                    durations.append(rec["duration_ms"])
            if created >= day_ago:
                readings_24h += 1
        except Exception:
            pass

    for f in _COMPAT_DIR.glob("*.json"):
        try:
            rec = json.loads(f.read_text(encoding="utf-8"))
            created = datetime.datetime.fromisoformat(rec["created"])
            if created >= week_ago:
                compat_7d += 1
                if rec.get("duration_ms"):
                    durations.append(rec["duration_ms"])
            if created >= day_ago:
                compat_24h += 1
        except Exception:
            pass

    errors_24h, errors_7d = 0, 0
    recent_errors = []
    if _ERRORS_FILE.exists():
        for line in _ERRORS_FILE.read_text(encoding="utf-8").strip().splitlines()[-500:]:
            try:
                entry = json.loads(line)
                ts = datetime.datetime.fromisoformat(entry["ts"])
                if ts >= week_ago:
                    errors_7d += 1
                    if ts >= day_ago:
                        errors_24h += 1
                    recent_errors.append(entry)
            except Exception:
                pass

    avg_ms = round(sum(durations) / len(durations)) if durations else None
    slowest_ms = round(max(durations)) if durations else None
    total_24h = readings_24h + compat_24h
    total_7d = readings_7d + compat_7d

    return {
        "total_generations_24h": total_24h,
        "total_generations_7d": total_7d,
        "readings_24h": readings_24h,
        "readings_7d": readings_7d,
        "compatibility_24h": compat_24h,
        "compatibility_7d": compat_7d,
        "errors_24h": errors_24h,
        "errors_7d": errors_7d,
        "failed_count": errors_7d,
        "avg_response_ms": avg_ms,
        "slowest_response_ms": slowest_ms,
        "success_rate_7d": round((total_7d / (total_7d + errors_7d)) * 100, 1) if (total_7d + errors_7d) > 0 else None,
        "recent_errors": recent_errors[-10:],
    }


# ── Analytics Aggregation ────────────────────────────────────────

def get_analytics(days: int = 7) -> dict:
    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=days)
    events = []
    if _ANALYTICS_FILE.exists():
        for line in _ANALYTICS_FILE.read_text(encoding="utf-8").strip().splitlines():
            try:
                entry = json.loads(line)
                ts = datetime.datetime.fromisoformat(entry["ts"])
                if ts >= cutoff:
                    events.append(entry)
            except Exception:
                pass

    event_counts = Counter(e.get("event", "unknown") for e in events)
    section_views = Counter(
        e.get("section", "unknown")
        for e in events if e.get("event") == "section_view"
    )

    return {
        "period_days": days,
        "total_events": len(events),
        "event_counts": dict(event_counts.most_common(20)),
        "section_views": dict(section_views.most_common(20)),
        "recent_events": events[-50:],
    }


# ── Session Listing + Detail ────────────────────────────────────

def list_sessions(limit: int = 50, offset: int = 0, type_filter: str | None = None) -> dict:
    all_records = []

    if type_filter in (None, "reading"):
        for f in sorted(_READINGS_DIR.glob("*.json"), reverse=True):
            try:
                rec = json.loads(f.read_text(encoding="utf-8"))
                all_records.append({
                    "id": rec["id"],
                    "type": "reading",
                    "created": rec["created"],
                    "duration_ms": rec.get("duration_ms"),
                    "quality_status": rec.get("quality", {}).get("status", "unknown"),
                    "quality_flags": rec.get("quality", {}).get("flags", []),
                    "input_summary": rec.get("input_summary", {}),
                })
            except Exception:
                pass

    if type_filter in (None, "compatibility"):
        for f in sorted(_COMPAT_DIR.glob("*.json"), reverse=True):
            try:
                rec = json.loads(f.read_text(encoding="utf-8"))
                all_records.append({
                    "id": rec["id"],
                    "type": "compatibility",
                    "created": rec["created"],
                    "duration_ms": rec.get("duration_ms"),
                    "overall_score": rec.get("overall_score"),
                    "verdict": rec.get("verdict", ""),
                    "quality_status": rec.get("quality", {}).get("status", "unknown"),
                    "quality_flags": rec.get("quality", {}).get("flags", []),
                    "user_name": rec.get("user_name", ""),
                    "partner_name": rec.get("partner_name", ""),
                })
            except Exception:
                pass

    all_records.sort(key=lambda r: r["created"], reverse=True)
    return {
        "total": len(all_records),
        "offset": offset,
        "limit": limit,
        "sessions": all_records[offset:offset + limit],
    }


def get_session(session_id: str) -> dict | None:
    for directory in [_READINGS_DIR, _COMPAT_DIR]:
        path = directory / f"{session_id}.json"
        if path.exists():
            try:
                return json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                return None
    return None


# ── Quality Summary ──────────────────────────────────────────────

def get_quality_summary(limit: int = 50) -> dict:
    records = []
    for directory in [_COMPAT_DIR, _READINGS_DIR]:
        for f in sorted(directory.glob("*.json"), reverse=True)[:limit]:
            try:
                rec = json.loads(f.read_text(encoding="utf-8"))
                quality = rec.get("quality", {})
                records.append({
                    "id": rec["id"],
                    "type": rec.get("type", "unknown"),
                    "created": rec["created"],
                    "status": quality.get("status", "unknown"),
                    "flags": quality.get("flags", []),
                    "fallback_count": quality.get("fallback_count", 0),
                    "sections": quality.get("sections", {}),
                })
            except Exception:
                pass

    records.sort(key=lambda r: r["created"], reverse=True)
    records = records[:limit]

    status_counts = Counter(r["status"] for r in records)
    all_flags = Counter(f for r in records for f in r["flags"])

    return {
        "total_reviewed": len(records),
        "status_counts": dict(status_counts),
        "top_flags": dict(all_flags.most_common(15)),
        "sessions": records,
    }
```

- [ ] **Step 2: Verify module imports correctly**

Run: `cd Y:/Astrology_App && .venv/Scripts/python.exe -c "from backend import admin; print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/admin.py
git commit -m "feat(admin): add admin storage, quality heuristics, and aggregation module"
```

---

## Task 2: Hook Into Existing Endpoints

**Files:**
- Modify: `backend/main.py`

- [ ] **Step 1: Add admin import and hook reading/compatibility/ask endpoints**

At top of main.py, add:
```python
from backend import admin as admin_module
```

In the `reading()` handler, after building the result dict but before returning, add:
```python
    duration_ms = ...  # measure with time.perf_counter
    admin_module.save_reading(result, {"duration_ms": duration_ms})
```

In the `compatibility()` handler, same pattern:
```python
    admin_module.save_compatibility(analysis, {"duration_ms": duration_ms})
```

In both handlers' exception blocks, add:
```python
    admin_module.log_error("/api/reading", str(exc))
```

- [ ] **Step 2: Mount admin API routes**

Add admin API endpoints to main.py using the admin module functions:
- `GET /api/admin/health` — returns `admin_module.get_health_stats()`
- `GET /api/admin/quality` — returns `admin_module.get_quality_summary()`
- `GET /api/admin/analytics` — returns `admin_module.get_analytics()`
- `GET /api/admin/sessions` — returns `admin_module.list_sessions()`
- `GET /api/admin/sessions/{session_id}` — returns `admin_module.get_session()`
- `POST /api/admin/analytics/event` — calls `admin_module.log_event()` (for frontend tracking)

All admin endpoints require `X-Backend-Key` header matching `_ADMIN_SECRET`.

- [ ] **Step 3: Verify server starts and health endpoint works**

Run: `.venv/Scripts/python.exe -c "from backend.main import app; print('app loaded OK')"`

- [ ] **Step 4: Commit**

```bash
git add backend/main.py
git commit -m "feat(admin): hook reading/compat persistence, mount admin API endpoints"
```

---

## Task 3: Admin CSS

**Files:**
- Modify: `frontend/src/app/styles.js`

- [ ] **Step 1: Add admin-specific styles**

Append admin styles to the styles string — internal-tool aesthetic: clean tables, status badges, card metrics, desktop-first. Key classes:
- `.admin-shell` — full-screen container with sidebar nav
- `.admin-nav` — left sidebar with tab links
- `.admin-page` — scrollable content area
- `.admin-card` — metric cards with label/value
- `.admin-table` — clean data tables with hover
- `.admin-badge` — status badges (healthy/review/poor)
- `.admin-gate` — centered auth form
- `.admin-filter` — filter bar with selects/inputs
- `.admin-detail` — session detail layout
- `.admin-section` — collapsible content sections
- `.admin-empty` — empty state messaging

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/styles.js
git commit -m "feat(admin): add admin UI styles"
```

---

## Task 4: Admin Gate + Shell (AdminApp.jsx)

**Files:**
- Create: `frontend/src/components/AdminApp.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Create AdminApp.jsx**

Auth gate: text input for admin key, stored in sessionStorage. On valid key, show admin shell with 5 tabs: Health, Quality, Feedback, Analytics, Sessions.

Tab navigation renders the corresponding page component. All admin API calls include `X-Backend-Key` header.

Shared `adminFetch(endpoint)` helper that adds the key header.

- [ ] **Step 2: Wire into App.jsx**

Detect `#admin` in URL hash. When present, render `<AdminApp />` instead of the consumer app. Add a `hashchange` listener.

- [ ] **Step 3: Verify admin gate renders**

Run: `cd frontend && npm run build`
Expected: builds without errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/AdminApp.jsx frontend/src/App.jsx
git commit -m "feat(admin): add admin shell with auth gate and tab navigation"
```

---

## Task 5: Health Dashboard (AdminHealth.jsx)

**Files:**
- Create: `frontend/src/components/AdminHealth.jsx`

- [ ] **Step 1: Create health dashboard component**

Calls `GET /api/admin/health`. Displays:
- Summary cards: total generations (24h/7d), errors (24h/7d), avg response time, success rate
- Recent failures table: timestamp, endpoint, error message
- Response time indicator (avg + slowest)

Includes loading spinner and empty state.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AdminHealth.jsx
git commit -m "feat(admin): add health dashboard page"
```

---

## Task 6: Quality Monitor (AdminQuality.jsx)

**Files:**
- Create: `frontend/src/components/AdminQuality.jsx`

- [ ] **Step 1: Create quality monitor component**

Calls `GET /api/admin/quality`. Displays:
- Summary cards: status distribution (healthy/review/poor), top flags
- Sessions table with columns: ID, type, date, status badge, flags, section presence indicators, fallback count
- Click row to navigate to session detail (sets tab to Sessions with selected ID)
- Filter by status and type

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AdminQuality.jsx
git commit -m "feat(admin): add quality monitor page"
```

---

## Task 7: Feedback Admin (AdminFeedback.jsx)

**Files:**
- Create: `frontend/src/components/AdminFeedback.jsx`

- [ ] **Step 1: Create feedback admin component**

Calls `GET /api/feedback/admin` (existing endpoint). Displays:
- Ticket list with category, message preview, timestamp, response status
- Click to expand full message and responses
- Inline reply form that calls `POST /api/feedback/respond`
- Filter by category, has_response status

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AdminFeedback.jsx
git commit -m "feat(admin): add feedback admin page"
```

---

## Task 8: Analytics Dashboard (AdminAnalytics.jsx)

**Files:**
- Create: `frontend/src/components/AdminAnalytics.jsx`

- [ ] **Step 1: Create analytics component**

Calls `GET /api/admin/analytics`. Displays:
- Summary cards: total events, top events by count
- Section views ranked list (most to least viewed)
- Recent events table
- Period selector (7d / 30d)

- [ ] **Step 2: Add frontend event tracking**

Add a `trackEvent(event, props)` function in `frontend/src/app/api.js` that POSTs to `/api/admin/analytics/event`. Call it from key user actions:
- Section tab changes (section_view)
- Reading generated (reading_complete)
- Compatibility generated (compatibility_complete)
- Oracle question asked (oracle_ask)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AdminAnalytics.jsx frontend/src/app/api.js
git commit -m "feat(admin): add analytics dashboard and frontend event tracking"
```

---

## Task 9: Session Inspector (AdminSessions.jsx)

**Files:**
- Create: `frontend/src/components/AdminSessions.jsx`

- [ ] **Step 1: Create session list + detail component**

**List view:** Calls `GET /api/admin/sessions`. Table with: ID, type, date, quality status, flags, duration. Filter by type. Click row for detail.

**Detail view:** Calls `GET /api/admin/sessions/{id}`. Shows:
- Session metadata (ID, type, date, duration, input summary)
- Quality flags with badges
- For compatibility: overall score, verdict, intent, names
- Expandable sections for each generated section (tier1_synthesis, relationship_roles, when_you_clash, relationship_playbook, per-system results)
- For readings: expandable per-system output, combined, daily
- Section char counts and quality indicators
- Back button to return to list

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/AdminSessions.jsx
git commit -m "feat(admin): add session inspector with list and detail views"
```

---

## Task 10: Hardening + Empty States

**Files:**
- Modify: all admin frontend components

- [ ] **Step 1: Add loading, error, and empty states to all pages**

Each page should handle:
- Loading: show spinner while fetching
- Error: show error message with retry button
- Empty: show helpful message when no data exists yet

- [ ] **Step 2: Verify frontend builds**

Run: `cd frontend && npm run build`
Expected: builds clean

- [ ] **Step 3: Commit**

```bash
git add -A frontend/src/components/Admin*.jsx
git commit -m "feat(admin): add loading, error, and empty states to all admin pages"
```

---

## Task 11: Backend Tests

**Files:**
- Create: `tests/test_admin.py`

- [ ] **Step 1: Write tests**

Test coverage for:
- `score_reading()` — healthy result, result with missing systems, fallback-heavy result
- `score_compatibility()` — healthy result, missing tier1_synthesis, repetitive language detection
- `save_reading()` / `save_compatibility()` — files created, JSON valid
- `get_health_stats()` — returns correct shape with empty data and with saved records
- `list_sessions()` — returns records sorted by date, respects type filter
- `get_session()` — returns record by ID, returns None for missing ID
- `log_error()` / `log_event()` — appends to JSONL files
- `get_quality_summary()` — aggregates status counts and flags correctly
- `get_analytics()` — filters by date range, counts events

- [ ] **Step 2: Run tests**

Run: `.venv/Scripts/python.exe -m pytest tests/test_admin.py -v`
Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add tests/test_admin.py
git commit -m "test(admin): add backend admin module test coverage"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `.venv/Scripts/python.exe -m pytest tests/test_admin.py tests/test_fixes.py tests/test_api_validation.py tests/test_daily_content.py -v`

- [ ] **Step 2: Build frontend**

Run: `cd frontend && npm run build`

- [ ] **Step 3: Final commit if needed**
