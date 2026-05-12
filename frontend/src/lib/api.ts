const API_BASE = '/api'

interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'dir'
  is_dir_index?: boolean
  children?: FileTreeNode[]
}

interface SearchResult {
  path: string
  title: string
  snippet: string
}

interface LinkIndex {
  nodes: Array<{ id: string; label: string }>
  edges: Array<{ source: string; target: string }>
}

interface FileContent {
  path: string
  title: string
  content: string
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  async login(token: string): Promise<{ ok: boolean }> {
    return fetchJson(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
  },

  async logout(): Promise<{ ok: boolean }> {
    return fetchJson(`${API_BASE}/logout`, { method: 'POST' })
  },

  async me(): Promise<{ authenticated: boolean }> {
    return fetchJson(`${API_BASE}/me`)
  },

  async getFileTree(): Promise<{ tree: FileTreeNode[] }> {
    return fetchJson(`${API_BASE}/files`)
  },

  async search(q: string): Promise<{ results: SearchResult[] }> {
    return fetchJson(`${API_BASE}/search?q=${encodeURIComponent(q)}`)
  },

  async getLinkIndex(): Promise<LinkIndex> {
    return fetchJson(`${API_BASE}/link-index`)
  },

  async getFile(path: string): Promise<FileContent> {
    return fetchJson(`${API_BASE}/file/${encodeURIComponent(path)}`)
  },
}

export type { FileTreeNode, SearchResult, LinkIndex, FileContent }
