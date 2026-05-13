# Routes module
# Import all routers to make them available via `from app.routes import files, auth, sync`
from . import files, auth, sync

__all__ = ["files", "auth", "sync"]
