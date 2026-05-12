import { X } from 'lucide-react'
import { useTabStore, type Tab } from '@/stores/tab-store'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

function TabItem({ tab }: { tab: Tab }) {
  const { setActiveTab, closeTab } = useTabStore()
  const activeTabId = useTabStore((s) => s.activeTabId)
  const isActive = activeTabId === tab.id

  return (
    <div
      className={cn(
        'group relative flex h-8 min-w-0 max-w-[160px] items-center gap-1 border-r px-3 text-sm transition-colors',
        isActive ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}
    >
      <button
        className="truncate"
        onClick={() => setActiveTab(tab.id)}
        aria-label={`Open tab: ${tab.title}`}
      >
        {tab.title}
      </button>
      <button
        className="shrink-0 rounded-sm opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          closeTab(tab.id)
        }}
        aria-label={`Close tab: ${tab.title}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function TabBar() {
  const tabs = useTabStore((s) => s.tabs)

  if (tabs.length === 0) {
    return null
  }

  return (
    <div className="flex h-9 border-b bg-muted/50">
      <ScrollArea className="flex-1">
        <div className="flex">
          {tabs.map((tab) => (
            <TabItem key={tab.id} tab={tab} />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
