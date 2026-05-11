import { useEffect } from 'react'
import TreeView from 'react-accessible-treeview'
import { useFileTreeStore } from '../../stores/fileTreeStore'
import { useTabStore } from '../../stores/tabStore'
import { api } from '../../api/client'

// ── Transform flat file list into tree format required by react-accessible-treeview ──
function buildTreeData(files) {
  // Collect all top-level groups (directories)
  const dirs = new Set()
  const rootFiles = []
  files.forEach((f) => {
    const parts = f.path.split('/')
    if (parts.length > 1) {
      dirs.add(parts[0])
    } else {
      rootFiles.push(f)
    }
  })

  const nodes = []
  const sortedDirs = Array.from(dirs).sort()

  // Root node (required by react-accessible-treeview)
  nodes.push({ id: '__root__', name: 'Root', parent: null, isBranch: true, metadata: { isRoot: true } })

  // Top-level group nodes (directories like "05-语言学", "02-历史")
  sortedDirs.forEach((dir) => {
    nodes.push({ id: dir, name: dir, parent: '__root__', isBranch: true })
  })

  // Root-level files
  rootFiles.forEach((f) => {
    nodes.push({ id: f.path, name: f.name, parent: '__root__', isBranch: false, metadata: { path: f.path } })
  })

  // Files inside each group directory
  files.forEach((f) => {
    const parts = f.path.split('/')
    if (parts.length > 1) {
      const dir = parts[0]
      const relative = parts.slice(1).join('/')
      nodes.push({ id: f.path, name: relative, parent: dir, isBranch: false, metadata: { path: f.path } })
    }
  })

  return nodes
}

// ── Icon: file ──
function FileIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

// ── Icon: folder (open/closed) ──
function FolderIcon({ isOpen }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0, color: 'var(--color-text-secondary)' }}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

// ── Custom node renderer ──
function NodeRenderer({ element, isExpanded, isSelected, isBranch, handleExpand, handleSelect }) {
  const { tabs, activeTabId } = useTabStore()
  const isActive = !isBranch && tabs.find((t) => t.id === activeTabId)?.path === element.metadata?.path

  if (element.metadata?.isRoot) {
    return null
  }

  if (isBranch) {
    return (
      <button
        onClick={handleExpand}
        className="tree-group-btn"
      >
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.12s',
            flexShrink: 0,
            color: 'var(--color-text-muted)',
          }}
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        <FolderIcon isOpen={isExpanded} />
        <span className="truncate">{element.name}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleSelect}
      className={`tree-file-btn${isActive ? ' active' : ''}`}
    >
      <FileIcon />
      <span className="truncate">{element.name}</span>
    </button>
  )
}

// ── Custom class names for TreeView internals ──
const TREE_CLASSES = {
  root: 'tree-view-root',
  node: 'tree-view-node',
  branch: 'tree-view-branch',
  leaf: 'tree-view-leaf',
}

export function FileTree({ onFileOpen }) {
  const { files, loading, error, setFiles, setLoading, setError } = useFileTreeStore()
  const { tabs, activeTabId } = useTabStore()

  // Load files on mount
  useEffect(() => {
    if (files.length > 0) return
    setLoading(true)
    api.files()
      .then((data) => setFiles(data.tree ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Build tree data
  const treeData = buildTreeData(files)

  // Initial expanded state from sessionStorage
  const initialExpanded = (() => {
    try {
      const raw = sessionStorage.getItem('notes_expanded')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()

  function handleNodeSelect(node) {
    if (node.isBranch) return
    const path = node.metadata?.path
    if (!path) return
    onFileOpen({ path, title: node.name })
  }

  function handleExpand(node, isExpanded) {
    // Persist expansion state to sessionStorage
    try {
      const raw = sessionStorage.getItem('notes_expanded')
      let current = []
      try {
        current = raw ? JSON.parse(raw) : []
        if (!Array.isArray(current)) current = []
      } catch {
        current = []
      }
      let next
      if (isExpanded) {
        next = [...current, node.name]
      } else {
        next = current.filter((d) => d !== node.name)
      }
      sessionStorage.setItem('notes_expanded', JSON.stringify(next))
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-xs p-xs">
        {[80, 60, 90, 70, 55].map((w, i) => (
          <div key={i} className="skeleton" style={{ height: 22, width: `${w}%`, borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="p-sm text-sm" style={{ color: '#ef4444' }}>
        {error}
      </p>
    )
  }

  return (
    <nav className="flex flex-col" style={{ flex: 1, overflow: 'auto' }}>
      <TreeView
        data={treeData}
        className={TREE_CLASSES.root}
        nodeRenderer={NodeRenderer}
        defaultExpandedIds={initialExpanded}
        onNodeSelect={handleNodeSelect}
        onExpand={(node, state) => handleExpand(node, state.isExpanded)}
        togglableSelect={false}
        multiSelect={false}
        propagateSelect={false}
      />
    </nav>
  )
}
