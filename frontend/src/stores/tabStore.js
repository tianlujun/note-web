import { create } from 'zustand'

let tabIdCounter = 0

export const useTabStore = create((set, get) => ({
  tabs: [],      // [{ id, path, title }]
  activeTabId: null,

  openTab: ({ path, title }) => {
    const existing = get().tabs.find((t) => t.path === path)
    if (existing) {
      set({ activeTabId: existing.id })
      return
    }
    const id = `tab-${++tabIdCounter}`
    set((state) => ({
      tabs: [...state.tabs, { id, path, title: title || path }],
      activeTabId: id,
    }))
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get()
    const idx = tabs.findIndex((t) => t.id === id)
    const newTabs = tabs.filter((t) => t.id !== id)
    let newActive = activeTabId
    if (activeTabId === id) {
      newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.id ?? null
    }
    // Defensive: if activeTabId points to a tab not in the list, clear it
    if (newTabs.findIndex((t) => t.id === newActive) === -1) {
      newActive = null
    }
    set({ tabs: newTabs, activeTabId: newActive })
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find((t) => t.id === activeTabId) ?? null
  },
}))
