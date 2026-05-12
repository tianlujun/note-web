import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { api, type SearchResult } from '@/lib/api'
import { useTabStore } from '@/stores/tab-store'
export function SearchInput() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { openTab } = useTabStore()

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setIsLoading(true)
    try {
      const res = await api.search(q)
      setResults(res.results)
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, handleSearch])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        setIsOpen(true)
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
        setResults([])
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleResultClick = (result: SearchResult) => {
    openTab(result.path, result.title)
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-8 pr-8"
          aria-label="Search notes"
        />
        {query && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (query || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-md border bg-popover shadow-lg">
          {isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          {!isLoading && results.length === 0 && query && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}
          {results.map((result) => (
            <button
              key={result.path}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent/10"
              onClick={() => handleResultClick(result)}
            >
              <div className="font-medium truncate">{result.title}</div>
              <div className="text-xs text-muted-foreground truncate">
                {result.snippet}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
