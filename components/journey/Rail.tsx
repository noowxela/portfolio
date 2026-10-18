'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { Branch } from '@/data/experience'

export type RailItem = { key: string; branch: Branch; label: string; head?: boolean }

export type RailHandle = {
  /** Fractional position along the log (0 .. n-1): moves the light cycle and the lit trail. */
  setProgress: (f: number) => void
}

type Pt = { x: number; y: number }

const PAD_X = 30

/** Polyline helpers: total length, point and heading at a distance. */
function lengths(pts: Pt[]) {
  const acc = [0]
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  return acc
}

function pointAt(pts: Pt[], acc: number[], len: number) {
  const l = Math.max(0, Math.min(acc[acc.length - 1], len))
  let i = 1
  while (i < acc.length - 1 && acc[i] < l) i++
  const a = pts[i - 1]
  const b = pts[i]
  const seg = Math.max(1e-6, acc[i] - acc[i - 1])
  const t = (l - acc[i - 1]) / seg
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x), seg: i }
}

function pathTo(pts: Pt[], acc: number[], len: number) {
  const end = pointAt(pts, acc, len)
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 1; i < end.seg; i++) d += ` L${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`
  return `${d} L${end.x.toFixed(1)} ${end.y.toFixed(1)}`
}

const line = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

/**
 * The branch rail under the log: an `edu` lane that merges into `main`, a
 * dashed run to HEAD, one node per step. Drawn in pixels from the rail's size.
 */
export const Rail = forwardRef<RailHandle, { items: RailItem[]; cur: number; onPick: (i: number) => void }>(function Rail(
  { items, cur, onPick },
  ref,
) {
  const boxRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<SVGPathElement>(null)
  const cycleRef = useRef<HTMLSpanElement>(null)
  const progress = useRef(0)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const ro = new ResizeObserver(() => setSize({ w: box.clientWidth, h: box.clientHeight }))
    ro.observe(box)
    return () => ro.disconnect()
  }, [])

  const geo = useMemo(() => {
    const { w, h } = size
    const n = items.length
    if (!w || !h || n < 2) return null
    const yEdu = Math.round(h * 0.3)
    const yMain = Math.round(h * 0.7)
    const span = w - PAD_X * 2
    const xs = items.map((_, i) => PAD_X + (span * i) / (n - 1))
    const nodes: Pt[] = items.map((it, i) => ({ x: xs[i], y: it.branch === 'edu' ? yEdu : yMain }))
    // The route the light cycle rides: along each lane, with a diagonal at the merge.
    const route: Pt[] = [nodes[0]]
    for (let i = 1; i < n; i++) {
      const a = nodes[i - 1]
      const b = nodes[i]
      if (a.y !== b.y) route.push({ x: a.x + (b.x - a.x) * 0.62, y: a.y })
      route.push(b)
    }
    const nodeAt = nodes.map((p) => route.findIndex((q) => q === p))
    const acc = lengths(route)
    const firstMain = items.findIndex((it) => it.branch === 'main')
    const eduEnd = Math.max(0, nodeAt[firstMain] ?? 0)
    const headStart = items.length - 2
    return {
      nodes,
      route,
      acc,
      nodeLen: nodeAt.map((k) => acc[k]),
      edu: line(route.slice(0, eduEnd + 1)),
      main: line(route.slice(eduEnd, nodeAt[headStart] + 1)),
      next: line(route.slice(nodeAt[headStart])),
      labels: {
        edu: { x: nodes[0].x, y: yEdu - 18 },
        main: { x: nodes[firstMain]?.x ?? 0, y: yMain + 20 },
        head: { x: nodes[n - 1].x, y: yMain - 18 },
      },
    }
  }, [size, items])

  const draw = useCallback(
    (f: number) => {
      progress.current = f
      if (!geo) return
      const i = Math.max(0, Math.min(items.length - 1, Math.floor(f)))
      const t = Math.max(0, Math.min(1, f - i))
      const a = geo.nodeLen[i]
      const b = geo.nodeLen[Math.min(items.length - 1, i + 1)]
      const len = a + (b - a) * t
      const p = pointAt(geo.route, geo.acc, len)
      trailRef.current?.setAttribute('d', pathTo(geo.route, geo.acc, len))
      if (cycleRef.current) {
        cycleRef.current.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${p.angle.toFixed(3)}rad)`
      }
    },
    [geo, items.length],
  )

  useImperativeHandle(ref, () => ({ setProgress: draw }), [draw])

  // Redraw at the last position after a resize.
  useEffect(() => draw(progress.current), [draw])

  return (
    <div ref={boxRef} className="gl-rail" aria-label="Branch graph">
      {geo && (
        <svg width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden>
          <path className="gl-lane b-edu" d={geo.edu} />
          <path className="gl-lane b-main" d={geo.main} />
          <path className="gl-lane b-next" d={geo.next} />
          <path ref={trailRef} className="gl-trail" d="" />
        </svg>
      )}
      {geo && (
        <>
          <span className="gl-lane-label" style={{ left: geo.labels.edu.x, top: geo.labels.edu.y }} aria-hidden>
            edu
          </span>
          <span className="gl-lane-label" style={{ left: geo.labels.main.x, top: geo.labels.main.y }} aria-hidden>
            main
          </span>
          <span className="gl-lane-label is-head" style={{ left: geo.labels.head.x, top: geo.labels.head.y }} aria-hidden>
            HEAD
          </span>
          {items.map((it, i) => (
            <button
              key={it.key}
              type="button"
              className={`gl-node${i === cur ? ' is-on' : ''}${i < cur ? ' is-done' : ''}${
                i > 0 && items[i - 1].branch !== it.branch ? ' is-merge' : ''
              }${it.head ? ' is-head' : ''}`}
              style={{ left: geo.nodes[i].x, top: geo.nodes[i].y }}
              aria-label={it.label}
              aria-current={i === cur ? 'step' : undefined}
              data-label={it.label}
              onClick={() => onPick(i)}
            />
          ))}
          <span ref={cycleRef} className="gl-cycle" aria-hidden />
        </>
      )}
    </div>
  )
})
