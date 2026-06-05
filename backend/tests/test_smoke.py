"""Minimal smoke test — verifies the app boots and the health endpoint works.
Run more thorough integration tests against a real Postgres in CI."""
from fastapi.testclient import TestClient

from app.main import app


def test_health():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
