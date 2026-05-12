# File Tree Specification

## ADDED Requirements

### Requirement: Display file tree structure
The system SHALL display the file tree from `/api/files` in the sidebar.

#### Scenario: File tree loads successfully
- **WHEN** sidebar mounts and user is authenticated
- **THEN** system fetches `/api/files` and displays file tree
- **AND** shows loading skeleton during fetch

#### Scenario: File tree fetch fails
- **WHEN** file tree API returns error
- **THEN** system displays error message with retry button

#### Scenario: Empty file tree
- **WHEN** file tree API returns empty list
- **THEN** system displays "No notes found" message

### Requirement: File type filtering
The system SHALL only display markdown files (`.md`) and directories.

#### Scenario: Filter non-markdown files
- **WHEN** file tree API returns files
- **THEN** system SHALL display only files with `.md` extension
- **AND** system SHALL exclude: `.obsidian/`, `attachments/`, `*.png`, `*.gif`, `*.svg`, `*.bin`, `.DS_Store`

#### Scenario: Show index files
- **WHEN** directory contains `_index.md`
- **THEN** system SHALL display it as a normal file (not hidden)
- **AND** it SHALL be clickable to open

### Requirement: Directory expand/collapse
The system SHALL allow user to expand and collapse directories.

#### Scenario: Click to expand directory
- **WHEN** user clicks a collapsed directory
- **THEN** system reveals child items with slide-down animation

#### Scenario: Click to collapse directory
- **WHEN** user clicks an expanded directory
- **THEN** system hides child items with slide-up animation

#### Scenario: Directory remembers state
- **WHEN** user expands a directory
- **AND** navigates away
- **THEN** system remembers expanded state when returning

### Requirement: File selection
The system SHALL open a file when user clicks on it.

#### Scenario: Click on file
- **WHEN** user clicks a file item
- **THEN** system opens file in new tab or focuses existing tab

### Requirement: Active file indication
The system SHALL highlight the currently active file.

#### Scenario: File is active tab
- **WHEN** file has an open tab
- **THEN** system shows accent background color on file item

### Requirement: Text overflow handling
The system SHALL handle long file names gracefully.

#### Scenario: Long file name
- **WHEN** file name exceeds available width
- **THEN** system SHALL truncate with ellipsis (...)
- **AND** full name SHALL be available via title attribute (tooltip)

### Requirement: Mobile touch interaction
The system SHALL support touch interaction on mobile devices.

#### Scenario: Touch to expand/collapse
- **WHEN** user taps on a directory on mobile
- **THEN** system expands or collapses it
- **AND** touch target size SHALL be minimum 44x44px

#### Scenario: Touch scroll
- **WHEN** user scrolls file tree on mobile
- **THEN** system SHALL use native momentum scrolling
- **AND** SHALL NOT prevent default zoom behavior

### Requirement: Keyboard navigation
The system SHALL support keyboard navigation.

#### Scenario: Arrow key navigation
- **WHEN** user presses Arrow Down/Up
- **THEN** system SHALL move focus between items
- **AND** directories SHALL expand/collapse on Arrow Right/Left

#### Scenario: Enter to select
- **WHEN** user presses Enter with item focused
- **THEN** system SHALL open that file or toggle directory

### Requirement: Accessibility
The system SHALL be accessible to screen reader users.

#### Scenario: Screen reader
- **WHEN** screen reader reads file tree
- **THEN** each file item SHALL have accessible name
- **AND** directory expand/collapse state SHALL be announced
- **AND** file type (.md) SHALL be indicated