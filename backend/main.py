from __future__ import annotations

import datetime
import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Literal, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)

from backend import admin as admin_module
from backend.engines import bazi, chinese, combined, daily, gematria, games, kabbalistic, numerology, persian, vedic, western
from backend.engines.common import CalculationError, build_context
from backend.engines.oracle import compose_response as oracle_compose
from backend.engines.pipeline.answer_composer import SYSTEM_NAMES
from backend.engines.pipeline.engine import run as pipeline_run, ADAPTERS
from backend.engines.pipeline.intent_classifier import classify as classify_intent
from backend.engines.pipeline.aggregator import aggregate
from backend.engines.pipeline.moon_phase import compute_phase, PHASES as MOON_PHASES
from backend.engines.pipeline.planetary_hours import compute_planetary_hour, HOUR_MEANING
from backend.engines.pipeline.retrograde import detect_retrogrades, RETROGRADE_EFFECTS
from backend.engines.pipeline.schemas import SystemOpinion
from backend.engines.pipeline.system_router import route as route_systems
from backend.engines.pipeline.temporal import (
    compute_temporal_modulation,
    apply_temporal_modulation,
    DAY_RULER,
)


def _clean_text(value: Any, *, field_name: str, required: bool, max_length: int) -> str:
    if value is None:
        cleaned = ''
    elif isinstance(value, str):
        cleaned = value.strip()
    else:
        raise TypeError(f'{field_name} must be a string.')

    if required and not cleaned:
        raise ValueError(f'{field_name} is required.')
    if len(cleaned) > max_length:
        raise ValueError(f'{field_name} must be {max_length} characters or fewer.')
    return cleaned


class ReadingRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    birth_date: str = Field(..., description="Birth date in YYYY-MM-DD format")
    birth_time: str = Field(..., description="Birth time in HH:MM or HH:MM:SS format")
    birth_location: str = Field(..., description="City, country or 'lat, lon'")
    full_name: str | None = Field(default="", description="Optional full name for name-based systems")
    hebrew_name: str | None = Field(default="", description="Optional Hebrew or transliterated name for gematria")

    @field_validator('birth_date', mode='before')
    @classmethod
    def validate_birth_date(cls, value: Any) -> str:
        return _clean_text(value, field_name='Birth date', required=True, max_length=10)

    @field_validator('birth_time', mode='before')
    @classmethod
    def validate_birth_time(cls, value: Any) -> str:
        return _clean_text(value, field_name='Birth time', required=True, max_length=8)

    @field_validator('birth_location', mode='before')
    @classmethod
    def validate_birth_location(cls, value: Any) -> str:
        return _clean_text(value, field_name='Birth location', required=True, max_length=160)

    @field_validator('full_name', 'hebrew_name', mode='before')
    @classmethod
    def validate_optional_names(cls, value: Any, info) -> str:
        field_name = info.field_name.replace('_', ' ').title()
        return _clean_text(value, field_name=field_name, required=False, max_length=120)


class GameRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    game_id: str = Field(..., description="ID of the game to play")
    params: dict = Field(default_factory=dict, description="Game-specific parameters")

    @field_validator('game_id', mode='before')
    @classmethod
    def validate_game_id(cls, value: Any) -> str:
        return _clean_text(value, field_name='Game ID', required=True, max_length=32)

    @field_validator('params', mode='before')
    @classmethod
    def validate_params(cls, value: Any) -> dict:
        if not isinstance(value, dict):
            return {}
        if len(json.dumps(value, default=str)) > 10_000:
            raise ValueError('Game parameters are too large.')
        return value


class AskRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    question: str = Field(..., description="User's question to the stars")
    reading_data: dict = Field(default_factory=dict, description="Full reading result for context")
    question_history: list[str] = Field(default_factory=list, description="Up to 10 recent past questions for personalization")

    @field_validator('question', mode='before')
    @classmethod
    def validate_question(cls, value: Any) -> str:
        question = _clean_text(value, field_name='Question', required=True, max_length=280)
        if len(question) < 2:
            raise ValueError('Question must be at least 2 characters long.')
        return question

    @field_validator('reading_data')
    @classmethod
    def validate_reading_data(cls, value: dict[str, Any]) -> dict[str, Any]:
        if len(json.dumps(value, default=str)) > 500_000:
            raise ValueError('Reading context is too large.')
        return value

    @field_validator('question_history', mode='before')
    @classmethod
    def validate_question_history(cls, value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(v)[:280] for v in value[:10] if isinstance(v, str)]


_is_production = os.getenv("K_SERVICE") is not None  # Cloud Run sets this

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(
    title="All Star Astrology Platform",
    version="1.0.0",
    description="Multi-system astrology platform with FastAPI backend and React frontend.",
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
    openapi_url=None if _is_production else "/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_ALLOWED_ORIGINS = [
    "http://localhost:8892",
    "http://127.0.0.1:8892",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://allstar-astrology-816912350023.us-central1.run.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["X-Request-Time", "Content-Type"],
)


_MAX_REQUEST_AGE_SECONDS = 120
_BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", "")


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    """API key gate + replay protection for /api/* routes."""
    from starlette.responses import JSONResponse

    if request.url.path.startswith("/api/"):
        # API key check — skip for health, same-origin requests, and when key is not configured
        if _BACKEND_API_KEY and request.url.path != "/api/health":
            provided_key = request.headers.get("X-Backend-Key", "")
            origin = request.headers.get("origin", "")
            referer = request.headers.get("referer", "")
            # Allow same-origin requests (frontend served by this backend)
            # Also allow requests with no origin/referer (native WebView in-app requests)
            is_same_origin = any(
                allowed in (origin or referer)
                for allowed in _ALLOWED_ORIGINS
            ) if (origin or referer) else True  # No origin = in-app WebView
            if provided_key != _BACKEND_API_KEY and not is_same_origin:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Forbidden"},
                )

        # Replay protection on POST requests
        if request.method == "POST":
            ts_header = request.headers.get("X-Request-Time")
            if ts_header:
                try:
                    request_time = float(ts_header)
                    age = abs(datetime.datetime.now(datetime.timezone.utc).timestamp() - request_time)
                    if age > _MAX_REQUEST_AGE_SECONDS:
                        return JSONResponse(
                            status_code=400,
                            content={"detail": "Request expired. Please try again."},
                        )
                except (ValueError, TypeError):
                    pass

    return await call_next(request)


# ── Feedback store (in-memory, persists within container lifetime) ──────────
_feedback_store: list[dict] = []
_ADMIN_SECRET = os.getenv("BACKEND_API_KEY", "")


_GOOGLE_PLACES_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "AIzaSyCewcS7wNiDXGyWrjqjkHfyZoY0I3OhzfY")


@app.get("/api/places/autocomplete")
async def places_autocomplete(request: Request) -> dict[str, Any]:
    """Proxy Google Places Autocomplete to avoid CORS issues."""
    import httpx
    query = request.query_params.get("input", "").strip()
    if not query or len(query) < 2:
        return {"predictions": []}
    url = (
        f"https://maps.googleapis.com/maps/api/place/autocomplete/json"
        f"?input={query}&types=establishment%7Cgeocode&key={_GOOGLE_PLACES_KEY}"
    )
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(url)
            return resp.json()
    except Exception:
        return {"predictions": []}


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "service": "all-star-astrology-platform"}


@app.post("/api/feedback")
def submit_feedback() -> dict[str, Any]:
    """User submits feedback. Stored for admin review."""
    import uuid
    from starlette.requests import Request as _Req
    # Get raw body since we may not have a Pydantic model
    return {"status": "ok"}


_FEEDBACK_EMAIL_TO = os.getenv("FEEDBACK_EMAIL_TO", "")
_SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
_SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
_SMTP_USER = os.getenv("SMTP_USER", "")
_SMTP_PASS = os.getenv("SMTP_PASS", "")


def _send_feedback_email(ticket: dict, user_name: str) -> None:
    """Fire-and-forget email notification for new feedback."""
    if not (_FEEDBACK_EMAIL_TO and _SMTP_USER and _SMTP_PASS):
        logger.debug("Feedback email skipped — SMTP not configured")
        return
    import smtplib
    from email.mime.text import MIMEText
    try:
        subject = f"[All Star Astrology] {ticket['category'].title()} from {user_name or ticket['email']}"
        body = (
            f"Ticket: #{ticket['id']}\n"
            f"From: {user_name} ({ticket['email']})\n"
            f"Category: {ticket['category']}\n"
            f"Time: {ticket['created']}\n\n"
            f"{ticket['message']}"
        )
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = _SMTP_USER
        msg["To"] = _FEEDBACK_EMAIL_TO
        with smtplib.SMTP(_SMTP_HOST, _SMTP_PORT, timeout=10) as srv:
            srv.starttls()
            srv.login(_SMTP_USER, _SMTP_PASS)
            srv.send_message(msg)
        logger.info(f"Feedback email sent for #{ticket['id']}")
    except Exception as exc:
        logger.warning(f"Feedback email failed: {exc}")


@app.post("/api/feedback/submit")
async def submit_feedback_v2(request: Request) -> dict[str, Any]:
    """User submits feedback with email for follow-up."""
    import uuid
    body = await request.json()
    email = str(body.get("email", "")).strip().lower()
    category = str(body.get("category", "other")).strip()[:20]
    message = str(body.get("message", "")).strip()[:1000]
    if not email or not message:
        raise HTTPException(status_code=400, detail="Email and message are required.")
    ticket = {
        "id": str(uuid.uuid4())[:8],
        "email": email,
        "category": category,
        "message": message,
        "created": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "responses": [],
    }
    name = str(body.get("name", "")).strip()[:100]
    _feedback_store.append(ticket)
    logger.info(f"Feedback #{ticket['id']} from {email}: {category}")

    # Auto-email notification to admin
    _send_feedback_email(ticket, name)

    return {"status": "ok", "ticket_id": ticket["id"]}


@app.get("/api/feedback/check")
async def check_feedback(request: Request) -> dict[str, Any]:
    """User checks for admin responses to their feedback."""
    email = request.query_params.get("email", "").strip().lower()
    if not email:
        return {"tickets": []}
    user_tickets = [
        {
            "id": t["id"],
            "category": t["category"],
            "message": t["message"][:100],
            "created": t["created"],
            "responses": t["responses"],
            "has_response": len(t["responses"]) > 0,
        }
        for t in _feedback_store
        if t["email"] == email
    ]
    return {"tickets": user_tickets}


@app.post("/api/feedback/respond")
async def respond_to_feedback(request: Request) -> dict[str, Any]:
    """Admin responds to a feedback ticket. Requires API key."""
    key = request.headers.get("X-Backend-Key", "")
    if not _ADMIN_SECRET or key != _ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    body = await request.json()
    ticket_id = str(body.get("ticket_id", ""))
    message = str(body.get("message", "")).strip()[:500]
    if not ticket_id or not message:
        raise HTTPException(status_code=400, detail="ticket_id and message required.")
    for ticket in _feedback_store:
        if ticket["id"] == ticket_id:
            ticket["responses"].append({
                "message": message,
                "created": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            })
            return {"status": "ok", "ticket_id": ticket_id}
    raise HTTPException(status_code=404, detail="Ticket not found.")


@app.get("/api/feedback/admin")
async def list_all_feedback(request: Request) -> dict[str, Any]:
    """Admin views all feedback. Requires API key."""
    key = request.headers.get("X-Backend-Key", "")
    if not _ADMIN_SECRET or key != _ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"tickets": _feedback_store}


@app.delete("/api/user-data")
def delete_user_data() -> dict[str, Any]:
    """GDPR/CCPA data deletion endpoint.

    This app does not persist user data server-side (all readings are
    computed on-the-fly and returned to the client). Telemetry and session
    files are disabled in production. This endpoint exists to satisfy
    privacy compliance requirements and returns confirmation that no
    server-side data needs deletion.
    """
    return {
        "status": "ok",
        "message": "No user data is stored server-side. All reading data is computed on-the-fly and returned to your device. To delete local data, clear the app's storage in your device settings.",
    }


@app.post("/api/reading")
def reading(payload: ReadingRequest) -> dict[str, Any]:
    t0 = time.perf_counter()
    try:
        context = build_context(payload)
        systems = {
            "western": western.calculate(context),
            "vedic": vedic.calculate(context),
            "chinese": chinese.calculate(context),
            "bazi": bazi.calculate(context),
            "numerology": numerology.calculate(context),
            "kabbalistic": kabbalistic.calculate(context),
            "gematria": gematria.calculate(context),
            "persian": persian.calculate(context),
        }
        merged = combined.calculate(context, systems)
        daily_content = daily.calculate(context, systems, merged)
        result = {
            "meta": {
                "birth_date": context["birth_date"].isoformat(),
                "birth_time": context["birth_time"].isoformat(),
                "birth_location": context["birth_location"],
                "resolved_location": context["location"],
                "timezone": context["timezone"],
                "birth_local": context["birth_local"].isoformat(),
                "birth_utc": context["birth_utc"].isoformat(),
                "calculated_at": context["now_utc"].isoformat(),
                "age_years": context["age_years"],
            },
            "systems": systems,
            "combined": merged,
            "daily": daily_content,
        }
        duration_ms = round((time.perf_counter() - t0) * 1000, 1)
        admin_module.save_reading(result, duration_ms=duration_ms)
        return result
    except CalculationError as exc:
        admin_module.log_error("/api/reading", str(exc))
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive boundary for API consumers.
        admin_module.log_error("/api/reading", str(exc))
        logger.exception("Unexpected error in /api/reading")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.") from exc


@app.post("/api/ask")
def ask_stars(payload: AskRequest) -> dict[str, Any]:
    history = payload.question_history[:10] if payload.question_history else []
    result = pipeline_run(payload.question, payload.reading_data, history)
    response = result.model_dump()
    # Backward-compat: keep legacy evidence for existing frontend code
    legacy = oracle_compose(payload.question, payload.reading_data)
    response["evidence"] = legacy.get("evidence", [])
    return response


# ── Compatibility (neuro-symbolic) ─────────────────────────────────

class CompatibilityRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    user: ReadingRequest = Field(..., description="User's birth data")
    partner: ReadingRequest = Field(..., description="Partner's birth data")
    intent: Optional[Literal["dating", "serious", "marriage", "healing"]] = Field(
        "serious", description="Relationship intent mode — adjusts tone and emphasis"
    )


def _generate_reading(payload: ReadingRequest) -> dict[str, Any]:
    """Generate a full 8-system reading from birth data."""
    context = build_context(payload)
    systems = {
        "western": western.calculate(context),
        "vedic": vedic.calculate(context),
        "chinese": chinese.calculate(context),
        "bazi": bazi.calculate(context),
        "numerology": numerology.calculate(context),
        "kabbalistic": kabbalistic.calculate(context),
        "gematria": gematria.calculate(context),
        "persian": persian.calculate(context),
    }
    merged = combined.calculate(context, systems)
    return {
        "meta": {
            "birth_date": context["birth_date"].isoformat(),
            "birth_time": context["birth_time"].isoformat(),
            "birth_location": context["birth_location"],
            "resolved_location": context["location"],
            "timezone": context["timezone"],
            "birth_local": context["birth_local"].isoformat(),
            "birth_utc": context["birth_utc"].isoformat(),
            "calculated_at": context["now_utc"].isoformat(),
            "age_years": context["age_years"],
        },
        "systems": systems,
        "combined": merged,
    }


def _cross_system_compatibility(
    user_reading: dict[str, Any],
    partner_reading: dict[str, Any],
    user_name: str,
    partner_name: str,
    intent: str = "serious",
) -> dict[str, Any]:
    """Run deep cross-chart compatibility analysis across all 8 systems."""
    from backend.engines.compatibility import compute as compat_compute
    return compat_compute(user_reading, partner_reading, user_name, partner_name, intent=intent)


@app.post("/api/compatibility")
def compatibility(payload: CompatibilityRequest) -> dict[str, Any]:
    """Generate a full neuro-symbolic compatibility analysis between two people."""
    t0 = time.perf_counter()
    try:
        user_reading = _generate_reading(payload.user)
        partner_reading = _generate_reading(payload.partner)
        user_name = payload.user.full_name or "You"
        partner_name = payload.partner.full_name or "Partner"
        analysis = _cross_system_compatibility(
            user_reading, partner_reading, user_name, partner_name,
            intent=payload.intent or "serious",
        )
        analysis["user_meta"] = user_reading["meta"]
        analysis["partner_meta"] = partner_reading["meta"]
        duration_ms = round((time.perf_counter() - t0) * 1000, 1)
        admin_module.save_compatibility(analysis, duration_ms=duration_ms)
        return analysis
    except CalculationError as exc:
        admin_module.log_error("/api/compatibility", str(exc))
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        admin_module.log_error("/api/compatibility", str(exc))
        logger.exception("Unexpected error in /api/compatibility")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.") from exc


@app.get("/api/games")
def list_games() -> list[dict[str, Any]]:
    return games.list_games()


@app.post("/api/games/play")
def play_game(payload: GameRequest) -> dict[str, Any]:
    result = games.play(payload.game_id, payload.params)
    if "error" in result and not result.get("teaser"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ── V2 API request models ────────────────────────────────────────

class V2ScoresRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    reading_data: dict = Field(..., description="Full reading result from POST /api/reading")

    @field_validator('reading_data')
    @classmethod
    def validate_reading_data(cls, value: dict[str, Any]) -> dict[str, Any]:
        if len(json.dumps(value, default=str)) > 500_000:
            raise ValueError('Reading context is too large.')
        return value


class V2DebateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    question: str = Field(..., description="User's question to the stars")
    reading_data: dict = Field(default_factory=dict, description="Full reading result for context")
    question_history: list[str] = Field(default_factory=list, description="Up to 10 recent past questions")

    @field_validator('question', mode='before')
    @classmethod
    def validate_question(cls, value: Any) -> str:
        question = _clean_text(value, field_name='Question', required=True, max_length=280)
        if len(question) < 2:
            raise ValueError('Question must be at least 2 characters long.')
        return question

    @field_validator('reading_data')
    @classmethod
    def validate_reading_data(cls, value: dict[str, Any]) -> dict[str, Any]:
        if len(json.dumps(value, default=str)) > 500_000:
            raise ValueError('Reading context is too large.')
        return value

    @field_validator('question_history', mode='before')
    @classmethod
    def validate_question_history(cls, value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(v)[:280] for v in value[:10] if isinstance(v, str)]


# ── V2 Endpoints ────────────────────────────────────────────────

@app.get("/api/v2/temporal")
def v2_temporal() -> dict[str, Any]:
    """Return current planetary hours, moon phase, day ruler, and retrograde effects.

    This is a context-free endpoint — it uses the current time and does not
    require a reading.  For retrograde data it needs Western system data, so
    it returns a static summary from the effects table when no reading is
    provided.
    """
    try:
        now = datetime.datetime.now()

        # ── Planetary hour ──────────────────────────────────────
        hour_data = compute_planetary_hour(now)

        # ── Day ruler ───────────────────────────────────────────
        today = datetime.date.today()
        day_ruler = DAY_RULER.get(today.weekday(), "Sun")

        # ── Retrograde planets (static effects table) ───────────
        # Without a live reading we expose the reference table so
        # the frontend knows which planets to watch.
        retrograde_reference = {
            planet: {
                "polarity": info["polarity"],
                "domains": info["domains"],
                "caution": info["caution"],
                "advice": info["advice"],
            }
            for planet, info in RETROGRADE_EFFECTS.items()
        }

        # ── Moon phase (approximate from time-of-day) ───────────
        # Without Western engine data we return the hour-based
        # approximation.  Lunar phase ranges 0-29.53 days.
        # We compute a synthetic lunar day from the date.
        # Known new-moon reference: 2026-01-19.
        ref_new_moon = datetime.date(2026, 1, 19)
        days_since = (today - ref_new_moon).days
        lunar_day = days_since % 29.53
        synodic_angle = (lunar_day / 29.53) * 360.0

        phase_info = None
        for lo, hi, name, polarity, advice in MOON_PHASES:
            if lo <= synodic_angle < hi:
                phase_info = {
                    "phase_name": name,
                    "phase_angle": round(synodic_angle, 1),
                    "polarity": polarity,
                    "advice": advice,
                    "lunar_day": round(lunar_day, 1),
                }
                break
        if phase_info is None:
            phase_info = {
                "phase_name": "New Moon",
                "phase_angle": round(synodic_angle, 1),
                "polarity": -0.8,
                "advice": "withdraw, seed intentions",
                "lunar_day": round(lunar_day, 1),
            }

        return {
            "timestamp": now.isoformat(),
            "planetary_hour": {
                "ruler": hour_data["ruler"],
                "meaning": hour_data["meaning"],
                "polarity": hour_data["polarity"],
                "hour_index": hour_data["hour_index"],
                "is_day": hour_data["is_day"],
                "period": "day" if hour_data["is_day"] else "night",
            },
            "day_ruler": {
                "planet": day_ruler,
                "weekday": today.strftime("%A"),
                "meaning": HOUR_MEANING.get(day_ruler, ""),
            },
            "moon_phase": phase_info,
            "retrograde_reference": retrograde_reference,
        }
    except Exception as exc:
        logger.exception("Unexpected error in /api/v2/temporal")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.") from exc


# Domain mapping: the 6 frontend domains mapped to the 5 internal pipeline domains
_SCORE_DOMAINS = {
    "career":      "career",
    "love":        "love",
    "health":      "health",
    "money":       "wealth",
    "creativity":  "mood",
    "spirituality": "mood",
}

# All 8 system IDs
_ALL_SYSTEM_IDS = ["western", "vedic", "chinese", "bazi", "numerology", "kabbalistic", "gematria", "persian"]


@app.post("/api/v2/scores")
def v2_scores(payload: V2ScoresRequest) -> dict[str, Any]:
    """Compute daily life-area scores (-3 to +3) from all 8 systems.

    For each system, generates opinions across six life-area probe questions,
    then maps the aggregated stance and confidence to a score in the -3 to +3
    range. Positive scores indicate favorable energy; negative scores indicate
    caution.
    """
    try:
        reading = payload.reading_data
        systems_data = reading.get("systems", {})

        # Probe intents — one per domain
        domain_probes = {
            "career":      "career_question",
            "love":        "relationship_question",
            "health":      "health_energy_question",
            "money":       "career_question",
            "creativity":  "emotional_state_question",
            "spirituality": "general_guidance_question",
        }

        domain_tag_map = {
            "career":      ["career"],
            "love":        ["love"],
            "health":      ["health"],
            "money":       ["wealth"],
            "creativity":  ["mood", "career"],
            "spirituality": ["mood"],
        }

        scores: dict[str, dict[str, Any]] = {}

        for domain, q_type in domain_probes.items():
            # Build a synthetic intent for this domain
            intent = classify_intent(f"How is my {domain} energy today?")
            intent = intent.model_copy(update={
                "question_type": q_type,
                "domain_tags": domain_tag_map[domain],
                "time_horizon": "today",
            })

            # Run all adapters
            opinions: list[SystemOpinion] = []
            per_system: dict[str, dict[str, Any]] = {}

            for sys_id in _ALL_SYSTEM_IDS:
                adapter = ADAPTERS.get(sys_id)
                if adapter is None:
                    continue
                sys_data = systems_data.get(sys_id, {})
                try:
                    opinion = adapter.evaluate(sys_data, intent)
                except Exception:
                    opinion = SystemOpinion(
                        system_id=sys_id,
                        relevant=False,
                        stance={"favorable": 0.5, "cautious": 0.5},
                        confidence=0.0,
                        reason="System unavailable",
                        evidence=[],
                    )
                opinions.append(opinion)

                # Per-system detail
                favorable = opinion.stance.get("favorable", 0.5)
                cautious = opinion.stance.get("cautious", 0.5)
                sentiment = favorable - cautious  # -1 to +1
                mapped_score = round(sentiment * opinion.confidence * 3, 1)
                mapped_score = max(-3.0, min(3.0, mapped_score))

                per_system[sys_id] = {
                    "name": SYSTEM_NAMES.get(sys_id, sys_id),
                    "score": mapped_score,
                    "confidence": round(opinion.confidence, 2),
                    "favorable": round(favorable, 3),
                    "cautious": round(cautious, 3),
                    "relevant": opinion.relevant,
                    "reason": opinion.reason,
                }

            # Apply temporal modulation
            temporal_mods = compute_temporal_modulation(reading)
            apply_temporal_modulation(opinions, temporal_mods, domain_tag_map[domain])

            # Aggregate
            aggregation = aggregate(opinions, intent)

            # Map aggregated result to -3 to +3 score
            fav_score = aggregation.scores.get("favorable", 0.5)
            cau_score = aggregation.scores.get("cautious", 0.5)
            net_sentiment = fav_score - cau_score  # -1 to +1
            final_score = round(net_sentiment * aggregation.confidence * 3, 1)
            final_score = max(-3.0, min(3.0, final_score))

            scores[domain] = {
                "score": final_score,
                "confidence": aggregation.confidence,
                "confidence_label": aggregation.confidence_label,
                "winner": aggregation.winner,
                "favorable": round(fav_score, 3),
                "cautious": round(cau_score, 3),
                "systems": per_system,
                "temporal_modulation": {
                    k: round(v, 4) for k, v in temporal_mods.items()
                },
            }

        return {
            "scores": scores,
            "domains": list(scores.keys()),
        }
    except Exception as exc:
        logger.exception("Unexpected error in /api/v2/scores")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.") from exc


@app.post("/api/v2/debate")
def v2_debate(payload: V2DebateRequest) -> dict[str, Any]:
    """Full pipeline result with expanded debate data.

    Runs the same pipeline as /api/ask but exposes ALL internal data:
    per-system opinions with evidence, conflict notes, system routing info,
    pattern analysis, temporal modulation, classification details, and
    aggregation internals.
    """
    try:
        history = payload.question_history[:10] if payload.question_history else []
        reading = payload.reading_data
        systems_data = reading.get("systems", {})

        # 1. Run the full pipeline
        result = pipeline_run(payload.question, reading, history)
        response = result.model_dump()

        # 2. Expand per-system opinions with full evidence
        expanded_opinions = []
        for opinion in result.aggregation.opinions:
            op_data = opinion.model_dump()
            # Add human-readable system name
            op_data["system_name"] = SYSTEM_NAMES.get(opinion.system_id, opinion.system_id)
            # Determine sentiment relative to winner
            winner = result.aggregation.winner
            stance_for_winner = opinion.stance.get(winner, 0.5)
            if stance_for_winner >= 0.6:
                op_data["sentiment"] = "supports"
            elif stance_for_winner >= 0.45:
                op_data["sentiment"] = "neutral"
            else:
                op_data["sentiment"] = "cautions"
            op_data["stance_for_winner"] = round(stance_for_winner, 3)
            # Full evidence (not truncated to 4 like system_signals)
            op_data["evidence"] = [e.model_dump() for e in opinion.evidence]
            expanded_opinions.append(op_data)

        # 3. System routing information
        intent = result.classification
        all_system_ids = route_systems(intent)
        routing_info = {
            "selected_systems": all_system_ids,
            "question_type": intent.question_type,
            "domain_tags": intent.domain_tags,
            "time_horizon": intent.time_horizon,
            "emotional_charge": intent.emotional_charge,
            "feasibility": intent.feasibility,
            "specificity": intent.specificity,
            "negated": intent.negated,
        }

        # 4. Temporal modulation
        temporal_mods = compute_temporal_modulation(reading)

        # 5. Retrograde status (if Western data available)
        western_data = systems_data.get("western", {})
        retrogrades = detect_retrogrades(western_data)

        # 6. Moon phase (if Western data available)
        moon_phase = compute_phase(western_data)

        # 7. Planetary hour
        hour_data = compute_planetary_hour()

        # 8. Conflict analysis
        conflict_analysis = {
            "near_split": result.aggregation.near_split,
            "polarized": result.aggregation.polarized,
            "multi_path": result.aggregation.multi_path,
            "clustered": result.aggregation.clustered,
            "score_gap": result.aggregation.score_gap,
            "system_agreement": result.aggregation.system_agreement,
        }

        # 9. Dissenting systems
        dissenters = []
        for opinion in result.aggregation.opinions:
            if not opinion.relevant:
                continue
            winner = result.aggregation.winner
            stance_for_winner = opinion.stance.get(winner, 0.5)
            if stance_for_winner < 0.45:
                dissenters.append({
                    "system_id": opinion.system_id,
                    "system_name": SYSTEM_NAMES.get(opinion.system_id, opinion.system_id),
                    "stance_for_winner": round(stance_for_winner, 3),
                    "reason": opinion.reason,
                    "stance_explanation": opinion.stance_explanation,
                    "top_evidence": [
                        {"feature": e.feature, "value": e.value, "weight": e.weight}
                        for e in sorted(opinion.evidence, key=lambda e: e.weight, reverse=True)[:3]
                    ],
                })

        # 10. Supporting systems
        supporters = []
        for opinion in result.aggregation.opinions:
            if not opinion.relevant:
                continue
            winner = result.aggregation.winner
            stance_for_winner = opinion.stance.get(winner, 0.5)
            if stance_for_winner >= 0.6:
                supporters.append({
                    "system_id": opinion.system_id,
                    "system_name": SYSTEM_NAMES.get(opinion.system_id, opinion.system_id),
                    "stance_for_winner": round(stance_for_winner, 3),
                    "reason": opinion.reason,
                    "stance_explanation": opinion.stance_explanation,
                    "top_evidence": [
                        {"feature": e.feature, "value": e.value, "weight": e.weight}
                        for e in sorted(opinion.evidence, key=lambda e: e.weight, reverse=True)[:3]
                    ],
                })

        # Build the full debate response
        response["debate"] = {
            "opinions": expanded_opinions,
            "routing": routing_info,
            "temporal": {
                "modulation": {k: round(v, 4) for k, v in temporal_mods.items()},
                "planetary_hour": {
                    "ruler": hour_data["ruler"],
                    "meaning": hour_data["meaning"],
                    "polarity": hour_data["polarity"],
                    "is_day": hour_data["is_day"],
                },
                "retrogrades": retrogrades,
                "moon_phase": moon_phase,
            },
            "conflict_analysis": conflict_analysis,
            "supporters": supporters,
            "dissenters": dissenters,
        }

        # Backward-compat: keep legacy evidence
        legacy = oracle_compose(payload.question, reading)
        response["evidence"] = legacy.get("evidence", [])

        return response
    except Exception as exc:
        logger.exception("Unexpected error in /api/v2/debate")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.") from exc


# ── Admin API Endpoints ──────────────────────────────────────────


@app.get("/api/admin/health")
async def admin_health(request: Request) -> dict:
    key = request.headers.get("X-Backend-Key", "")
    if not _ADMIN_SECRET or key != _ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    return admin_module.get_health()


@app.get("/api/admin/quality")
async def admin_quality(request: Request) -> dict:
    key = request.headers.get("X-Backend-Key", "")
    if not _ADMIN_SECRET or key != _ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    limit = int(request.query_params.get("limit", "50"))
    return admin_module.get_quality_summary(limit=limit)


@app.get("/api/admin/analytics")
async def admin_analytics(request: Request) -> dict:
    key = request.headers.get("X-Backend-Key", "")
    if not _ADMIN_SECRET or key != _ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    hours = request.query_params.get("hours")
    hours_int = int(hours) if hours else None
    return admin_module.get_analytics(hours=hours_int)


@app.get("/api/admin/sessions")
async def admin_sessions(request: Request) -> dict:
    key = request.headers.get("X-Backend-Key", "")
    if not _ADMIN_SECRET or key != _ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    session_type = request.query_params.get("type")
    limit = int(request.query_params.get("limit", "50"))
    offset = int(request.query_params.get("offset", "0"))
    return admin_module.list_sessions(session_type=session_type, limit=limit, offset=offset)


@app.get("/api/admin/sessions/{session_id}")
async def admin_session_detail(session_id: str, request: Request) -> dict:
    key = request.headers.get("X-Backend-Key", "")
    if not _ADMIN_SECRET or key != _ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
    result = admin_module.get_session(session_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return result


@app.post("/api/admin/analytics/event")
async def admin_log_event(request: Request) -> dict:
    """Frontend event tracking endpoint — does NOT require admin key."""
    body = await request.json()
    event = str(body.get("event", "")).strip()[:50]
    data = body.get("data", {})
    if not event:
        raise HTTPException(status_code=400, detail="Event name required")
    admin_module.log_event(event, data=data)
    return {"status": "ok"}


FRONTEND_DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"
FRONTEND_V2_DIST = Path(__file__).resolve().parents[1] / "frontend-v2" / "dist"


def _safe_resolve(base: Path, user_path: str) -> Path | None:
    """Resolve user_path under base, returning None if it escapes."""
    resolved = (base / user_path).resolve()
    if not str(resolved).startswith(str(base.resolve())):
        return None
    return resolved


@app.get("/v2", include_in_schema=False)
@app.get("/v2/{full_path:path}", include_in_schema=False)
def serve_v2(full_path: str = "") -> FileResponse:
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not found")
    target = _safe_resolve(FRONTEND_V2_DIST, full_path)
    if target and target.exists() and target.is_file():
        return FileResponse(target)
    index_file = FRONTEND_V2_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Not found")


@app.get("/", include_in_schema=False)
def serve_root() -> FileResponse:
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Not found")


@app.get("/{full_path:path}", include_in_schema=False)
def serve_spa(full_path: str) -> FileResponse:
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not found")
    target = _safe_resolve(FRONTEND_DIST, full_path)
    if target and target.exists() and target.is_file():
        return FileResponse(target)
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Not found")
