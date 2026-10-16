'use client'

import { useState } from 'react'
import { DiscSignal } from '@/components/discs/DiscSignal'

const TICKS = Array.from({ length: 42 }, (_, i) => {
  const deg = 38 + (i * 104) / 41
  const a = (deg * Math.PI) / 180
  const inner = i % 5 === 0 ? 70.5 : 72
  return {
    x1: 100 + Math.cos(a) * inner,
    y1: 100 + Math.sin(a) * inner,
    x2: 100 + Math.cos(a) * 74.2,
    y2: 100 + Math.sin(a) * 74.2,
  }
})

const SPARKS = [
  [100, 104, 0.9],
  [91, 96, 0.45],
  [112, 98, 0.4],
  [106, 116, 0.3],
  [88, 112, 0.28],
  [116, 110, 0.22],
  [97, 88, 0.25],
] as const

/** First grid background, plus a hollow v2 whose core is a changing signal. */
export function CenteredDisc() {
  const [v2, setV2] = useState(false)

  return (
    <>
      <div aria-hidden className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="h-[min(78vmin,760px)] w-[min(78vmin,760px)] text-white">
          <circle cx="100" cy="100" r="96" className="fill-[#070707]" />
          <g className="grid-disc-breathe">
            <circle
              cx="100"
              cy="100"
              r="84"
              fill="none"
              stroke="currentColor"
              strokeWidth="4.2"
              strokeLinecap="round"
              strokeDasharray="488 40"
              transform="rotate(-90 100 100)"
            />
          </g>
          <g className="grid-disc-spin">
            <circle cx="100" cy="100" r="68" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.55 2.15" opacity="0.9" />
            <circle cx="100" cy="100" r="63" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeDasharray="0.35 2.8" opacity="0.55" />
          </g>
          <g className="grid-disc-spin grid-disc-spin-reverse">
            <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.4 2.5" opacity="0.75" />
            <circle cx="100" cy="100" r="51" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="0.3 3.4" opacity="0.4" />
          </g>
          {TICKS.map((tick) => (
            <line key={`${tick.x1}-${tick.y1}`} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke="currentColor" strokeWidth="0.35" opacity="0.7" />
          ))}
          {v2 ? (
            <>
              <circle cx="100" cy="100" r="44" className="fill-[#0d0d0d]" />
              <DiscSignal />
            </>
          ) : (
            <>
              <circle cx="100" cy="100" r="46" className="fill-[#050505]" />
              {SPARKS.map(([x, y, r]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="currentColor" opacity="0.55" />
              ))}
            </>
          )}
        </svg>
      </div>
      <button
        type="button"
        aria-pressed={v2}
        onClick={() => setV2((on) => !on)}
        className={`absolute bottom-5 left-1/2 z-10 -translate-x-1/2 border px-3 py-1 text-[0.72rem] font-medium tracking-[0.14em] uppercase ${
          v2
            ? 'border-[#5ce1ff] text-[#5ce1ff]'
            : 'border-white/25 text-white/70 hover:border-white/50 hover:text-white'
        }`}
      >
        01 v2
      </button>
    </>
  )
}
