'use client'

import { useEffect, useRef } from 'react'

const TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='48' viewBox='0 0 56 48'%3E%3Cpath d='M14 2 L28 10 L28 26 L14 34 L0 26 L0 10 Z' fill='none' stroke='%235ce1ff' stroke-width='1.15'/%3E%3Cpath d='M42 26 L56 34 L56 50 L42 58 L28 50 L28 34 Z' fill='none' stroke='%235ce1ff' stroke-width='1.15'/%3E%3C/svg%3E\")"

export function AboutHexGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const glow = ref.current
    const page = glow?.closest('.about-page')
    if (!glow || !(page instanceof HTMLElement)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const place = (event: PointerEvent) => {
      const rect = glow.getBoundingClientRect()
      glow.style.setProperty('--hx', `${event.clientX - rect.left}px`)
      glow.style.setProperty('--hy', `${event.clientY - rect.top}px`)
      glow.dataset.lit = 'true'
    }

    const clear = () => {
      delete glow.dataset.lit
    }

    page.addEventListener('pointermove', place)
    page.addEventListener('pointerleave', clear)
    return () => {
      page.removeEventListener('pointermove', place)
      page.removeEventListener('pointerleave', clear)
    }
  }, [])

  return <div ref={ref} className="about-hex-glow" style={{ backgroundImage: TILE }} />
}
