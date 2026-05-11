import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { api } from '../api/client'

/**
 * Initialize auth from session cookie on mount.
 * Returns { loading } while checking.
 */
export function useAuthInit() {
  const { setToken, clearToken, authenticated } = useAuthStore()

  useEffect(() => {
    api.me()
      .then((res) => {
        if (res.authenticated) setToken(null) // session cookie present
        else clearToken()
      })
      .catch(() => clearToken())
  }, [])

  return { authenticated }
}
