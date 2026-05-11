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

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        <TabBar onTabClose={handleTabClose} />
        <ContentArea tab={activeTab} />
      </div>
    </div>
  )
}
