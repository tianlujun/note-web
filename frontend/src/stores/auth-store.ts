import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isLoading: true,

      login: async (token: string) => {
        await api.login(token)
        set({ isAuthenticated: true })
      },

      logout: async () => {
        await api.logout()
        set({ isAuthenticated: false })
      },

      checkAuth: async () => {
        set({ isLoading: true })
        try {
          const res = await api.me()
          set({ isAuthenticated: res.authenticated, isLoading: false })
        } catch {
          set({ isAuthenticated: false, isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    }
  )
)
