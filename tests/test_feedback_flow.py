from __future__ import annotations

import pathlib
import sys

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from backend import admin
from backend.main import app


@pytest.fixture(autouse=True)
def _feedback_storage(tmp_path, monkeypatch):
    monkeypatch.setattr(admin, "_STORAGE_BASE", str(tmp_path / "admin"))
    monkeypatch.setenv("BACKEND_API_KEY", "secret")
    monkeypatch.setattr("backend.main._ADMIN_SECRET", "secret")


def test_feedback_submit_check_and_resolve_flow():
    client = TestClient(app)

    submit = client.post(
        "/api/feedback/submit",
        json={
            "user_id": "device-1",
            "category": "error",
            "message": "Feedback confirmation did not appear.",
            "name": "Taylor",
        },
    )

    assert submit.status_code == 200
    ticket_id = submit.json()["ticket_id"]

    pending = client.get("/api/feedback/check", params={"user_id": "device-1"})
    assert pending.status_code == 200
    assert pending.json()["tickets"][0]["status"] == "pending"

    resolved = client.post(
        "/api/feedback/respond",
        headers={"X-Backend-Key": "secret"},
        json={
            "ticket_id": ticket_id,
            "message": "This has been fixed in the latest update.",
            "status": "resolved",
        },
    )

    assert resolved.status_code == 200
    assert resolved.json()["ticket_status"] == "resolved"

    updated = client.get("/api/feedback/check", params={"user_id": "device-1"})
    assert updated.status_code == 200
    ticket = updated.json()["tickets"][0]
    assert ticket["status"] == "resolved"
    assert ticket["responses"][0]["status"] == "resolved"


def test_feedback_submit_requires_user_id_and_message():
    client = TestClient(app)

    response = client.post(
        "/api/feedback/submit",
        json={"user_id": "", "category": "other", "message": ""},
    )

    assert response.status_code == 400
    assert "User ID" in response.json()["detail"]
