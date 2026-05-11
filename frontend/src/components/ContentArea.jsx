import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useAuthStore } from '../stores/authStore'

export function ContentArea({ tab }) {
  const contentRef = useRef(null)
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch note content when tab changes
  useEffect(() => {
    if (!tab) {
      setHtml('')
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()

    setLoading(true)
    setError(null)
    setHtml('')

    fetch(`/notes/${tab.path}`, {
      headers: {
        ...(useAuthStore.getState().token
          ? { Authorization: `Bearer ${useAuthStore.getState().token}` }
          : {}),
      },
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.text()
      })
      .then((text) => setHtml(text))
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err.message)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [tab])

  // Inject HTML into DOM and intercept links
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    if (!tab) {
      el.innerHTML = ''
      return
    }

    if (!html) return

    // Strip DOCTYPE/html/body wrapper — extract just the inner content
    let body = html
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    if (bodyMatch) body = bodyMatch[1]

    el.innerHTML = body

    // Intercept link clicks
    el.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href')
        if (!href) return
        if (href.startsWith('http://') || href.startsWith('https://')) {
          e.preventDefault()
          window.open(href, '_blank', 'noopener')
          return
        }
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('notes:navigate', { detail: href }))
      })
    })
  }, [tab, html])

  if (!tab) {
    return (
      <div className="content-scroll">
        <div className="note-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-text-muted)', margin: '0 auto 16px' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
            Open a note from the sidebar
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="content-scroll">
        <div className="note-card" style={{ padding: '32px 24px' }}>
          <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 20 }} />
          <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 16, width: '75%', marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 16, width: '85%', marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 16, width: '60%' }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="content-scroll">
        <div className="note-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: 8 }}>Failed to load</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 16 }}>{error}</p>
          <button
            onClick={() => setError(null)}
            style={{
              padding: '7px 16px',
              background: 'var(--color-bg-hover)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--color-text-primary)',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="content-scroll">
      <div className="note-card" ref={contentRef} />
    </div>
  )
}
