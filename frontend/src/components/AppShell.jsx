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

  // Listen for internal navigation events from ContentArea shadow DOM
  function handleNavigate(e) {
    const path = e.detail
    const title = path.split('/').pop()
    openTab({ path, title })
  }

  return (
    <div
      className="flex flex-row"
      style={{ height: '100dvh', overflow: 'hidden' }}
    >
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        onFileOpen={handleFileOpen}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <TabBar onTabClose={handleTabClose} />
        <ContentArea tab={activeTab} />
      </div>
    </div>
  )
}
