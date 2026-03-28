"""Validation tests for API request models."""

from __future__ import annotations

import datetime as dt
import pathlib
import sys

import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from backend.main import AskRequest, ReadingRequest, app


class TestReadingRequestValidation:
    def test_trims_whitespace(self):
        payload = ReadingRequest(
            birth_date=" 1990-04-21 ",
            birth_time=" 14:30 ",
            birth_location=" Los Angeles, CA ",
            full_name=" Jane Doe ",
            hebrew_name=" שלום ",
        )

        assert payload.birth_date == "1990-04-21"
        assert payload.birth_time == "14:30"
        assert payload.birth_location == "Los Angeles, CA"
        assert payload.full_name == "Jane Doe"
        assert payload.hebrew_name == "שלום"

    def test_rejects_extra_fields(self):
        with pytest.raises(ValidationError):
            ReadingRequest(
                birth_date="1990-04-21",
                birth_time="14:30",
                birth_location="Los Angeles, CA",
                extra_field="nope",
            )


class TestAskRequestValidation:
    def test_trims_question(self):
        payload = AskRequest(question="  Will I find love?  ", reading_data={})
        assert payload.question == "Will I find love?"

    def test_rejects_too_short_question(self):
        with pytest.raises(ValidationError, match="at least 2 characters"):
            AskRequest(question="x", reading_data={})

    def test_rejects_whitespace_only_question(self):
        with pytest.raises(ValidationError, match="Question is required"):
            AskRequest(question="   ", reading_data={})

    def test_rejects_oversized_reading_context(self):
        with pytest.raises(ValidationError, match="too large"):
            AskRequest(question="Will this work?", reading_data={"blob": "x" * 600_000})


class TestReplayProtection:
    def test_allows_legit_mobile_clock_skew_within_five_minutes(self):
        client = TestClient(app)
        skewed_now = dt.datetime.now(dt.timezone.utc).timestamp() + 180

        response = client.post(
            "/api/feedback/submit",
            headers={"X-Request-Time": str(skewed_now)},
            json={
                "email": "clock-skew-user",
                "category": "other",
                "message": "Testing request skew tolerance.",
                "name": "Clock Skew User",
            },
        )

        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_rejects_requests_older_than_ten_minutes(self):
        client = TestClient(app)
        expired = dt.datetime.now(dt.timezone.utc).timestamp() - 601

        response = client.post(
            "/api/feedback/submit",
            headers={"X-Request-Time": str(expired)},
            json={
                "email": "expired-user",
                "category": "other",
                "message": "This request should expire.",
                "name": "Expired User",
            },
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Request expired. Please try again."
