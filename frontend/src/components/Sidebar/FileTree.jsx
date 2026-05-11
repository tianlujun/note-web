import { useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useFileTreeStore } from '../../stores/fileTreeStore'
import { useTabStore } from '../../stores/tabStore'
import { api } from '../../api/client'

const ROW_HEIGHT = 28

// Flatten the nested tree into rows for virtual list
// expandedSet: Set of expanded dir paths
function flattenTree(nodes, expandedSet, rows = [], parentPath = '') {
  for (const node of nodes) {
    if (node.type === 'dir') {
      const isExpanded = expandedSet.has(node.path)
      rows.push({ type: 'dir', name: node.name, path: node.path, isExpanded })
      if (isExpanded) {
        flattenTree(node.children, expandedSet, rows)
      }
    } else {
      rows.push({ type: 'file', name: node.name, path: node.path })
    }
  }
  return rows
}

function ChevronIcon({ expanded }) {
  return (
    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor'
      strokeWidth='2.5' strokeLinecap='round'
      style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.12s', flexShrink: 0, color: 'var(--color-text-muted)' }}>
      <path d='m9 18 6-6-6-6' />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
      strokeWidth='1.8' style={{ flexShrink: 0, color: 'var(--color-text-secondary)' }}>
      <path d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' />
    </svg>
  )
}

function FolderOpenIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'
      strokeWidth='1.8' style={{ flexShrink: 0, color: 'var(--color-text-secondary)' }}>
      <path d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v1H5l1 1' />
      <path d='M5 19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2' />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor'
      strokeWidth='2' style={{ flexShrink: 0 }}>
      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
      <polyline points='14 2 14 8 20 8' />
    </svg>
  )
}

function TreeNode({ node, depth, expandedSet, toggleDir, onFileOpen, activePaths }) {
  const isDir = node.type === 'dir'
  const isExpanded = expandedSet.has(node.path)
  const indent = depth * 16

  if (isDir) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: indent + 4, height: ROW_HEIGHT }}>
          <button
            onClick={() => toggleDir(node.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px 4px', borderRadius: 4, width: '100%', textAlign: 'left',
              color: 'var(--color-text-primary)',
            }}
          >
            <ChevronIcon expanded={isExpanded} />
            {isExpanded ? <FolderOpenIcon /> : <FolderIcon />}
            <span className='truncate' style={{ fontSize: 13 }}>{node.name}</span>
          </button>
        </div>
        {isExpanded && node.children.map(child => (
          <TreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            expandedSet={expandedSet}
            toggleDir={toggleDir}
            onFileOpen={onFileOpen}
            activePaths={activePaths}
          />
        ))}
      </div>
    )
  }

  const isActive = activePaths.has(node.path)
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: indent + 20, height: ROW_HEIGHT }}>
      <button
        onClick={() => onFileOpen({ path: node.path, title: node.name })}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '2px 4px', borderRadius: 4, width: '100%', textAlign: 'left',
          color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)',
          fontWeight: isActive ? 500 : 400,
        }}
      >
        <FileIcon />
        <span className='truncate' style={{ fontSize: 13 }}>{node.name}</span>
      </button>
    </div>
  )
}

export function FileTree({ onFileOpen }) {
  const { tree, loading, error, setTree, setLoading, setError, expandedDirs, toggleDir } = useFileTreeStore()
  const { tabs } = useTabStore()
  const parentRef = useRef(null)

  useEffect(() => {
    if (tree.length > 0) return
    setLoading(true)
    api.files()
      .then(data => setTree(data.tree ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const activePaths = new Set(tabs.map(t => t.path))

  if (loading) {
    return (
      <div className='flex flex-col gap-xs p-xs'>
        {[80, 60, 90, 70, 55, 65].map((w, i) => (
          <div key={i} className='skeleton' style={{ height: 22, width: w + '%', borderRadius: 8 }} />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className='p-sm text-sm' style={{ color: '#ef4444' }}>{error}</p>
  }

  return (
    <div ref={parentRef} style={{ flex: 1, overflow: 'auto' }}>
      {tree.map(node => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          expandedSet={new Set(expandedDirs)}
          toggleDir={toggleDir}
          onFileOpen={onFileOpen}
          activePaths={activePaths}
        />
      ))}
    </div>
  )
}
