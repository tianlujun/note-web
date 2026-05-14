import { useState, useCallback, useEffect, useRef } from 'react';

interface BlobConfig {
  x: number;
  y: number;
  size: number;
  delay: number;
  rotate: number;
  shape: string;
  dx: number;
  dy: number;
}

const BLOB_SHAPES = [
  '62% 38% 70% 30% / 48% 52% 48% 52%',
  '45% 55% 50% 50% / 55% 45% 55% 45%',
  '55% 45% 65% 35% / 42% 58% 42% 58%',
  '50% 50% 45% 55% / 52% 48% 52% 48%',
];

function InkBlob({ config, onDone }: { config: BlobConfig; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="ink-blob"
      style={{
        left: config.x,
        top: config.y,
        animationDelay: `${config.delay}s`,
        '--r': `${config.rotate}deg`,
        '--dx': `${config.dx}px`,
        '--dy': `${config.dy}px`,
      } as React.CSSProperties}
    >
      <div
        className="ink-blob-inner"
        style={{
          width: config.size,
          height: config.size * 0.75,
          borderRadius: config.shape,
        }}
      />
    </div>
  );
}

export function InkSplatter({ containerRef }: { containerRef?: React.RefObject<HTMLElement> }) {
  const [blobs, setBlobs] = useState<Array<{ id: number; config: BlobConfig }>>([]);
  const lastTriggerRef = useRef<number>(0);

  const handleClick = useCallback((e: MouseEvent) => {
    const now = Date.now();
    if (now - lastTriggerRef.current < 100) {
      return;
    }
    lastTriggerRef.current = now;
    const target = e.target as HTMLElement;

    // Ignore if clicking on interactive elements
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a') ||
      target.closest('form') ||
      target.closest('[role="button"]') ||
      target.closest('.no-ink')
    ) {
      return;
    }

    // Ignore sidebar resize handle
    if (target.closest('[role="separator"]')) {
      return;
    }

    const id = Date.now();
    const baseX = e.clientX - 30;
    const baseY = e.clientY - 30;

    const configs: BlobConfig[] = [
      {
        x: baseX + (Math.random() - 0.5) * 30,
        y: baseY + (Math.random() - 0.5) * 30,
        size: 35 + Math.random() * 35,
        delay: 0,
        rotate: Math.random() * 360,
        shape: BLOB_SHAPES[Math.floor(Math.random() * BLOB_SHAPES.length)],
        dx: 0,
        dy: 0,
      },
      {
        x: baseX + (Math.random() - 0.5) * 40,
        y: baseY + (Math.random() - 0.5) * 40,
        size: 30 + Math.random() * 30,
        delay: 0,
        rotate: Math.random() * 360,
        shape: BLOB_SHAPES[Math.floor(Math.random() * BLOB_SHAPES.length)],
        dx: 0,
        dy: 0,
      },
      {
        x: baseX + (Math.random() - 0.5) * 25,
        y: baseY + (Math.random() - 0.5) * 25,
        size: 25 + Math.random() * 25,
        delay: 0,
        rotate: Math.random() * 360,
        shape: BLOB_SHAPES[Math.floor(Math.random() * BLOB_SHAPES.length)],
        dx: 0,
        dy: 0,
      },
    ];

    setBlobs((prev) => [...prev, ...configs.map((config) => ({ id: id + Math.random(), config }))]);
  }, []);

  const removeBlob = useCallback((blobId: number) => {
    setBlobs((prev) => prev.filter((b) => b.id !== blobId));
  }, []);

  useEffect(() => {
    const container = containerRef?.current || document.documentElement;
    container.addEventListener('click', handleClick, true);
    return () => container.removeEventListener('click', handleClick, true);
  }, [handleClick, containerRef]);

  return (
    <>
      <style>{`
        .ink-blob {
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          animation: ink-spread 2.5s ease-out forwards;
        }

        .ink-blob-inner {
          background: radial-gradient(ellipse at center,
            rgba(197, 62, 62, 0.6) 0%,
            rgba(197, 62, 62, 0.35) 30%,
            rgba(197, 62, 62, 0.1) 60%,
            transparent 100%
          );
          background-size: 100% 100%;
          background-position: center;
        }

        @keyframes ink-spread {
          0% {
            opacity: 0;
            background-size: 30% 30%;
          }
          5% {
            opacity: 0.7;
            background-size: 60% 60%;
          }
          100% {
            opacity: 0;
            background-size: 180% 180%;
          }
        }
      `}</style>
      {blobs.map((blob) => (
        <InkBlob key={blob.id} config={blob.config} onDone={() => removeBlob(blob.id)} />
      ))}
    </>
  );
}