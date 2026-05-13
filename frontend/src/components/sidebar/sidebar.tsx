import { FileTree } from './file-tree'
import { SearchInput } from './search-input'
import { ThemeToggle } from '@/components/theme-toggle'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, X, Network, LogOut } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'

const MIN_WIDTH = 180
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 256

interface UseResizableOptions {
  min: number
  max: number
  defaultWidth: number
}

function useResizable({ min, max, defaultWidth }: UseResizableOptions) {
  const [width, setWidth] = useState(defaultWidth)
  const [isDragging, setIsDragging] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return
      const rect = sidebarRef.current.getBoundingClientRect()
      const newWidth = e.clientX - rect.left
      setWidth(Math.min(Math.max(newWidth, min), max))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, min, max])

  return { width, isDragging, sidebarRef, handleMouseDown }
}

interface SidebarProps {
  onOpenGraph: () => void
}

export function Sidebar({ onOpenGraph }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { logout } = useAuthStore()
  const { width, sidebarRef, handleMouseDown } = useResizable({
    min: MIN_WIDTH,
    max: MAX_WIDTH,
    defaultWidth: DEFAULT_WIDTH,
  })

  const handleLogout = async () => {
    await logout()
  }

  const sealMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <img src="/seal.svg" alt="seal" className="h-8 w-8 cursor-pointer" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-background border">
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const sidebarHeader = (
    <div className="flex items-center justify-between border-b px-3 py-2">
      {sealMenu}
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

  const sidebarContent = (
    <>
      {sidebarHeader}
      <div className="border-b px-3 py-2">
        <SearchInput />
      </div>
      <ScrollArea className="flex-1">
        <FileTree />
      </ScrollArea>
    </>
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

      {/* Desktop sidebar */}
      <div
        ref={sidebarRef}
        className="hidden md:flex h-full flex-col border-r bg-card relative"
        style={{ width }}
      >
        {sidebarContent}
        <div
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-accent/50 active:bg-accent/70 transition-colors"
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
        />
      </div>

      {/* Mobile overlay sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed left-0 top-0 flex h-full flex-col border-r bg-card shadow-lg relative"
            style={{ width }}
          >
            {sidebarContent}
            <div
              className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-accent/50 active:bg-accent/70 transition-colors"
              onMouseDown={handleMouseDown}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => setIsOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
