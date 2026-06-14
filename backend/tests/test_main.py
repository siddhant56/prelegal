import sqlite3
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import main as app_module
from main import app, init_db


@pytest.fixture(autouse=True)
def temp_db(tmp_path):
    """Redirect DB to a temp path for each test."""
    db = tmp_path / "test.db"
    with patch.object(app_module, "DB_PATH", db):
        yield db


class TestInitDb:
    def test_creates_db(self, temp_db):
        init_db()
        assert temp_db.exists()

    def test_creates_users_table(self, temp_db):
        init_db()
        conn = sqlite3.connect(temp_db)
        tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        conn.close()
        assert ("users",) in tables

    def test_users_table_has_expected_columns(self, temp_db):
        init_db()
        conn = sqlite3.connect(temp_db)
        cols = [row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()]
        conn.close()
        assert "id" in cols
        assert "email" in cols
        assert "password_hash" in cols
        assert "created_at" in cols

    def test_drops_existing_db_on_restart(self, temp_db):
        init_db()
        conn = sqlite3.connect(temp_db)
        conn.execute("INSERT INTO users (email, password_hash) VALUES ('a@b.com', 'x')")
        conn.commit()
        conn.close()

        init_db()  # second call = fresh DB
        conn = sqlite3.connect(temp_db)
        count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        conn.close()
        assert count == 0


class TestHealthEndpoint:
    def setup_method(self):
        init_db()
        self.client = TestClient(app)

    def test_health_returns_ok(self):
        resp = self.client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


class TestStaticFileServing:
    def setup_method(self):
        self.tmp = tempfile.mkdtemp()
        self.static = Path(self.tmp)

    def test_serves_index_html_for_root(self, tmp_path):
        static = tmp_path / "static"
        static.mkdir()
        (static / "index.html").write_text("<html>login</html>")

        with patch.object(app_module, "STATIC_DIR", static):
            init_db()
            client = TestClient(app)
            resp = client.get("/")
        assert resp.status_code == 200
        assert b"login" in resp.content

    def test_serves_page_html(self, tmp_path):
        static = tmp_path / "static"
        static.mkdir()
        (static / "index.html").write_text("<html>root</html>")
        (static / "create.html").write_text("<html>create</html>")

        with patch.object(app_module, "STATIC_DIR", static):
            init_db()
            client = TestClient(app)
            resp = client.get("/create")
        assert resp.status_code == 200
        assert b"create" in resp.content

    def test_fallback_to_index_for_unknown_route(self, tmp_path):
        static = tmp_path / "static"
        static.mkdir()
        (static / "index.html").write_text("<html>spa</html>")

        with patch.object(app_module, "STATIC_DIR", static):
            init_db()
            client = TestClient(app)
            resp = client.get("/unknown-route")
        assert resp.status_code == 200
        assert b"spa" in resp.content
