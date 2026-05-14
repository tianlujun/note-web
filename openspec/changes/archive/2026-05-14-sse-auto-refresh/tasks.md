## 1. Backend SSE Infrastructure

- [x] 1.1 Add `sse_clients: list` global variable in `database.py`
- [x] 1.2 Implement `notify_clients()` function to broadcast refresh events
- [x] 1.3 Create `events_router` in `backend/app/routes/events.py` with `GET /api/events` endpoint
- [x] 1.4 Register `events_router` in `main.py`

## 2. Backend Notification Integration

- [x] 2.1 Call `notify_clients()` at the end of `incremental_cache_update()` in `database.py`
- [x] 2.2 Call `notify_clients()` at the end of `rebuild_cache()` in `database.py`

## 3. Frontend SSE Client

- [x] 3.1 Add SSE connection initialization in `AppShell` component (`app-shell.tsx`)
- [x] 3.2 Implement `onmessage` handler to re-fetch current note content
- [x] 3.3 Handle connection errors and automatic reconnection (EventSource native support)

## 4. Verification

- [ ] 4.1 Trigger `/api/rebuild` and verify SSE event is received
- [ ] 4.2 Verify frontend auto-refreshes current note without manual browser refresh
