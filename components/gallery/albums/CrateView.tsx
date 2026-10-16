'use client'

import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { Demo } from '@/data/demos'
import { AlbumCover } from './AlbumCover'
import { AlbumOverlay } from './AlbumOverlay'
import { Disc } from './Disc'
import { useAlbumMotion } from './useAlbumMotion'
import { useIndexScroller } from './useIndexScroller'

/** V3 Crate: records stacked in a crate. Scrolling flips the front record away; the current disc slides up out of its sleeve. */
export function CrateView({ demos }: { demos: Demo[] }) {
  const { isMobile, reduceMotion } = useAlbumMotion()
  const [open, setOpen] = useState<Demo | null>(null)
  const items = useRef<(HTMLDivElement | null)[]>([])
  const discs = useRef<(HTMLDivElement | null)[]>([])
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const spin = useRef(0)

  const onFrame = useCallback(
    (pos: number, velocity: number) => {
      if (!reduceMotion) spin.current += velocity * 220
      const gapY = isMobile ? 16 : 28
      const gapZ = isMobile ? 30 : 55
      items.current.forEach((el, i) => {
        if (!el) return
        const d = i - pos
        let transform: string
        let opacity = 1
        if (d < 0) {
          // Already flipped: tilt toward the viewer and drop out of the crate.
          const t = Math.min(1, -d)
          transform = reduceMotion
            ? `translateY(${t * 30}%)`
            : `translateY(${t * 18}%) translateZ(${t * 80}px) rotateX(${-t * (isMobile ? 55 : 80)}deg)`
          opacity = 1 - t
        } else {
          transform = `translateY(${-d * gapY}px) translateZ(${-d * gapZ}px)`
          opacity = d > 5 ? 0 : 1
        }
        el.style.transform = transform
        el.style.opacity = String(Math.max(0, opacity))
        el.style.zIndex = String(100 - Math.round(d * 10))
        el.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible'
        el.style.filter = d > 0 ? `brightness(${1 - Math.min(0.5, d * 0.12)})` : ''
        const disc = discs.current[i]
        if (disc) {
          const lift = Math.max(0, 1 - Math.abs(d))
          disc.style.transform = `translateY(${-lift * lift * (isMobile ? 32 : 44)}%) rotate(${spin.current + i * 53}deg)`
        }
      })
    },
    [isMobile, reduceMotion],
  )

  const { targetRef, active, go } = useIndexScroller<HTMLDivElement>({
    count: demos.length,
    axis: 'y',
    wheelStep: isMobile ? 200 : 300,
    swipeStep: isMobile ? 140 : 220,
    paused: Boolean(open),
    reduceMotion,
    onFrame,
  })

  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = Math.min(demos.length - 1, Math.max(0, active + step))
    go(next)
    buttons.current[next]?.focus({ preventScroll: true })
  }

  const close = useCallback(() => setOpen(null), [])

  return (
    <div className="box-border flex h-dvh flex-col overflow-hidden bg-[#eeeeee] pt-[var(--work-top,3.5rem)] font-sans dark:bg-[#0d0d0d]">
      <p className="sr-only" aria-live="polite">{`Record ${active + 1} of ${demos.length}: ${demos[active].name}`}</p>
      <div
        ref={targetRef}
        role="listbox"
        aria-label="Projects crate"
        onKeyDown={onKeyDown}
        className="relative flex min-h-0 flex-1 touch-none items-end justify-center overflow-hidden pb-[6vh] [perspective:1200px] [perspective-origin:50%_20%]"
      >
        <div className="relative w-[62vw] max-w-[340px] sm:w-[30vw] [transform-style:preserve-3d] [transform:rotateX(14deg)]">
          <div className="aspect-square" />
          {demos.map((d, i) => (
            <div
              key={d.slug}
              ref={(el) => { items.current[i] = el }}
              className="absolute inset-0 origin-bottom will-change-transform [transform-style:preserve-3d]"
            >
              <Disc demo={d} discRef={(el) => { discs.current[i] = el }} className="absolute inset-x-[5%] top-[5%] w-[90%]" />
              <button
                ref={(el) => { buttons.current[i] = el }}
                type="button"
                role="option"
                aria-selected={i === active}
                aria-label={`${d.name}${i === active ? ', open details' : ''}`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => (i === active ? setOpen(d) : go(i))}
                className="relative block w-full cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111] dark:focus-visible:outline-white"
              >
                <AlbumCover demo={d} priority={i < 3} />
              </button>
            </div>
          ))}
          {/* Crate front panel: sits in front of every record. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-[9%] -bottom-[4%] h-[38%] rounded-lg bg-gradient-to-b from-[#d9d9d9] to-[#c4c4c4] shadow-[0_18px_40px_rgb(0_0_0/0.25)] ring-1 ring-black/10 [transform:translateZ(90px)] dark:from-[#222] dark:to-[#161616] dark:ring-white/10"
          >
            <div className="absolute inset-x-[34%] top-[14%] h-[16%] rounded-full bg-black/15 dark:bg-black/50" />
            <p className="absolute inset-x-0 bottom-[16%] text-center text-[0.6rem] font-semibold tracking-[0.3em] text-black/35 uppercase dark:text-white/30">
              {String(active + 1).padStart(2, '0')} / {String(demos.length).padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>
      <div className="shrink-0 px-4 pb-16 text-center sm:pb-10">
        <p className="text-sm font-semibold text-[#111] dark:text-white">{demos[active].name}</p>
        <p className="mt-0.5 text-[0.72rem] text-[#777] dark:text-[#999]">{demos[active].blurb}</p>
        <p className="mt-2 text-[0.6rem] tracking-[0.12em] text-[#999] uppercase">
          {isMobile ? 'Swipe up to flip · tap the front record' : 'Scroll or ↑ ↓ to flip · click or Enter to open'}
        </p>
      </div>
      <AlbumOverlay demo={open} onClose={close} />
    </div>
  )
}
