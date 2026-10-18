'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { CONTACT_LINKS } from '@/components/landing/entries'
import { HEAD, STEPS, commitHash, formatMonth, monthsBetween, type Step } from '@/data/experience'
import { site } from '@/data/site'
import { Rail, type RailHandle, type RailItem } from './Rail'
import { createTrack, type Track } from './track'
import type { MarkField } from './markField'
import { playArrive } from '@/lib/sound'

type Mode = 'pending' | 'webgl' | 'static'

type Item =
  | { kind: 'step'; key: string; hash: string; mark: string; step: Step }
  | { kind: 'head'; key: string; hash: string; mark: string }

const REDUCED = '(prefers-reduced-motion: reduce)'
const SMALL = '(max-width: 767px), (pointer: coarse)'
const FINE = '(hover: hover) and (pointer: fine)'
const PS = 'alex@grid:~$'

const ITEMS: Item[] = [
  ...STEPS.map((step) => ({ kind: 'step' as const, key: step.id, hash: commitHash(step.id), mark: step.mark, step })),
  { kind: 'head' as const, key: HEAD.id, hash: commitHash(HEAD.id), mark: HEAD.mark },
]

const BRANCHES = new Set(ITEMS.map((it) => (it.kind === 'step' ? it.step.branch : HEAD.branch))).size

function canUseWebGL() {
  return typeof window !== 'undefined' && 'WebGLRenderingContext' in window
}

/**
 * Resolve once the home's hand-off (curtain + staged entrance) is over and the
 * main thread is idle, so building the particle field (font raster, shader
 * compile) never lands on an entrance frame. Direct visits resolve at once.
 */
function whenCalm(signal: { cancelled: boolean }) {
  const html = document.documentElement
  const busy = () => html.classList.contains('route-enter') || !!html.dataset.curtain
  return new Promise<void>((resolve) => {
    const idle = () => {
      if (signal.cancelled) return
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => resolve(), { timeout: 400 })
      else setTimeout(resolve, 60)
    }
    if (!busy()) return idle()
    const mo = new MutationObserver(() => {
      if (busy()) return
      mo.disconnect()
      window.clearTimeout(cap)
      idle()
    })
    const cap = window.setTimeout(() => {
      mo.disconnect()
      idle()
    }, 3000)
    mo.observe(html, { attributes: true, attributeFilter: ['class', 'data-curtain'] })
  })
}

const order = (i: number) => ({ '--i': i }) as CSSProperties

function StepBody({ it }: { it: Extract<Item, { kind: 'step' }> }) {
  const s = it.step
  const months = s.to ? monthsBetween(s.from, s.to) : null
  let n = 0
  return (
    <div className="gl-body">
      <p className="gl-meta" style={order(n++)}>
        <span className="gl-hash">{it.hash}</span>
        <span className={`gl-chip b-${s.branch}`}>{s.branch}</span>
        <span className="gl-msg">{s.message}</span>
      </p>
      <h2 className="gl-title" style={order(n++)}>
        {s.href ? (
          <a href={s.href} target="_blank" rel="noreferrer">
            {s.title}
            <span aria-hidden> ↗</span>
          </a>
        ) : (
          s.title
        )}
      </h2>
      <p className="gl-role" style={order(n++)}>
        {s.role}
        {s.place ? ` · ${s.place}` : ''} · {formatMonth(s.from)} — {s.to ? formatMonth(s.to) : 'Present'}
      </p>
      {s.facts.length > 0 && (
        <ul className="gl-facts">
          {s.facts.map((fact) => (
            <li key={fact} style={order(n++)}>
              {fact}
            </li>
          ))}
        </ul>
      )}
      <div className="gl-foot" style={order(n++)}>
        {s.tags.length > 0 && (
          <ul className="gl-tags" aria-label="Technologies">
            {s.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
        <p className="gl-stats">
          {months !== null && (
            <span className="gl-stat">
              <b data-count={months}>{months}</b> months
            </span>
          )}
          {s.stats?.map((st) => (
            <span key={st.label} className="gl-stat">
              <b data-count={st.value}>{st.value}</b> {st.label}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}

function HeadBody({ it }: { it: Extract<Item, { kind: 'head' }> }) {
  let n = 0
  return (
    <div className="gl-body">
      <p className="gl-meta" style={order(n++)}>
        <span className="gl-hash">{it.hash}</span>
        <span className="gl-chip b-head">HEAD</span>
        <span className="gl-msg">{HEAD.message}</span>
      </p>
      <h2 className="gl-title" style={order(n++)}>
        {HEAD.title}
      </h2>
      <p className="gl-role" style={order(n++)}>
        {HEAD.role}
      </p>
      <p className="gl-summary" style={order(n++)}>
        {HEAD.summary}
      </p>
      <p className="gl-prompt" style={order(n++)} aria-hidden>
        {PS} <span className="gl-caret" />
      </p>
      <div className="gl-links" style={order(n++)}>
        {CONTACT_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            {...(link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            className="gl-link"
          >
            {link.label}
            {link.external && <span aria-hidden> ↗</span>}
          </a>
        ))}
        <Link href="/about" className="gl-link is-primary">
          About <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  )
}

/**
 * /journey ("grid.log"): Alex's work history as a horizontal git log. One
 * panel sits in the middle; wheel, drag, keys or the rail move between them.
 * Behind the panel its date floats as particles (one small WebGL canvas).
 */
export function GridLog({ className }: { className?: string }) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLOListElement>(null)
  const railRef = useRef<RailHandle>(null)
  const trackRef = useRef<Track | null>(null)
  const markRef = useRef<MarkField | null>(null)
  const reducedRef = useRef(false)
  const shownRef = useRef(0)
  const [cur, setCur] = useState(0)
  const [mode, setMode] = useState<Mode>('pending')
  const settledRef = useRef<number | null>(null)

  const railItems = useMemo<RailItem[]>(
    () =>
      ITEMS.map((it) =>
        it.kind === 'step'
          ? { key: it.key, branch: it.step.branch, short: it.step.short, label: `${it.mark} — ${it.step.title}` }
          : { key: it.key, branch: HEAD.branch, label: 'Next commit — available', head: true },
      ),
    [],
  )

  // Void ground, no page scroll.
  useEffect(() => {
    const html = document.documentElement
    html.classList.add('tron-home', 'gridlog-page')
    return () => html.classList.remove('tron-home', 'gridlog-page')
  }, [])

  // Particles or the static mark; follow reduced-motion changes.
  useEffect(() => {
    const mq = window.matchMedia(REDUCED)
    const pick = () => {
      reducedRef.current = mq.matches
      setMode(mq.matches || !canUseWebGL() ? 'static' : 'webgl')
    }
    queueMicrotask(pick)
    mq.addEventListener('change', pick)
    return () => mq.removeEventListener('change', pick)
  }, [])

  // The row controller.
  useEffect(() => {
    const stage = stageRef.current
    const row = rowRef.current
    if (!stage || !row) return
    const track = createTrack({
      surface: stage,
      row,
      panels: () => Array.from(row.children) as HTMLElement[],
      reduced: () => reducedRef.current,
      onIndex: (i) => setCur(i),
      onMove: (f, speed) => {
        railRef.current?.setProgress(f)
        if (speed) markRef.current?.stir(speed)
      },
      onSettle: (i) => {
        // A blip when the cycle settles on a new node; not for the first (load / deep-link) settle.
        if (settledRef.current !== null && settledRef.current !== i) playArrive(i, ITEMS[i]?.kind === 'head')
        settledRef.current = i
        const hash = ITEMS[i]?.hash
        if (hash && location.hash.slice(1) !== hash) history.replaceState(history.state, '', `#${hash}`)
      },
    })
    trackRef.current = track
    const fromHash = ITEMS.findIndex((it) => it.hash === location.hash.slice(1))
    if (fromHash > 0) track.go(fromHash, { animate: false })
    else track.refresh()
    settledRef.current = track.index()
    const onHash = () => {
      const i = ITEMS.findIndex((it) => it.hash === location.hash.slice(1))
      if (i >= 0) track.go(i)
    }
    window.addEventListener('hashchange', onHash)
    return () => {
      window.removeEventListener('hashchange', onHash)
      track.dispose()
      trackRef.current = null
    }
  }, [])

  // The particle mark (WebGL only).
  useEffect(() => {
    if (mode !== 'webgl') return
    const root = rootRef.current
    const host = fieldRef.current
    if (!root || !host) return
    const signal = { cancelled: false }
    let field: MarkField | null = null
    void (async () => {
      const [{ createMarkField }] = await Promise.all([import('./markField'), whenCalm(signal)])
      if (signal.cancelled) return
      const fontFamily = getComputedStyle(root).fontFamily || 'sans-serif'
      try {
        await document.fonts.load(`600 100px ${fontFamily}`)
      } catch {
        /* sample with whatever font is there */
      }
      if (signal.cancelled) return
      field = createMarkField(host, {
        marks: ITEMS.map((it) => it.mark),
        fontFamily,
        small: window.matchMedia(SMALL).matches,
        start: trackRef.current?.index() ?? 0,
        onLost: () => setMode('static'),
      })
      if (!field) {
        setMode('static')
        return
      }
      markRef.current = field
      root.dataset.field = 'ready'
    })()
    return () => {
      signal.cancelled = true
      markRef.current = null
      field?.dispose()
      delete root.dataset.field
    }
  }, [mode])

  // Cursor: push the particles and move the stage glow (fine pointers only).
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !window.matchMedia(FINE).matches) return
    let raf = 0
    let px = 0
    let py = 0
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const r = stage.getBoundingClientRect()
      px = e.clientX - r.left
      py = e.clientY - r.top
      markRef.current?.pointer(px, py)
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0
          stage.style.setProperty('--mx', `${px.toFixed(0)}px`)
          stage.style.setProperty('--my', `${py.toFixed(0)}px`)
        })
    }
    const onLeave = () => markRef.current?.leave()
    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  // On every step change after the first: panel glitch-in, counters, particles.
  useEffect(() => {
    markRef.current?.setMark(cur)
    // Only real changes (also skips StrictMode's effect replay on mount).
    if (shownRef.current === cur) return
    shownRef.current = cur
    let raf = 0
    const reduced = reducedRef.current
    const panels = rowRef.current ? (Array.from(rowRef.current.children) as HTMLElement[]) : []
    panels.forEach((p, i) => {
      if (i !== cur) delete p.dataset.swap
    })
    const panel = panels[cur]
    if (panel && !reduced) {
      delete panel.dataset.swap
      void panel.offsetWidth
      panel.dataset.swap = 'true'
      const counters = Array.from(panel.querySelectorAll<HTMLElement>('[data-count]'))
      const t0 = performance.now()
      const count = (now: number) => {
        const t = Math.min(1, (now - t0) / 650)
        const e = 1 - Math.pow(1 - t, 3)
        counters.forEach((c) => (c.textContent = String(Math.round(Number(c.dataset.count) * e))))
        if (t < 1) raf = requestAnimationFrame(count)
      }
      raf = requestAnimationFrame(count)
    }
    return () => {
      cancelAnimationFrame(raf)
      panel?.querySelectorAll<HTMLElement>('[data-count]').forEach((c) => (c.textContent = c.dataset.count ?? ''))
    }
  }, [cur])

  // Panels taller than the stage (phones) scroll inside; flag them for the fade hint.
  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    const mark = () => {
      row.querySelectorAll<HTMLElement>('.gl-body').forEach((b) => {
        const more = b.scrollHeight - b.clientHeight > 4 && b.scrollTop + b.clientHeight < b.scrollHeight - 4
        if (more) b.dataset.more = 'true'
        else delete b.dataset.more
      })
    }
    const ro = new ResizeObserver(mark)
    ro.observe(row)
    row.addEventListener('scroll', mark, { capture: true, passive: true })
    mark()
    return () => {
      ro.disconnect()
      row.removeEventListener('scroll', mark, { capture: true })
    }
  }, [])

  const pick = useCallback((i: number) => trackRef.current?.go(i), [])

  return (
    <main ref={rootRef} className={`tron-root gridlog ${className ?? ''}`} data-mode={mode}>
      <h1 className="hero-name-hidden">Journey: {site.name}&apos;s work experience</h1>
      <div className="grid-pit gl-floor" aria-hidden>
        <div className="grid-floor" />
      </div>
      <div className="gl-haze" aria-hidden />

      <div className="gl-bar hud">
        <span className="gl-crumb">
          <span>~/grid</span>
          <span aria-hidden> / </span>
          <b>journey.log</b>
        </span>
        <span className="gl-count">
          {ITEMS.length} commits · {BRANCHES} branches
        </span>
        <span className="gl-hint" aria-hidden>
          ← → · drag · scroll
        </span>
        <a className="gl-resume" href={site.resume} target="_blank" rel="noreferrer">
          Resume <span aria-hidden>↗</span>
        </a>
      </div>

      <div ref={stageRef} className="gl-stage">
        <div ref={fieldRef} className="gl-field" aria-hidden />
        <p className="gl-mark" aria-hidden>
          {ITEMS[cur].mark}
        </p>
        <ol ref={rowRef} className="gl-row" aria-label="Work experience, oldest first">
          {ITEMS.map((it, i) => (
            <li
              key={it.key}
              id={`commit-${it.hash}`}
              className={`gl-panel${i === cur ? ' is-cur' : ''}${it.kind === 'head' ? ' is-head' : ''}`}
              aria-current={i === cur ? 'step' : undefined}
              onClick={(e) => {
                if (trackRef.current?.consumeDrag()) return
                if (i !== cur && !(e.target as Element).closest('a, button')) pick(i)
              }}
              onFocus={() => i !== cur && trackRef.current?.go(i, { animate: false })}
            >
              {it.kind === 'step' ? <StepBody it={it} /> : <HeadBody it={it} />}
            </li>
          ))}
        </ol>
      </div>

      <Rail ref={railRef} items={railItems} cur={cur} onPick={pick} />
      <div className="tron-scan" aria-hidden />
    </main>
  )
}
