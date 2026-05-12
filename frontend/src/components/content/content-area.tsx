import { useEffect, useRef, useState } from 'react'
import { useTabStore } from '@/stores/tab-store'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export function ContentArea() {
  const { getActiveTab } = useTabStore()
  const activeTab = getActiveTab()
  const containerRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeTab) {
      setContent(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    api.getFile(activeTab.path)
      .then((data) => {
        if (!cancelled) {
          setContent(data.content)
          setIsLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError((e as Error).message)
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeTab?.path])

  useEffect(() => {
    if (shadowRef.current && containerRef.current) {
      const shadow = shadowRef.current
      const container = containerRef.current

      const updateShadow = () => {
        if (container.scrollWidth > container.clientWidth) {
          shadow.classList.add('opacity-100')
        } else {
          shadow.classList.remove('opacity-100')
        }
      }

      updateShadow()
      container.addEventListener('scroll', updateShadow)
      window.addEventListener('resize', updateShadow)

      return () => {
        container.removeEventListener('scroll', updateShadow)
        window.removeEventListener('resize', updateShadow)
      }
    }
  }, [content])

  if (!activeTab) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Open a note from the sidebar</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Failed to load note</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  const stripBodyStyles = (html: string) => {
  if (!html) return ''
  return html.replace(/body\s*\{[^}]*\}/gi, '')
}

return (
    <div className="relative h-full overflow-hidden">
      <div
        ref={containerRef}
        className="h-full overflow-auto p-8"
        style={{ scrollbarWidth: 'thin' }}
      >
        <article className="mx-auto max-w-3xl">
          <div
            ref={shadowRef}
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: stripBodyStyles(content || '') }}
            onClick={(e) => {
              const target = e.target as HTMLElement
              const link = target.closest('a')
              if (link) {
                const href = link.getAttribute('href')
                if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
                  e.preventDefault()
                  const path = href.replace(/^\//, '')
                  const title = link.textContent || path
                  useTabStore.getState().openTab(path, title)
                }
              }
            }}
          />
        </article>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent opacity-0 transition-opacity" />
    </div>
  )
}
