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
      setError('丹书尚缺，烦请付之')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await login(token)
    } catch {
      setError('丹书似伪，烦请复授')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <img src="/seal.svg" alt="logo" className="mb-4 mx-auto h-24 w-24" />
          <p className="text-lg text-muted-foreground">
            纸田墨稼
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="丹书"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              autoComplete="off"
              aria-label="丹书"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '墨染中...' : '启卷'}
          </Button>
        </form>

      </div>
    </div>
  )
}
