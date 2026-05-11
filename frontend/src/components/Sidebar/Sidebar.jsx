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
    <aside
      className="flex flex-col border-r sidebar-transition"
      style={{
        width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        minWidth: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        height: '100dvh',
        background: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-sm px-sm border-b"
        style={{
          height: 48,
          borderColor: 'var(--color-border)',
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            Notes
          </span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto flex-shrink-0 flex items-center justify-center rounded hover:bg-[var(--color-bg-tertiary)]"
          style={{ width: 28, height: 28, border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-sm py-sm" style={{ borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          <SearchInput onResultClick={handleSearchResult} />
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-hidden">
        {!collapsed && <FileTree onFileOpen={onFileOpen} />}
      </div>
    </aside>
  )
}
