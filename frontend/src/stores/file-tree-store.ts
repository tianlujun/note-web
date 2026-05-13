import { create } from 'zustand'
import type { FileTreeNode } from '@/lib/api'

interface ContextMenu {
  node: FileTreeNode
  x: number
  y: number
}

interface FileTreeState {
  tree: FileTreeNode[]
  isLoading: boolean
  error: string | null
  expandedPaths: Set<string>
  contextMenu: ContextMenu | null
  fetchTree: () => Promise<void>
  toggleExpand: (path: string) => void
  isExpanded: (path: string) => boolean
  openContextMenu: (node: FileTreeNode, x: number, y: number) => void
  closeContextMenu: () => void
}

export const useFileTreeStore = create<FileTreeState>()((set, get) => ({
  tree: [],
  isLoading: false,
  error: null,
  expandedPaths: new Set(),
  contextMenu: null,

  fetchTree: async () => {
    set({ isLoading: true, error: null })
    try {
      const { api } = await import('@/lib/api')
      const res = await api.getFileTree()
      set({ tree: res.tree, isLoading: false })
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  toggleExpand: (path: string) => {
    set((state) => {
      const next = new Set(state.expandedPaths)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return { expandedPaths: next }
    })
  },

  isExpanded: (path: string) => {
    return get().expandedPaths.has(path)
  },

  openContextMenu: (node: FileTreeNode, x: number, y: number) => {
    set({ contextMenu: { node, x, y } })
  },

  closeContextMenu: () => {
    set({ contextMenu: null })
  },
}))
