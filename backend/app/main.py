"""
Notes Web App — FastAPI backend
"""
import os, time, secrets
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from backend.app import database

# ─── Config ───────────────────────────────────────────────────────────────────
ACCESS_TOKEN = os.environ.get("ACCESS_TOKEN", "")

# ─── Session store ────────────────────────────────────────────────────────────
SESSION_TTL_DAYS = 7
sessions: dict[str, dict] = {}

def create_session() -> str:
    session_id = secrets.token_urlsafe(32)
    sessions[session_id] = {
        "expires": time.time() + SESSION_TTL_DAYS * 86400,
    }
    return session_id

def verify_session(session_id: Optional[str]) -> bool:
    if not session_id or session_id not in sessions:
        return False
    if time.time() > sessions[session_id]["expires"]:
        del sessions[session_id]
        return False
    return True

def clean_expired_sessions():
    now = time.time()
    for sid in [s for s, v in sessions.items() if now > v["expires"]]:
        del sessions[sid]


def _auth_header_valid(request: Request) -> bool:
    if not ACCESS_TOKEN:
        return False
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return False
    return auth[7:] == ACCESS_TOKEN

SESSION_COOKIE = "notes_session"

# ─── Serve frontend/dist directly at root ─────────────────────────────────────
FRONTEND_DIST = Path(__file__).parent.parent.parent / "frontend" / "dist"

# ─── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI()

@app.middleware("http")
async def spa_middleware(request: Request, call_next):
    path = request.url.path

    # Public paths — no auth required
    if (
        path in ("/health", "/favicon.ico", "/seal.svg")
        or path.startswith("/assets")
        or path == "/api/login"
        or path == "/api/logout"
        or path == "/api/auth/login"
        or path == "/api/auth/logout"
    ):
        return await call_next(request)

    # Check Bearer token
    if _auth_header_valid(request):
        clean_expired_sessions()
        return await call_next(request)

    # Check session cookie
    session_id = request.cookies.get(SESSION_COOKIE)
    if verify_session(session_id):
        clean_expired_sessions()
        return await call_next(request)

    # Session query param (for img tags in iframe srcdoc)
    session_param = request.query_params.get("session")
    if session_param and verify_session(session_param):
        clean_expired_sessions()
        return await call_next(request)

    # Unauthenticated: 401 for API routes, SPA index for /
    if path == "/":
        return HTMLResponse((FRONTEND_DIST / "index.html").read_text(), status_code=200)
    return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

# ─── Mount assets from frontend/dist ──────────────────────────────────────────
app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")
app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")

# ─── SPA index ────────────────────────────────────────────────────────────────
@app.get("/")
def spa_index():
    return HTMLResponse((FRONTEND_DIST / "index.html").read_text(), status_code=200)

@app.get("/health")
def health():
    return {"status": "ok"}

# ─── Routers ─────────────────────────────────────────────────────────────────
from .routes import files, auth, sync
app.include_router(auth.router)
app.include_router(files.router)
app.include_router(sync.router)

# ─── Legacy API compat ────────────────────────────────────────────────────────
@app.get("/api/me")
async def api_me_compat(request: Request):
    session_id = request.cookies.get(SESSION_COOKIE)
    if _auth_header_valid(request) or verify_session(session_id):
        return {"authenticated": True}
    return {"authenticated": False}

@app.post("/api/login")
async def api_login_compat(request: Request, response: Response):
    session_id = create_session()
    response.set_cookie(key=SESSION_COOKIE, value=session_id, httponly=False, samesite="lax", max_age=SESSION_TTL_DAYS * 86400)
    return {"ok": True}

@app.post("/api/logout")
async def api_logout_compat(response: Response):
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}

# ─── Favicon ──────────────────────────────────────────────────────────────────
@app.get("/favicon.svg")
async def favicon():
    return FileResponse(FRONTEND_DIST / "favicon.svg", media_type="image/svg+xml")

@app.get("/seal.svg")
async def seal():
    return FileResponse(FRONTEND_DIST / "seal.svg", media_type="image/svg+xml")

# ─── Catch-all → SPA ──────────────────────────────────────────────────────────
@app.get("/{path:path}")
def catch_all(path: str):
    return HTMLResponse((FRONTEND_DIST / "index.html").read_text(), status_code=200)
