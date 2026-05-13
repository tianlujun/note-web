# Note Web

Obsidian vault → static HTML publishing platform.

Stack: React + Vite (frontend) + FastAPI (backend) + SQLite (search index).

## Quick Start

```bash
# Frontend
cd frontend && npm install && npm run build

# Backend
cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r app/requirements.txt

# Run (development)
cd backend && source .venv/bin/activate
NOTES_PATH=/path/to/notes ACCESS_TOKEN=your_token uvicorn app.main:app --host 0.0.0.0 --port 8080
```

## Deployment (NERD VPS)

See [`docs/deploy.md`](docs/deploy.md) for full deployment guide.

## Architecture

- `frontend/` — React SPA (Vite build → `frontend/dist/`)
- `backend/app/` — FastAPI backend (serves `frontend/dist/` directly at `/`)
- `backend/data/` — SQLite cache DB (link index, search data)
- `notes/` — Static HTML files (gitignored, managed by migration pipeline)

## Obsidian → HTML Migration

See [migration pipeline docs](docs/migration.md).
