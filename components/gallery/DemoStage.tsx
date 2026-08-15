'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Demo, demoLiveUrl } from '@/data/demos'

type FrameState = { width: number; height: number; scale: number }

type Props = {
  demo: Demo | null
  onOpenNote?: (demo: Demo) => void
}

export function DemoStage({ demo, onOpenNote }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState<FrameState>({ width: 1, height: 1, scale: 1 })
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let rafId = 0
    const schedule = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = 0
        const rect = container.getBoundingClientRect()
        const width = window.innerWidth
        const height = window.innerHeight
        const scale = Math.min(rect.width / width, rect.height / height, 1)
        setFrame({ width, height, scale })
      })
    }

    schedule()
    const ro = new ResizeObserver(schedule)
    ro.observe(container)
    window.addEventListener('resize', schedule)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener('resize', schedule)
    }
  }, [])

  const liveUrl = demo ? demoLiveUrl(demo) : null
  const showFallback =
    Boolean(demo) && (demo?.embeddable === false || failedUrl === demo?.embedUrl)

  return (
    <div ref={containerRef} className="relative h-full min-h-0 w-full min-w-0">
      {demo && !showFallback ? (
        <iframe
          key={demo.embedUrl}
          src={demo.embedUrl}
          title={demo.name}
          className="absolute rounded-2xl border-none bg-white shadow-[0_24px_60px_rgb(0_0_0/0.16)] transition-shadow duration-200"
          style={{
            inset: '50% auto auto 50%',
            width: `${frame.width}px`,
            height: `${frame.height}px`,
            transform: `translate(-50%, -50%) scale(${frame.scale})`,
          }}
          onError={() => setFailedUrl(demo.embedUrl)}
        />
      ) : null}

      {showFallback && demo ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgb(0_0_0/0.16)] ring-1 ring-black/5 dark:bg-[#1a1a1a] dark:ring-white/10">
            <div className="relative aspect-video w-full bg-[#eee] dark:bg-[#111]">
              <Image src={demo.thumb} alt="" fill sizes="448px" className="object-cover" />
            </div>
            <div className="p-4">
              <p className="text-sm font-semibold text-[#111] dark:text-white">{demo.name}</p>
              <p className="mt-1 text-[0.8rem] text-[#777] dark:text-[#aaa]">
                This demo cannot be previewed here. Open it in a new tab.
              </p>
              {liveUrl ? (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block rounded-full bg-[#111] px-3.5 py-1.5 text-[0.8rem] font-medium text-white dark:bg-white dark:text-[#111]"
                >
                  Open live site
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!demo ? (
        <div className="flex h-full items-center justify-center text-sm text-[#999]">
          Select a demo
        </div>
      ) : null}

      {demo ? (
        <div className="pointer-events-none absolute top-0 right-16 left-0 z-10 p-3 sm:right-4 sm:p-4">
          <div className="pointer-events-auto max-w-md rounded-2xl bg-white/92 p-3 shadow-[0_2px_16px_rgb(0_0_0/0.08)] ring-1 ring-black/5 backdrop-blur-sm sm:p-4 dark:bg-[#1a1a1a]/92 dark:ring-white/10">
            <p className="text-sm font-semibold text-[#111] dark:text-white">{demo.name}</p>
            <p className="mt-1 text-[0.75rem] leading-snug text-[#666] dark:text-[#aaa]">{demo.blurb}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {demo.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-black/5 px-2 py-0.5 text-[0.6rem] font-medium text-[#555] dark:bg-white/8 dark:text-[#ccc]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {liveUrl ? (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#111] px-3 py-1 text-[0.7rem] font-medium text-white dark:bg-white dark:text-[#111]"
                >
                  Live
                </a>
              ) : null}
              {demo.repoUrl ? (
                <a
                  href={demo.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-black/10 px-3 py-1 text-[0.7rem] font-medium text-[#333] dark:border-white/10 dark:text-[#ddd]"
                >
                  GitHub
                </a>
              ) : null}
              {demo.note && onOpenNote ? (
                <button
                  type="button"
                  onClick={() => onOpenNote(demo)}
                  className="rounded-full border border-black/10 px-3 py-1 text-[0.7rem] font-medium text-[#333] dark:border-white/10 dark:text-[#ddd]"
                >
                  Details
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
