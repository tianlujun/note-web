from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import re, os, mimetypes

router = APIRouter(prefix="/api", tags=["files"])

def _verify_any_auth(request: Request) -> bool:
    from ..main import _auth_header_valid, verify_session, SESSION_COOKIE
    # Bearer token
    if _auth_header_valid(request):
        return True
    # Session cookie
    session_id = request.cookies.get(SESSION_COOKIE)
    if session_id and verify_session(session_id):
        return True
    # Session query param (for img tags in iframe srcdoc)
    session_param = request.query_params.get("session")
    if session_param and verify_session(session_param):
        return True
    return False

def _get_root():
    return Path(os.environ.get("NOTES_PATH", "/root/notes"))

@router.get("/ls/{path:path}")
def api_ls(request: Request, path: str):
    """List directory contents (files and subdirs) for a given path."""
    if not _verify_any_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    root = _get_root()
    dir_path = root / path
    try:
        dir_path.resolve().relative_to(root.resolve())
    except ValueError:
        raise HTTPException(403, "Access denied")
    if not dir_path.is_dir():
        raise HTTPException(404, "Directory not found")
    entries = []
    for p in sorted(dir_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
        if p.is_dir():
            entries.append({"name": p.name, "path": str(p.relative_to(root)), "type": "dir"})
        elif p.suffix == ".html" or p.name == "_index.html":
            entries.append({"name": p.name, "path": str(p.relative_to(root)), "type": "file"})
    return JSONResponse({"entries": entries})

@router.get("/attachment/{path:path}")
def api_attachment(request: Request, path: str):
    if not _verify_any_auth(request):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    root = _get_root()
    file_path = root / path
    try:
        file_path.resolve().relative_to(root.resolve())
    except ValueError:
        raise HTTPException(403, "Access denied")
    if not file_path.is_file():
        raise HTTPException(404, "File not found")
    media_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    return FileResponse(file_path, media_type=media_type)

@router.get("/files")
def api_files():
    from .. import database
    root = _get_root()
    if not root.exists():
        raise HTTPException(503, "Notes directory not mounted")
    if database.get_cache_valid():
        tree = database.get_file_tree()
    else:
        database.update_tree_cache(root, full_rebuild=True)
        database.set_cache_valid(True)
        tree = database.get_file_tree()
    return JSONResponse({"tree": tree})

@router.get("/link-index")
def api_link_index():
    from .. import database
    if not database.get_cache_valid():
        root = _get_root()
        if root.exists():
            database.update_link_cache(root)
            database.set_cache_valid(True)
    return JSONResponse(database.get_link_index())

@router.get("/search")
def api_search(q: str = Query(..., min_length=1)):
    from .. import database
    if not database.get_cache_valid():
        root = _get_root()
        if root.exists():
            database.rebuild_search_index(root)
            database.set_cache_valid(True)
    results = database.search_notes(q)
    return JSONResponse({"results": results})

@router.get("/file/{path:path}")
def api_file(path: str):
    from .. import database
    if database.get_cache_valid():
        cached = database.get_file_content(path)
        if cached:
            return JSONResponse(cached)
    root = _get_root()
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
