import type { Ref } from 'react'
import { Demo } from '@/data/demos'
import { tagColor } from './tagColor'

const GROOVES = [47, 44.5, 42, 39.5, 37, 34.5, 32, 29.5, 27, 24.5]

/**
 * A vinyl record drawn in SVG: grooves, a sheen, and a label in the project's tag colour.
 * The outer element takes `discRef` so a variant can rotate it without re-rendering.
 */
export function Disc({ demo, discRef, className }: { demo: Demo; discRef?: Ref<HTMLDivElement>; className?: string }) {
  const label = tagColor(demo.tags[0] ?? demo.name)
  const id = `disc-${demo.slug}`
  return (
    <div ref={discRef} aria-hidden className={`aspect-square will-change-transform ${className ?? ''}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_8px_18px_rgb(0_0_0/0.35)]">
        <defs>
          <radialGradient id={`${id}-v`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1c1c1c" />
            <stop offset="100%" stopColor="#050505" />
          </radialGradient>
          <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.14" />
            <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <path id={`${id}-arc`} d="M 50 50 m -11 0 a 11 11 0 1 1 22 0" />
        </defs>
        <circle cx="50" cy="50" r="49.5" fill={`url(#${id}-v)`} />
        {GROOVES.map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="0.35" />
        ))}
        <circle cx="50" cy="50" r="49.5" fill={`url(#${id}-s)`} />
        <circle cx="50" cy="50" r="17" fill={label} />
        <circle cx="50" cy="50" r="17" fill="none" stroke="#000" strokeOpacity="0.15" strokeWidth="0.6" />
        <text fontSize="4.2" fontWeight="700" fill="#fff" letterSpacing="0.3" className="font-sans uppercase">
          <textPath href={`#${id}-arc`} startOffset="50%" textAnchor="middle">
            {demo.name.length > 16 ? `${demo.name.slice(0, 15)}…` : demo.name}
          </textPath>
        </text>
        <text x="50" y="61" fontSize="3" fill="#fff" fillOpacity="0.85" textAnchor="middle" className="font-sans">
          {demo.tags.slice(0, 2).join(' · ')}
        </text>
        <circle cx="50" cy="50" r="1.6" fill="#eeeeee" className="dark:fill-[#0d0d0d]" />
      </svg>
    </div>
  )
}
