from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import os, datetime

router = APIRouter(prefix="/api", tags=["sync"])

def _require_bearer(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    token = auth[7:]
    if token != os.environ.get("ACCESS_TOKEN", ""):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    return None

def _do_rebuild():
    """Run rclone sync then incremental cache update, fully detached."""
    data_path = os.environ.get("DATA_PATH", "/opt/note-web/backend/data")
    notes_path = os.environ.get("NOTES_PATH", "/root/notes")
    pid = os.fork()
    if pid > 0:
        with open(f"{data_path}/rebuild.log", "a") as f:
            f.write(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] "
                     f"rebuild forked, pid={pid}\n")
        try:
            import asyncio
            from ..database import notify_clients
            asyncio.run(notify_clients())
        except Exception:
            pass
        return

    os.setsid()
    os.chdir("/")
    fd = os.open(os.devnull, os.O_RDWR)
    os.dup2(fd, 0)
    os.dup2(fd, 1)
    os.dup2(fd, 2)
    if fd > 2:
        os.close(fd)

    rclone_pid = os.fork()
    if rclone_pid == 0:
        os.execvp("rclone", [
            "rclone", "sync",
            "tos:tianlujun-default/notes", notes_path,
            "--quiet", "--timeout=300s", "--contimeout=60s"
        ])
        os._exit(1)

    _, status = os.waitpid(rclone_pid, 0)
    rclone_ok = os.WEXITSTATUS(status) == 0

    if rclone_ok:
        db_pid = os.fork()
        if db_pid == 0:
            python = os.environ.get("PYTHON_BIN", "/opt/note-web/.venv/bin/python")
            os.execvp(python, [
                python, "-c",
                "import sys; sys.path.insert(0,'/opt/note-web/backend/app'); "
                "from database import incremental_cache_update; incremental_cache_update()"
            ])
            os._exit(1)
        os.waitpid(db_pid, 0)
        with open(f"{data_path}/rebuild.log", "a") as f:
            f.write(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] "
                     f"rclone+incremental-cache done\n")

    os._exit(0)

@router.post("/rebuild")
def rebuild(request: Request):
    err = _require_bearer(request)
    if err:
        return err

    _do_rebuild()
    return JSONResponse({"ok": True, "triggered_at": datetime.datetime.now(datetime.timezone.utc).isoformat()})
