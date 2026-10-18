import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Observer } from 'gsap/Observer'

gsap.registerPlugin(Observer)

type Options = {
  count: number
  /** Which wheel / swipe axis drives the index. Wheel always accepts both. */
  axis: 'x' | 'y'
  /** Wheel pixels per album. */
  wheelStep: number
  /** Swipe pixels per album. */
  swipeStep: number
  paused: boolean
  reduceMotion: boolean
  /** Called every tick with the smoothed position (album index, fractional) and velocity (albums per tick). */
  onFrame: (pos: number, velocity: number) => void
}

/**
 * Wheel / trackpad / touch input mapped to a smoothed, snapping album index.
 * Drives a gsap ticker; the caller paints transforms in `onFrame` without React renders.
 */
export function useIndexScroller<T extends HTMLElement>({ count, axis, wheelStep, swipeStep, paused, reduceMotion, onFrame }: Options) {
  const targetRef = useRef<T>(null)
  const target = useRef(0)
  const pos = useRef(0)
  const lastInput = useRef(0)
  const frame = useRef(onFrame)
  const [active, setActive] = useState(0)

  useEffect(() => {
    frame.current = onFrame
  })

  const clamp = useCallback((v: number) => Math.min(count - 1, Math.max(0, v)), [count])

  const go = useCallback(
    (i: number) => {
      target.current = clamp(i)
      lastInput.current = 0
    },
    [clamp],
  )

  useEffect(() => {
    const el = targetRef.current
    if (!el || paused) return
    const obs = Observer.create({
      target: el,
      type: 'wheel,touch',
      preventDefault: true,
      tolerance: 2,
      onChange: (self) => {
        const touch = (self.event?.type ?? '').startsWith('touch') || (self.event?.type ?? '').startsWith('pointer')
        const delta = touch
          ? -(axis === 'x' ? self.deltaX : self.deltaY) / swipeStep
          : (Math.abs(self.deltaX) > Math.abs(self.deltaY) ? self.deltaX : self.deltaY) / wheelStep
        target.current = clamp(target.current + delta)
        lastInput.current = performance.now()
      },
    })
    return () => obs.kill()
  }, [axis, wheelStep, swipeStep, paused, clamp])

  useEffect(() => {
    let shown = -1
    const tick = () => {
      // Snap to the nearest album once input settles.
      if (lastInput.current && performance.now() - lastInput.current > 180) {
        target.current = Math.round(target.current)
        lastInput.current = 0
      }
      const prev = pos.current
      pos.current = reduceMotion ? target.current : prev + (target.current - prev) * 0.12
      if (Math.abs(target.current - pos.current) < 0.0005) pos.current = target.current
      frame.current(pos.current, pos.current - prev)
      const nearest = Math.round(pos.current)
      if (nearest !== shown) {
        shown = nearest
        setActive(nearest)
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [reduceMotion])

  return { targetRef, active, go, target }
}
