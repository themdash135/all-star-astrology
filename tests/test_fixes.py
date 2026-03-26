"""Tests for the 10 known-issue fixes."""

from __future__ import annotations

import json
from datetime import date, datetime, time, timezone
from unittest.mock import patch, MagicMock

import pytest

# ---------------------------------------------------------------------------
# Ensure the project root is importable
# ---------------------------------------------------------------------------
import sys, pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from backend.engines.common import (
    CalculationError,
    angular_distance,
    parse_birth_date,
    resolve_location,
    build_context,
    BAZI_STEMS,
)
from backend.engines import western, vedic, chinese, bazi, kabbalistic, combined


# ---------------------------------------------------------------------------
# Fix 1: Date range validation
# ---------------------------------------------------------------------------
class TestDateRangeValidation:
    def test_valid_date(self):
        assert parse_birth_date("1990-04-21") == date(1990, 4, 21)

    def test_empty_date(self):
        with pytest.raises(CalculationError, match="required"):
            parse_birth_date("")

    def test_malformed_date(self):
        with pytest.raises(CalculationError, match="YYYY-MM-DD"):
            parse_birth_date("not-a-date")

    def test_date_before_1800(self):
        with pytest.raises(CalculationError, match="between 1800"):
            parse_birth_date("1799-12-31")

    def test_future_date(self):
        with pytest.raises(CalculationError, match="between 1800"):
            parse_birth_date("2099-01-01")

    def test_boundary_1800(self):
        assert parse_birth_date("1800-01-01") == date(1800, 1, 1)


# ---------------------------------------------------------------------------
# Fix 2: Geocoding resilience with retry
# ---------------------------------------------------------------------------
class TestGeocodingRetry:
    def test_retry_on_transient_failure(self):
        """Geocoder should retry up to 3 times on failure."""
        mock_result = MagicMock()
        mock_result.latitude = 34.0522
        mock_result.longitude = -118.2437
        mock_result.address = "Los Angeles, CA, USA"

        call_count = 0

        def side_effect(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise Exception("Transient error")
            return mock_result

        # Clear the lru_cache before testing
        resolve_location.cache_clear()

        with patch.object(
            type(resolve_location).__wrapped__
            if hasattr(resolve_location, "__wrapped__")
            else resolve_location,
            "__call__",
            side_effect=side_effect,
        ) if False else patch(
            "backend.engines.common.GEOLOCATOR.geocode", side_effect=side_effect
        ):
            result = resolve_location("Los Angeles, CA")
            assert result["latitude"] == 34.0522
            assert call_count == 3

        resolve_location.cache_clear()

    def test_all_retries_fail(self):
        """Should raise CalculationError after all retries fail."""
        resolve_location.cache_clear()

        with patch(
            "backend.engines.common.GEOLOCATOR.geocode",
            side_effect=Exception("Network down"),
        ):
            with pytest.raises(CalculationError, match="retries"):
                resolve_location("Nonexistent Place XYZ 12345")

        resolve_location.cache_clear()


# ---------------------------------------------------------------------------
# Fix 3: lunardate range guard
# ---------------------------------------------------------------------------
class TestLunardateRangeGuard:
    def _make_context(self, year: int):
        """Build a minimal context with a date that may be outside lunardate's range."""
        from zoneinfo import ZoneInfo

        tz = ZoneInfo("UTC")
        birth_local = datetime(year, 6, 15, 12, 0, tzinfo=tz)
        now_local = datetime(2025, 3, 10, 12, 0, tzinfo=tz)
        return {
            "birth_local": birth_local,
            "now_local": now_local,
            "birth_time": time(12, 0),
            "birth_date": birth_local.date(),
            "birth_location": "0, 0",
            "full_name": "",
            "hebrew_name": "",
            "location": {"name": "test", "latitude": 0, "longitude": 0, "timezone": "UTC"},
            "timezone": "UTC",
            "latitude": 0.0,
            "longitude": 0.0,
            "birth_utc": birth_local,
            "jd_ut": 2451545.0,
            "now_utc": now_local,
            "current_jd_ut": 2460784.0,
            "age_years": 25.0,
        }

    def test_out_of_range_birth_raises(self):
        ctx = self._make_context(1900)
        with pytest.raises(CalculationError, match="lunar calendar range"):
            chinese.calculate(ctx)

    def test_in_range_does_not_raise(self):
        ctx = self._make_context(1990)
        # Should not raise — just verify it returns a dict
        result = chinese.calculate(ctx)
        assert result["id"] == "chinese"


# ---------------------------------------------------------------------------
# Fix 4: localStorage safety (structural check — the try/catch was added)
# ---------------------------------------------------------------------------
class TestLocalStorageSafety:
    def test_try_catch_present_in_set_item(self):
        storage_js = pathlib.Path(__file__).resolve().parents[1] / "frontend" / "src" / "app" / "storage.js"
        content = storage_js.read_text(encoding="utf-8")
        # The setItem call should now be inside a try block
        assert "try {" in content
        idx_set = content.index("localStorage.setItem")
        # Find the nearest 'try' before setItem
        preceding = content[:idx_set]
        assert "try {" in preceding[max(0, preceding.rfind("export function safeSet")) :]


# ---------------------------------------------------------------------------
# Fix 5: Deduplicate angular_distance in western.py
# ---------------------------------------------------------------------------
class TestDeduplicateAngularDistance:
    def test_angular_distance_imported_in_western(self):
        """western.py should import angular_distance from common."""
        src = pathlib.Path(__file__).resolve().parents[1] / "backend" / "engines" / "western.py"
        content = src.read_text(encoding="utf-8")
        assert "angular_distance" in content.split("from .common import")[1].split(")")[0]

    def test_no_inline_distance_calc(self):
        """The old inline distance formula should no longer exist."""
        src = pathlib.Path(__file__).resolve().parents[1] / "backend" / "engines" / "western.py"
        content = src.read_text(encoding="utf-8")
        assert "360.0 - distance if distance > 180" not in content

    def test_angular_distance_values(self):
        assert angular_distance(10.0, 350.0) == 20.0
        assert angular_distance(0.0, 180.0) == 180.0
        assert angular_distance(90.0, 90.0) == 0.0


# ---------------------------------------------------------------------------
# Fix 6: Clean dead code in kabbalistic.py
# ---------------------------------------------------------------------------
class TestKabbalisticCleanup:
    def test_no_dead_code_pattern(self):
        src = pathlib.Path(__file__).resolve().parents[1] / "backend" / "engines" / "kabbalistic.py"
        content = src.read_text(encoding="utf-8")
        assert "13 if False" not in content

    def test_simplified_condition(self):
        src = pathlib.Path(__file__).resolve().parents[1] / "backend" / "engines" / "kabbalistic.py"
        content = src.read_text(encoding="utf-8")
        assert "cycle_sefirah == 3" in content


# ---------------------------------------------------------------------------
# Fix 7: Safe default in bazi.py next() calls
# ---------------------------------------------------------------------------
class TestBaziSafeDefaults:
    def test_no_bare_next_calls(self):
        """bazi.py should not use bare next() generator calls that can raise StopIteration."""
        src = pathlib.Path(__file__).resolve().parents[1] / "backend" / "engines" / "bazi.py"
        content = src.read_text(encoding="utf-8")
        # Should not have 'next(i for' or 'next(idx for' or 'next(elem for' patterns
        import re
        bare_next = re.findall(r"next\([a-z_]+ for ", content)
        assert bare_next == [], f"Found bare next() calls: {bare_next}"

    def test_stem_name_to_index_exists(self):
        from backend.engines.bazi import STEM_NAME_TO_INDEX
        assert len(STEM_NAME_TO_INDEX) == 10
        assert STEM_NAME_TO_INDEX["Jia"] == 0
        assert STEM_NAME_TO_INDEX["Gui"] == 9

    def test_controlled_by_used(self):
        src = pathlib.Path(__file__).resolve().parents[1] / "backend" / "engines" / "bazi.py"
        content = src.read_text(encoding="utf-8")
        assert "controlled_by(" in content


# ---------------------------------------------------------------------------
# Fix 8: 5-tier sentiment in combined.py
# ---------------------------------------------------------------------------
class TestFiveTierSentiment:
    def test_strong_positive(self):
        from backend.engines.combined import _sentiment
        assert _sentiment(80) == "strong positive"

    def test_positive(self):
        from backend.engines.combined import _sentiment
        assert _sentiment(65) == "positive"

    def test_mixed(self):
        from backend.engines.combined import _sentiment
        assert _sentiment(50) == "mixed"

    def test_challenging(self):
        from backend.engines.combined import _sentiment
        assert _sentiment(35) == "challenging"

    def test_strong_challenging(self):
        from backend.engines.combined import _sentiment
        assert _sentiment(20) == "strong challenging"

    def test_boundaries(self):
        from backend.engines.combined import _sentiment
        assert _sentiment(75) == "strong positive"
        assert _sentiment(74.9) == "positive"
        assert _sentiment(60) == "positive"
        assert _sentiment(59.9) == "mixed"
        assert _sentiment(45) == "mixed"
        assert _sentiment(44.9) == "challenging"
        assert _sentiment(30) == "challenging"
        assert _sentiment(29.9) == "strong challenging"


# ---------------------------------------------------------------------------
# Fix 9: CORS tightening
# ---------------------------------------------------------------------------
class TestCorsTightening:
    def test_no_wildcard_origin(self):
        src = pathlib.Path(__file__).resolve().parents[1] / "backend" / "main.py"
        content = src.read_text(encoding="utf-8")
        # allow_origins must not use wildcard "*"
        assert 'allow_origins=["*"]' not in content and "allow_origins=['*']" not in content

    def test_localhost_origins_present(self):
        src = pathlib.Path(__file__).resolve().parents[1] / "backend" / "main.py"
        content = src.read_text(encoding="utf-8")
        assert "http://localhost:8892" in content
        assert "http://127.0.0.1:8892" in content
        assert "http://localhost:5173" in content


# ---------------------------------------------------------------------------
# Fix 10: Vedic dasha datetime serialization
# ---------------------------------------------------------------------------
class TestVedicDashaSerialization:
    def test_dasha_periods_are_strings(self):
        """The start/end fields in dasha periods should be ISO strings, not datetime objects."""
        from backend.engines.vedic import _build_vimshottari
        from zoneinfo import ZoneInfo

        tz = ZoneInfo("America/New_York")
        birth_dt = datetime(1990, 4, 21, 14, 30, tzinfo=tz)
        now_dt = datetime(2025, 3, 10, 12, 0, tzinfo=tz)
        dasha = _build_vimshottari(120.0, birth_dt, now_dt)

        for period in dasha["maha_periods"]:
            assert isinstance(period["start"], str), f"start should be str, got {type(period['start'])}"
            assert isinstance(period["end"], str), f"end should be str, got {type(period['end'])}"

        assert isinstance(dasha["current_maha"]["start"], str)
        assert isinstance(dasha["current_maha"]["end"], str)
        assert isinstance(dasha["current_antar"]["start"], str)
        assert isinstance(dasha["current_antar"]["end"], str)

    def test_dasha_json_serializable(self):
        """The entire dasha dict should be JSON-serializable."""
        from backend.engines.vedic import _build_vimshottari
        from zoneinfo import ZoneInfo

        tz = ZoneInfo("America/New_York")
        birth_dt = datetime(1990, 4, 21, 14, 30, tzinfo=tz)
        now_dt = datetime(2025, 3, 10, 12, 0, tzinfo=tz)
        dasha = _build_vimshottari(120.0, birth_dt, now_dt)

        # This should not raise
        serialized = json.dumps(dasha)
        assert isinstance(serialized, str)


# ---------------------------------------------------------------------------
# Bonus: tzdata in requirements.txt
# ---------------------------------------------------------------------------
class TestTzdata:
    def test_tzdata_in_requirements(self):
        req = pathlib.Path(__file__).resolve().parents[1] / "requirements.txt"
        content = req.read_text(encoding="utf-8")
        assert "tzdata" in content
