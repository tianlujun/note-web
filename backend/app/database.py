"""
SQLite Database Module for note-web
Provides caching layer for file tree, search, and link graph.
"""
import json
import os
import re
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Optional

import sqlite3


# ─── Configuration ────────────────────────────────────────────────────────────────

def get_data_path() -> Path:
    """Get the data directory path from environment variable."""
    data_path = os.environ.get("DATA_PATH", "/opt/note-web/backend/data")
    return Path(data_path)


def get_db_path() -> Path:
    """Get the SQLite database file path."""
    return get_data_path() / "notes.db"


def get_notes_path() -> Path:
    """Get the notes directory path from environment variable."""
    notes_path = os.environ.get("NOTES_PATH", "/root/notes-mvp")
    return Path(notes_path)


# ─── Database Connection ─────────────────────────────────────────────────────────

@contextmanager
def get_db():
    """Database connection context manager.

    Usage:
        with get_db() as db:
            db.execute("SELECT ...")
    """
    data_path = get_data_path()
    data_path.mkdir(parents=True, exist_ok=True)

    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row

    # Enable WAL mode for better concurrent access
    conn.execute("PRAGMA journal_mode=WAL")

    try:
        yield conn
    finally:
        conn.close()


# ─── Database Initialization ─────────────────────────────────────────────────────

def init_db():
    """Initialize database schema.

    Creates all necessary tables if they don't exist:
    - files: File tree cache
    - search_index: FTS5 virtual table for full-text search
    - links: Link relationships between notes
    - nodes: Graph nodes
    - sync_log: Synchronization history
    - cache_meta: Cache metadata (cache_valid flag)
    """
    with get_db() as db:
        # Files table for file tree cache (includes content for fast retrieval)
        db.execute("""
            CREATE TABLE IF NOT EXISTS files (
                path TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('file', 'dir')),
                parent_path TEXT,
                is_dir_index INTEGER DEFAULT 0,
                title TEXT,
                content TEXT,
                modified_at REAL,
                cached_at REAL
            )
        """)

        # Create index on parent_path for tree queries
        db.execute("""
            CREATE INDEX IF NOT EXISTS idx_files_parent
            ON files(parent_path)
        """)

        # Migration: Add title and content columns if they don't exist (existing DBs)
        try:
            db.execute("ALTER TABLE files ADD COLUMN title TEXT")
        except sqlite3.OperationalError:
            pass  # Column already exists
        try:
            db.execute("ALTER TABLE files ADD COLUMN content TEXT")
        except sqlite3.OperationalError:
            pass  # Column already exists

        # FTS5 virtual table for full-text search (standalone, managed manually)
        db.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
                path,
                title,
                content
            )
        """)

        # Links table for link relationships
        db.execute("""
            CREATE TABLE IF NOT EXISTS links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_path TEXT NOT NULL,
                target_path TEXT NOT NULL,
                link_text TEXT,
                link_type TEXT CHECK(link_type IN ('internal', 'external')),
                cached_at REAL,
                UNIQUE(source_path, target_path, link_text)
            )
        """)

        db.execute("""
            CREATE INDEX IF NOT EXISTS idx_links_source
            ON links(source_path)
        """)

        db.execute("""
            CREATE INDEX IF NOT EXISTS idx_links_target
            ON links(target_path)
        """)

        # Nodes table for graph nodes
        db.execute("""
            CREATE TABLE IF NOT EXISTS nodes (
                path TEXT PRIMARY KEY,
                label TEXT NOT NULL,
                modified_at REAL,
                cached_at REAL
            )
        """)

        # Sync log table
        db.execute("""
            CREATE TABLE IF NOT EXISTS sync_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                triggered_at REAL NOT NULL,
                status TEXT CHECK(status IN ('success', 'failed')),
                files_updated INTEGER DEFAULT 0,
                duration_ms INTEGER
            )
        """)

        # Cache metadata table
        db.execute("""
            CREATE TABLE IF NOT EXISTS cache_meta (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)

        db.commit()


def get_cache_valid() -> bool:
    """Check if cache is marked as valid."""
    with get_db() as db:
        row = db.execute(
            "SELECT value FROM cache_meta WHERE key = 'cache_valid'"
        ).fetchone()
        return row and row["value"] == "1"


def set_cache_valid(valid: bool):
    """Set cache validity flag."""
    with get_db() as db:
        db.execute(
            "INSERT OR REPLACE INTO cache_meta (key, value) VALUES ('cache_valid', ?)",
            ("1" if valid else "0",)
        )
        db.commit()


# ─── File Tree Operations ─────────────────────────────────────────────────────────

def get_file_tree() -> list:
    """Get file tree from database cache.

    Returns:
        List of file/directory nodes in tree structure.
    """
    with get_db() as db:
        rows = db.execute("SELECT * FROM files ORDER BY type DESC, name ASC").fetchall()

        # Build tree structure from flat list
        nodes = {}
        for row in rows:
            path = row["path"]
            nodes[path] = {
                "name": row["name"],
                "path": row["path"],
                "type": row["type"],
                "parent_path": row["parent_path"],
                "is_dir_index": bool(row["is_dir_index"]),
                "children": [] if row["type"] == "dir" else None
            }

        # Build tree by linking children to parents
        root = []
        for path, node in nodes.items():
            parent_path = nodes[path]["parent_path"]
            if parent_path and parent_path in nodes:
                nodes[parent_path]["children"].append(node)
            elif not parent_path:
                root.append(node)

        return root


def build_tree_from_fs(root: Path) -> list:
    """Scan filesystem and build file tree.

    Args:
        root: Root directory to scan.

    Returns:
        List of file/directory nodes in tree structure.
    """
    def recurse(path: Path, parent_path: str = "") -> dict:
        node = {
            "name": path.name,
            "path": parent_path,
            "type": "dir",
            "is_dir_index": False,
            "children": [],
        }
        children = sorted(
            path.iterdir(),
            key=lambda p: (not p.is_dir(), p.name.lower())
        )
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
                    "modified_at": p.stat().st_mtime,
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
                "modified_at": p.stat().st_mtime,
            })
    return root_children


def update_tree_cache(root: Path, full_rebuild: bool = False):
    """Update file tree cache.

    Args:
        root: Notes root directory.
        full_rebuild: If True, clear and rebuild all. If False, incremental.
    """
    with get_db() as db:
        if full_rebuild:
            db.execute("DELETE FROM files")
            db.execute("DELETE FROM search_index")

        now = time.time()

        def process_path(path: Path, parent_path: str = ""):
            for p in sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
                if p.is_dir():
                    rel = p.relative_to(root).as_posix()
                    db.execute("""
                        INSERT OR REPLACE INTO files
                        (path, name, type, parent_path, is_dir_index, modified_at, cached_at)
                        VALUES (?, ?, 'dir', ?, 0, ?, ?)
                    """, (rel, p.name, parent_path, p.stat().st_mtime, now))
                    process_path(p, rel)
                elif p.is_file() and (p.suffix == ".html" or p.name == "_index.html"):
                    rel = p.relative_to(root).as_posix()
                    title = None
                    content = None
                    try:
                        file_content = p.read_text(encoding="utf-8")
                        title_match = re.search(r"<title[^>]*>([^<]+)</title>", file_content)
                        if title_match:
                            title = title_match.group(1).strip()
                        content = file_content
                    except Exception:
                        pass
                    db.execute("""
                        INSERT OR REPLACE INTO files
                        (path, name, type, parent_path, is_dir_index, title, content, modified_at, cached_at)
                        VALUES (?, ?, 'file', ?, ?, ?, ?, ?, ?)
                    """, (
                        rel, p.name, parent_path,
                        1 if p.name == "_index.html" else 0,
                        title, content,
                        p.stat().st_mtime, now
                    ))

        process_path(root)
        db.commit()


def get_file_modified_at(path: str) -> Optional[float]:
    """Get modified time of a cached file."""
    with get_db() as db:
        row = db.execute(
            "SELECT modified_at FROM files WHERE path = ?",
            (path,)
        ).fetchone()
        return row["modified_at"] if row else None


def get_file_content(path: str) -> Optional[dict]:
    """Get file content from cache.

    Args:
        path: File path relative to notes root.

    Returns:
        Dictionary with path, title, and content, or None if not found.
    """
    with get_db() as db:
        row = db.execute(
            "SELECT path, title, content FROM files WHERE path = ? AND type = 'file'",
            (path,)
        ).fetchone()
        if row:
            return {
                "path": row["path"],
                "title": row["title"] or path,
                "content": row["content"]
            }
        return None


# ─── Search Operations ───────────────────────────────────────────────────────────

def rebuild_search_index(root: Path):
    """Rebuild the FTS5 search index from scratch.

    Args:
        root: Notes root directory.
    """
    with get_db() as db:
        # Clear existing FTS index
        db.execute("DELETE FROM search_index")

        now = time.time()

        # Index all HTML files
        for p in root.rglob("*.html"):
            if p.name.startswith("_"):
                continue

            try:
                content = p.read_text(encoding="utf-8")
            except Exception:
                continue

            rel = p.relative_to(root).as_posix()
            title_match = re.search(r"<title[^>]*>([^<]+)</title>", content)
            title = title_match.group(1).strip() if title_match else p.stem

            # Strip HTML tags for plain text content
            plain = re.sub(r"<[^>]+>", " ", content)

            db.execute("""
                INSERT INTO search_index (path, title, content)
                VALUES (?, ?, ?)
            """, (rel, title, plain))

        db.commit()


def update_search_index(root: Path, paths: list[str]):
    """Update FTS5 index for specific files.

    Args:
        root: Notes root directory.
        paths: List of file paths to update.
    """
    with get_db() as db:
        now = time.time()

        for rel_path in paths:
            p = root / rel_path
            if not p.exists():
                # File deleted - remove from index
                db.execute("DELETE FROM search_index WHERE path = ?", (rel_path,))
                continue

            try:
                content = p.read_text(encoding="utf-8")
            except Exception:
                continue

            title_match = re.search(r"<title[^>]*>([^<]+)</title>", content)
            title = title_match.group(1).strip() if title_match else p.stem
            plain = re.sub(r"<[^>]+>", " ", content)

            db.execute("DELETE FROM search_index WHERE path = ?", (rel_path,))
            db.execute("""
                INSERT INTO search_index (path, title, content)
                VALUES (?, ?, ?)
            """, (rel_path, title, plain))

        db.commit()


def search_notes(query: str, limit: int = 20) -> list[dict]:
    """Search notes using FTS5.

    Args:
        query: Search query string.
        limit: Maximum number of results.

    Returns:
        List of search results with path, title, and snippet.
    """
    with get_db() as db:
        # Use FTS5 MATCH for search
        # Escape special characters and prepare query
        escaped_query = query.replace('"', '""')

        try:
            rows = db.execute("""
                SELECT path, title, snippet(search_index, 2, '<mark>', '</mark>', '...', 64) as snippet
                FROM search_index
                WHERE search_index MATCH ?
                ORDER BY rank
                LIMIT ?
            """, (f'"{escaped_query}"', limit)).fetchall()
        except sqlite3.OperationalError:
            # Fallback to LIKE search if FTS query fails
            like_query = f"%{query}%"
            rows = db.execute("""
                SELECT path, title,
                       substr(content, max(1, instr(lower(content), lower(?)) - 32), 96) as snippet
                FROM search_index
                WHERE content LIKE ? OR title LIKE ?
                LIMIT ?
            """, (query, like_query, like_query, limit)).fetchall()

        results = []
        for row in rows:
            # Clean up snippet - remove HTML tags but keep markers
            snippet = row["snippet"] or ""
            snippet = re.sub(r"<[^>]+>", "", snippet)
            snippet = snippet.strip()

            results.append({
                "path": row["path"],
                "title": row["title"],
                "snippet": snippet
            })

        return results


# ─── Link Graph Operations ────────────────────────────────────────────────────────

def extract_links_from_html(html_content: str, source_path: str) -> list[dict]:
    """Extract links from HTML content.

    Args:
        html_content: HTML file content.
        source_path: Path of the source file (for resolving relative links).

    Returns:
        List of extracted links with source, target, text, and type.
    """
    links = []

    # Extract <a href="..."> tags
    link_pattern = re.compile(
        r'<a\s+href=["\']([^"\']+)["\'][^>]*>([^<]*)</a>',
        re.IGNORECASE
    )

    for match in link_pattern.finditer(html_content):
        href = match.group(1)
        link_text = match.group(2).strip()

        # Skip empty links and anchors
        if not href or href.startswith("#"):
            continue

        # Determine if internal or external
        if href.startswith(("http://", "https://", "mailto:", "tel:")):
            link_type = "external"
            target_path = href
        else:
            link_type = "internal"
            # Resolve relative paths
            if href.startswith("/"):
                target_path = href.lstrip("/")
            else:
                # Relative to source file's directory
                source_dir = str(Path(source_path).parent)
                target_path = str((Path(source_dir) / href))

            # Normalize .html extension
            if not target_path.endswith(".html"):
                target_path = target_path + ".html"

        links.append({
            "source_path": source_path,
            "target_path": target_path,
            "link_text": link_text,
            "link_type": link_type
        })

    return links


def update_link_cache(root: Path, paths: Optional[list[str]] = None):
    """Update link graph cache.

    Args:
        root: Notes root directory.
        paths: Optional list of specific paths to update. If None, full rebuild.
    """
    with get_db() as db:
        now = time.time()

        if paths is None:
            # Full rebuild - clear existing data
            db.execute("DELETE FROM links")
            db.execute("DELETE FROM nodes")
            paths = []

            # Get all HTML files
            for p in root.rglob("*.html"):
                if not p.name.startswith("_"):
                    paths.append(p.relative_to(root).as_posix())

        for rel_path in paths:
            p = root / rel_path
            if not p.exists():
                # File deleted - remove from graph
                db.execute("DELETE FROM links WHERE source_path = ?", (rel_path,))
                db.execute("DELETE FROM nodes WHERE path = ?", (rel_path,))
                continue

            try:
                content = p.read_text(encoding="utf-8")
            except Exception:
                continue

            # Extract title for node
            title_match = re.search(r"<title[^>]*>([^<]+)</title>", content)
            title = title_match.group(1).strip() if title_match else Path(rel_path).stem

            db.execute("""
                INSERT OR REPLACE INTO nodes (path, label, modified_at, cached_at)
                VALUES (?, ?, ?, ?)
            """, (rel_path, title, p.stat().st_mtime, now))

            # Extract and store links
            links = extract_links_from_html(content, rel_path)
            for link in links:
                if link["link_type"] == "internal":
                    # Ensure target node exists
                    target_path = link["target_path"]
                    target_p = root / target_path
                    if target_p.exists():
                        target_title = target_path.split("/")[-1].replace(".html", "")
                        db.execute("""
                            INSERT OR IGNORE INTO nodes (path, label, cached_at)
                            VALUES (?, ?, ?)
                        """, (target_path, target_title, now))

                db.execute("""
                    INSERT OR REPLACE INTO links
                    (source_path, target_path, link_text, link_type, cached_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    link["source_path"],
                    link["target_path"],
                    link["link_text"],
                    link["link_type"],
                    now
                ))

        db.commit()


def get_link_index() -> dict:
    """Get link graph data from database.

    Returns:
        Dictionary with 'nodes' and 'edges' lists.
    """
    with get_db() as db:
        nodes = db.execute("SELECT path, label FROM nodes").fetchall()
        edges = db.execute("""
            SELECT source_path, target_path, link_text, link_type
            FROM links WHERE link_type = 'internal'
        """).fetchall()

        return {
            "nodes": [{"id": n["path"], "label": n["label"]} for n in nodes],
            "edges": [
                {"source": e["source_path"], "target": e["target_path"]}
                for e in edges
            ]
        }


# ─── Sync and Cache Management ──────────────────────────────────────────────────

def log_sync(status: str, files_updated: int = 0, duration_ms: int = 0):
    """Log a sync operation.

    Args:
        status: 'success' or 'failed'.
        files_updated: Number of files updated.
        duration_ms: Duration in milliseconds.
    """
    with get_db() as db:
        db.execute("""
            INSERT INTO sync_log (triggered_at, status, files_updated, duration_ms)
            VALUES (?, ?, ?, ?)
        """, (time.time(), status, files_updated, duration_ms))
        db.commit()


def get_sync_status() -> dict:
    """Get synchronization status.

    Returns:
        Dictionary with sync status information.
    """
    with get_db() as db:
        # Get last successful sync
        last_sync = db.execute("""
            SELECT * FROM sync_log
            WHERE status = 'success'
            ORDER BY triggered_at DESC LIMIT 1
        """).fetchone()

        # Get file count
        file_count = db.execute("SELECT COUNT(*) as count FROM files").fetchone()["count"]

        # Get cache valid status
        cache_valid = get_cache_valid()

        return {
            "cache_valid": cache_valid,
            "file_count": file_count,
            "last_sync_at": last_sync["triggered_at"] if last_sync else None,
            "last_sync_status": last_sync["status"] if last_sync else None,
            "files_updated": last_sync["files_updated"] if last_sync else 0,
        }


def full_cache_rebuild():
    """Perform a full cache rebuild.

    Scans the entire notes directory and rebuilds all caches.
    """
    notes_path = get_notes_path()
    if not notes_path.exists():
        return

    start_time = time.time()

    # Mark cache as invalid during rebuild
    set_cache_valid(False)

    try:
        # Rebuild all caches
        update_tree_cache(notes_path, full_rebuild=True)
        rebuild_search_index(notes_path)
        update_link_cache(notes_path)

        # Mark cache as valid
        set_cache_valid(True)

        duration_ms = int((time.time() - start_time) * 1000)

        # Count updated files
        with get_db() as db:
            file_count = db.execute("SELECT COUNT(*) as count FROM files").fetchone()["count"]

        log_sync("success", files_updated=file_count, duration_ms=duration_ms)

    except Exception as e:
        log_sync("failed")
        raise e


def incremental_cache_update():
    """Perform incremental cache update.

    Compares file modification times and only updates changed files.
    """
    notes_path = get_notes_path()
    if not notes_path.exists():
        return

    start_time = time.time()
    changed_files = []

    # Find files that have changed since last sync
    for p in notes_path.rglob("*.html"):
        if p.name.startswith("_"):
            continue

        rel_path = p.relative_to(notes_path).as_posix()
        cached_mtime = get_file_modified_at(rel_path)
        current_mtime = p.stat().st_mtime

        if cached_mtime is None or current_mtime > cached_mtime:
            changed_files.append(rel_path)

    if changed_files:
        update_tree_cache(notes_path, full_rebuild=False)
        update_search_index(notes_path, changed_files)
        update_link_cache(notes_path, changed_files)

    duration_ms = int((time.time() - start_time) * 1000)
    log_sync("success", files_updated=len(changed_files), duration_ms=duration_ms)

    return len(changed_files)
