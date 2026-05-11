import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../stores/authStore'

const DEFAULT_WIDTH = 720

function extractMeta(html) {
  const m = html.match(/<meta[^>]+name=["']content-width["'][^>]+content=["']([^"']+)["'][^>]*>/i)
  if (m) return parseInt(m[1], 10)
  const m2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']content-width["'][^>]*>/i)
  if (m2) return parseInt(m2[1], 10)
  return null
}

function extractBody(html) {
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  return m ? m[1] : html
}

export function ContentArea({ tab }) {
  const [html, setHtml] = useState('')
  const [contentWidth, setContentWidth] = useState(DEFAULT_WIDTH)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const tabRef = useRef(tab)
  tabRef.current = tab

  useEffect(() => {
    if (!tab) {
      setHtml('')
      setError(null)
      setLoading(false)
      setContentWidth(DEFAULT_WIDTH)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setHtml('')
    setContentWidth(DEFAULT_WIDTH)

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
        if (tabRef.current?.id === tab.id) {
          const w = extractMeta(text)
          if (w && w > 0) setContentWidth(w)
          setHtml(text)
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [tab])

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
      } else {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('notes:navigate', { detail: href }))
      }
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [html])

  if (!tab) { return null }

  // Dynamic width from meta tag; all centering and scrolling via CSS classes.
  const cardStyle = { width: contentWidth }

  if (loading) {
    return (
      <div className="content-scroll" ref={containerRef}>
        <div className="note-card" style={{ ...cardStyle, padding: '32px 24px' }}>
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
      <div className="content-scroll" ref={containerRef}>
        <div className="note-card" style={{ ...cardStyle, padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: 8 }}>Failed to load</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 16 }}>{error}</p>
          <button
            onClick={() => setError(null)}
            style={{ padding: '7px 16px', background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: 'var(--color-text-primary)' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="content-scroll" ref={containerRef}>
      <div
        className="note-card"
        style={cardStyle}
        dangerouslySetInnerHTML={{ __html: extractBody(html) }}
      />
    </div>
  )
}
