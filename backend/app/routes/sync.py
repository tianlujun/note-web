from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import os, datetime, threading

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
    """Fork a grandchild that runs rclone then cache rebuild, fully detached."""
    pid = os.fork()
    if pid > 0:
        # Parent: log and return immediately
        with open("/var/log/note-web-rebuild.log", "a") as f:
            f.write(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] "
                     f"rebuild forked, pid={pid}\n")
        return

    # Grandchild: become daemon
    os.setsid()
    os.chdir("/")
    # Redirect stdin/stdout/stderr to /dev/null
    fd = os.open(os.devnull, os.O_RDWR)
    os.dup2(fd, 0)
    os.dup2(fd, 1)
    os.dup2(fd, 2)
    if fd > 2:
        os.close(fd)

    # Run rclone sync
    rclone_pid = os.fork()
    if rclone_pid == 0:
        os.execvp("rclone", [
            "rclone", "sync",
            "tos:tianlujun-default/notes", "/root/notes",
            "--quiet", "--timeout=300s", "--contimeout=60s"
        ])
        os._exit(1)

    # Wait for rclone
    _, status = os.waitpid(rclone_pid, 0)
    rclone_ok = os.WEXITSTATUS(status) == 0

    if rclone_ok:
        # Rebuild cache
        db_pid = os.fork()
        if db_pid == 0:
            os.execvp("/opt/note-web/.venv/bin/python", [
                "/opt/note-web/.venv/bin/python", "-c",
                "import sys; sys.path.insert(0,'/opt/note-web/backend/app'); "
                "from database import full_cache_rebuild; full_cache_rebuild()"
            ])
            os._exit(1)
        os.waitpid(db_pid, 0)
        with open("/var/log/note-web-rebuild.log", "a") as f:
            f.write(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] "
                     f"rclone+cache done\n")

    os._exit(0)

@router.post("/rebuild")
def rebuild(request: Request):
    err = _require_bearer(request)
    if err:
        return err

    _do_rebuild()
    return JSONResponse({"ok": True, "triggered_at": datetime.datetime.now(datetime.timezone.utc).isoformat()})
