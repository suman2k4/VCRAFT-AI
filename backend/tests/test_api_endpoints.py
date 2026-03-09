"""
Smoke tests for API endpoints using FastAPI TestClient.

These tests validate routing, auth enforcement, and basic validation
without calling real LLM or Firebase services. They use the development
auth bypass (Firebase not configured => dev mode allows all requests).
"""

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    """FastAPI test client — no real server needed."""
    return TestClient(app)


class TestPublicEndpoints:
    """Endpoints that should be accessible without auth."""

    def test_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "operational"
        assert "VCRAFT" in data["message"]

    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"


class TestAnalyzePitchValidation:
    """Test input validation on /api/analyze-pitch (doesn't call LLM)."""

    def test_missing_body(self, client):
        resp = client.post("/api/analyze-pitch")
        assert resp.status_code == 422  # Pydantic validation error

    def test_startup_idea_too_short(self, client):
        resp = client.post("/api/analyze-pitch", json={
            "startup_idea": "short",
            "investor_stage": "seed",
            "investor_persona": "saas",
            "industry": "SaaS",
            "user_id": "test-user",
        })
        assert resp.status_code == 422

    def test_invalid_stage(self, client):
        resp = client.post("/api/analyze-pitch", json={
            "startup_idea": "x" * 60,
            "investor_stage": "series_z",
            "investor_persona": "saas",
            "industry": "SaaS",
            "user_id": "test-user",
        })
        assert resp.status_code == 422

    def test_invalid_persona(self, client):
        resp = client.post("/api/analyze-pitch", json={
            "startup_idea": "x" * 60,
            "investor_stage": "seed",
            "investor_persona": "invalid_persona",
            "industry": "SaaS",
            "user_id": "test-user",
        })
        assert resp.status_code == 422


class TestExtractPdfValidation:
    """Test file validation on /api/extract-pdf."""

    def test_no_file(self, client):
        resp = client.post("/api/extract-pdf")
        assert resp.status_code == 422

    def test_wrong_file_type(self, client):
        resp = client.post(
            "/api/extract-pdf",
            files={"file": ("test.txt", b"Hello", "text/plain")},
        )
        assert resp.status_code == 400
        assert "PDF" in resp.json()["detail"]


class TestChatValidation:
    """Test chat endpoint validation."""

    def test_chat_start_pitch_too_short(self, client):
        resp = client.post("/api/chat/start", json={
            "pitch_summary": "short",
            "industry": "SaaS",
        })
        assert resp.status_code == 422

    def test_chat_message_missing_session(self, client):
        resp = client.post("/api/chat/message", json={
            "session_id": "nonexistent",
            "message": "Hello there!",
        })
        # Should return 404 (session not found) not 500
        assert resp.status_code == 404


class TestDeckUploadValidation:
    """Test deck upload endpoint validation."""

    def test_no_file(self, client):
        resp = client.post("/api/upload-deck")
        assert resp.status_code == 422
