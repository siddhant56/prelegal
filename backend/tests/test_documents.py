"""Tests for /api/documents CRUD endpoints."""
import pytest
from fastapi.testclient import TestClient
from main import app


_SLA_FIELDS = {
    "providerName": "Acme Cloud",
    "customerName": "Beta Corp",
    "targetUptime": "99.9%",
    "targetResponseTime": "4 hours",
    "supportChannel": "support@acme.com",
    "uptimeCredit": "10%",
    "responseTimeCredit": "5%",
    "scheduledDowntime": "None",
}


class TestSaveDocument:
    def test_saves_document_and_returns_id(self, auth_client):
        res = auth_client.post("/api/documents", json={
            "doc_type": "sla",
            "title": "SLA with Beta Corp",
            "fields": _SLA_FIELDS,
        })
        assert res.status_code == 200
        data = res.json()
        assert "id" in data
        assert data["doc_type"] == "sla"
        assert data["title"] == "SLA with Beta Corp"

    def test_rejects_unknown_doc_type(self, auth_client):
        res = auth_client.post("/api/documents", json={
            "doc_type": "fake-type",
            "title": "Bad doc",
            "fields": {},
        })
        assert res.status_code == 400

    def test_requires_auth(self, client):
        res = client.post("/api/documents", json={
            "doc_type": "sla",
            "title": "SLA",
            "fields": _SLA_FIELDS,
        })
        assert res.status_code == 401

    def test_saves_multiple_documents(self, auth_client):
        for i in range(3):
            res = auth_client.post("/api/documents", json={
                "doc_type": "sla",
                "title": f"SLA {i}",
                "fields": _SLA_FIELDS,
            })
            assert res.status_code == 200


class TestListDocuments:
    def test_returns_empty_list_initially(self, auth_client):
        res = auth_client.get("/api/documents")
        assert res.status_code == 200
        assert res.json() == []

    def test_returns_saved_document(self, auth_client):
        auth_client.post("/api/documents", json={"doc_type": "sla", "title": "My SLA", "fields": _SLA_FIELDS})
        res = auth_client.get("/api/documents")
        assert res.status_code == 200
        assert len(res.json()) == 1
        assert res.json()[0]["title"] == "My SLA"

    def test_returns_documents_ordered_by_updated_at_desc(self, auth_client):
        auth_client.post("/api/documents", json={"doc_type": "sla", "title": "First", "fields": {}})
        auth_client.post("/api/documents", json={"doc_type": "sla", "title": "Second", "fields": {}})
        res = auth_client.get("/api/documents")
        titles = [d["title"] for d in res.json()]
        assert titles[0] == "Second"

    def test_only_returns_own_documents(self, client, registered_user):
        # Register a second user
        client.post("/api/auth/register", json={"email": "other@example.com", "password": "password123"})
        client.post("/api/auth/login", json={"email": "other@example.com", "password": "password123"})
        client.post("/api/documents", json={"doc_type": "sla", "title": "Other user doc", "fields": {}})

        # Log in as first user
        client.post("/api/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]})
        res = client.get("/api/documents")
        assert res.status_code == 200
        assert all(d["title"] != "Other user doc" for d in res.json())

    def test_requires_auth(self, client):
        res = client.get("/api/documents")
        assert res.status_code == 401

    def test_includes_fields_in_list(self, auth_client):
        auth_client.post("/api/documents", json={"doc_type": "sla", "title": "SLA", "fields": _SLA_FIELDS})
        res = auth_client.get("/api/documents")
        assert "fields" in res.json()[0]
        assert res.json()[0]["fields"]["providerName"] == "Acme Cloud"


class TestGetDocument:
    def test_returns_document_by_id(self, auth_client):
        save_res = auth_client.post("/api/documents", json={"doc_type": "sla", "title": "My SLA", "fields": _SLA_FIELDS})
        doc_id = save_res.json()["id"]

        res = auth_client.get(f"/api/documents/{doc_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == doc_id
        assert data["title"] == "My SLA"
        assert data["fields"]["providerName"] == "Acme Cloud"

    def test_returns_404_for_missing_id(self, auth_client):
        res = auth_client.get("/api/documents/99999")
        assert res.status_code == 404

    def test_cannot_access_other_users_document(self, client, registered_user):
        # User 1 saves a doc
        client.post("/api/auth/login", json={"email": registered_user["email"], "password": registered_user["password"]})
        save_res = client.post("/api/documents", json={"doc_type": "sla", "title": "Private", "fields": {}})
        doc_id = save_res.json()["id"]

        # Register and log in as user 2
        client.post("/api/auth/register", json={"email": "other2@example.com", "password": "password123"})
        client.post("/api/auth/login", json={"email": "other2@example.com", "password": "password123"})

        res = client.get(f"/api/documents/{doc_id}")
        assert res.status_code == 404

    def test_requires_auth(self, client):
        res = client.get("/api/documents/1")
        assert res.status_code == 401


class TestUpdateDocument:
    def test_updates_title(self, auth_client):
        save_res = auth_client.post("/api/documents", json={"doc_type": "sla", "title": "Old Title", "fields": {}})
        doc_id = save_res.json()["id"]

        res = auth_client.put(f"/api/documents/{doc_id}", json={"title": "New Title"})
        assert res.status_code == 200
        assert res.json()["title"] == "New Title"

    def test_updates_fields(self, auth_client):
        save_res = auth_client.post("/api/documents", json={"doc_type": "sla", "title": "SLA", "fields": {"providerName": "Old Co"}})
        doc_id = save_res.json()["id"]

        auth_client.put(f"/api/documents/{doc_id}", json={"fields": {"providerName": "New Co"}})
        res = auth_client.get(f"/api/documents/{doc_id}")
        assert res.json()["fields"]["providerName"] == "New Co"

    def test_partial_update_preserves_untouched_fields(self, auth_client):
        save_res = auth_client.post("/api/documents", json={"doc_type": "sla", "title": "SLA", "fields": _SLA_FIELDS})
        doc_id = save_res.json()["id"]

        auth_client.put(f"/api/documents/{doc_id}", json={"title": "Updated Title"})
        res = auth_client.get(f"/api/documents/{doc_id}")
        assert res.json()["title"] == "Updated Title"
        assert res.json()["fields"]["providerName"] == "Acme Cloud"

    def test_returns_404_for_missing_document(self, auth_client):
        res = auth_client.put("/api/documents/99999", json={"title": "x"})
        assert res.status_code == 404

    def test_requires_auth(self, client):
        res = client.put("/api/documents/1", json={"title": "x"})
        assert res.status_code == 401


class TestDeleteDocument:
    def test_deletes_document(self, auth_client):
        save_res = auth_client.post("/api/documents", json={"doc_type": "sla", "title": "To Delete", "fields": {}})
        doc_id = save_res.json()["id"]

        res = auth_client.delete(f"/api/documents/{doc_id}")
        assert res.status_code == 200
        assert res.json() == {"ok": True}

        # Confirm it's gone
        assert auth_client.get(f"/api/documents/{doc_id}").status_code == 404

    def test_returns_404_for_missing_document(self, auth_client):
        res = auth_client.delete("/api/documents/99999")
        assert res.status_code == 404

    def test_requires_auth(self, client):
        res = client.delete("/api/documents/1")
        assert res.status_code == 401
