import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useAuthStore } from '../stores/authStore'

const BASE = ''

/** Inject a <style> reset into Shadow DOM */
const SHADOW_RESET = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: "Inter", system-ui, sans-serif; font-size: 15px; line-height: 1.6; color: var(--color-text-primary, #0d0d0d); background: transparent; }
a { color: var(--color-accent, #6366f1); }
`

export function ContentArea({ tab }) {
  const containerRef = useRef(null)
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!tab) {
      setHtml('')
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    setHtml('')

    fetch(`${BASE}/api/files/${encodeURIComponent(tab.path)}`, {
      headers: {
        ...(useAuthStore.getState().token
          ? { Authorization: `Bearer ${useAuthStore.getState().token}` }
          : {}),
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((text) => {
        setHtml(text)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tab?.path])

  // Mount / update Shadow DOM
  useEffect(() => {
    if (!containerRef.current) return
    const host = containerRef.current
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    shadow.innerHTML = ''

    if (!html) return

    const wrapper = document.createElement('div')
    wrapper.className = 'note-content'
    wrapper.innerHTML = html

    const style = document.createElement('style')
    style.textContent = SHADOW_RESET

    shadow.appendChild(style)
    shadow.appendChild(wrapper)

    // Intercept link clicks inside shadow DOM
    shadow.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href')
        if (!href) return
        // External links still work
        if (href.startsWith('http://') || href.startsWith('https://')) {
          e.preventDefault()
          window.open(href, '_blank', 'noopener')
          return
        }
        // Relative links → navigate
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('notes:navigate', { detail: href }))
      })
    })
  }, [html])

  if (!tab) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-md" style={{ color: 'var(--color-text-secondary)' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Open a note from the sidebar
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col gap-sm p-lg" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="skeleton" style={{ height: 28, width: '40%' }} />
        <div className="skeleton" style={{ height: 16, width: '90%' }} />
        <div className="skeleton" style={{ height: 16, width: '75%' }} />
        <div className="skeleton" style={{ height: 16, width: '85%' }} />
        <div className="skeleton" style={{ height: 16, width: '60%' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <p className="mb-sm" style={{ color: '#ef4444' }}>Failed to load</p>
          <p className="text-sm mb-md" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-md py-xs rounded text-sm"
            style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto"
      style={{ background: 'var(--color-bg-primary)' }}
    />
  )
}
