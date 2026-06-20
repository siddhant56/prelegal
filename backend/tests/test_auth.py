"""Tests for /api/auth/* endpoints."""
import pytest
from fastapi.testclient import TestClient
from main import app


class TestRegister:
    def test_registers_new_user(self, client):
        res = client.post("/api/auth/register", json={"email": "new@example.com", "password": "password123"})
        assert res.status_code == 200
        data = res.json()
        assert data["email"] == "new@example.com"
        assert "id" in data

    def test_sets_httponly_cookie(self, client):
        res = client.post("/api/auth/register", json={"email": "cookie@example.com", "password": "password123"})
        assert res.status_code == 200
        assert "token" in res.cookies

    def test_rejects_duplicate_email(self, client):
        client.post("/api/auth/register", json={"email": "dup@example.com", "password": "password123"})
        res = client.post("/api/auth/register", json={"email": "dup@example.com", "password": "other123"})
        assert res.status_code == 409
        assert "already registered" in res.json()["error"]

    def test_rejects_short_password(self, client):
        res = client.post("/api/auth/register", json={"email": "short@example.com", "password": "abc"})
        assert res.status_code == 400
        assert "8 characters" in res.json()["error"]

    def test_normalises_email_to_lowercase(self, client):
        res = client.post("/api/auth/register", json={"email": "Upper@Example.COM", "password": "password123"})
        assert res.status_code == 200
        assert res.json()["email"] == "upper@example.com"

    def test_rejects_empty_email(self, client):
        res = client.post("/api/auth/register", json={"email": "", "password": "password123"})
        assert res.status_code == 400

    def test_rejects_empty_password(self, client):
        res = client.post("/api/auth/register", json={"email": "x@example.com", "password": ""})
        assert res.status_code == 400


class TestLogin:
    def test_login_returns_user_data(self, client, registered_user):
        res = client.post("/api/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]})
        assert res.status_code == 200
        assert res.json()["email"] == registered_user["email"]

    def test_login_sets_cookie(self, client, registered_user):
        res = client.post("/api/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]})
        assert "token" in res.cookies

    def test_login_is_case_insensitive_for_email(self, client, registered_user):
        res = client.post("/api/auth/login", json={"email": registered_user["email"].upper(), "password": registered_user["password"]})
        assert res.status_code == 200

    def test_rejects_wrong_password(self, client, registered_user):
        res = client.post("/api/auth/login", json={"email": registered_user["email"], "password": "wrongpassword"})
        assert res.status_code == 401
        assert "Invalid" in res.json()["error"]

    def test_rejects_unknown_email(self, client):
        res = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "password123"})
        assert res.status_code == 401

    def test_does_not_reveal_whether_user_exists(self, client, registered_user):
        wrong_email = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "password123"})
        wrong_pass = client.post("/api/auth/login", json={"email": registered_user["email"], "password": "wrongpassword"})
        assert wrong_email.json()["error"] == wrong_pass.json()["error"]


class TestMe:
    def test_me_returns_current_user(self, auth_client, registered_user):
        res = auth_client.get("/api/auth/me")
        assert res.status_code == 200
        assert res.json()["email"] == registered_user["email"]
        assert res.json()["id"] == registered_user["id"]

    def test_me_requires_auth(self, client):
        res = client.get("/api/auth/me")
        assert res.status_code == 401

    def test_me_rejects_invalid_token(self, client):
        client.cookies.set("token", "not.a.real.token")
        res = client.get("/api/auth/me")
        assert res.status_code == 401


class TestLogout:
    def test_logout_clears_cookie(self, auth_client):
        res = auth_client.post("/api/auth/logout")
        assert res.status_code == 200
        assert res.json() == {"ok": True}

    def test_me_fails_after_logout(self, auth_client):
        auth_client.post("/api/auth/logout")
        # Cookie is cleared; subsequent requests are unauthenticated
        res = auth_client.get("/api/auth/me")
        assert res.status_code == 401
