# Routes module
# Import all routers to make them available via `from app.routes import files, auth, sync, events`
from . import files, auth, sync, events

__all__ = ["files", "auth", "sync", "events"]
