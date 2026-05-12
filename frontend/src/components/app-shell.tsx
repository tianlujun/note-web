import { useState } from 'react'
import { Sidebar } from '@/components/sidebar/sidebar'
import { TabBar } from '@/components/tab-bar/tab-bar'
import { ContentArea } from '@/components/content/content-area'
import { GraphView } from '@/components/graph/graph-view'
import { Dialog, DialogContent } from '@/components/ui/dialog'

export function AppShell() {
  const [isGraphOpen, setIsGraphOpen] = useState(false)

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
