## ADDED Requirements

### Requirement: Content Cache Store

The frontend SHALL maintain an in-memory cache of loaded note content using Zustand store.

#### Scenario: Cache hit on tab switch
- **WHEN** user switches to a tab that was previously opened and loaded
- **THEN** the system SHALL use cached content directly without making an API request
- **AND** the iframe SHALL display the cached content immediately

#### Scenario: Cache miss on first open
- **WHEN** user opens a tab for the first time
- **THEN** the system SHALL fetch content from the API
- **AND** the fetched content SHALL be stored in the cache

#### Scenario: Cache stores noteDir for image rewriting
- **WHEN** content is cached
- **THEN** the cache SHALL store `noteDir` (directory path) along with content
- **AND** image src rewriting SHALL work correctly when using cached content

### Requirement: Cache Invalidation via SSE

When an SSE `refresh` event is received, all cached content SHALL be invalidated.

#### Scenario: SSE refresh clears cache
- **WHEN** the SSE connection receives a `refresh` event
- **THEN** the system SHALL clear all cached content
- **AND** if there is an active tab, the system SHALL re-fetch the current note's content

#### Scenario: Stale content prevention
- **WHEN** Agent modifies a note and triggers sync
- **THEN** after SSE refresh, the next access to that note SHALL fetch fresh content
- **AND** no stale cached content SHALL be displayed

### Requirement: Memory-only Cache

The cache SHALL be stored in memory only and SHALL NOT persist across page reloads.

#### Scenario: Page reload clears cache
- **WHEN** user reloads the browser page
- **THEN** the content cache SHALL be empty
- **AND** all tabs SHALL be reloaded from the API on first access

#### Scenario: Cache does not cause memory leaks
- **WHEN** user opens and closes multiple tabs
- **THEN** the cache SHALL only store content for currently known tabs
- **AND** old entries SHALL be eligible for garbage collection when no longer referenced
