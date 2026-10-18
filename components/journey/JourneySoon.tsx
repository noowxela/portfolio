'use client'

import Link from 'next/link'
import { useEffect } from 'react'

/**
 * Temporary /journey: a small Tron "coming soon" card until the work-experience
 * journey lands. The previous 3D scroll ride now lives at /noelite2.
 */
export function JourneySoon({ className }: { className?: string }) {
  // The home page's void ground (same hook as /, /noelite and /noelite2).
  useEffect(() => {
    const html = document.documentElement
    html.classList.add('tron-home')
    return () => html.classList.remove('tron-home')
  }, [])

  return (
    <main className={`tron-root journey-soon ${className ?? ''}`}>
      <div className="grid-pit journey-soon-grid" aria-hidden>
        <div className="grid-floor" />
      </div>
      <div className="journey-soon-copy">
        <p className="hud">02 · journey.run</p>
        <h1 className="journey-soon-title">Journey</h1>
        <p className="hud journey-soon-status">
          <span className="journey-soon-dot" aria-hidden />
          Work experience timeline · coming soon
        </p>
        <Link className="journey-soon-cta" href="/noelite2">
          <span>Ride the 3D journey</span>
          <span aria-hidden>→</span>
        </Link>
      </div>
      <div className="tron-scan" aria-hidden />
    </main>
  )
}
