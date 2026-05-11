import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  token: null,
  authenticated: false,

  setToken: (token) => set({ token, authenticated: true }),

  clearToken: () => set({ token: null, authenticated: false }),
}))
