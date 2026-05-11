import { useEffect } from 'react'

/**
 * Global keyboard shortcuts.
 * Call with the map of keys → handlers.
 */
export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    function handler(e) {
      const parts = [
        e.ctrlKey && 'Ctrl',
        e.metaKey && 'Meta',
        e.shiftKey && 'Shift',
        e.key,
      ].filter(Boolean)
      const key = parts.join('+')

      if (shortcuts[key]) {
        e.preventDefault()
        shortcuts[key](e)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}
