import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useAuthStore } from '../stores/authStore'

const BASE = ''

/** Inject typography + card styles into Shadow DOM */
const SHADOW_STYLES = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  font-size: 15px;
  line-height: 1.75;
  color: var(--color-text-primary, #111827);
  background: transparent;
}
a { color: var(--color-accent, #4f6ef7); text-decoration: none; }
a:hover { text-decoration: underline; }
h1 { font-size: 1.7em; font-weight: 700; margin: 0 0 0.6em; line-height: 1.25; }
h2 { font-size: 1.3em;  font-weight: 650; margin: 1.4em 0 0.45em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
h3 { font-size: 1.1em;  font-weight: 600; margin: 1.2em 0 0.4em; }
p  { margin: 0.7em 0; }
ul, ol { padding-left: 1.5em; margin: 0.6em 0; }
li { margin: 0.25em 0; }
blockquote {
  border-left: 3px solid #4f6ef7;
  background: #eef1fe;
  border-radius: 0 6px 6px 0;
  margin: 1em 0;
  padding: 0.5em 1em;
  color: #6b7280;
}
pre { background: #f5f7fa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; font-size: 13px; line-height: 1.6; overflow-x: auto; }
.note-card { overflow-x: hidden; }
code { font-family: "JetBrains Mono", monospace; }
code:not(pre code) { background: #f5f7fa; border: 1px solid #e5e7eb; border-radius: 6px; color: #4f6ef7; padding: 1px 5px; font-size: 0.875em; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 0.9em; }
th, td { border: 1px solid #e5e7eb; padding: 6px 12px; }
th { background: #f5f7fa; font-weight: 600; }
hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5em 0; }
img { border-radius: 10px; max-width: 100%; height: auto; }
`

export function ContentArea({ tab }) {
  const containerRef = useRef(null)
  const tabRef = useRef(tab)
  const shadowRef = useRef(null)
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Keep refs in sync with props
  tabRef.current = tab

  // Initialize Shadow DOM once
  useEffect(() => {
    if (!containerRef.current) return
    const host = containerRef.current
    if (!host.shadowRoot) {
      const shadow = host.attachShadow({ mode: 'open' })
      shadowRef.current = shadow
    } else {
      shadowRef.current = host.shadowRoot
    }
  }, [])

  // Fetch note content when tab changes
  useEffect(() => {
    console.log('[ContentArea] first effect running, tab:', tab)
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

    fetch(`${BASE}/notes/${tab.path}`, {
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

  // Render / clear Shadow DOM
  useEffect(() => {
    const shadow = shadowRef.current
    const currentTab = tabRef.current
    console.log('[ContentArea] second effect', { currentTab, html: html?.slice(0, 50), htmlLength: html?.length })

    if (!currentTab) {
      console.log('[ContentArea] clearing shadow DOM (no tab)')
      if (shadow) shadow.innerHTML = ''
      return
    }

    if (!html) {
      console.log('[ContentArea] second effect: no html yet, skipping')
      return
    }

    console.log('[ContentArea] rendering note, html length:', html.length)
    if (!shadow) return

    shadow.innerHTML = ''

    const card = document.createElement('div')
    card.className = 'note-card'

    const content = document.createElement('div')
    content.className = 'note-content'
    content.innerHTML = html

    const style = document.createElement('style')
    style.textContent = SHADOW_STYLES

    card.appendChild(style)
    card.appendChild(content)
    shadow.appendChild(card)

    // Intercept link clicks inside shadow DOM
    shadow.querySelectorAll('a').forEach((a) => {
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
    <div
      ref={containerRef}
      className="content-scroll"
    />
  )
}
