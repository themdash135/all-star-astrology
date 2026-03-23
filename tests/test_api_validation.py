"""Validation tests for API request models."""

from __future__ import annotations

import pathlib
import sys

import pytest
from pydantic import ValidationError

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from backend.main import AskRequest, ReadingRequest


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
