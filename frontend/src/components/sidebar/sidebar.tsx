import { FileTree } from './file-tree'
import { SearchInput } from './search-input'
import { ThemeToggle } from '@/components/theme-toggle'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Menu, X, Network } from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  onOpenGraph: () => void
}

export function Sidebar({ onOpenGraph }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const sidebarHeader = (
    <div className="flex items-center justify-between border-b px-3 py-2">
      <img src="/seal.svg" alt="seal" className="h-8 w-8" />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenGraph}
          aria-label="Open graph view"
        >
          <Network className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-40 flex md:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden md:flex h-full w-64 flex-col border-r bg-card">
        {sidebarHeader}
        <div className="border-b px-3 py-2">
          <SearchInput />
        </div>
        <ScrollArea className="flex-1">
          <FileTree />
        </ScrollArea>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed left-0 top-0 flex h-full w-64 flex-col border-r bg-card shadow-lg">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <img src="/seal.svg" alt="seal" className="h-8 w-8" />
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenGraph}
                  aria-label="Open graph view"
                >
                  <Network className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="border-b px-3 py-2">
              <SearchInput />
            </div>
            <ScrollArea className="flex-1">
              <FileTree />
            </ScrollArea>
          </div>
        </div>
      )}
    </>
  )
}
