from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.engines import bazi, chinese, combined, daily, gematria, games, kabbalistic, numerology, persian, vedic, western
from backend.engines.common import CalculationError, build_context
from backend.engines.oracle import compose_response as oracle_compose


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


class AskRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    question: str = Field(..., description="User's question to the stars")
    reading_data: dict = Field(default_factory=dict, description="Full reading result for context")

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


app = FastAPI(
    title="All Star Astrology Platform",
    version="1.0.0",
    description="Multi-system astrology platform with FastAPI backend and React frontend.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8892",
        "http://127.0.0.1:8892",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "service": "all-star-astrology-platform"}


@app.post("/api/reading")
def reading(payload: ReadingRequest) -> dict[str, Any]:
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
            "daily": daily_content,
        }
    except CalculationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive boundary for API consumers.
        raise HTTPException(status_code=500, detail=f"Unexpected calculation error: {exc}") from exc


@app.post("/api/ask")
def ask_stars(payload: AskRequest) -> dict[str, Any]:
    return oracle_compose(payload.question, payload.reading_data)


@app.get("/api/games")
def list_games() -> list[dict[str, Any]]:
    return games.list_games()


@app.post("/api/games/play")
def play_game(payload: GameRequest) -> dict[str, Any]:
    result = games.play(payload.game_id, payload.params)
    if "error" in result and not result.get("teaser"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


FRONTEND_DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"


@app.get("/", include_in_schema=False)
def serve_root() -> FileResponse:
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Frontend has not been built yet. Run npm install && npm run build in /frontend.")


@app.get("/{full_path:path}", include_in_schema=False)
def serve_spa(full_path: str) -> FileResponse:
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="Not found")
    target = FRONTEND_DIST / full_path
    if target.exists() and target.is_file():
        return FileResponse(target)
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Frontend has not been built yet. Run npm install && npm run build in /frontend.")
