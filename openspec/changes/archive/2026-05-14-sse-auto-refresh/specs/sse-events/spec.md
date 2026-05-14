## ADDED Requirements

### Requirement: SSE Event Endpoint

The backend SHALL provide a `GET /api/events` endpoint that establishes a Server-Sent Events connection.

#### Scenario: Client connects to SSE endpoint
- **WHEN** a client sends a GET request to `/api/events`
- **THEN** the server returns a streaming response with `Content-Type: text/event-stream`
- **AND** the connection remains open until the client disconnects

#### Scenario: Multiple clients can connect simultaneously
- **WHEN** multiple clients connect to `/api/events`
- **THEN** all connections are maintained independently
- **AND** each client receives the same notifications

### Requirement: Cache Update Notification

After a cache update completes, all connected SSE clients SHALL receive a `refresh` event.

#### Scenario: Incremental cache update triggers notification
- **WHEN** `incremental_cache_update()` function completes successfully
- **THEN** the server SHALL send `data: refresh\n\n` to all connected clients

#### Scenario: Full cache rebuild triggers notification
- **WHEN** `rebuild_cache()` function completes successfully
- **THEN** the server SHALL send `data: refresh\n\n` to all connected clients

#### Scenario: Client disconnects gracefully
- **WHEN** a connected client closes the connection
- **THEN** the server SHALL remove the client from the active clients list
- **AND** no errors occur

### Requirement: Frontend SSE Client

The frontend SHALL establish an SSE connection on application initialization and handle refresh events.

#### Scenario: App initializes SSE connection
- **WHEN** the application loads
- **THEN** it SHALL create an `EventSource` connection to `/api/events`
- **AND** maintain this connection while the application is running

#### Scenario: Frontend receives refresh event
- **WHEN** the frontend receives a `refresh` event from the SSE connection
- **THEN** it SHALL re-fetch the currently active note's content via `api.getFile(activeTab.path)`
- **AND** update the iframe display with the new content

#### Scenario: SSE connection is lost
- **WHEN** the SSE connection is lost or disconnected
- **THEN** the `EventSource` SHALL automatically attempt to reconnect
- **AND** the user experience remains uninterrupted
