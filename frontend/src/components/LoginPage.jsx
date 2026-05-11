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
      setToken(value.trim())
    } catch (err) {
      setError(err.message === 'Unauthorized' ? 'Invalid token' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        {/* Logo / title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>
            Note Web
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary)', margin: 0 }}>
            Enter your access token to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Bearer token"
              autoFocus
              disabled={loading}
              style={{
                width: '100%',
                height: 40,
                padding: '0 14px',
                fontSize: 14,
                fontFamily: 'var(--font-mono)',
                background: 'var(--color-bg-page)',
                border: '1.5px solid var(--color-border)',
                borderRadius: 10,
                color: 'var(--color-text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.12s, box-shadow 0.12s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-accent)'
                e.target.style.boxShadow = '0 0 0 3px rgba(197,48,48,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-border)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !value.trim()}
            style={{
              width: '100%',
              height: 40,
              fontSize: 14,
              fontWeight: 600,
              background: loading ? 'var(--color-text-muted)' : 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s, transform 0.1s',
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.background = 'var(--color-accent-hover)' }}
            onMouseLeave={(e) => { if (!loading) e.target.style.background = 'var(--color-accent)' }}
            onMouseDown={(e) => { if (!loading) e.target.style.transform = 'scale(0.98)' }}
            onMouseUp={(e) => { if (!loading) e.target.style.transform = 'scale(1)' }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
