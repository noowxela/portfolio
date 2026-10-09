'use client'

import { useEffect, useRef } from 'react'

/**
 * Interactive pixel-mosaic name in the Legacy hero. Three.js is loaded with a
 * dynamic import inside the effect, so it never runs during the static export
 * and stays out of the main home bundle.
 */
export function HeroMosaic({ front, back }: { front: string; back: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancelled = false
    let dispose = () => {}
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    const mount = async () => {
      const style = getComputedStyle(el)
      const fontFamily = style.fontFamily || 'sans-serif'
      try {
        await document.fonts.load(`600 100px ${fontFamily}`)
      } catch {
        // Fall back to whatever font is available.
      }
      const { createMosaic } = await import('./mosaicScene')
      if (cancelled) return
      dispose()
      dispose = createMosaic(el, {
        front,
        back,
        color: style.getPropertyValue('--tron').trim() || '#5ce1ff',
        ember: style.getPropertyValue('--ember').trim() || '#b8f4ff',
        fontFamily,
        reducedMotion: reduced.matches,
      })
    }

    void mount()
    const onChange = () => void mount()
    reduced.addEventListener('change', onChange)

    return () => {
      cancelled = true
      reduced.removeEventListener('change', onChange)
      dispose()
    }
  }, [front, back])

  return (
    <div className="hero-mosaic" data-hero="mosaic">
      <div ref={ref} className="hero-mosaic-stage" aria-hidden />
    </div>
  )
}
