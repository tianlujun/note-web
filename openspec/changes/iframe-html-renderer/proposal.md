## Why

HTML notes offer rich expressiveness (Canvas charts, CSS animations, complex layouts) that Markdown cannot match. However, the current `dangerouslySetInnerHTML` approach renders raw HTML directly into the React DOM, causing:
1. **Style conflicts** between HTML notes' embedded CSS and the React app's Tailwind styles
2. **No isolation** - a note's CSS can bleed into the entire app
3. **XSS vulnerability** - no sanitization of user content

The old vanilla JS SPA successfully used iframe + srcdoc for this purpose. We should adopt the same pattern for the React frontend.

## What Changes

- Replace `dangerouslySetInnerHTML` in ContentArea with iframe-based rendering
- Inject postMessage listener script into iframe content to intercept internal links
- Handle internal link navigation via parent React app's tab system
- Add proper sandbox attributes for security
- Maintain the same UX (loading states, error handling, scroll behavior)

## Capabilities

### New Capabilities

- `iframe-renderer`: Sandboxed iframe HTML rendering with srcdoc, postMessage link interception, and dynamic height adjustment

### Modified Capabilities

- (none - this is a new feature, not modifying existing requirements)

## Impact

- **Frontend**: Modify `content-area.tsx` - replace dangerouslySetInnerHTML div with iframe
- **Security**: Uses sandbox attribute to restrict iframe capabilities
- **UX**: Internal links in HTML notes will navigate via React Router instead of full page reload
