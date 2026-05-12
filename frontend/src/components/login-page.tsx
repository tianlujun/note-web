import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function LoginPage() {
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      setError('Token required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await login(token)
    } catch {
      setError('Invalid token')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img src="/seal.svg" alt="logo" className="mb-4 mx-auto h-24 w-24" />
          <h1 className="text-2xl font-semibold">Note</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your access token to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Access token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              aria-label="Access token"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
        </div>

        <div className="flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            className="h-12 w-12 opacity-20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="20" y="20" width="60" height="60" rx="8" />
            <rect x="30" y="30" width="40" height="40" rx="4" />
            <circle cx="50" cy="50" r="8" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  )
}
