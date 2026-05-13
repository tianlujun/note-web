import os, time, secrets
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from backend.app import database

# ─── Config ───────────────────────────────────────────────────────────────────
ACCESS_TOKEN = os.environ.get("ACCESS_TOKEN", "")

# ─── Session store ────────────────────────────────────────────────────────────
SESSION_TTL_DAYS = 7
_sessions: dict[str, dict] = {}

def create_session() -> str:
    session_id = secrets.token_urlsafe(32)
    _sessions[session_id] = {"expires": time.time() + SESSION_TTL_DAYS * 86400}
    return session_id

def verify_session(session_id: Optional[str]) -> bool:
    if not session_id or session_id not in _sessions:
        return False
    if time.time() > _sessions[session_id]["expires"]:
        del _sessions[session_id]
        return False
    return True

def clean_expired_sessions():
    now = time.time()
    for sid in [s for s, v in _sessions.items() if now > v["expires"]]:
        del _sessions[sid]

def _auth_header_valid(request: Request) -> bool:
    if not ACCESS_TOKEN:
        return False
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return False
    return auth[7:] == ACCESS_TOKEN

SESSION_COOKIE = "notes_session"
INDEX_HTML_PATH = Path(__file__).parent / "static" / "index.html"

# ─── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI()

@app.middleware("http")
async def spa_middleware(request: Request, call_next):
    path = request.url.path

    # Public paths — no auth required
    if (
        path in ("/health", "/favicon.ico", "/seal.svg")
        or path.startswith("/static")
        or path.startswith("/assets")
        or path == "/api/login"
    ):
        return await call_next(request)

    # Check Bearer token
    if _auth_header_valid(request):
        if path == "/":
            return HTMLResponse(INDEX_HTML_PATH.read_text(), status_code=200)
        return await call_next(request)

    # Check session cookie
    session_id = request.cookies.get(SESSION_COOKIE)
    if verify_session(session_id):
        clean_expired_sessions()
        if path == "/":
            return HTMLResponse(INDEX_HTML_PATH.read_text(), status_code=200)
        return await call_next(request)

    # Session query param (for img tags in iframe srcdoc)
    session_param = request.query_params.get("session")
    if session_param and verify_session(session_param):
        clean_expired_sessions()
        return await call_next(request)

    # Unauthenticated: serve SPA for / (frontend handles login UI based on session cookie)
    if path == "/":
        return HTMLResponse(INDEX_HTML_PATH.read_text(), status_code=200)
    return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

# ─── Mount static (SPA) ───────────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")

# ─── Health ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}

# ─── Routers ──────────────────────────────────────────────────────────────────
from .routes import files, auth, sync
app.include_router(auth.router)
app.include_router(files.router)
app.include_router(sync.router)

# ─── Favicon / seal ──────────────────────────────────────────────────────────
@app.get("/seal.svg")
async def seal_svg():
    return FileResponse(Path(__file__).parent / "static" / "seal.svg", media_type="image/svg+xml")

@app.get("/{path:path}")
def catch_all(path: str):
    raise HTTPException(404)
