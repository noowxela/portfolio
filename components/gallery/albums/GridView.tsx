'use client'

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { gsap } from 'gsap'
import { Demo } from '@/data/demos'
import { useMediaQuery } from '../useMediaQuery'
import { AlbumCover } from './AlbumCover'
import { AlbumOverlay } from './AlbumOverlay'
import { Disc } from './Disc'
import { GridDisc } from './GridDisc'
import { useAlbumMotion } from './useAlbumMotion'

const ROW_DEPTH = [0.6, 1.3, 0.9]

/** V2 Grid: a wall of sleeves, each with a disc peeking out. Discs spin with scroll velocity; rows drift with parallax. */
export function GridView({ demos }: { demos: Demo[] }) {
  const { isMobile, reduceMotion } = useAlbumMotion()
  const wide = useMediaQuery('(min-width: 1024px)')
  const cols = isMobile ? 2 : wide ? 4 : 3
  const [open, setOpen] = useState<Demo | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const rows = useRef<(HTMLDivElement | null)[]>([])
  const discs = useRef<(HTMLDivElement | null)[]>([])
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const el = scroller.current
    if (!el || reduceMotion) return
    let last = el.scrollTop
    let velocity = 0
    let angle = 0
    const tick = () => {
      const top = el.scrollTop
      velocity += (top - last - velocity) * 0.12 // eases back to idle when scrolling stops
      last = top
      angle += 0.12 + velocity * (isMobile ? 0.6 : 1.1)
      discs.current.forEach((disc, i) => {
        if (disc) disc.style.transform = `rotate(${angle + i * 41}deg)`
      })
      const k = isMobile ? 0.5 : 1
      rows.current.forEach((row, r) => {
        if (!row) return
        const y = Math.max(-48, Math.min(48, -velocity * ROW_DEPTH[r % 3] * 2.2 * k))
        row.style.transform = `translateY(${y}px)`
      })
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [isMobile, reduceMotion])

  const grid: Demo[][] = []
  demos.forEach((d, i) => {
    const r = Math.floor(i / cols)
    ;(grid[r] ??= []).push(d)
  })

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key]
    if (!step) return
    e.preventDefault()
    const next = Math.min(demos.length - 1, Math.max(0, i + step))
    buttons.current[next]?.focus()
    buttons.current[next]?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  const close = useCallback(() => setOpen(null), [])

  return (
    <div
      ref={scroller}
      className="box-border h-dvh overflow-x-hidden overflow-y-auto overscroll-contain bg-[#eeeeee] pt-[var(--work-top,3.5rem)] font-sans dark:bg-[#0d0d0d]"
    >
      <GridDisc />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-8 pb-28 sm:px-8 sm:pt-12">
        <header className="mb-10 sm:mb-14">
          <p className="text-[0.6rem] font-semibold tracking-[0.16em] text-[#999] uppercase">Collection</p>
          <h1 className="mt-1 text-xl font-semibold text-[#111] sm:text-2xl dark:text-white">Records</h1>
          <p className="mt-1 text-[0.75rem] text-[#777] dark:text-[#999]">
            {demos.length} projects. Open one to play it live.
          </p>
        </header>
        <ul role="list" aria-label="Projects" className="flex flex-col gap-14 sm:gap-20">
          {grid.map((row, r) => (
            <li key={r}>
              <div
                ref={(el) => { rows.current[r] = el }}
                className="grid gap-x-5 gap-y-14 will-change-transform sm:gap-x-8"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {row.map((d) => {
                  const i = demos.indexOf(d)
                  return (
                    <div key={d.slug} className="group relative pt-[18%]">
                      <div className="absolute top-0 left-[23%] w-[54%] transition-transform duration-300 ease-out group-focus-within:-translate-y-[10%] group-hover:-translate-y-[10%] motion-reduce:transition-none">
                        <Disc demo={d} discRef={(el) => { discs.current[i] = el }} />
                      </div>
                      <button
                        ref={(el) => { buttons.current[i] = el }}
                        type="button"
                        onClick={() => setOpen(d)}
                        onKeyDown={(e) => onKeyDown(e, i)}
                        aria-label={`${d.name}, open details`}
                        className="relative block w-full cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111] dark:focus-visible:outline-white"
                      >
                        <AlbumCover demo={d} priority={i < cols} className="!aspect-[16/9]" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <AlbumOverlay demo={open} onClose={close} />
    </div>
  )
}
