import { useEffect } from 'react'
import { useFileTreeStore } from '../../stores/fileTreeStore'
import { useTabStore } from '../../stores/tabStore'
import { api } from '../../api/client'

// Derive top-level groups from flat file list
function deriveGroups(files) {
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
  return { groups: Array.from(dirs).sort(), rootFiles }
}

function groupFiles(files, group) {
  return files
    .filter((f) => f.path.startsWith(group + '/') && !f.name.startsWith('_'))
    .map((f) => ({ ...f, relative: f.path.slice(group.length + 1) }))
}

export function FileTree({ onFileOpen }) {
  const { files, loading, error, expandedDirs, toggleDir, isExpanded, setFiles, setLoading, setError } =
    useFileTreeStore()
  const { tabs, activeTabId } = useTabStore()
  const { groups, rootFiles } = deriveGroups(files)

  useEffect(() => {
    if (files.length > 0) return
    setLoading(true)
    api.files()
      .then((data) => setFiles(data.tree ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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
    <nav className="flex flex-col gap-xs" style={{ flex: 1 }}>
      {groups.length === 0 && rootFiles.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)', padding: '8px 12px' }}>
          No notes yet
        </p>
      )}
      {rootFiles.map((f) => {
        const isActive = tabs.find((t) => t.id === activeTabId)?.path === f.path
        return (
          <button
            key={f.path}
            onClick={() => onFileOpen(f)}
            className={`tree-file-btn${isActive ? ' active' : ''}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="truncate">{f.name}</span>
          </button>
        )
      })}
      {groups.map((group) => {
        const expanded = isExpanded(group)
        const groupFilesList = groupFiles(files, group)
        return (
          <div key={group}>
            <button
              onClick={() => toggleDir(group)}
              className="tree-group-btn"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{
                  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.12s',
                  flexShrink: 0,
                  color: 'var(--color-text-muted)',
                }}
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0, color: 'var(--color-text-secondary)' }}>
                {expanded ? (
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                ) : (
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                )}
              </svg>
              <span className="truncate">{group}</span>
            </button>

            {expanded && (
              <div className="flex flex-col gap-xs" style={{ marginTop: 2 }}>
                {groupFilesList.map((f) => {
                  const isActive = tabs.find((t) => t.id === activeTabId)?.path === f.path
                  return (
                    <button
                      key={f.path}
                      onClick={() => onFileOpen(f)}
                      className={`tree-file-btn${isActive ? ' active' : ''}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="truncate">{f.relative}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
