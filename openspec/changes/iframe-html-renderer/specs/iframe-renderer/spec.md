## ADDED Requirements

### Requirement: iframe-renderer renders HTML notes in sandboxed iframe

The system SHALL render HTML notes using an iframe with srcdoc attribute, providing style isolation from the React application.

#### Scenario: Render note in iframe
- **WHEN** user opens a note tab
- **THEN** system fetches HTML content via api.getFile()
- **AND** injects content into iframe via srcdoc
- **AND** iframe has sandbox="allow-scripts allow-top-navigation-by-user-activation"

#### Scenario: Loading state while fetching note
- **WHEN** note fetch is in progress
- **THEN** display loading skeleton in content area
- **AND** do not render iframe until content arrives

#### Scenario: Error state when fetch fails
- **WHEN** api.getFile() throws an error
- **THEN** display error message with retry button
- **AND** do not render iframe

### Requirement: Internal links intercepted via postMessage

The system SHALL intercept link clicks inside the iframe and navigate using React's tab system for internal links.

#### Scenario: Click internal link opens new tab
- **WHEN** user clicks a link with href like "02-projects/_index.html"
- **THEN** iframe posts message { type: 'note-link', path: href } to parent
- **AND** parent React app opens the path in a new tab
- **AND** does NOT navigate the iframe away

#### Scenario: Click external link opens in new tab
- **WHEN** user clicks a link with href starting with "http://" or "https://"
- **THEN** link opens in a new browser tab (default behavior)
- **AND** parent React app is not affected

### Requirement: Note content uses srcdoc injection pattern

The system SHALL inject a script into the iframe srcdoc that handles link interception.

#### Scenario: srcdoc includes link interception script
- **WHEN** iframe srcdoc is set
- **THEN** srcdoc contains injected script: document.addEventListener('click', ...) that posts note-link messages
- **AND** script is injected before the HTML content

#### Scenario: srcdoc preserves HTML content
- **WHEN** note HTML is: <html><body><p>Hello</p></body></html>
- **THEN** iframe.srcdoc = "<injected-script>" + "<html><body><p>Hello</p></body></html>"
- **AND** HTML content is rendered correctly in iframe
