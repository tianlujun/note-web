import { useState } from 'react'
import { Sidebar } from './Sidebar/Sidebar'
import { TabBar } from './TabBar/TabBar'
import { ContentArea } from './ContentArea'
import { useTabStore } from '../stores/tabStore'

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { tabs, activeTabId, openTab, closeTab } = useTabStore()

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null

  function handleFileOpen(file) {
    openTab({ path: file.path, title: file.title || file.path.split('/').pop() })
  }

  function handleTabClose(id) {
    closeTab(id)
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        onFileOpen={handleFileOpen}
      />

      {/* Mobile: sidebar overlay backdrop */}
      {sidebarCollapsed === false && (
        <div
          className="mobile-backdrop"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Mobile: hamburger button (shown when sidebar is collapsed) */}
      <button
        className="mobile-hamburger"
        onClick={() => setSidebarCollapsed(false)}
        aria-label="Open sidebar"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <TabBar onTabClose={handleTabClose} />
        <ContentArea tab={activeTab} />
      </div>
    </div>
  )
}
