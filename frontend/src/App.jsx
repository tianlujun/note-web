import { useEffect, useState } from 'react'
import { LoginPage } from './components/LoginPage'
import { AppShell } from './components/AppShell'
import { useAuthInit } from './hooks/useAuthInit'
import { useAuthStore } from './stores/authStore'
import { useTabStore } from './stores/tabStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export default function App() {
  const { authenticated } = useAuthInit()
  const { token } = useAuthStore()
  const { closeTab, setActiveTab, tabs, activeTabId } = useTabStore()
  const [hydrated, setHydrated] = useState(false)

  // Hydrate token from sessionStorage (for page refresh persistence)
  useEffect(() => {
    const stored = sessionStorage.getItem('notes_token')
    if (stored && !token) {
      useAuthStore.getState().setToken(stored)
    }
    setHydrated(true)
  }, [])

  // Persist token to sessionStorage
  useEffect(() => {
    if (token) sessionStorage.setItem('notes_token', token)
  }, [token])

  // Listen for internal navigation events from ContentArea
  useEffect(() => {
    function handler(e) {
      const { openTab } = useTabStore.getState()
      const path = e.detail
      const title = path.split('/').pop()
      openTab({ path, title })
    }
    window.addEventListener('notes:navigate', handler)
    return () => window.removeEventListener('notes:navigate', handler)
  }, [])

  // Listen for unauthorized events (401 from API)
  useEffect(() => {
    function handler() {
      const { clearToken } = useAuthStore.getState()
      clearToken()
      sessionStorage.removeItem('notes_token')
    }
    window.addEventListener('notes:unauthorized', handler)
    return () => window.removeEventListener('notes:unauthorized', handler)
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'Ctrl+w': () => {
      const { activeTabId } = useTabStore.getState()
      if (activeTabId) closeTab(activeTabId)
    },
    'Ctrl+Tab': () => {
      const { tabs, activeTabId } = useTabStore.getState()
      if (tabs.length < 2) return
      const idx = tabs.findIndex((t) => t.id === activeTabId)
      const next = tabs[(idx + 1) % tabs.length]
      setActiveTab(next.id)
    },
    'Ctrl+Shift+Tab': () => {
      const { tabs, activeTabId } = useTabStore.getState()
      if (tabs.length < 2) return
      const idx = tabs.findIndex((t) => t.id === activeTabId)
      const prev = tabs[(idx - 1 + tabs.length) % tabs.length]
      setActiveTab(prev.id)
    },
  })

  if (!hydrated) return null

  if (!authenticated && !token) {
    return <LoginPage />
  }

  return <AppShell />
}
