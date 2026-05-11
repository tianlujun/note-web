import os

# Path to the notes HTML directory (can be overridden via env)
NOTES_PATH = os.environ.get("NOTES_PATH", "/root/notes-mvp")

# Access token
ACCESS_TOKEN = os.environ.get("ACCESS_TOKEN", "")

# Server config
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8080"))

# Notes directory relative URL path prefix
NOTES_URL_PREFIX = "/notes"
