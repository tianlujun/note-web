import { useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useFileTreeStore } from '../../stores/fileTreeStore'
import { useTabStore } from '../../stores/tabStore'
import { api } from '../../api/client'

const ROW_HEIGHT = 28

function buildTree(files) {
  const rootDirs = {}
  const rootFiles = []
  files.forEach((f) => {
    const parts = f.path.split('/')
    if (parts.length === 1) {
      rootFiles.push(f)
    } else {
      const dir = parts[0]
      if (!rootDirs[dir]) rootDirs[dir] = []
      rootDirs[dir].push({ path: f.path, name: parts.slice(1).join('/') })
    }
  })
  return { rootDirs, rootFiles }
}

function flattenTree({ rootDirs, rootFiles }, expandedDirs) {
  const rows = []
  rootFiles.forEach((f) => {
    rows.push({ type: 'file', path: f.path, name: f.name || f.path, depth: 0 })
  })
  Object.keys(rootDirs).sort().forEach((dir) => {
    const isExpanded = expandedDirs.includes(dir)
    rows.push({ type: 'dir', name: dir, depth: 0, isExpanded })
    if (isExpanded) {
      rootDirs[dir].sort((a, b) => a.name.localeCompare(b.name)).forEach((f) => {
        rows.push({ type: 'file', path: f.path, name: f.name, depth: 1 })
      })
    }
  })
  return rows
}

function ChevronIcon({ expanded }) {
  const transform = expanded ? 'rotate(90deg)' : 'rotate(0deg)'
  return (
    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' style={{ transform, transition: 'transform 0.12s', flexShrink: 0, color: 'var(--color-text-muted)' }}>
      <path d='m9 18 6-6-6-6' />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' style={{ flexShrink: 0, color: 'var(--color-text-secondary)' }}>
      <path d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' style={{ flexShrink: 0 }}>
      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
      <polyline points='14 2 14 8 20 8' />
    </svg>
  )
}

export function FileTree({ onFileOpen }) {
  const { files, loading, error, setFiles, setLoading, setError, expandedDirs, toggleDir } = useFileTreeStore()
  const { tabs } = useTabStore()
  const parentRef = useRef(null)

  useEffect(() => {
    if (files.length > 0) return
    setLoading(true)
    api.files()
      .then((data) => setFiles(data.tree ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const tree = useMemo(() => buildTree(files), [files])
  const rows = useMemo(() => flattenTree(tree, expandedDirs), [tree, expandedDirs])
  const activePaths = useMemo(() => new Set(tabs.map((t) => t.path)), [tabs])

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  if (loading) {
    return (
      <div className='flex flex-col gap-xs p-xs'>
        {[80, 60, 90, 70, 55].map((w, i) => (
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
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vrow) => {
          const row = rows[vrow.index]
          if (row.type === 'dir') {
            const indent = row.depth * 14
            return (
              <div key={vrow.index} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: 'translateY(' + vrow.start + 'px)', display: 'flex', alignItems: 'center', paddingLeft: indent + 4, height: ROW_HEIGHT }}>
                <button onClick={() => toggleDir(row.name)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, width: '100%', textAlign: 'left', color: 'var(--color-text-primary)' }}>
                  <ChevronIcon expanded={row.isExpanded} />
                  <FolderIcon />
                  <span className='truncate' style={{ fontSize: 13 }}>{row.name}</span>
                </button>
              </div>
            )
          }
          const isActive = activePaths.has(row.path)
          const indent = row.depth * 14
          return (
            <div key={vrow.index} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: 'translateY(' + vrow.start + 'px)', display: 'flex', alignItems: 'center', paddingLeft: indent + 20, height: ROW_HEIGHT }}>
              <button onClick={() => onFileOpen({ path: row.path, title: row.name })} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, width: '100%', textAlign: 'left', color: isActive ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
                <FileIcon />
                <span className='truncate' style={{ fontSize: 13 }}>{row.name}</span>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
