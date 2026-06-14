import os
import sqlite3
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path
import logging
from typing import Literal, Optional

logger = logging.getLogger(__name__)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from litellm import completion
from pydantic import BaseModel

STATIC_DIR = Path(__file__).parent / "static"
DB_PATH = Path(__file__).parent / "prelegal.db"

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

SYSTEM_PROMPT = f"""You are a legal document assistant helping users create a Mutual Non-Disclosure Agreement (MNDA).

Today's date is {date.today().isoformat()}.

Have a friendly, efficient conversation to collect all required information. Ask 1-2 questions at a time.

Required fields:
- purpose: Why parties are sharing confidential information
- effectiveDate: NDA start date in YYYY-MM-DD format (use today's date if user says "today")
- mndaTermType: "expires" for a fixed period, or "until_terminated"
- mndaTermYears: Number of years as a string (only required when mndaTermType is "expires")
- confidentialityTermType: "years" or "perpetuity"
- confidentialityTermYears: Number of years as a string (only required when confidentialityTermType is "years")
- governingLaw: Governing state name (e.g. "Delaware")
- jurisdiction: Where disputes are resolved (e.g. "New Castle, Delaware")
- party1Name, party1Title, party1Company, party1Address: First party details
- party2Name, party2Title, party2Company, party2Address: Second party details
- modifications: Any changes to standard terms (use empty string "" if none)

Extract field values from user responses and include them in the fields object. Only include fields you have confirmed values for — set all others to null.

Set is_complete to true ONLY when ALL required fields are populated (including mndaTermYears when mndaTermType is "expires", and confidentialityTermYears when confidentialityTermType is "years"). When complete, confirm everything is captured and tell the user to click Preview NDA."""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class NDAFields(BaseModel):
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTermType: Optional[str] = None
    mndaTermYears: Optional[str] = None
    confidentialityTermType: Optional[str] = None
    confidentialityTermYears: Optional[str] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    modifications: Optional[str] = None
    party1Name: Optional[str] = None
    party1Title: Optional[str] = None
    party1Company: Optional[str] = None
    party1Address: Optional[str] = None
    party2Name: Optional[str] = None
    party2Title: Optional[str] = None
    party2Company: Optional[str] = None
    party2Address: Optional[str] = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    message: str
    fields: NDAFields
    is_complete: bool


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return JSONResponse({"status": "ok"})


@app.post("/api/nda/chat")
def nda_chat(req: ChatRequest) -> dict:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return JSONResponse({"error": "OpenRouter API key not configured"}, status_code=500)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m.role, "content": m.content} for m in req.messages]

    try:
        response = completion(
            model=MODEL,
            messages=messages,
            response_format=ChatResponse,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
            api_key=api_key,
        )
        raw = response.choices[0].message.content
        result = ChatResponse.model_validate_json(raw)
        return result.model_dump()
    except Exception as e:
        logger.error("LLM call failed: %s", e)
        return JSONResponse({"error": "Failed to process request"}, status_code=500)


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
    if not path:
        index = STATIC_DIR / "index.html"
        if index.is_file():
            return FileResponse(index)

    hit = _try_static(path)
    if hit:
        return FileResponse(hit)

    fallback = STATIC_DIR / "index.html"
    if fallback.is_file():
        return FileResponse(fallback)

    return JSONResponse({"error": "Not found"}, status_code=404)
