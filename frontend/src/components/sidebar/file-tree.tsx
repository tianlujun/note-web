import { useEffect, useState } from 'react'
import { ChevronRight, File, Folder } from 'lucide-react'
import { useFileTreeStore } from '@/stores/file-tree-store'
import { useTabStore } from '@/stores/tab-store'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FileTreeNode } from '@/lib/api'

interface TreeItemProps {
  node: FileTreeNode
  depth: number
}

function TreeItem({ node, depth }: TreeItemProps) {
  const { toggleExpand, isExpanded } = useFileTreeStore()
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
      openTab(node.path, node.name)
    }
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
        aria-label={isDir ? `Directory ${node.name}` : `File ${node.name}`}
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
        <span className="truncate">{node.name}</span>
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
    <div className="py-2">
      {tree.map((node) => (
        <TreeItem key={node.path} node={node} depth={0} />
      ))}
    </div>
  )
}
