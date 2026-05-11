import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useAuthStore } from '../stores/authStore'

/** Strip <html>/<head>/<body> wrapper from a full HTML document */
function extractBody(html) {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  return m ? m[1] : html
}

export function ContentArea({ tab }) {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const prevTabRef = useRef(tab)

  // Keep a ref to detect actual tab changes
  const tabRef = useRef(tab)
  tabRef.current = tab

  // Fetch note content
  useEffect(() => {
    if (!tab) {
      setHtml('')
      setError(null)
      setLoading(false)
      prevTabRef.current = null
      return
    }

    const controller = new AbortController()

    setLoading(true)
    setError(null)
    setHtml('')
    prevTabRef.current = tab

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
      .then((text) => {
        // Only update if this is still the current tab
        if (tabRef.current?.id === tab.id) {
          setHtml(text)
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err.message)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [tab])

  // Intercept link clicks on the rendered content
  const containerRef = useRef(null)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handler = (e) => {
      const a = e.target.closest('a')
      if (!a) return
      const href = a.getAttribute('href')
      if (!href) return
      if (href.startsWith('http://') || href.startsWith('https://')) {
        e.preventDefault()
        window.open(href, '_blank', 'noopener')
        return
      }
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('notes:navigate', { detail: href }))
    }

    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [html])

  // ——— Render ———

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

  // Render HTML via React — no manual DOM manipulation
  return (
    <div className="content-scroll" ref={containerRef}>
      <div
        className="note-card"
        dangerouslySetInnerHTML={{ __html: extractBody(html) }}
      />
    </div>
  )
}
