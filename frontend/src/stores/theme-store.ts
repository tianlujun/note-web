import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const applyTheme = (theme: 'light' | 'dark') => {
  const metaTheme = document.getElementById('theme-color')
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'dark' ? '#0A0A0A' : '#FAFAF8')
  }
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),

      setTheme: (theme: Theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme
        applyTheme(resolved)
        set({ theme, resolvedTheme: resolved })
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = state.theme === 'system' ? getSystemTheme() : state.theme
          applyTheme(resolved)
          state.resolvedTheme = resolved
        }
      },
    }
  )
)
