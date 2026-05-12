# Search Specification

## ADDED Requirements

### Requirement: Search trigger
The system SHALL allow user to trigger search.

#### Scenario: Click search icon
- **WHEN** user clicks search icon in sidebar
- **THEN** search input expands and focuses

#### Scenario: Press slash key
- **WHEN** user presses `/` key (not in input)
- **THEN** search input expands and focuses

### Requirement: Search input
The system SHALL accept search query input.

#### Scenario: Type in search
- **WHEN** user types in search input
- **THEN** system debounces input for 300ms
- **AND** sends search request to `/api/search`

#### Scenario: Clear search
- **WHEN** user clicks clear button or presses Escape
- **THEN** search input clears and closes

### Requirement: Display search results
The system SHALL display search results.

#### Scenario: Show results dropdown
- **WHEN** search returns results
- **THEN** system displays dropdown with up to 8 results
- **AND** each result shows title and snippet

#### Scenario: No results
- **WHEN** search returns empty
- **THEN** system displays "No results found"

### Requirement: Navigate to result
The system SHALL open search result in new tab.

#### Scenario: Click search result
- **WHEN** user clicks a search result
- **THEN** system opens file in new tab
- **AND** closes search

### Requirement: Close search
The system SHALL close search on Escape.

#### Scenario: Press Escape
- **WHEN** search is open and user presses Escape
- **THEN** search closes and input clears
