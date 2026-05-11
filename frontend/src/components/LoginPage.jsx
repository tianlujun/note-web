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
    <div style={styles.root}>
      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.header}>
          <h1 style={styles.title}>Note Web</h1>
          <p style={styles.subtitle}>Enter your access token</p>
        </div>

        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Bearer token"
          autoFocus
          disabled={loading}
          style={styles.input}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          type="submit"
          disabled={loading || !value.trim()}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    background: 'var(--color-bg-primary)',
    fontFamily: 'var(--font-sans)',
  },
  form: {
    width: '100%',
    maxWidth: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '8px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    margin: '0 0 4px 0',
    color: 'var(--color-text-primary)',
  },
  subtitle: {
    fontSize: '14px',
    margin: 0,
    color: 'var(--color-text-secondary)',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    fontFamily: 'var(--font-mono)',
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '6px',
    color: 'var(--color-text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  error: {
    fontSize: '14px',
    margin: 0,
    color: '#ef4444',
  },
  button: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: 500,
    background: 'var(--color-accent)',
    color: 'var(--color-text-inverse)',
    border: 'none',
    borderRadius: '6px',
    transition: 'opacity 0.15s',
  },
}
