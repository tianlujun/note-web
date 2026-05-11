import { create } from 'zustand'

export const useFileTreeStore = create((set, get) => ({
  tree: [],        // nested tree from API
  loading: false,
  error: null,
  // Persisted expansion state — stored as full dir paths
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

  setTree: (tree) => set({ tree }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  toggleDir: (dirPath) => {
    const { expandedDirs } = get()
    const next = expandedDirs.includes(dirPath)
      ? expandedDirs.filter((d) => d !== dirPath)
      : [...expandedDirs, dirPath]
    try {
      sessionStorage.setItem('notes_expanded', JSON.stringify(next))
    } catch {}
    set({ expandedDirs: next })
  },

  isExpanded: (dirPath) => get().expandedDirs.includes(dirPath),
}))
