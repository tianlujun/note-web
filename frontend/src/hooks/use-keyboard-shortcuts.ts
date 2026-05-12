import { useEffect } from 'react'
import { useTabStore } from '@/stores/tab-store'

export function useKeyboardShortcuts() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      if (isMod && e.key === 'w') {
        e.preventDefault()
        if (activeTabId) {
          closeTab(activeTabId)
        }
        return
      }

      if (isMod && e.key === 'Tab') {
        e.preventDefault()
        if (tabs.length < 2) return
        const currentIdx = tabs.findIndex((t) => t.id === activeTabId)
        let nextIdx: number
        if (e.shiftKey) {
          nextIdx = currentIdx <= 0 ? tabs.length - 1 : currentIdx - 1
        } else {
          nextIdx = currentIdx >= tabs.length - 1 ? 0 : currentIdx + 1
        }
        setActiveTab(tabs[nextIdx].id)
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [tabs, activeTabId, setActiveTab, closeTab])
}
