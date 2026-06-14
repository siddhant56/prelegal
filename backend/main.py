import os
import sqlite3
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

STATIC_DIR = Path(__file__).parent / "static"
DB_PATH = Path(__file__).parent / "prelegal.db"


def init_db() -> None:
    """Create a fresh SQLite database each time the app starts."""
    if DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/api/health")
def health():
    return JSONResponse({"status": "ok"})


def _try_static(path: str) -> Path | None:
    """Return the first matching static file for the given URL path."""
    candidates = [
        STATIC_DIR / path,
        STATIC_DIR / (path + ".html"),
        STATIC_DIR / path / "index.html",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


@app.get("/{path:path}")
def serve_frontend(path: str):
    # Root path
    if not path:
        index = STATIC_DIR / "index.html"
        if index.is_file():
            return FileResponse(index)

    hit = _try_static(path)
    if hit:
        return FileResponse(hit)

    # SPA fallback
    fallback = STATIC_DIR / "index.html"
    if fallback.is_file():
        return FileResponse(fallback)

    return JSONResponse({"error": "Not found"}, status_code=404)
