# Search Specification

## ADDED Requirements

### Requirement: Full-text search with FTS5
The system SHALL use SQLite FTS5 for full-text search with < 200ms response time.

#### Scenario: Basic keyword search
- **WHEN** frontend requests `GET /api/search?q=keyword`
- **THEN** system SHALL search using FTS5 MATCH
- **AND** return results with path, title, and snippet
- **AND** limit results to 20 items

#### Scenario: Search with snippet
- **WHEN** search returns results
- **THEN** each result SHALL include a snippet showing keyword in context
- **AND** snippet SHALL be 60 characters before and after keyword
- **AND** snippet SHALL be plain text (HTML tags stripped)

#### Scenario: Empty search results
- **WHEN** search query returns no matches
- **THEN** system SHALL return empty results array
- **AND** response SHALL still complete in < 200ms

### Requirement: Search index maintenance
The search index SHALL be automatically updated when notes are synced.

#### Scenario: Index update on sync
- **WHEN** `POST /api/sync-trigger` is called
- **THEN** system SHALL update FTS5 index for changed files only
- **AND** remove index entries for deleted files
- **AND** preserve index for unchanged files

#### Scenario: Full index rebuild
- **WHEN** `POST /api/cache/rebuild` is called
- **THEN** system SHALL drop and recreate FTS5 index
- **AND** index all HTML files in `/root/notes-mvp`

### Requirement: Search result ranking
The system SHALL return most relevant results first.

#### Scenario: Title match ranking
- **WHEN** keyword appears in title
- **THEN** result SHALL rank higher than matches in body only

#### Scenario: Multiple matches
- **WHEN** multiple files contain the keyword
- **THEN** results SHALL be sorted by relevance (BM25 score from FTS5)
