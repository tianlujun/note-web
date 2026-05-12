# Authentication Specification

## ADDED Requirements

### Requirement: Login page access
The system SHALL display a login page when user is not authenticated.

#### Scenario: Unauthenticated user visits root
- **WHEN** user visits `/` without valid session
- **THEN** system displays login page with token input

#### Scenario: Authenticated user visits root
- **WHEN** user visits `/` with valid session cookie
- **THEN** system redirects to `/app`

### Requirement: Token authentication
The system SHALL authenticate user via Bearer token.

#### Scenario: Valid token submission
- **WHEN** user submits valid token
- **THEN** system creates session cookie and redirects to `/app`

#### Scenario: Invalid token submission
- **WHEN** user submits invalid token
- **THEN** system displays error message "Invalid token"

#### Scenario: Empty token submission
- **WHEN** user submits empty token
- **THEN** system displays error message "Token required"

### Requirement: Session persistence
The system SHALL persist authentication across page refreshes.

#### Scenario: Page refresh with valid session
- **WHEN** user refreshes page with valid session cookie
- **THEN** system maintains authenticated state

#### Scenario: Page refresh without session
- **WHEN** user refreshes page without session cookie
- **THEN** system redirects to login page

### Requirement: Logout functionality
The system SHALL allow user to logout and clear session.

#### Scenario: User clicks logout
- **WHEN** user clicks logout button
- **THEN** system clears session cookie and redirects to login page
