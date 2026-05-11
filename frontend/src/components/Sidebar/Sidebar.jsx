import { useState } from 'react'
import { FileTree } from './FileTree'
import { SearchInput } from './SearchInput'
import { useTabStore } from '../../stores/tabStore'

export function Sidebar({ collapsed, onToggle, onFileOpen }) {
  const { openTab } = useTabStore()

  function handleSearchResult(result) {
    onFileOpen({ path: result.path, title: result.title || result.path })
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)', letterSpacing: '0.01em' }}>
            Notes
          </span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-[var(--color-bg-hover)]"
          style={{ width: 30, height: 30, border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', transition: 'background 0.12s' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {collapsed ? (
              <path d="m9 18 6-6-6-6" />
            ) : (
              <path d="m15 18-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-search">
          <div className="relative">
            <SearchInput onResultClick={handleSearchResult} />
          </div>
        </div>
      )}

      {!collapsed && (
        <div className="sidebar-tree">
          <FileTree onFileOpen={onFileOpen} />
        </div>
      )}
    </aside>
  )
}
