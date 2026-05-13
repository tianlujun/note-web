import { useEffect, useState, useCallback } from 'react'
import { ChevronRight, File, Folder, Copy, Link } from 'lucide-react'
import { useFileTreeStore } from '@/stores/file-tree-store'
import { useTabStore } from '@/stores/tab-store'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FileTreeNode } from '@/lib/api'

/** Strip .html extension for display — path is untouched */
function displayName(name: string): string {
  return name.endsWith('.html') ? name.slice(0, -5) : name
}

interface TreeItemProps {
  node: FileTreeNode
  depth: number
}

function TreeItem({ node, depth }: TreeItemProps) {
  const { toggleExpand, isExpanded, openContextMenu } = useFileTreeStore()
  const { openTab, tabs, activeTabId } = useTabStore()
  const [expanded, setExpanded] = useState(false)

  const isDir = node.type === 'dir'
  const isOpen = isExpanded(node.path)
  const hasChildren = isDir && node.children && node.children.length > 0
  const isActive = tabs.some((t) => t.path === node.path) && tabs.find((t) => t.path === node.path)?.id === activeTabId

  useEffect(() => {
    setExpanded(Boolean(isOpen && hasChildren))
  }, [isOpen, hasChildren])

  const handleClick = () => {
    if (isDir) {
      toggleExpand(node.path)
    } else {
      openTab(node.path, displayName(node.name))
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    openContextMenu(node, e.clientX, e.clientY)
  }

  const paddingLeft = depth * 20 + 12

  return (
    <div>
      <Button
        variant="ghost"
        className={cn(
          'h-8 w-full justify-start text-sm truncate',
          isActive && 'bg-accent/10 text-accent'
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        aria-label={isDir ? `Directory ${displayName(node.name)}` : `File ${displayName(node.name)}`}
      >
        {isDir && (
          <ChevronRight
            className={cn(
              'mr-1 h-3 w-3 shrink-0 transition-transform',
              isOpen && 'rotate-90'
            )}
          />
        )}
        {isDir ? (
          <Folder className="mr-2 h-4 w-4 shrink-0" />
        ) : (
          <File className="mr-2 h-4 w-4 shrink-0" />
        )}
        <span className="truncate">{displayName(node.name)}</span>
      </Button>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function ContextMenu() {
  const { contextMenu, closeContextMenu } = useFileTreeStore()
  const [copiedType, setCopiedType] = useState<'path' | 'link' | null>(null)

  const handleCopyRelativePath = useCallback(() => {
    if (!contextMenu) return
    const path = contextMenu.node.path
    navigator.clipboard.writeText(path).then(() => {
      setCopiedType('path')
      setTimeout(() => setCopiedType(null), 1500)
    })
    closeContextMenu()
  }, [contextMenu, closeContextMenu])

  const handleCopyLink = useCallback(() => {
    if (!contextMenu) return
    const path = contextMenu.node.path
    const url = `https://notes.cinnabar.ink/api/attachment/${encodeURIComponent(path)}`
    const curl = `curl -s "${url}" -H "Authorization: Bearer <TOKEN>"`
    navigator.clipboard.writeText(curl).then(() => {
      setCopiedType('link')
      setTimeout(() => setCopiedType(null), 1500)
    })
    closeContextMenu()
  }, [contextMenu, closeContextMenu])

  const handleCopyLs = useCallback(() => {
    if (!contextMenu) return
    const path = contextMenu.node.path
    const url = `https://notes.cinnabar.ink/api/ls/${encodeURIComponent(path)}`
    const curl = `curl -s "${url}" -H "Authorization: Bearer <TOKEN>"`
    navigator.clipboard.writeText(curl).then(() => {
      setCopiedType('link')
      setTimeout(() => setCopiedType(null), 1500)
    })
    closeContextMenu()
  }, [contextMenu, closeContextMenu])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeContextMenu])

  // Close on click outside
  useEffect(() => {
    if (!contextMenu) return
    const handleClick = () => closeContextMenu()
    const t = setTimeout(() => document.addEventListener('click', handleClick), 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('click', handleClick)
    }
  }, [contextMenu, closeContextMenu])

  if (!contextMenu) return null

  const isDir = contextMenu.node.type === 'dir'

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(contextMenu.x, window.innerWidth - 200),
    top: Math.min(contextMenu.y, window.innerHeight - 80),
    zIndex: 9999,
  }

  return (
    <div
      className="absolute bg-background border rounded-lg shadow-lg py-1 min-w-[200px]"
      style={menuStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        className="w-full justify-start text-sm h-8 px-3"
        onClick={handleCopyRelativePath}
      >
        <Copy className="mr-2 h-4 w-4" />
        {copiedType === 'path' ? 'Copied!' : 'Copy relative path'}
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start text-sm h-8 px-3"
        onClick={isDir ? handleCopyLs : handleCopyLink}
      >
        <Link className="mr-2 h-4 w-4" />
        {copiedType === 'link' ? 'Copied!' : isDir ? 'Copy ls curl' : 'Copy curl link'}
      </Button>
    </div>
  )
}

export function FileTree() {
  const { tree, isLoading, error, fetchTree } = useFileTreeStore()

  useEffect(() => {
    fetchTree()
  }, [fetchTree])

  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground mb-2">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchTree}>
          Retry
        </Button>
      </div>
    )
  }

  if (tree.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">No notes found</p>
      </div>
    )
  }

  return (
    <div className="relative py-2">
      {tree.map((node) => (
        <TreeItem key={node.path} node={node} depth={0} />
      ))}
      <ContextMenu />
    </div>
  )
}
