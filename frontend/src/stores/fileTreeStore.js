import { create } from 'zustand'

export const useFileTreeStore = create((set, get) => ({
  files: [],       // flat list from API
  loading: false,
  error: null,
  // Persisted expansion state
  expandedDirs: JSON.parse(sessionStorage.getItem('notes_expanded') ?? 'null') ?? [],

  setFiles: (files) => set({ files }),

  toggleDir: (dir) => {
    const { expandedDirs } = get()
    const next = expandedDirs.includes(dir)
      ? expandedDirs.filter((d) => d !== dir)
      : [...expandedDirs, dir]
    sessionStorage.setItem('notes_expanded', JSON.stringify(next))
    set({ expandedDirs: next })
  },

  isExpanded: (dir) => get().expandedDirs.includes(dir),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
