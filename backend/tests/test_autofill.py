import json
import os
from unittest.mock import MagicMock, patch

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


def _completion_mock(message: str, fields: dict, is_complete: bool) -> MagicMock:
    payload = {"message": message, "fields": fields, "is_complete": is_complete}
    mock = MagicMock()
    mock.choices[0].message.content = json.dumps(payload)
    return mock


_empty_fields = {
    "purpose": None,
    "effectiveDate": None,
    "mndaTermType": None,
    "mndaTermYears": None,
    "confidentialityTermType": None,
    "confidentialityTermYears": None,
    "governingLaw": None,
    "jurisdiction": None,
    "modifications": None,
    "party1Name": None,
    "party1Title": None,
    "party1Company": None,
    "party1Address": None,
    "party2Name": None,
    "party2Title": None,
    "party2Company": None,
    "party2Address": None,
}

_all_fields = {
    "purpose": "Partnership evaluation",
    "effectiveDate": "2025-01-15",
    "mndaTermType": "expires",
    "mndaTermYears": "2",
    "confidentialityTermType": "years",
    "confidentialityTermYears": "3",
    "governingLaw": "Delaware",
    "jurisdiction": "New Castle, Delaware",
    "modifications": "",
    "party1Name": "Jane Smith",
    "party1Title": "CEO",
    "party1Company": "Acme Corp",
    "party1Address": "jane@acme.com",
    "party2Name": "John Doe",
    "party2Title": "CTO",
    "party2Company": "Beta Inc",
    "party2Address": "john@beta.com",
}

_partial_fields = {**_empty_fields, "purpose": "Vendor evaluation", "party1Name": "Jane Smith"}


class TestNdaAutofillEndpoint:
    def setup_method(self):
        self.client = TestClient(app)

    def _post(self, fields: dict):
        return self.client.post("/api/nda/autofill", json={"fields": fields})

    def test_returns_200_with_partial_fields(self):
        mock = _completion_mock("I filled in some fields.", _partial_fields, False)
        with patch("main.completion", return_value=mock), patch.dict(
            os.environ, {"OPENROUTER_API_KEY": "test-key"}
        ):
            resp = self._post(_partial_fields)
        assert resp.status_code == 200

    def test_returns_message(self):
        mock = _completion_mock("Filled missing fields.", _all_fields, True)
        with patch("main.completion", return_value=mock), patch.dict(
            os.environ, {"OPENROUTER_API_KEY": "test-key"}
        ):
            resp = self._post(_partial_fields)
        assert resp.json()["message"] == "Filled missing fields."

    def test_returns_updated_fields(self):
        updated = {**_empty_fields, "governingLaw": "California"}
        mock = _completion_mock("Added governing law.", updated, False)
        with patch("main.completion", return_value=mock), patch.dict(
            os.environ, {"OPENROUTER_API_KEY": "test-key"}
        ):
            resp = self._post(_empty_fields)
        assert resp.json()["fields"]["governingLaw"] == "California"

    def test_is_complete_true_when_all_fields_present(self):
        mock = _completion_mock("All done!", _all_fields, True)
        with patch("main.completion", return_value=mock), patch.dict(
            os.environ, {"OPENROUTER_API_KEY": "test-key"}
        ):
            resp = self._post(_all_fields)
        assert resp.json()["is_complete"] is True

    def test_is_complete_false_for_partial(self):
        mock = _completion_mock("Still missing fields.", _partial_fields, False)
        with patch("main.completion", return_value=mock), patch.dict(
            os.environ, {"OPENROUTER_API_KEY": "test-key"}
        ):
            resp = self._post(_partial_fields)
        assert resp.json()["is_complete"] is False

    def test_returns_500_when_api_key_missing(self):
        env = {k: v for k, v in os.environ.items() if k != "OPENROUTER_API_KEY"}
        with patch.dict(os.environ, env, clear=True):
            resp = self._post(_partial_fields)
        assert resp.status_code == 500
        assert "error" in resp.json()

    def test_returns_500_on_completion_error(self):
        with patch("main.completion", side_effect=Exception("API error")), patch.dict(
            os.environ, {"OPENROUTER_API_KEY": "test-key"}
        ):
            resp = self._post(_partial_fields)
        assert resp.status_code == 500
        assert resp.json()["error"] == "Failed to process request"

    def test_passes_autofill_system_prompt(self):
        mock = _completion_mock("OK", _empty_fields, False)
        with patch("main.completion", return_value=mock) as mock_completion, patch.dict(
            os.environ, {"OPENROUTER_API_KEY": "test-key"}
        ):
            self._post(_partial_fields)
        messages = mock_completion.call_args.kwargs["messages"]
        assert messages[0]["role"] == "system"
        assert "pre-entered" in messages[0]["content"]

    def test_passes_fields_json_to_completion(self):
        mock = _completion_mock("OK", _empty_fields, False)
        with patch("main.completion", return_value=mock) as mock_completion, patch.dict(
            os.environ, {"OPENROUTER_API_KEY": "test-key"}
        ):
            self._post(_partial_fields)
        messages = mock_completion.call_args.kwargs["messages"]
        user_msg = messages[1]["content"]
        assert '"purpose":"Vendor evaluation"' in user_msg

    def test_uses_cerebras_provider(self):
        mock = _completion_mock("OK", _empty_fields, False)
        with patch("main.completion", return_value=mock) as mock_completion, patch.dict(
            os.environ, {"OPENROUTER_API_KEY": "test-key"}
        ):
            self._post(_partial_fields)
        assert mock_completion.call_args.kwargs["extra_body"]["provider"]["order"] == ["cerebras"]

    def test_rejects_request_missing_fields_key(self):
        resp = self.client.post("/api/nda/autofill", json={})
        assert resp.status_code == 422

    def test_accepts_empty_fields_object(self):
        mock = _completion_mock("Let me help fill those in.", _empty_fields, False)
        with patch("main.completion", return_value=mock), patch.dict(
            os.environ, {"OPENROUTER_API_KEY": "test-key"}
        ):
            resp = self._post(_empty_fields)
        assert resp.status_code == 200
