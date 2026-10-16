'use client'

import { useEffect, useRef, useState } from 'react'

export type FrameState = { width: number; height: number; scale: number }

/**
 * Render a demo at the full window size, then scale it down to fit the container.
 * Sites get their desktop layout instead of a cramped mobile breakpoint.
 * Pass a fixed `size` (e.g. the 1440x900 screenshot size) to render at that size instead of the window's.
 */
export function useScaledFrame<T extends HTMLElement = HTMLDivElement>(size?: { width: number; height: number }) {
  const fixedWidth = size?.width
  const fixedHeight = size?.height
  const containerRef = useRef<T>(null)
  const [frame, setFrame] = useState<FrameState>({ width: 1, height: 1, scale: 1 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let rafId = 0
    const schedule = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = 0
        const rect = container.getBoundingClientRect()
        const width = fixedWidth ?? window.innerWidth
        const height = fixedHeight ?? window.innerHeight
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
  }, [fixedWidth, fixedHeight])

  return { containerRef, frame }
}

/** Inline style that centres a window-sized iframe and scales it to the container. */
export function scaledFrameStyle(frame: FrameState) {
  return {
    inset: '50% auto auto 50%',
    width: `${frame.width}px`,
    height: `${frame.height}px`,
    transform: `translate(-50%, -50%) scale(${frame.scale})`,
  } as const
}
