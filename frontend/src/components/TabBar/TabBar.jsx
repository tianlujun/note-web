import { useTabStore } from '../../stores/tabStore'

export function TabBar({ onTabClose }) {
  const { tabs, activeTabId, setActiveTab } = useTabStore()

  if (tabs.length === 0) return null

  return (
    <div
      className="flex items-center border-b overflow-x-auto"
      style={{
        height: 'var(--tabbar-height)',
        background: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            className="flex items-center gap-xs pl-sm pr-xs group relative cursor-pointer"
            style={{
              height: '100%',
              borderRight: '1px solid var(--color-border)',
              background: isActive ? 'var(--color-bg-primary)' : 'transparent',
              flexShrink: 0,
              maxWidth: 180,
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {/* Active indicator */}
            {isActive && (
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{ height: 2, background: 'var(--color-accent)' }}
              />
            )}

            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--color-text-secondary)' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>

            <span
              className="truncate text-xs"
              style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
            >
              {tab.title || tab.path}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onTabClose(tab.id)
              }}
              className="ml-auto flex-shrink-0 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--color-bg-tertiary)]"
              style={{ width: 18, height: 18, border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
