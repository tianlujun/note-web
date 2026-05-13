from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import asyncio, os, datetime

router = APIRouter(prefix="/api", tags=["sync"])

def _require_bearer(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    token = auth[7:]
    if token != os.environ.get("ACCESS_TOKEN", ""):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    return None

@router.post("/sync-trigger")
async def sync_trigger(request: Request):
    err = _require_bearer(request)
    if err:
        return err
    from .. import database
    notes_path = os.environ.get("NOTES_PATH", "/root/notes")
    cmd = ["rclone", "sync", "tos:tianlujun-default/notes", notes_path, "--quiet", "--timeout=300s", "--contimeout=60s"]
    try:
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            return JSONResponse(status_code=504, content={"ok": False, "detail": "rclone sync timed out"})
        if proc.returncode != 0:
            database.log_sync("failed")
            return JSONResponse(status_code=500, content={"ok": False, "detail": stderr.decode()})
        database.incremental_cache_update()
        return JSONResponse({"ok": True, "triggered_at": datetime.datetime.now(datetime.timezone.utc).isoformat()})
    except Exception as exc:
        database.log_sync("failed")
        return JSONResponse(status_code=500, content={"ok": False, "detail": str(exc)})

@router.post("/rebuild")
async def rebuild(request: Request):
    err = _require_bearer(request)
    if err:
        return err
    from .. import database
    notes_path = os.environ.get("NOTES_PATH", "/root/notes")
    cmd = ["rclone", "sync", "tos:tianlujun-default/notes", notes_path, "--quiet", "--timeout=300s", "--contimeout=60s"]
    try:
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            return JSONResponse(status_code=504, content={"ok": False, "step": "sync", "detail": "rclone sync timed out"})
        if proc.returncode != 0:
            database.log_sync("failed")
            return JSONResponse(status_code=500, content={"ok": False, "step": "sync", "detail": stderr.decode()})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"ok": False, "step": "sync", "detail": str(exc)})
    try:
        database.full_cache_rebuild()
    except Exception as exc:
        return JSONResponse(status_code=500, content={"ok": False, "step": "cache", "detail": str(exc)})
    return JSONResponse({"ok": True, "triggered_at": datetime.datetime.now(datetime.timezone.utc).isoformat()})

@router.post("/cache/rebuild")
def cache_rebuild(request: Request):
    err = _require_bearer(request)
    if err:
        return err
    from .. import database
    try:
        database.full_cache_rebuild()
        return JSONResponse({"ok": True})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"ok": False, "detail": str(exc)})

@router.get("/cache/status")
def cache_status(request: Request):
    err = _require_bearer(request)
    if err:
        return err
    from .. import database
    return JSONResponse(database.get_sync_status())
