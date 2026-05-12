# Link Graph Specification

## ADDED Requirements

### Requirement: Link graph data storage
The system SHALL store link relationships between notes in SQLite for graph visualization.

#### Scenario: Extract internal links
- **WHEN** a note contains `<a href="./other-note.html">` or `<a href="/notes/other-note.html">`
- **THEN** system SHALL extract source_path, target_path, and link_text
- **AND** store in `links` table with `link_type = 'internal'`

#### Scenario: Extract external links
- **WHEN** a note contains `<a href="https://...">`
- **THEN** system SHALL store with `link_type = 'external'`
- **AND** may omit from graph visualization

#### Scenario: Graph nodes from links
- **WHEN** links are extracted
- **THEN** system SHALL ensure both source and target exist in `nodes` table
- **AND** create node entries if they don't exist

### Requirement: Link graph API
The system SHALL provide `/api/link-index` from SQLite instead of JSON file.

#### Scenario: Get link graph data
- **WHEN** frontend requests `GET /api/link-index`
- **THEN** system SHALL return `{nodes: [...], edges: [...]}`
- **AND** nodes SHALL be from `nodes` table
- **AND** edges SHALL be from `links` table

#### Scenario: Graph update on sync
- **WHEN** `POST /api/sync-trigger` is called
- **THEN** system SHALL parse changed HTML files for links
- **AND** update `links` and `nodes` tables incrementally

### Requirement: Graph node metadata
Each graph node SHALL include label for display.

#### Scenario: Node label extraction
- **WHEN** a node is created from `path/to/note.html`
- **THEN** label SHALL be extracted from `<title>` tag in HTML
- **OR** if no title, use filename without extension

#### Scenario: Node modification tracking
- **WHEN** a note's modification time changes
- **THEN** node's `modified_at` SHALL be updated
- **AND** cached_at SHALL reflect when node was last cached
