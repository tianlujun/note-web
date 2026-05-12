# Deployment Guide — NERD VPS

Tested on: NERD VPS (172.245.147.11), Ubuntu, user-level systemd.

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
ssh -p 22 root@172.245.147.11
cd /opt
git clone git@github.com:tianlujun/note-web.git
cd note-web
```

### 2. Install frontend dependencies and build

```bash
cd /opt/note-web/frontend
npm install
npm run build
```

Build output is `frontend/dist/`.

### 3. Copy build artifacts to backend static dir

```bash
cp -r /opt/note-web/frontend/dist/* /opt/note-web/backend/app/static/
```

`static/` is gitignored — this copies JS/CSS/images into the backend's serve directory.

### 4. Copy seal.svg (Vite strips it from dist)

```bash
cp /opt/note-web/frontend/dist/seal.svg /opt/note-web/backend/app/static/seal.svg
```

### 5. Install backend dependencies

```bash
cd /opt/note-web/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r app/requirements.txt
```

### 6. Create systemd service

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
Environment="ACCESS_TOKEN="
ExecStart=/opt/note-web/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8082
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

### Pull latest code from GitHub

```bash
ssh -p 22 root@172.245.147.11 "cd /opt/note-web && git pull origin master"
```

### Rebuild frontend if JS/CSS changed

```bash
ssh -p 22 root@172.245.147.11 "cd /opt/note-web/frontend && npm install && npm run build"
ssh -p 22 root@172.245.147.11 "cp -r /opt/note-web/frontend/dist/* /opt/note-web/backend/app/static/"
ssh -p 22 root@172.245.147.11 "cp /opt/note-web/frontend/dist/seal.svg /opt/note-web/backend/app/static/seal.svg"
```

### Restart service

```bash
ssh -p 22 root@172.245.147.11 "systemctl restart note-web"
```

### Trigger cache rebuild (after migrating new HTML notes)

```bash
ssh -p 22 root@172.245.147.11
TOKEN=""  # match your ACCESS_TOKEN config
curl -X POST http://127.0.0.1:8082/api/cache/rebuild \
  -H "Authorization: Bearer $TOKEN"
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
| `/opt/note-web/backend/app/static/` | Frontend build output (served at `/static/`) |
| `/root/notes/` | HTML notes directory (symlink or actual) |
| `/opt/note-web/backend/data/` | SQLite cache DB |
| `/opt/note-web/.venv/` | Python venv (gitignored) |
| `/opt/note-web/frontend/dist/` | Vite build output (gitignored) |

---

## Troubleshooting

### 500 on `/api/cache/rebuild`

Check `extract_links_from_html()` — path resolution bug was fixed in `db81f39`.

### seal.svg 404

`cp /opt/note-web/frontend/dist/seal.svg /opt/note-web/backend/app/static/seal.svg`

Vite's `public` dir only copies to `dist/`, not `backend/app/static/`.

### `/static/assets/*.js` 404

Vite build uses content-hashed filenames. Always `cp -r frontend/dist/* backend/app/static/` after build.
