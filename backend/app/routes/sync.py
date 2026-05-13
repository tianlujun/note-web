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
    # Use os.fork+setsid to fully detach, then exec rclone in the child
    pid = os.fork()
    if pid == 0:
        # Child: detach from parent env
        os.setsid()
        os.chdir("/")
        os.close(0)
        os.open(os.devnull, os.O_RDWR)  # stdin -> /dev/null
        os.dup2(0, 1)  # stdout -> /dev/null
        os.dup2(0, 2)  # stderr -> /dev/null

        os.execvp("rclone", [
            "rclone", "sync",
            "tos:tianlujun-default/notes", "/root/notes",
            "--quiet", "--timeout=300s", "--contimeout=60s"
        ])
        os._exit(1)

    # Parent: log and return immediately
    with open("/var/log/note-web-rebuild.log", "a") as f:
        f.write(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] "
                 f"rebuild triggered, rclone pid={pid}\n")

    # Also spawn a background thread to call full_cache_rebuild after a delay
    def _rebuild_cache():
        import time
        time.sleep(10)  # give rclone time to finish
        import sys
        sys.path.insert(0, "/opt/note-web/backend/app")
        from database import full_cache_rebuild
        full_cache_rebuild()
        with open("/var/log/note-web-rebuild.log", "a") as f:
            f.write(f"[{datetime.datetime.now(datetime.timezone.utc).isoformat()}] cache rebuild done\n")

    t = threading.Thread(target=_rebuild_cache, daemon=True)
    t.start()

@router.post("/rebuild")
def rebuild(request: Request):
    err = _require_bearer(request)
    if err:
        return err

    _do_rebuild()
    return JSONResponse({"ok": True, "triggered_at": datetime.datetime.now(datetime.timezone.utc).isoformat()})
