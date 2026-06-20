"""Shared fixtures for all backend tests."""
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import main as app_module
from main import app, init_db


@pytest.fixture(autouse=True)
def temp_db(tmp_path):
    db = tmp_path / "test.db"
    with patch.object(app_module, "DB_PATH", db):
        init_db()
        yield db


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def registered_user(client):
    """Register a test user and return their credentials."""
    res = client.post("/api/auth/register", json={"email": "test@example.com", "password": "password123"})
    assert res.status_code == 200
    return {"email": "test@example.com", "password": "password123", "id": res.json()["id"]}


@pytest.fixture
def auth_client(client, registered_user):
    """TestClient with an authenticated session cookie."""
    res = client.post("/api/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]})
    assert res.status_code == 200
    # TestClient automatically carries the Set-Cookie header for subsequent requests
    return client
