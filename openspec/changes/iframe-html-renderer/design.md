## Context

HTML notes stored in `/home/tianlj/notes/` are converted from Markdown and contain rich styling, Canvas charts, and complex CSS layouts. The current React frontend renders them using `dangerouslySetInnerHTML` directly in the DOM, which causes style conflicts with Tailwind CSS.

The old vanilla JS SPA (`backend/static/index.html`) successfully solved this using iframe with srcdoc. The React frontend should adopt the same pattern.

**Current implementation issues:**
- `dangerouslySetInnerHTML` renders HTML directly in React DOM
- HTML notes' embedded CSS (`<style>` in `<head>` or inline styles) conflicts with app styles
- No XSS sanitization
- No style isolation

## Goals / Non-Goals

**Goals:**
- Render HTML notes in a sandboxed iframe using srcdoc
- Intercept internal links via postMessage and navigate using React Router
- Maintain current UX (loading states, error handling, responsive layout)
- Add proper security via sandbox attribute

**Non-Goals:**
- Support editing HTML notes (read-only viewing)
- Implement full HTML sanitization (trust the source /home/tianlj/notes)
- Handle iframe-to-iframe communication (single iframe only)
- ResizeObserver-based dynamic height adjustment (initial version uses fixed height)

## Decisions

### 1. Use srcdoc instead of src

**Decision**: Inject HTML content via `iframe.srcdoc` instead of loading via `src` attribute.

**Rationale**:
- `srcdoc` keeps content same-origin with parent, avoiding CORS issues
- Allows injecting the postMessage listener script alongside content
- No additional network request for each note

**Alternatives considered**:
- `src` with backend serving HTML files - requires CORS headers, more complex
- `data:text/html` - works but less readable, same-origin issues

### 2. Intercept links via injected script in srcdoc

**Decision**: Inject a `<script>` tag into srcdoc that listens for link clicks and posts messages to parent.

**Rationale**:
- Works reliably across all browsers
- Content + script are delivered together in srcdoc
- Matches the pattern already proven in the old SPA

**Alternatives considered**:
- `sandbox="allow-top-navigation"` + intercept in parent - causes full page reloads
- Target `_blank` for all links - breaks internal navigation UX

### 3. Sandbox attribute: `allow-scripts allow-top-navigation-by-user-activation`

**Decision**: Use sandbox flags that allow scripts and user-initiated top navigation.

**Rationale**:
- `allow-scripts` - notes may have JS (e.g., Chart.js, interactive elements)
- `allow-top-navigation-by-user-activation` - allows notes to link out to external URLs when user clicks
- Don't use `allow-same-origin` as it would remove sandbox protection

### 4. Handle internal link navigation in React

**Decision**: Parent window listens for `postMessage` with `{ type: 'note-link', path: href }` and opens the note in a new tab.

**Rationale**:
- Internal links (relative paths like `02-projects/_index.html`) should open as tabs
- External links (http://, https://) should open in new tab via `target="_blank"`
- The injected script already handles this by posting only internal links to parent

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| iframe may break scroll synchronization with parent | Use dedicated scroll container inside iframe; parent handles only tab/loading state |
| postMessage security (origin validation) | Verify `event.origin` matches expected origin (localhost in dev) |
| XSS from malicious note content | Notes are from trusted source (/home/tianlj/notes); sandbox restricts script capabilities |
| iframe height fixed, may not fit all content | Initial version uses `height: 100%` with overflow scroll inside iframe |
