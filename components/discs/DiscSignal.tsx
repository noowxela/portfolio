'use client'

import { useEffect, useState } from 'react'
import { type Live, mix, signal } from '@/components/discs/signalFrames'

/** Hollow-core signal. Dots travel into the next shape instead of cutting. */
export function DiscSignal({ offset = 0 }: { offset?: number }) {
  const [dots, setDots] = useState<Live[]>(() => signal(offset).map((dot) => ({ ...dot, opacity: 1 })))

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let from = signal(offset)
    let next = offset + 1
    let to = signal(next)
    let phase: 'hold' | 'morph' = 'hold'
    let phaseStart = performance.now()
    let raf = 0
    const loop = (now: number) => {
      if (phase === 'hold') {
        if (now - phaseStart >= 800) {
          phase = 'morph'
          phaseStart = now
        }
      } else {
        const t = Math.min(1, (now - phaseStart) / 1700)
        setDots(mix(from, to, t))
        if (t >= 1) {
          from = to
          next += 1
          to = signal(next)
          phase = 'hold'
          phaseStart = now
        }
      }
      raf = window.requestAnimationFrame(loop)
    }
    raf = window.requestAnimationFrame(loop)
    return () => window.cancelAnimationFrame(raf)
  }, [offset])

  return (
    <g className="grid-disc-breathe">
      {dots.map((dot, i) => (
        <circle key={i} cx={dot.x} cy={dot.y} r={dot.r} opacity={dot.opacity} fill="currentColor" />
      ))}
    </g>
  )
}
