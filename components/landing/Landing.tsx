'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type FocusEvent, type MouseEvent } from 'react'
import { site } from '@/data/site'
import { withBasePath } from '@/lib/withBasePath'
import { ContactPanel } from './ContactPanel'
import { ENTRIES, type Entry, type EntryId } from './entries'
import type { PortraitScene, Slot } from './portraitScene'

type Mode = 'pending' | 'webgl' | 'fallback'

const MOBILE = '(max-width: 767px)'
const FINE = '(hover: hover) and (pointer: fine)'
const REDUCED = '(prefers-reduced-motion: reduce)'
const NAV_H = 56

/** Cheap check only: probing with a test canvas would cost a second WebGL context. */
function canUseWebGL() {
  return typeof window !== 'undefined' && 'WebGLRenderingContext' in window
}

/**
 * `/`: one full-screen stage. The name sits in the middle, four entries are
 * pinned to the corners, and the particle portrait lives behind the name.
 */
export function Landing({ className }: { className?: string }) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLElement>(null)
  const entriesRef = useRef<HTMLUListElement>(null)
  const sceneRef = useRef<PortraitScene | null>(null)
  const [mode, setMode] = useState<Mode>('pending')
  const [motionKey, setMotionKey] = useState('')
  const [active, setActive] = useState<EntryId | null>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [touch, setTouch] = useState(false)
  const activeRef = useRef<EntryId | null>(null)

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

  // WebGL or the static fallback; remount the scene when motion / pointer prefs change.
  useEffect(() => {
    const queries = [MOBILE, FINE, REDUCED].map((q) => window.matchMedia(q))
    const pick = () => {
      if (!canUseWebGL()) setMode('fallback')
      else setMode((m) => (m === 'fallback' ? m : 'webgl'))
      setMotionKey(queries.map((q) => (q.matches ? '1' : '0')).join(''))
    }
    queueMicrotask(pick)
    queries.forEach((q) => q.addEventListener('change', pick))
    return () => queries.forEach((q) => q.removeEventListener('change', pick))
  }, [])

  useEffect(() => {
    if (mode !== 'webgl' || !motionKey) return
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    let cancelled = false
    let scene: PortraitScene | null = null
    const [small, fine, reduced] = motionKey.split('').map((c) => c === '1')

    const getSlot = (): Slot => {
      const w = stage.clientWidth
      const h = stage.clientHeight
      if (small) {
        const top = titleRef.current?.getBoundingClientRect().bottom ?? NAV_H + 120
        const bottom = entriesRef.current?.getBoundingClientRect().top ?? h - 160
        return { cx: w / 2, cy: (top + bottom) / 2 + 10, w, h: Math.max(120, bottom - top + 40) }
      }
      return { cx: w / 2, cy: (NAV_H + h) / 2, w, h: h - NAV_H }
    }

    void import('./portraitScene').then(({ createPortraitScene }) => {
      if (cancelled) return
      const style = getComputedStyle(root)
      scene = createPortraitScene(stage, {
        small,
        reducedMotion: reduced,
        pointerEffects: fine && !reduced,
        getSlot,
        tron: style.getPropertyValue('--tron').trim() || '#5ce1ff',
        ember: style.getPropertyValue('--ember').trim() || '#ff2b2b',
        onReady: () => {
          root.dataset.ready = 'true'
        },
        onLost: () => setMode('fallback'),
      })
      if (!scene) {
        setMode('fallback')
        return
      }
      sceneRef.current = scene
      scene.setPose(activeRef.current ?? 'hello')
    })

    return () => {
      cancelled = true
      delete root.dataset.ready
      scene?.dispose()
      sceneRef.current = null
    }
  }, [mode, motionKey])

  // Hover / focus / tap-select morphs the portrait to that entry's pose. Going
  // back to "hello" waits a beat so sliding between entries does not bounce.
  useEffect(() => {
    activeRef.current = active
    if (active) {
      sceneRef.current?.setPose(active)
      return
    }
    const id = window.setTimeout(() => sceneRef.current?.setPose('hello'), 160)
    return () => window.clearTimeout(id)
  }, [active])

  // Touch: a tap on the stage (not a drag) clears the selection.
  useEffect(() => {
    const stage = stageRef.current
    if (!touch || !stage) return
    const onTap = () => {
      if (!sceneRef.current?.wasDrag()) setActive(null)
    }
    stage.addEventListener('click', onTap)
    return () => stage.removeEventListener('click', onTap)
  }, [touch])

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
      data-mode={mode}
    >
      <div className="landing-floor" aria-hidden>
        <div className="landing-floor-grid" />
      </div>
      <div className="landing-haze" aria-hidden />
      <div ref={stageRef} className="landing-stage" aria-hidden />
      {mode === 'fallback' && (
        <div className="landing-fallback" data-landing="fallback" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={withBasePath('/portrait/alex-square.webp')} alt="" />
        </div>
      )}
      <div className="tron-scan" aria-hidden />
      <div className="scene-frame landing-frame" aria-hidden />

      <header ref={titleRef} className="landing-title">
        <h1 className="landing-name">{site.name.toLowerCase()}</h1>
      </header>

      <nav className="landing-entries" aria-label="Home">
        <ul ref={entriesRef}>
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
              // Keyboard focus only; a tap also focuses, and must not count as the first tap.
              onFocus: (e: FocusEvent<HTMLElement>) => {
                if (e.currentTarget.matches(':focus-visible')) setActive(entry.id)
              },
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
