# Tabs Specification

## ADDED Requirements

### Requirement: Open files in tabs
The system SHALL open files in tabs when clicked.

#### Scenario: Open new file
- **WHEN** user clicks a file in file tree
- **THEN** system creates new tab with file path and title
- **AND** tab becomes active

#### Scenario: Open already open file
- **WHEN** user clicks a file that already has a tab
- **THEN** system focuses that existing tab

### Requirement: Close tabs
The system SHALL allow user to close tabs.

#### Scenario: Click close button
- **WHEN** user clicks × button on tab
- **THEN** system closes tab and removes it from tab bar
- **AND** activates adjacent tab

#### Scenario: Close last tab
- **WHEN** user closes the last tab
- **THEN** system shows empty state content

### Requirement: Switch tabs
The system SHALL allow switching between tabs.

#### Scenario: Click on inactive tab
- **WHEN** user clicks an inactive tab
- **THEN** system activates that tab

#### Scenario: Keyboard navigation
- **WHEN** user presses Ctrl+Tab
- **THEN** system activates next tab (wrapping)
- **WHEN** user presses Ctrl+Shift+Tab
- **THEN** system activates previous tab (wrapping)

### Requirement: Tab overflow
The system SHALL handle overflow when many tabs are open.

#### Scenario: Many tabs overflow
- **WHEN** more than 5 tabs are open
- **THEN** tab bar shows horizontal scroll
- **AND** fade hints indicate more tabs

### Requirement: Empty state
The system SHALL show empty state when no tabs are open.

#### Scenario: No tabs open
- **WHEN** user has not opened any files
- **THEN** content area shows "Open a note from the sidebar" message
