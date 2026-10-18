'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type FocusEvent, type MouseEvent } from 'react'
import { site } from '@/data/site'
import { withBasePath } from '@/lib/withBasePath'
import { beginRouteExit, normalizePath, registerHomeExit } from '@/components/transition/routeTransition'
import { playClick, playTick } from '@/lib/sound'
import { ContactPanel } from './ContactPanel'
import { ENTRIES, type Entry, type EntryId } from './entries'
import type { PortraitScene, Slot } from './portraitScene'

type Mode = 'pending' | 'webgl' | 'fallback'

const MOBILE = '(max-width: 767px)'
const FINE = '(hover: hover) and (pointer: fine)'
const REDUCED = '(prefers-reduced-motion: reduce)'
const NAV_H = 56
/** Exit length: particles + name out, then the curtain covers and the route changes. */
const EXIT_MS = 720
const COVER_AT = 560
const REDUCED_EXIT_MS = 130

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
  const router = useRouter()
  const [exit, setExit] = useState<{ id: EntryId; dx: number; dy: number } | null>(null)
  const exitingRef = useRef(false)

  // The Tron void ground (shared with /noelite, /noelite2 and /journey).
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

  // A bfcache restore must not come back mid-exit.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      exitingRef.current = false
      setExit(null)
    }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [])

  const prefetch = (entry: Entry) => {
    if (entry.href) router.prefetch(entry.href)
  }

  /** Exit to a page: name glitches out, particles stream into the clicked corner, curtain, push. */
  const leaveTo = (entry: Entry, link: HTMLElement) => {
    const href = entry.href
    if (!href || exitingRef.current) return
    exitingRef.current = true
    const reduced = window.matchMedia(REDUCED).matches
    const root = rootRef.current
    const stage = stageRef.current
    const r = link.getBoundingClientRect()
    const s = stage?.getBoundingClientRect() ?? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
    const x = r.left + r.width / 2 - s.left
    const y = r.top + r.height / 2 - s.top
    setExit({ id: entry.id, dx: x - s.width / 2, dy: y - s.height / 2 })
    setActive(entry.id)
    root?.setAttribute('data-exit', entry.id)
    if (!reduced) sceneRef.current?.exit(x, y, EXIT_MS / 1000)
    beginRouteExit(href, { reduced, coverDelay: reduced ? 0 : COVER_AT })
    window.setTimeout(() => router.push(href), reduced ? REDUCED_EXIT_MS : EXIT_MS)
  }

  // The header nav's Work / Journey / About play the same exit, aimed at the matching corner.
  const leaveRef = useRef(leaveTo)
  useEffect(() => {
    leaveRef.current = leaveTo
  })
  useEffect(
    () =>
      registerHomeExit((to) => {
        if (exitingRef.current) return true
        const entry = ENTRIES.find((en) => en.href && normalizePath(en.href) === to)
        const link = entry && entriesRef.current?.querySelector<HTMLElement>(`[data-entry="${entry.id}"]`)
        if (!entry || !link) return false
        setContactOpen(false)
        leaveRef.current(entry, link)
        return true
      }),
    [],
  )

  const onEntryClick = (entry: Entry) => (e: MouseEvent<HTMLElement>) => {
    if (exitingRef.current) {
      e.preventDefault()
      return
    }
    // New tab / window: let the browser have it.
    if (entry.href && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) return
    // Touch: the first tap selects (morph + ENTER), the second opens.
    if (touch && active !== entry.id) {
      e.preventDefault()
      playTick()
      setActive(entry.id)
      prefetch(entry)
      return
    }
    e.preventDefault()
    // Same note as the header link for this page, before the exit starts.
    playClick(entry.id)
    if (!entry.href) {
      setContactOpen(true)
      return
    }
    leaveTo(entry, e.currentTarget)
  }

  return (
    <main
      ref={rootRef}
      className={`landing-root ${className ?? ''}`}
      data-active={active ?? 'none'}
      data-touch={touch}
      data-mode={mode}
      data-exit={exit?.id}
      style={exit ? ({ '--exit-dx': `${exit.dx}px`, '--exit-dy': `${exit.dy}px` } as CSSProperties) : undefined}
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
              onMouseEnter: () => {
                prefetch(entry)
                if (!touch) setActive(entry.id)
              },
              onMouseLeave: () => !touch && setActive((id) => (id === entry.id ? null : id)),
              // Keyboard focus only; a tap also focuses, and must not count as the first tap.
              onFocus: (e: FocusEvent<HTMLElement>) => {
                if (!e.currentTarget.matches(':focus-visible')) return
                prefetch(entry)
                setActive(entry.id)
              },
              onBlur: () => !touch && setActive((id) => (id === entry.id ? null : id)),
              onClick: onEntryClick(entry),
            }
            return (
              <li
                key={entry.id}
                className={`landing-entry landing-entry-${entry.corner}`}
                data-active={isActive}
                data-exit-target={exit?.id === entry.id || undefined}
              >
                {entry.href ? (
                  <Link href={entry.href} className="landing-entry-link" data-entry={entry.id} {...handlers}>
                    {body}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="landing-entry-link"
                    data-entry={entry.id}
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
