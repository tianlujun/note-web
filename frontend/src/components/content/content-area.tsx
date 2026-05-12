import { useEffect, useRef, useState } from 'react'
import { useTabStore } from '@/stores/tab-store'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'

const LINK_INTERCEPT_SCRIPT = `<script>
  document.addEventListener('click', function(e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) return;
    e.preventDefault();
    window.parent.postMessage({ type: 'note-link', path: href }, '*');
  });
<\/script>`

export function ContentArea() {
  const { getActiveTab, openTab } = useTabStore()
  const activeTab = getActiveTab()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeTab) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    api.getFile(activeTab.path)
      .then(async (data) => {
        if (!cancelled && iframeRef.current) {
          // Rewrite img src: relative paths -> /api/attachment/{path}?session=xxx
          const sessionId = document.cookie.match(/notes_session=([^;]+)/)?.[1] || '';
          const noteDir = activeTab.path.replace(/\/[^/]+$/, '');
          const processed = sessionId
            ? data.content.replace(
                /<img([^>]*)src="(attachments\/[^"]+)"/g,
                `<img$1src="/api/attachment/${noteDir}/$2?session=${sessionId}"`
              )
            : data.content;
          iframeRef.current.srcdoc = LINK_INTERCEPT_SCRIPT + processed;
          setIsLoading(false);
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
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'note-link') {
        const path = event.data.path
        if (path) {
          const cleanPath = path.replace(/^\//, '')
          const title = cleanPath.split('/').pop() || cleanPath
          openTab(cleanPath, title)
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [openTab])

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
        sandbox="allow-scripts allow-top-navigation-by-user-activation"
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
