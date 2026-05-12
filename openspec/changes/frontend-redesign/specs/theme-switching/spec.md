# Theme Switching Specification

## ADDED Requirements

### Requirement: Theme toggle
The system SHALL allow user to toggle between light and dark themes.

#### Scenario: Click theme toggle
- **WHEN** user clicks theme toggle button
- **THEN** system switches theme immediately
- **AND** icon animates between sun and moon

### Requirement: Theme persistence
The system SHALL persist theme preference.

#### Scenario: Theme saved to storage
- **WHEN** user changes theme
- **THEN** system saves preference to localStorage

#### Scenario: Theme restored on load
- **WHEN** user visits app
- **THEN** system restores theme from localStorage

### Requirement: System preference detection
The system SHALL respect system color scheme on first visit.

#### Scenario: First visit, no saved preference
- **WHEN** user visits app for the first time
- **AND** has no saved theme preference
- **THEN** system uses system color scheme (prefers-color-scheme)

### Requirement: Theme applied correctly
The system SHALL apply theme to all components.

#### Scenario: Light theme
- **WHEN** light theme is active
- **THEN** background is #FAFAF8
- **AND** text is #1A1A1A
- **AND** accent is #C53E3E

#### Scenario: Dark theme
- **WHEN** dark theme is active
- **THEN** background is #0A0A0A
- **AND** text is #E5E5E5
- **AND** accent is #C53E3E

### Requirement: Browser theme support
The system SHALL set browser-level theme indicators.

#### Scenario: Light theme active
- **WHEN** light theme is active
- **THEN** system SHALL set `<html color-scheme="light">`
- **AND** system SHALL set `<meta name="theme-color" content="#FAFAF8">`

#### Scenario: Dark theme active
- **WHEN** dark theme is active
- **THEN** system SHALL set `<html color-scheme="dark">`
- **AND** system SHALL set `<meta name="theme-color" content="#0A0A0A">`

### Requirement: Motion preference respect
The system SHALL respect user's motion preferences.

#### Scenario: Reduced motion preferred
- **WHEN** user has `prefers-reduced-motion: reduce`
- **THEN** theme toggle animation SHALL be disabled or reduced
- **AND** all non-essential animations SHALL be disabled

#### Scenario: No reduced motion preference
- **WHEN** user has no motion preference
- **THEN** theme toggle animation SHALL play normally