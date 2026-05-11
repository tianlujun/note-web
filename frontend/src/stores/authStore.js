import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  token: null,
  authenticated: false,

  setToken: (token) => {
    window.__NOTES_TOKEN__ = token
    set({ token, authenticated: true })
  },

  clearToken: () => {
    window.__NOTES_TOKEN__ = null
    set({ token: null, authenticated: false })
  },
}))
