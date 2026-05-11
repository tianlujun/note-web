import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { api } from '../api/client'

export function LoginPage() {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setToken } = useAuthStore()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    setError('')
    try {
      await api.login(value.trim())
      // Store as Bearer token in memory (for Agent-style calls)
      // Session cookie handles human users
      setToken(value.trim())
    } catch (err) {
      setError(err.message === 'Unauthorized' ? 'Invalid token' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-base">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs flex flex-col gap-md"
      >
        <div className="text-center mb-lg">
          <h1 className="text-xl font-semibold mb-xs">Note Web</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Enter your access token
          </p>
        </div>

        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Bearer token"
          autoFocus
          disabled={loading}
          className="w-full px-md py-sm border rounded"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            background: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />

        {error && (
          <p className="text-sm" style={{ color: '#ef4444', margin: 0 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="w-full py-sm rounded text-sm font-medium"
          style={{
            background: loading ? 'var(--color-accent-hover)' : 'var(--color-accent)',
            color: 'var(--color-text-inverse)',
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none',
            transition: 'opacity var(--duration-fast)',
          }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
