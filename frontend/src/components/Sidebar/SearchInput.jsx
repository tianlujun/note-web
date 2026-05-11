import { useState, useRef, useEffect } from 'react'
import { api } from '../../api/client'

export function SearchInput({ onResultClick }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const tag = document.activeElement?.tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault()
          setOpen(true)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function handleInput(e) {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.search(q)
        setResults(data.results ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); setResults([]) }
  }

  function handleResultClick(result) {
    onResultClick(result)
    setOpen(false); setQuery(''); setResults([])
  }

  return (
    <div className="relative">
      {open ? (
        <div className="flex flex-col gap-xs">
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Search notes…"
            className="search-input"
          />
          {(results.length > 0 || loading || query) && (
            <div
              className="absolute top-full left-0 right-0 z-50 mt-xs rounded-lg border shadow-lg overflow-hidden"
              style={{
                background: 'var(--color-bg-card)',
                borderColor: 'var(--color-border)',
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {loading && (
                <p className="px-sm py-xs text-xs" style={{ color: 'var(--color-text-muted)' }}>Searching…</p>
              )}
              {!loading && results.length === 0 && query && (
                <p className="px-sm py-xs text-xs" style={{ color: 'var(--color-text-muted)' }}>No results</p>
              )}
              {results.map((r) => (
                <button
                  key={r.path}
                  onClick={() => handleResultClick(r)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 12px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div className="font-medium truncate" style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>
                    {r.title || r.path}
                  </div>
                  {r.snippet && (
                    <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)', marginTop: 2 }}
                      dangerouslySetInnerHTML={{ __html: r.snippet }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-xs px-sm py-xs rounded-lg border"
          style={{
            background: 'var(--color-bg-page)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: 13,
            height: 34,
            transition: 'border-color 0.12s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span style={{ flex: 1, textAlign: 'left' }}>Search</span>
          <kbd style={{
            fontSize: 11, padding: '1px 5px',
            background: 'var(--color-bg-hover)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>/</kbd>
        </button>
      )}
    </div>
  )
}
