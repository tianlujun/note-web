# File Tree Cache Specification

## ADDED Requirements

### Requirement: File tree caching
The system SHALL cache the file tree structure in SQLite to avoid filesystem operations on each request.

#### Scenario: Get file tree from cache
- **WHEN** frontend requests `GET /api/files`
- **THEN** system SHALL return file tree from SQLite `files` table
- **AND** response time SHALL be < 100ms

#### Scenario: Cache miss triggers rebuild
- **WHEN** `files` table is empty or `cache_valid = 0`
- **THEN** system SHALL scan `/root/notes-mvp` directory
- **AND** populate `files` table with current file structure
- **AND** set `cache_valid = 1`

#### Scenario: Incremental update on sync
- **WHEN** `POST /api/sync-trigger` is called
- **THEN** system SHALL compare file `modified_at` with cached value
- **AND** only update files where `modified_at` has changed
- **AND** remove entries for deleted files

### Requirement: File tree structure
The file tree SHALL support directory hierarchy up to 3 levels deep (excluding root).

#### Scenario: Root level directories
- **WHEN** file tree is requested
- **THEN** system SHALL list top-level directories (e.g., `00-Scheme/`, `02-Projects/`)
- **AND** sort directories before files, alphabetically within each group

#### Scenario: Nested directory structure
- **WHEN** a directory is expanded
- **THEN** system SHALL return its children with correct parent_path
- **AND** distinguish between `type: 'dir'` and `type: 'file'`

#### Scenario: Directory index handling
- **WHEN** a file named `_index.html` exists in a directory
- **THEN** system SHALL mark it with `is_dir_index: true`
- **AND** hide it from normal file listing (frontend responsibility)

### Requirement: Cache invalidation
The system SHALL provide mechanism to invalidate cache when notes change.

#### Scenario: Manual cache rebuild
- **WHEN** `POST /api/cache/rebuild` is called
- **THEN** system SHALL drop all entries in `files` table
- **AND** perform full filesystem scan
- **AND** repopulate cache

#### Scenario: Cache status check
- **WHEN** `GET /api/cache/status` is called
- **THEN** system SHALL return number of cached files
- **AND** last_sync_time from sync_log table
- **AND** cache_valid status
