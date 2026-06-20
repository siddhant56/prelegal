# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation (PL-5) provides a fake login screen and a Mutual NDA AI chat creator with live field panel, preview, and PDF download, served via Docker/FastAPI.

## Development process

When instructed to build a feature:

1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:

```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

Backend available at http://localhost:8000

## Color Scheme

- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### Completed (PL-2)

- Legal document templates added to `templates/` for all 11 document types
- `catalog.json` created as the source-of-truth index

### Completed (PL-3)

- Next.js frontend with Mutual NDA creator
- Multi-field form (`/create`) covering agreement terms and both parties
- Live preview page (`/preview`) rendering cover page + full standard terms
- Browser print-to-PDF download

### Completed (PL-4)

- Docker multi-stage build (Node builds Next.js → Python/uv runs FastAPI)
- FastAPI backend (`backend/`) served at `http://localhost:8000`
- Next.js configured for static export (`output: 'export'`); served by FastAPI with SPA fallback
- SQLite DB initialised fresh on each container start; `users` table created (ready for future auth)
- Fake login screen at `/` — email/password fields, Sign In navigates to `/create`, no real auth
- Start/stop scripts for Mac, Linux, Windows in `scripts/`; start scripts pass `--env-file .env`

### Completed (PL-5)

- `/create` replaced with a split-pane AI chat interface (chat left, live field status panel right)
- `POST /api/nda/chat` backend endpoint — stateless, client sends full message history each turn
- LiteLLM → OpenRouter → Cerebras (`gpt-oss-120b`) with structured outputs (`ChatResponse` Pydantic model: `message`, `fields`, `is_complete`)
- AI extracts NDA fields from conversation; "Preview NDA" button unlocks when `is_complete: true`
- `ChatMessage.role` locked to `Literal["user", "assistant"]` to block prompt injection
- 19 backend pytest tests; 71 frontend Jest tests

### Current API Endpoints

- `GET /api/health` - Health check
- `POST /api/nda/chat` - AI chat turn; body: `{messages: [{role, content}]}`; returns `{message, fields, is_complete}`

### Current Frontend Routes

- `/` - Fake login page (no auth; Sign In → `/create`)
- `/create` - Mutual NDA AI chat creator (split-pane: chat + field status panel)
- `/preview` - NDA preview + browser print-to-PDF

### Not Yet Implemented

- PL-6: Support for all 11 document types
- PL-7: Real JWT authentication, user accounts, document persistence
