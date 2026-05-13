# Deployment Guide — NERD VPS

Tested on: NERD VPS (172.245.147.11), Ubuntu, user-level systemd.

---

## Architecture

```
frontend/dist/ (Vite build output)
  ↕ npm run build
backend/app/main.py → FRONTEND_DIST = /opt/note-web/frontend/dist
  → served directly at / (no hash sync problem)
  → /seal.svg route added in main.py
/root/notes/ → HTML vault (synced from TOS)
```

**No `backend/app/static/` layer.** Frontend dist is served directly. No copy step after build.

---

## Prerequisites

- Node.js 20+ (`node --version`)
- Python 3.12+ (`python3 --version`)
- Git SSH access to `git@github.com:tianlujun/note-web.git`
- `rclone` configured for TOS (`tos:` remote)

---

## One-Time Server Setup

### 1. Clone the repo

```bash
ssh root@172.245.147.11
cd /opt
git clone git@github.com:tianlujun/note-web.git
cd note-web
```

### 2. Build frontend

```bash
cd /opt/note-web/frontend
npm install
npm run build
```

Build output: `frontend/dist/` (gitignored).

### 3. Install backend dependencies

```bash
cd /opt/note-web/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r app/requirements.txt
```

### 4. Create systemd service

```bash
cat > /etc/systemd/system/note-web.service << 'EOF'
[Unit]
Description=Note Web App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/note-web
Environment="NOTES_PATH=/root/notes"
Environment="HOST=0.0.0.0"
Environment="PORT=8082"
Environment="ACCESS_TOKEN=your_token_here"
ExecStart=/opt/note-web/backend/.venv/bin/python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8082
Restart=always

[Install]
WantedBy=multi-user.target
EOF
```

Enable and start:

```bash
systemctl daemon-reload
systemctl enable note-web
systemctl start note-web
systemctl status note-web
```

---

## Updating

### Pull latest code

```bash
ssh root@172.245.147.11 "cd /opt/note-web && git pull origin master"
```

### Rebuild frontend if JS/CSS changed

```bash
ssh root@172.245.147.11 "cd /opt/note-web/frontend && npm install && npm run build"
```

No copy step needed — `FRONTEND_DIST` points to `frontend/dist` directly.

### Restart service

```bash
ssh root@172.245.147.11 "systemctl restart note-web"
```

---

## Reverse Proxy (Caddy)

```json
notes.cinnabar.ink {
  reverse_proxy localhost:8082
}
```

---

## Key Paths

| Path | Purpose |
|------|---------|
| `/opt/note-web/` | Git repo |
| `/opt/note-web/frontend/dist/` | Vite build output (served directly) |
| `/root/notes/` | HTML notes directory |
| `/opt/note-web/backend/data/` | SQLite cache DB |
| `/opt/note-web/.venv/` | Python venv (gitignored) |

---

## Auth Architecture

- **Bearer token**: Primary API credential (for agent/CLI access)
  - Header: `Authorization: Bearer <token>`
  - Env var: `ACCESS_TOKEN`
- **Session cookie**: Browser login convenience
  - Cookie name: `notes_session` (non-HttpOnly, JS-readable)
  - TTL: 7 days
  - Used for: Web UI session + img rewrite in iframe srcdoc
- **Image auth**: `?session=<session_id>` query param
  - Frontend rewrites `<img src="attachments/...">` → `/api/attachment/<path>?session=<session_id>`
  - Backend validates via `verify_session()`
- **No image_token separation**: Single session cookie covers both web session and image auth

### Agent API Usage

```bash
# List files
curl -H "Authorization: Bearer notes123" http://localhost:8082/api/files

# Get note
curl -H "Authorization: Bearer notes123" http://localhost:8082/api/file/04-learning/古代汉语/index.html

# Trigger sync from TOS
curl -X POST http://localhost:8082/api/sync/trigger -H "Authorization: Bearer notes123"
```

---

## Troubleshooting

### seal.svg 404

Fixed in commit `c11412c`. `/seal.svg` route is defined in `backend/app/main.py`. Ensure `frontend/dist/seal.svg` exists after build (Vite copies `public/` to `dist/`).

### /static/assets/*.js 404

Vite uses content-hashed filenames. With direct `frontend/dist/` serving (no copy step), this is no longer an issue. Ensure `vite.config.ts` has `base: '/'`.

### 500 on API login

Check that `ACCESS_TOKEN` env var is set in systemd service. Empty token allows any input to create a session.

### Session expired immediately

`SESSION_TTL_DAYS = 7` in `main.py`. Session store is in-memory — restarting the service clears all sessions.

### Images return 401

- Ensure `notes_session` cookie is set (check browser DevTools → Application → Cookies)
- Ensure cookie is non-Httponly (set in `api_login_compat()`)
- Check `verify_session()` is correctly validating the session_id
