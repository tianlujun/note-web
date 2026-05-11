/**
 * API client — thin wrapper around fetch with auth header injection.
 * Token is read from authStore via getState() to avoid circular deps.
 */
import { useAuthStore } from '../stores/authStore'

const BASE = '' // relative → same origin; FastAPI serves everything

async function request(path, opts = {}) {
  const token = useAuthStore.getState().token
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
    request(`/api/file/${encodeURIComponent(path)}`),

  search: (q) =>
    request(`/api/search?q=${encodeURIComponent(q)}`),

  linkIndex: () =>
    request('/api/link-index'),
}
