'use client'

import { useEffect, useRef } from 'react'
import { Demo, demoLiveUrl } from '@/data/demos'
import { DemoStage } from '../DemoStage'
import { PillButton } from '../PillButton'

/** Detail overlay for an album: the live stage (or screenshot fallback), links, blurb and tags. Esc closes. */
export function AlbumOverlay({ demo, onClose }: { demo: Demo | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!demo) return
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [demo, onClose])

  if (!demo) return null
  const liveUrl = demoLiveUrl(demo)

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-8"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${demo.name} details`}
        className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#eeeeee] shadow-[0_24px_60px_rgb(0_0_0/0.35)] ring-1 ring-black/5 dark:bg-[#0d0d0d] dark:ring-white/10"
      >
        <div className="relative aspect-[16/10] max-h-[62dvh] w-full p-3 sm:p-4">
          <DemoStage demo={demo} />
        </div>
        <div className="border-t border-black/5 bg-white p-3 sm:p-4 dark:border-white/10 dark:bg-[#1a1a1a]">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-[#111] dark:text-white">{demo.name}</h2>
            {demo.isNew ? (
              <span className="rounded-full bg-[#e8756a] px-[7px] py-0.5 text-[0.55rem] leading-[1.5] font-bold tracking-[0.06em] text-white uppercase">
                New
              </span>
            ) : null}
            {demo.featured ? (
              <span className="rounded-full bg-[#111] px-[7px] py-0.5 text-[0.55rem] leading-[1.5] font-bold tracking-[0.06em] text-white uppercase dark:bg-white dark:text-[#111]">
                Featured
              </span>
            ) : null}
            <div className="ml-auto flex items-center gap-1">
              {liveUrl ? (
                <PillButton href={liveUrl} target="_blank" rel="noopener noreferrer" className="flex h-7 items-center px-3 text-[0.7rem] font-medium">
                  Open live
                </PillButton>
              ) : null}
              {demo.repoUrl ? (
                <PillButton href={demo.repoUrl} target="_blank" rel="noopener noreferrer" className="flex h-7 items-center px-3 text-[0.7rem] font-medium">
                  Repo
                </PillButton>
              ) : null}
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close details"
                className="grid h-7 w-7 cursor-pointer place-items-center rounded-full text-[#777] transition-colors hover:bg-black/5 hover:text-[#111] dark:hover:bg-white/8 dark:hover:text-white"
              >
                <svg viewBox="0 0 10 10" aria-hidden className="h-2.5 w-2.5">
                  <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
          <p className="mt-1 text-[0.75rem] leading-snug text-[#666] dark:text-[#aaa]">{demo.blurb}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {demo.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-black/5 px-2 py-0.5 text-[0.6rem] font-medium text-[#555] dark:bg-white/8 dark:text-[#ccc]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
