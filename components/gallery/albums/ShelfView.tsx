import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { Demo } from '@/data/demos'
import { AlbumCover } from './AlbumCover'
import { AlbumOverlay } from './AlbumOverlay'
import { Disc } from './Disc'
import { useAlbumMotion } from './useAlbumMotion'
import { useIndexScroller } from './useIndexScroller'

/** V1 Shelf: a horizontal row of sleeves; the centre one lifts and its disc slides out and spins with scroll. */
// Sleeve size matches the Coverflow card (82vw on phones, min(64vw, 880px) on desktop, 16:10),
// capped so the sleeve plus the raised disc and the caption fit under the header and switcher.
const DISC_SIZE = 0.8 // disc diameter, as a share of the sleeve height
const DISC_OUT = 0.35 // how far the disc rises, as a share of its diameter
const RISE = DISC_SIZE * DISC_OUT * 0.625 // disc rise as a share of the sleeve width (16:10)
const SLEEVE_WIDTH = `min(var(--shelf-max-w), 880px, calc((100dvh - var(--work-top, 3.5rem) - 8rem) / (0.625 * ${1 + DISC_SIZE * DISC_OUT})))`

export function ShelfView({ demos }: { demos: Demo[] }) {
  const { isMobile, reduceMotion } = useAlbumMotion()
  const [open, setOpen] = useState<Demo | null>(null)
  const items = useRef<(HTMLDivElement | null)[]>([])
  const discs = useRef<(HTMLDivElement | null)[]>([])
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const spin = useRef(0)

  const spacing = isMobile ? 0.7 : 0.62 // of the sleeve width
  const onFrame = useCallback(
    (pos: number, velocity: number) => {
      if (!reduceMotion) spin.current += velocity * (isMobile ? 160 : 260) + 0
      items.current.forEach((el, i) => {
        if (!el) return
        const d = i - pos
        const lift = Math.max(0, 1 - Math.abs(d))
        const ry = reduceMotion ? 0 : Math.max(-1, Math.min(1, -d)) * (isMobile ? 14 : 28)
        el.style.transform = `translateX(calc(${d * spacing * 100}% + ${d === 0 ? 0 : Math.sign(d) * (isMobile ? 44 : 150)}px * ${Math.min(1, Math.abs(d))})) translateZ(${lift * (isMobile ? 16 : 40)}px) rotateY(${ry}deg) scale(${1 - Math.min(1, Math.abs(d)) * (isMobile ? 0.12 : 0.22)})`
        el.style.zIndex = String(100 - Math.round(Math.abs(d) * 10))
        el.style.opacity = String(Math.max(0, 1 - Math.max(0, Math.abs(d) - 3.5)))
        const disc = discs.current[i]
        if (disc) {
          // Slides up out of the top of the sleeve (percent of the disc's own height).
          const out = lift * lift * DISC_OUT * 100
          disc.style.transform = `translateY(${-out}%) rotate(${spin.current + i * 47}deg)`
        }
      })
    },
    [isMobile, reduceMotion, spacing],
  )

  const { targetRef, active, go } = useIndexScroller<HTMLDivElement>({
    count: demos.length,
    axis: 'x',
    wheelStep: isMobile ? 220 : 320,
    swipeStep: isMobile ? 160 : 260,
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
      <p className="sr-only" aria-live="polite">{`Album ${active + 1} of ${demos.length}: ${demos[active].name}`}</p>
      <div
        ref={targetRef}
        role="listbox"
        aria-label="Projects shelf"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden [perspective:1400px]"
      >
        <div aria-hidden className="shelf-neon pointer-events-none absolute inset-x-0 top-1/2 z-0 h-28 -translate-y-1/2">
          <div className="absolute inset-x-0 top-1/2 h-16 -translate-y-1/2 bg-[#5ce1ff]/40 blur-2xl" />
          <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-[#5ce1ff] shadow-[0_0_8px_2px_#5ce1ff,0_0_32px_8px_rgba(92,225,255,0.8)]" />
        </div>
        <div
          className="relative z-10 [--shelf-max-w:82vw] sm:[--shelf-max-w:64vw] [transform-style:preserve-3d]"
          style={{ width: SLEEVE_WIDTH, marginTop: `calc(${SLEEVE_WIDTH} * ${RISE})` }}
        >
          <div className="aspect-[16/10]" />
          {demos.map((d, i) => (
            <div key={d.slug} ref={(el) => { items.current[i] = el }} className="absolute inset-0 will-change-transform [transform-style:preserve-3d]">
              <div className="absolute inset-x-0 flex justify-center" style={{ top: `${((1 - DISC_SIZE) / 2) * 100}%`, height: `${DISC_SIZE * 100}%` }}>
                <Disc demo={d} discRef={(el) => { discs.current[i] = el }} className="h-full" />
              </div>
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
                <AlbumCover demo={d} priority={i < 3} className="!aspect-[16/10]" />
              </button>
              <div aria-hidden className="pointer-events-none absolute top-full right-0 left-0 h-1/3 scale-y-[-1] opacity-20 [mask-image:linear-gradient(to_top,black,transparent_70%)]">
                <AlbumCover demo={d} className="!aspect-[16/10]" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="shrink-0 px-4 pb-16 text-center sm:pb-6">
        <p className="text-sm font-semibold text-[#111] dark:text-white">{demos[active].name}</p>
        <p className="mt-0.5 text-[0.72rem] text-[#777] dark:text-[#999]">{demos[active].blurb}</p>
        <p className="mt-2 text-[0.6rem] tracking-[0.12em] text-[#999] uppercase">
          {isMobile ? 'Swipe to browse · tap the centre album' : 'Scroll or ← → to browse · click or Enter to open'}
        </p>
      </div>
      <AlbumOverlay demo={open} onClose={close} />
    </div>
  )
}
