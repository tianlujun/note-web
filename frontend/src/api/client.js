/**
 * API client — thin wrapper around fetch with auth header injection.
 * Auth state lives in authStore (Zustand), not here.
 */

const BASE = '' // relative → same origin; FastAPI serves everything

function getToken() {
  // Read from in-memory store via global (avoids circular deps in stores)
  return window.__NOTES_TOKEN__ ?? null
}

async function request(path, opts = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  }
  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  if (res.status === 401) {
    // Force logout
    window.dispatchEvent(new CustomEvent('notes:unauthorized'))
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail.detail ?? res.statusText)
  }
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const api = {
  login: (token) =>
    request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  logout: () =>
    request('/api/logout', { method: 'POST' }),

  me: () =>
    request('/api/me'),

  files: () =>
    request('/api/files'),

  file: (path) =>
    request(`/api/files/${encodeURIComponent(path)}`),

  search: (q) =>
    request(`/api/search?q=${encodeURIComponent(q)}`),

  linkIndex: () =>
    request('/api/link-index.json'),
}
