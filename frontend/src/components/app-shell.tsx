import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar/sidebar'
import { TabBar } from '@/components/tab-bar/tab-bar'
import { ContentArea } from '@/components/content/content-area'
import { GraphView } from '@/components/graph/graph-view'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useTabStore } from '@/stores/tab-store'
import { api } from '@/lib/api'

export function AppShell() {
  const [isGraphOpen, setIsGraphOpen] = useState(false)
  const { getActiveTab, clearContentCache, setCachedContent } = useTabStore()

  useEffect(() => {
    const eventSource = new EventSource('/api/events')

    eventSource.onmessage = (event) => {
      if (event.data === 'refresh') {
        clearContentCache()
        const activeTab = getActiveTab()
        if (activeTab) {
          const path = activeTab.path
          api.getFile(path).then((data) => {
            const noteDir = path.replace(/\/[^/]+$/, '')
            setCachedContent(path, {
              path,
              title: data.title,
              content: data.content,
              noteDir,
            })
          })
        }
      }
    }

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [getActiveTab, clearContentCache, setCachedContent])

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onOpenGraph={() => setIsGraphOpen(true)} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <TabBar />
        <ContentArea />
      </main>

      <Dialog open={isGraphOpen} onOpenChange={setIsGraphOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <GraphView onClose={() => setIsGraphOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
