import { useTabStore } from '../../stores/tabStore'

export function TabBar({ onTabClose }) {
  const { tabs, activeTabId, setActiveTab } = useTabStore()

  if (tabs.length === 0) return null

  return (
    <div className="tabbar">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        return (
          <div
            key={tab.id}
            className={`tab group${isActive ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="truncate">{tab.title || tab.path}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onTabClose(tab.id)
              }}
              className="ml-auto flex-shrink-0 flex items-center justify-center rounded hover:bg-[var(--color-bg-hover)]"
              style={{
                width: 18, height: 18, border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.12s, background 0.12s',
                background: 'transparent',
                marginLeft: 4,
              }}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
