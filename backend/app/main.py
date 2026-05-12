"""
Notes Web App — FastAPI backend
Serves HTML notes directory with search and token auth.
Supports two auth paths:
  - Bearer token: for Agent / API calls
  - Session cookie: for human users via login page
"""
import hashlib
import json
import os
import re
import secrets
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.app.config import ACCESS_TOKEN
from backend.app import database

# Path to the self-contained login page (no SPA/React needed)
LOGIN_PAGE_PATH = Path(__file__).parent / "login_page.html"
INDEX_HTML_PATH = Path(__file__).parent / "static" / "index.html"

# ─── Session store (in-memory) ─────────────────────────────────────────────────
# Maps session_id -> { "expires": unix_ts }

SESSION_TTL_DAYS = 7
sessions: dict[str, dict] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    database.init_db()
    yield


def create_session() -> str:
    """Create a new session, return session_id."""
    clean_expired_sessions()  # Prune before adding to keep memory clean
    session_id = secrets.token_urlsafe(32)
    sessions[session_id] = {
        "expires": time.time() + SESSION_TTL_DAYS * 86400,
    }
    return session_id


def verify_session(session_id: Optional[str]) -> bool:
    """Check if session is valid and not expired."""
    if not session_id:
        return False
    sess = sessions.get(session_id)
    if not sess:
        return False
    if time.time() > sess["expires"]:
        del sessions[session_id]
        return False
    return True


def clean_expired_sessions():
    """Remove expired sessions."""
    now = time.time()
    for k, v in list(sessions.items()):
        if now > v["expires"]:
            del sessions[k]


# ─── Helpers ───────────────────────────────────────────────────────────────────

def verify_token(credentials) -> bool:
    """Verify Bearer token.

    Accepts either:
      - HTTPAuthorizationCredentials (from HTTPBearer middleware in /me endpoint)
      - plain str (raw Authorization header string)
    """
    if not ACCESS_TOKEN:
        return False  # No token configured — bearer auth not possible

    if isinstance(credentials, HTTPAuthorizationCredentials):
        return credentials.scheme == "Bearer" and credentials.credentials == ACCESS_TOKEN

    # Plain string path (used by /me endpoint with raw header)
    if not credentials:
        return False
    parts = credentials.split(" ", 1)
    if len(parts) != 2:
        return False
    scheme, creds = parts
    return scheme == "Bearer" and creds == ACCESS_TOKEN


def build_tree(root: Path) -> list:
    """Return nested tree of directories and files under root."""
    def recurse(path: Path, prefix: str = "") -> dict:
        node = {
            "name": path.name,
            "path": prefix,
            "type": "dir",
            "children": [],
        }
        children = sorted(path.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
        for p in children:
            rel = p.relative_to(root).as_posix()
            if p.is_dir():
                node["children"].append(recurse(p, rel))
            elif p.is_file() and (p.suffix == ".html" or p.name == "_index.html"):
                node["children"].append({
                    "name": p.name,
                    "path": rel,
                    "type": "file",
                    "is_dir_index": p.name == "_index.html",
                })
        return node

    root_children = []
    for p in sorted(root.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
        if p.is_dir():
            root_children.append(recurse(p, p.name))
        elif p.is_file() and (p.suffix == ".html" or p.name == "_index.html"):
            root_children.append({
                "name": p.name,
                "path": p.name,
                "type": "file",
                "is_dir_index": p.name == "_index.html",
            })
    return root_children


def get_link_index(root: Path) -> dict:
    idx_file = root / "link-index.json"
    if not idx_file.exists():
        return {}
    with open(idx_file) as f:
        return json.load(f)


def search_notes(root: Path, q: str) -> list[dict]:
    """Simple content search across HTML files."""
    results = []
    q_lower = q.lower()
    for p in root.rglob("*.html"):
        if p.name.startswith("_"):
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except Exception:
            continue
        plain = re.sub(r"<[^>]+>", " ", text)
        if q_lower in plain.lower():
            title_match = re.search(r"<title[^>]*>([^<]+)</title>", text)
            title = title_match.group(1).strip() if title_match else p.stem
            idx = plain.lower().find(q_lower)
            start = max(0, idx - 60)
            end = min(len(plain), idx + len(q) + 60)
            snippet = plain[start:end].strip()
            rel = p.relative_to(root).as_posix()
            results.append({"path": rel, "title": title, "snippet": snippet})
    return results[:20]


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="Notes Web App", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Auth ─────────────────────────────────────────────────────────────────────

bearer = HTTPBearer(auto_error=False)
SESSION_COOKIE = "notes_session"


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    """Allow request if Bearer token is valid OR session cookie is valid."""
    path = request.url.path

    # Public paths — no auth required
    if (
        path in ("/health", "/favicon.ico")
        or path.startswith("/static")
        or path.startswith("/assets")
        or path == "/api/login"
    ):
        return await call_next(request)

    # Check Bearer token
    creds = await bearer(request)
    if verify_token(creds):
        # Authenticated: serve SPA for /
        if path == "/":
            return HTMLResponse(INDEX_HTML_PATH.read_text(), status_code=200)
        return await call_next(request)

    # Check session cookie
    session_id = request.cookies.get(SESSION_COOKIE)
    if verify_session(session_id):
        clean_expired_sessions()
        # Authenticated: serve SPA for /
        if path == "/":
            return HTMLResponse(INDEX_HTML_PATH.read_text(), status_code=200)
        return await call_next(request)

    # Unauthenticated: serve self-contained login page for /, 401 JSON for API routes
    if path == "/":
        return HTMLResponse(LOGIN_PAGE_PATH.read_text(), status_code=200)
    return JSONResponse(status_code=401, content={"detail": "Unauthorized"})


# ─── Mount static (SPA) ───────────────────────────────────────────────────────

app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")

# ─── Routes ───────────────────────────────────────────────────────────────────


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/login")
async def login(request: Request, response: Response):
    """Validate token and set session cookie."""
    body = await request.json()
    token = body.get("token", "").strip()

    if not ACCESS_TOKEN:
        # No token configured — any input creates session
        session_id = create_session()
        response.set_cookie(
            key=SESSION_COOKIE,
            value=session_id,
            httponly=True,
            samesite="lax",
            max_age=SESSION_TTL_DAYS * 86400,
        )
        return {"ok": True}

    if token != ACCESS_TOKEN:
        return JSONResponse(status_code=401, content={"detail": "Invalid token"})

    session_id = create_session()
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_id,
        httponly=True,
        samesite="lax",
        max_age=SESSION_TTL_DAYS * 86400,
    )
    return {"ok": True}


@app.post("/api/logout")
def logout(response: Response):
    """Clear session cookie."""
    response.delete_cookie(SESSION_COOKIE)
    return {"ok": True}


@app.get("/api/me")
def me(request: Request):
    """Check current auth status."""
    creds = request.headers.get("Authorization")
    session_id = request.cookies.get(SESSION_COOKIE)
    if verify_token(creds) or verify_session(session_id):
        return {"authenticated": True}
    return {"authenticated": False}


@app.get("/api/files")
def api_files():
    root = Path(os.environ.get("NOTES_PATH", "/root/notes-mvp"))
    if not root.exists():
        raise HTTPException(503, "Notes directory not mounted")

    if database.get_cache_valid():
        tree = database.get_file_tree()
    else:
        database.update_tree_cache(root, full_rebuild=True)
        database.set_cache_valid(True)
        tree = database.get_file_tree()

    return JSONResponse({"tree": tree})


@app.get("/api/link-index")
def api_link_index():
    if not database.get_cache_valid():
        root = Path(os.environ.get("NOTES_PATH", "/root/notes-mvp"))
        if root.exists():
            database.update_link_cache(root)
            database.set_cache_valid(True)

    return JSONResponse(database.get_link_index())


@app.get("/api/search")
def api_search(q: str = Query(..., min_length=1)):
    if not database.get_cache_valid():
        root = Path(os.environ.get("NOTES_PATH", "/root/notes-mvp"))
        if root.exists():
            database.rebuild_search_index(root)
            database.set_cache_valid(True)

    results = database.search_notes(q)
    return JSONResponse({"results": results})


@app.get("/api/file/{path:path}")
def api_file(path: str):
    if database.get_cache_valid():
        cached = database.get_file_content(path)
        if cached:
            return JSONResponse(cached)

    root = Path(os.environ.get("NOTES_PATH", "/root/notes-mvp"))
    file_path = root / path
    try:
        file_path.resolve().relative_to(root.resolve())
    except ValueError:
        raise HTTPException(403, "Access denied")
    if not file_path.is_file():
        raise HTTPException(404, "File not found")
    content = file_path.read_text(encoding="utf-8")
    title_match = re.search(r"<title[^>]*>([^<]+)</title>", content)
    title = title_match.group(1).strip() if title_match else path
    return JSONResponse({"path": path, "title": title, "content": content})


# ─── Mount static (SPA) ───────────────────────────────────────────────────────

@app.post("/api/sync-trigger")
async def sync_trigger():
    """Trigger rclone sync from TOS to local notes directory. Internal use only."""
    import asyncio, subprocess

    notes_path = os.environ.get("NOTES_PATH", "/root/notes-mvp")
    cmd = ["rclone", "sync", "tos:tianlujun-default/notes-mvp", notes_path, "--quiet"]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            database.log_sync("failed")
            return JSONResponse(
                status_code=500,
                content={"ok": False, "detail": stderr.decode() or "rclone failed"},
            )

        database.incremental_cache_update()

        return JSONResponse({"ok": True, "triggered_at": datetime.utcnow().isoformat()})
    except Exception as exc:
        database.log_sync("failed")
        return JSONResponse(status_code=500, content={"ok": False, "detail": str(exc)})


@app.post("/api/cache/rebuild")
def cache_rebuild():
    """Manually trigger a full cache rebuild."""
    try:
        database.full_cache_rebuild()
        return JSONResponse({"ok": True, "message": "Cache rebuilt successfully"})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"ok": False, "detail": str(exc)})


@app.get("/api/cache/status")
def cache_status():
    """Get cache status and statistics."""
    return JSONResponse(database.get_sync_status())


@app.get("/{path:path}")
def catch_all(path: str):
    raise HTTPException(404)
