## 1. Add Content Cache to Tab Store

- [x] 1.1 Add `CachedContent` interface to `tab-store.ts` with `path`, `title`, `content`, `noteDir` fields
- [x] 1.2 Add `contentCache: Map<string, CachedContent>` field to `TabState`
- [x] 1.3 Add `getCachedContent(path)` method to return cached entry or undefined
- [x] 1.4 Add `setCachedContent(path, data)` method to store content in cache
- [x] 1.5 Add `clearContentCache()` method to clear all cached content

## 2. Modify ContentArea to Use Cache

- [x] 2.1 Import `useTabStore` and `getCachedContent` in `ContentArea`
- [x] 2.2 Check cache before calling `api.getFile()` in useEffect
- [x] 2.3 If cache hit, use cached `content` and `noteDir` directly
- [x] 2.4 If cache miss, call API and store result in cache

## 3. Integrate SSE Refresh with Cache

- [x] 3.1 Modify SSE event handler in `AppShell` to call `clearContentCache()` on refresh
- [x] 3.2 After clearing cache, re-fetch current tab content (if any)
- [x] 3.3 Remove `window.location.reload()` in favor of targeted content refresh

## 4. Verification

- [ ] 4.1 Open tab A, then tab B, close tab B - verify no request for tab A
- [ ] 4.2 Trigger SSE refresh - verify cache is cleared and content is re-fetched
