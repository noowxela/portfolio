'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { site } from '@/data/site'
import { ContactPanel } from './ContactPanel'
import { ENTRIES, type Entry, type EntryId } from './entries'

/**
 * `/`: one full-screen stage. The name sits in the middle, four entries are
 * pinned to the corners, and the particle portrait lives behind the name.
 */
export function Landing({ className }: { className?: string }) {
  const rootRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState<EntryId | null>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [touch, setTouch] = useState(false)

  // The Tron void ground (shared with /noelite and /journey).
  useEffect(() => {
    const html = document.documentElement
    html.classList.add('tron-home', 'landing-page')
    return () => html.classList.remove('tron-home', 'landing-page')
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    const pick = () => setTouch(mq.matches)
    queueMicrotask(pick)
    mq.addEventListener('change', pick)
    return () => mq.removeEventListener('change', pick)
  }, [])

  const closeContact = useCallback(() => setContactOpen(false), [])

  const onEntryClick = (entry: Entry) => (e: MouseEvent) => {
    // Touch: the first tap selects (morph + ENTER), the second opens.
    if (touch && active !== entry.id) {
      e.preventDefault()
      setActive(entry.id)
      return
    }
    if (!entry.href) {
      e.preventDefault()
      setContactOpen(true)
    }
  }

  return (
    <main
      ref={rootRef}
      className={`landing-root ${className ?? ''}`}
      data-active={active ?? 'none'}
      data-touch={touch}
    >
      <div className="landing-floor" aria-hidden>
        <div className="landing-floor-grid" />
      </div>
      <div className="landing-haze" aria-hidden />
      <div className="landing-stage" aria-hidden />
      <div className="tron-scan" aria-hidden />
      <div className="scene-frame landing-frame" aria-hidden />

      <header className="landing-title">
        <p className="landing-role">
          {site.role} · {site.location}
        </p>
        <h1 className="landing-name">{site.name.toLowerCase()}</h1>
      </header>

      <nav className="landing-entries" aria-label="Home">
        <ul>
          {ENTRIES.map((entry) => {
            const isActive = active === entry.id
            const body = (
              <>
                <span className="landing-entry-no">{entry.no}</span>
                <span className="landing-entry-label">{entry.label}</span>
                <span className="landing-entry-title">{entry.title}</span>
                <span className="landing-entry-enter" aria-hidden>
                  ENTER ▸
                </span>
              </>
            )
            const handlers = {
              onMouseEnter: () => !touch && setActive(entry.id),
              onMouseLeave: () => !touch && setActive((id) => (id === entry.id ? null : id)),
              onFocus: () => setActive(entry.id),
              onBlur: () => !touch && setActive((id) => (id === entry.id ? null : id)),
              onClick: onEntryClick(entry),
            }
            return (
              <li key={entry.id} className={`landing-entry landing-entry-${entry.corner}`} data-active={isActive}>
                {entry.href ? (
                  <Link href={entry.href} className="landing-entry-link" {...handlers}>
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="landing-entry-link"
                    aria-haspopup="dialog"
                    aria-expanded={contactOpen}
                    {...handlers}
                  >
                    {body}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <ContactPanel open={contactOpen} onClose={closeContact} />
    </main>
  )
}
