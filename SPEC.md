# Note-Web React Frontend Specification

## 1. Concept & Vision

A modern, read-only knowledge base viewer with a Linear-inspired UI. The app feels like a premium developer tool — fast, calm, focused. Clean white content area with a dark sidebar, multi-tab browsing, and an optional graph view that reveals the structure of the knowledge base. Mobile-first responsive: sidebar becomes a bottom drawer on small screens.

**Core principle**: content is king. The UI stays out of the way — no decorations, no chrome, just the knowledge.

---

## 2. Design Language

### Color Palette
| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--bg-primary` | `#ffffff` | `#0d0d0d` | Main content background |
| `--bg-secondary` | `#f5f5f5` | `#161616` | Sidebar, tab bar background |
| `--bg-tertiary` | `#ebebeb` | `#262626` | Hover states, borders |
| `--text-primary` | `#0d0d0d` | `#e5e5e5` | Body text |
| `--text-secondary` | `#737373` | `#a3a3a3` | Muted labels, metadata |
| `--text-inverse` | `#ffffff` | `#0d0d0d` | Text on dark backgrounds |
| `--accent` | `#6366f1` | `#818cf8` | Active tab, links, focus rings |
| `--accent-hover` | `#4f46e5` | `#a5b4fc` | Hover on accent elements |
| `--border` | `#e5e5e5` | `#262626` | Dividers, card borders |
| `--shadow` | `rgba(0,0,0,0.06)` | `rgba(0,0,0,0.4)` | Card shadow |

### Typography
- **Body**: `Inter`, fallback `system-ui, sans-serif`
- **Headings**: `Inter`, weight 600-700
- **Code/Mono**: `JetBrains Mono`, `Fira Code`, fallback `monospace`
- Base size: 15px, line-height 1.6

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
- Border radius: 6px (cards), 4px (buttons), 2px (badges)
- Sidebar width: 260px (desktop), full-width bottom sheet (mobile)

### Motion Philosophy
- Duration: 150ms for micro-interactions, 200ms for layout shifts
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (spring-like, snappy)
- Animations: sidebar collapse/expand (200ms), tab switch (instant), drawer slide (250ms)
- No gratuitous animation — every motion has a functional purpose

### Visual Assets
- Icons: Lucide React (consistent 1.5px stroke, 18px default)
- No images in chrome — content area renders user HTML freely

---

## 3. Layout & Structure

### Desktop (≥768px)
```
┌─────────────────────────────────────────────────┐
│ [≡] sidebar (260px) │ [tabs] ──────────────── │
│                     │                           │
│ [search input]      │  [content area]          │
│                     │                           │
│ ▾ 00-Scheme/        │  Rendered HTML content    │
│   ▸ _index.html     │  via Shadow DOM           │
│   ▸ SCHEMA.md       │                           │
│ ▾ 05-entities/      │                           │
│   ▸ ACP.html        │                           │
│   ...               │                           │
└─────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────────────────┐
│ ≡  Note Web          [search]  │  ← top bar
├─────────────────────────────────┤
│                                 │
│  [content area]                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│ [tab1] [tab2] [+]               │  ← tab bar
└─────────────────────────────────┘
   ↑ tap to reveal bottom drawer
```

### Bottom Drawer (mobile only)
- Drag handle at top (40px × 4px, rounded)
- Slide up from bottom, max 70vh
- Backdrop overlay dims content
- Tap backdrop or drag down to dismiss

---

## 4. Features & Interactions

### Authentication
- **Login page**: Single input field for Bearer token, submit button
- **Flow**: `POST /api/login` with `{ "token": "..." }` → sets session cookie + stores token in Zustand
- **Session**: 7-day cookie for human users; Bearer token in `Authorization: Bearer <token>` header for Agent
- **Logout**: Clears cookie + Zustand state, returns to login
- **Protected routes**: All `/app/*` routes require auth; redirect to `/` if unauthenticated

### File Tree (Sidebar)
- **Source**: `GET /api/files` → flat list of `{ path, type: 'file'|'dir' }`
- **Grouping**: Top-level dirs derived from paths (e.g., `05-entities/` → group `05-entities`)
- **Index detection**: Files named `_index.html` are hidden from listing (they're directories, not notes)
- **Expand/Collapse**: Click dir row to toggle; state stored in Zustand (persisted to sessionStorage)
- **Active file**: Highlighted with accent background
- **Hover**: Subtle bg change (--bg-tertiary)

### Search
- **Trigger**: Click search icon or press `/` keyboard shortcut
- **Input**: Expandable search field in sidebar header
- **API**: `GET /api/search?q=<query>` → returns `[{ path, title, snippet }]`
- **Results**: Dropdown below search input, max 8 results, click to navigate
- **Escape**: Closes search, clears query

### Multi-Tab System
- **Data**: `useTabStore` with `{ id, path, title, scrollPos }[]`
- **Open**: Clicking a file in tree opens in new tab (or focuses existing tab with same path)
- **Tab bar**: Horizontal scrollable tabs above content area
- **Close**: × button on tab (removes tab, selects adjacent)
- **Reorder**: Not implemented in v1
- **Overflow**: Horizontal scroll with fade hints
- **Empty state**: Centered message "Open a note from the sidebar"

### Content View
- **Fetch**: `GET /api/files/<encoded-path>` returns raw HTML string
- **Render**: `innerHTML` into a Shadow DOM container
- **Style isolation**: Shadow DOM encapsulates note styles; CSS variables (defined in index.css) pierce through for theming
- **Link interception**: `<a>` clicks intercepted, `navigateTo(path)` called instead of native navigation
- **Code blocks**: Highlighted via CSS (no external lib in v1 — rely on pre/code styling)
- **Scroll restoration**: On tab focus, restore saved scroll position
- **Loading state**: Skeleton pulse animation while fetching
- **Error state**: "Failed to load" message with retry button

### Graph View
- **Data**: `GET /link-index.json` → `{ nodes: [{id, label, path}], edges: [{source, target}] }`
- **Library**: D3.js or pure SVG (no heavy deps) — use `<svg>` + React state for pan/zoom
- **Interaction**: Click node → navigate to that note in a new tab
- **Layout**: Force-directed (D3 force simulation), centered
- **Toggle**: Accessible from sidebar header icon button

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `/` | Focus search |
| `Esc` | Close search / close drawer |
| `⌘/Ctrl + w` | Close current tab |
| `⌘/Ctrl + Tab` | Next tab |
| `⌘/Ctrl + Shift + Tab` | Prev tab |

### Notify / Sync Trigger (Agent-facing)
- **Endpoint**: `POST /api/sync-trigger` (no auth required — internal network only)
- **Action**: NERD runs `rclone sync tos:tianlujun-default/notes-mvp /root/notes-mvp`
- **Response**: `{ "ok": true, "triggered_at": "..." }`
- **Note**: Implemented on FastAPI backend, not React frontend

---

## 5. Component Inventory

### `<LoginPage />`
- States: idle, loading (button spinner), error (red message below input)
- Input: password-type, monospace font, paste-friendly
- Button: full-width, accent color, "Sign In"
- Error: "Invalid token" with 200ms fade-in

### `<AppShell />`
- Layout container: flex row (sidebar + main)
- Manages sidebar collapsed state (Zustand)
- Handles responsive breakpoint switching
- Renders `<Sidebar>`, `<TabBar>`, `<ContentArea>`

### `<Sidebar />`
- States: expanded (260px), collapsed (48px, icon-only), mobile-drawer
- Header: logo/app name + collapse button + graph toggle
- Body: `<SearchInput />` + `<FileTree />`
- Collapse: transitions width with CSS transition

### `<FileTree />`
- States: loading (skeleton), empty, populated
- Dir row: folder icon (open/closed) + label
- File row: file icon + label
- Active: accent bg + bold label
- Hover: --bg-tertiary bg

### `<SearchInput />`
- States: collapsed (icon only), expanded (full input)
- Focus: auto-expand on focus
- Debounce: 300ms before API call
- Clear button (×) when has value

### `<TabBar />`
- Scrollable horizontal list
- Tab: file icon + truncated title + × close button
- Active tab: accent bottom border
- New tab button (+)
- Empty: hidden when no tabs

### `<ContentArea />`
- States: empty (no tabs open), loading, loaded, error
- Empty: centered illustration + "Open a note"
- Error: error message + retry button
- Loaded: `<article>` inside Shadow DOM

### `<GraphView />`
- States: loading (spinner), rendered, empty (no link-index.json)
- SVG canvas with zoom/pan
- Nodes: circles with labels
- Edges: curved lines
- Minimap: optional, bottom-right corner

### `<MobileDrawer />`
- Slide-up animation from bottom
- Drag handle for swipe-to-dismiss
- Backdrop: semi-transparent overlay
- Close: × button top-right, tap backdrop, or drag down

---

## 6. Technical Approach

### Stack
- **Framework**: React 19 + Vite 8
- **Routing**: React Router v7 (data router, parallel tab routes)
- **State**: Zustand v5 (tab store, auth store, file tree store)
- **Styling**: Tailwind CSS v4 (CSS-first config, no .config.js)
- **Icons**: Lucide React
- **Graph**: Pure SVG + React state (no D3 dep in v1)
- **Build**: Vite build → static files served by FastAPI

### Directory Structure
```
src/
├── api/
│   └── client.ts           # fetch wrapper with auth header
├── components/
│   ├── AppShell.tsx
│   ├── Sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── FileTree.tsx
│   │   └── SearchInput.tsx
│   ├── TabBar/
│   │   └── TabBar.tsx
│   ├── ContentArea.tsx
│   ├── GraphView.tsx
│   ├── LoginPage.tsx
│   └── MobileDrawer.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useFileTree.ts
│   └── useKeyboardShortcuts.ts
├── stores/
│   ├── authStore.ts
│   ├── tabStore.ts
│   └── fileTreeStore.ts
├── styles/
│   └── globals.css           # CSS variables, base styles, scrollbar
├── utils/
│   └── path.ts              # path helpers (basename, dirname, etc.)
├── App.tsx
├── main.tsx
└── index.css
```

### API Contract

#### `POST /api/login`
Request: `{ "token": "Bearer ..." }`
Response: `{ "ok": true }` + sets `session` cookie (7-day)

#### `GET /api/files`
Response: `{ "files": [{ "path": "05-entities/ACP.html", "type": "file" }, ...] }`

#### `GET /api/files/<path>`
Response: raw HTML string

#### `GET /api/search?q=<query>`
Response: `{ "results": [{ "path": "...", "title": "...", "snippet": "..." }] }`

#### `GET /api/me`
Response: `{ "authenticated": true|false }`

#### `GET /health`
Response: `{ "status": "ok" }` (no auth)

#### `POST /api/sync-trigger` (internal only)
Response: `{ "ok": true, "triggered_at": "..." }`

#### `GET /link-index.json`
Response: `{ "nodes": [...], "edges": [...] }`

### Responsive Strategy
- CSS-first: use Tailwind `md:` / `lg:` breakpoints
- Sidebar: `hidden md:flex` on desktop → `mobile-drawer` on <768px
- Bottom drawer: CSS transform transition, `pointer-events: none` when closed
- Tab bar: always visible, horizontal scroll for overflow

### Performance
- Lazy load content: `<ContentArea />` only fetches when tab is active
- File tree: cached in Zustand + sessionStorage, invalidate on sync-trigger
- Graph: render SVG only when route is `/app/graph`, lazy mount component
- Search: debounce 300ms, abort previous request with AbortController

### Shadow DOM Isolation
```tsx
const shadow = useRef(null);
useEffect(() => {
  if (!container.current) return;
  const sh = container.current.attachShadow({ mode: 'open' });
  sh.innerHTML = `<style>${resetStyles}</style><div class="note-content">${html}</div>`;
  // intercept links
  sh.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); navigate(a.href); });
  });
}, [html]);
```
