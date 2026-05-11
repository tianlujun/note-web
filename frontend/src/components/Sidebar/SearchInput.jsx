import { useState, useRef, useEffect } from 'react'
import { api } from '../../api/client'
import { useFileTreeStore } from '../../stores/fileTreeStore'

export function SearchInput({ onResultClick }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Focus when opened via keyboard shortcut
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
    if (!q.trim()) {
      setResults([])
      return
    }
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
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      setResults([])
    }
  }

  function handleResultClick(result) {
    onResultClick(result)
    setOpen(false)
    setQuery('')
    setResults([])
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
            className="w-full px-sm py-xs text-sm rounded border"
            style={{
              background: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
          {(results.length > 0 || loading || query) && (
            <div
              className="absolute top-full left-0 right-0 z-50 mt-xs rounded border shadow-lg overflow-hidden"
              style={{
                background: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                maxHeight: 320,
                overflowY: 'auto',
              }}
            >
              {loading && (
                <p className="px-sm py-xs text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Searching…
                </p>
              )}
              {!loading && results.length === 0 && query && (
                <p className="px-sm py-xs text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  No results
                </p>
              )}
              {results.map((r) => (
                <button
                  key={r.path}
                  onClick={() => handleResultClick(r)}
                  className="w-full text-left px-sm py-xs hover:bg-tertiary text-sm"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)' }}
                >
                  <div className="font-medium truncate">{r.title || r.path}</div>
                  {r.snippet && (
                    <div
                      className="text-xs truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                      dangerouslySetInnerHTML={{ __html: r.snippet }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-xs px-sm py-xs text-sm rounded border"
          style={{
            background: 'var(--color-bg-tertiary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span>Search</span>
          <kbd
            className="ml-auto text-xs px-1 rounded"
            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}
          >
            /
          </kbd>
        </button>
      )}
    </div>
  )
}
