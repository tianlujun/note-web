import { create } from 'zustand'

export interface Tab {
  id: string
  path: string
  title: string
}

export interface CachedContent {
  path: string
  title: string
  content: string
  noteDir: string
}

interface TabState {
  tabs: Tab[]
  activeTabId: string | null
  contentCache: Map<string, CachedContent>
  openTab: (path: string, title: string) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  getActiveTab: () => Tab | undefined
  getCachedContent: (path: string) => CachedContent | undefined
  setCachedContent: (path: string, data: CachedContent) => void
  clearContentCache: () => void
}

export const useTabStore = create<TabState>()((set, get) => ({
  tabs: [],
  activeTabId: null,
  contentCache: new Map(),

  openTab: (path: string, title: string) => {
    const existing = get().tabs.find((t) => t.path === path)
    if (existing) {
      set({ activeTabId: existing.id })
      return
    }
    const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`
    set((state) => ({
      tabs: [...state.tabs, { id, path, title }],
      activeTabId: id,
    }))
  },

  closeTab: (id: string) => {
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id)
      let newActiveId = state.activeTabId
      if (state.activeTabId === id) {
        const idx = state.tabs.findIndex((t) => t.id === id)
        newActiveId = newTabs[idx]?.id ?? newTabs[idx - 1]?.id ?? null
      }
      return { tabs: newTabs, activeTabId: newActiveId }
    })
  },

  setActiveTab: (id: string) => {
    set({ activeTabId: id })
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find((t) => t.id === activeTabId)
  },

  getCachedContent: (path: string) => {
    return get().contentCache.get(path)
  },

  setCachedContent: (path: string, data: CachedContent) => {
    set((state) => {
      const newCache = new Map(state.contentCache)
      newCache.set(path, data)
      return { contentCache: newCache }
    })
  },

  clearContentCache: () => {
    set({ contentCache: new Map() })
  },
}))
