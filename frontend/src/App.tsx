import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { LoginPage } from '@/components/login-page'
import { AppShell } from '@/components/app-shell'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

function AppContent() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useKeyboardShortcuts()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <AppShell />
}

export default AppContent
