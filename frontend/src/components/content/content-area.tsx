import { useEffect, useRef, useState } from 'react'
import { useTabStore } from '@/stores/tab-store'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

function renderContent(iframeRef: React.RefObject<HTMLIFrameElement | null>, content: string, noteDir: string, sessionId: string) {
  let processed = content
  if (sessionId) {
    processed = processed.replace(
      /<img([^>]*)src="(attachments\/[^"]+)"/g,
      `<img$1src="/api/attachment/${noteDir ? noteDir + '/' : ''}$2?session=${sessionId}"`
    )
  }

  const linkScript = `<script>
    var __noteDir = ${JSON.stringify(noteDir)};
    document.addEventListener('click', function(e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('http') || href.startsWith('mailto:')) return;
      e.preventDefault();
      var resolved;
      if (href.startsWith('/')) {
        resolved = href.replace(/^\\//, '');
      } else if (href.startsWith('./')) {
        var base = 'https://vault/' + (__noteDir ? __noteDir + '/' : '');
        resolved = new URL(href, base).pathname.replace(/^\\//, '');
      } else if (href.startsWith('../')) {
        var base = 'https://vault/' + (__noteDir ? __noteDir + '/' : '');
        resolved = new URL(href, base).pathname.replace(/^\\//, '');
      } else if (href.includes('/')) {
        resolved = href;
      } else {
        resolved = __noteDir ? __noteDir + '/' + href : href;
      }
      window.parent.postMessage({ type: 'note-link', path: resolved }, '*');
    });
  <\/script>`

  const wrapped = `<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_parent"></head><body>${processed}</body></html>`
  if (iframeRef.current) {
    iframeRef.current.srcdoc = linkScript + wrapped
  }
}

export function ContentArea() {
  const activeTab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId))
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeTab) return

    let cancelled = false
    const path = activeTab.path
    const cached = useTabStore.getState().getCachedContent(path)

    if (cached) {
      const sessionId = document.cookie.match(/notes_session=([^;]+)/)?.[1] || ''
      renderContent(iframeRef, cached.content, cached.noteDir, sessionId)
      return
    }

    setIsLoading(true)
    setError(null)

    api.getFile(path)
      .then(async (data) => {
        if (cancelled || !iframeRef.current) return

        const noteDir = path.replace(/\/[^/]+$/, '')
        const sessionId = document.cookie.match(/notes_session=([^;]+)/)?.[1] || ''

        useTabStore.getState().setCachedContent(path, {
          path,
          title: data.title,
          content: data.content,
          noteDir,
        })

        renderContent(iframeRef, data.content, noteDir, sessionId)
        setIsLoading(false)
      })
      .catch((e) => {
        if (!cancelled) {
          setError((e as Error).message)
          setIsLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [activeTab?.path])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'note-link' && event.data.path) {
        const cleanPath = event.data.path.replace(/^\//, '')
        const title = cleanPath.split('/').pop()?.replace(/\.html$/, '') || cleanPath
        useTabStore.getState().openTab(cleanPath, title)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (!activeTab) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Open a note from the sidebar</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Failed to load note</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <iframe
        ref={iframeRef}
        className="h-full w-full border-none bg-background"
        sandbox="allow-scripts allow-same-origin"
        title={activeTab?.title || 'Note content'}
      />
      {isLoading && (
        <div className="absolute inset-0 p-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      )}
    </div>
  )
}
