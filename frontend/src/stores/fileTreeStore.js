import { create } from 'zustand'

export const useFileTreeStore = create((set, get) => ({
  files: [],       // flat list from API
  loading: false,
  error: null,
  // Persisted expansion state — safe even when sessionStorage key is absent
  expandedDirs: (() => {
    try {
      const raw = sessionStorage.getItem('notes_expanded')
      if (raw === null) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })(),

  setFiles: (files) => set({ files }),

  toggleDir: (dir) => {
    const { expandedDirs } = get()
    const next = expandedDirs.includes(dir)
      ? expandedDirs.filter((d) => d !== dir)
      : [...expandedDirs, dir]
    try {
      sessionStorage.setItem('notes_expanded', JSON.stringify(next))
    } catch {}
    set({ expandedDirs: next })
  },

  isExpanded: (dir) => get().expandedDirs.includes(dir),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
