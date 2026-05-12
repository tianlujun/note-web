# Graph View Specification

## ADDED Requirements

### Requirement: Graph view toggle
The system SHALL allow user to toggle graph view.

#### Scenario: Click graph icon
- **WHEN** user clicks graph icon in sidebar
- **THEN** system opens graph view in full-screen modal

#### Scenario: Close graph view
- **WHEN** user clicks background or presses Escape
- **THEN** graph view closes

### Requirement: Display link graph
The system SHALL display the link graph from `/api/link-index`.

#### Scenario: Graph loads successfully
- **WHEN** graph view opens
- **THEN** system fetches `/api/link-index` and renders graph
- **AND** shows loading spinner during fetch

#### Scenario: Graph has nodes
- **WHEN** link index has nodes
- **THEN** system renders nodes as styled elements
- **AND** renders edges as connecting lines

#### Scenario: Graph is empty
- **WHEN** link index is empty
- **THEN** system displays "No connections yet" message

### Requirement: Node interaction
The system SHALL allow user to interact with nodes.

#### Scenario: Hover node
- **WHEN** user hovers over a node
- **THEN** system highlights node and connected edges

#### Scenario: Click node
- **WHEN** user clicks a node
- **THEN** system opens that note in new tab
- **AND** closes graph view

#### Scenario: Touch node on mobile
- **WHEN** user taps a node on mobile
- **THEN** system opens that note in new tab

### Requirement: Graph layout
The system SHALL use automatic layout for graph positioning.

#### Scenario: Initial render
- **WHEN** graph renders
- **THEN** nodes are positioned using Dagre layout algorithm
- **AND** layout direction SHALL be configurable (LR/TB)

#### Scenario: Pan and zoom
- **WHEN** user drags or scrolls
- **THEN** graph pans/zooms accordingly
- **AND** supports pinch-to-zoom on mobile

### Requirement: Mobile touch interaction
The system SHALL support touch-based graph interaction.

#### Scenario: Touch pan
- **WHEN** user drags on graph on mobile
- **THEN** graph pans in that direction

#### Scenario: Pinch to zoom
- **WHEN** user pinch gesture on graph
- **THEN** graph zooms in/out

#### Scenario: Double tap to reset
- **WHEN** user double taps on graph
- **THEN** graph resets to fit all nodes in viewport

### Requirement: Accessibility
The system SHALL be accessible to keyboard and screen reader users.

#### Scenario: Keyboard navigation
- **WHEN** user tabs to graph
- **THEN** nodes SHALL be focusable with Tab key
- **AND** focused node SHALL have visible focus ring

#### Scenario: Screen reader support
- **WHEN** screen reader user navigates graph
- **THEN** each node SHALL announce its label
- **AND** number of connections SHALL be announced

### Requirement: Performance
The system SHALL render efficiently with up to 500 nodes.

#### Scenario: Large graph
- **WHEN** graph has 100+ nodes
- **THEN** system SHALL maintain 60fps interaction
- **AND** SHALL use efficient rendering (no unnecessary re-renders)