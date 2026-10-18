/**
 * Row controller for /journey. The row is a flex strip of panels; `x` is its
 * horizontal offset. Wheel and drag move it freely and settle on the nearest
 * panel; keys, node clicks and `go()` jump. Plain rAF tweens, no gsap.
 */

export type TrackOptions = {
  /** Element that receives wheel / pointer input (the stage). */
  surface: HTMLElement
  row: HTMLElement
  panels: () => HTMLElement[]
  reduced: () => boolean
  /** Nearest panel changed (live while dragging). */
  onIndex: (i: number) => void
  /** Fractional position (0 .. n-1) and input speed in px per event / frame. */
  onMove: (f: number, speed: number) => void
  /** The row came to rest on panel i. */
  onSettle: (i: number) => void
}

export type Track = {
  go: (i: number, opts?: { animate?: boolean }) => void
  step: (dir: 1 | -1) => void
  index: () => number
  /** True once if the last pointer press turned into a drag (eat the click). */
  consumeDrag: () => boolean
  refresh: () => void
  dispose: () => void
}

const SETTLE_DELAY = 140
const SNAP_MS = 450
const KEY_REPEAT_MS = 220
const DRAG_START = 6
const THROW = 260

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export function createTrack(o: TrackOptions): Track {
  const { surface, row } = o
  let width = 0
  let centers: number[] = []
  let x = 0
  let cur = 0
  let locked: number | null = null
  let tweenRaf = 0
  let settleTimer = 0
  let lastKey = 0
  let dragged = false

  const count = () => centers.length
  const offsetFor = (i: number) => Math.round(width / 2 - (centers[i] ?? 0))
  const min = () => offsetFor(count() - 1)
  const max = () => offsetFor(0)
  const clamp = (v: number) => Math.min(max(), Math.max(min(), v))

  /** Fractional panel index for an offset. */
  const fractionAt = (v: number) => {
    const n = count()
    if (n < 2) return 0
    for (let i = 0; i < n - 1; i++) {
      const a = offsetFor(i)
      const b = offsetFor(i + 1)
      if (v <= a && v >= b) return i + (a - v) / Math.max(1, a - b)
    }
    return v > max() ? 0 : n - 1
  }

  const nearest = (v: number) => Math.round(fractionAt(v))

  const setIndex = (i: number) => {
    if (i === cur) return
    cur = i
    o.onIndex(i)
  }

  const apply = (v: number, speed = 0) => {
    x = v
    row.style.transform = `translate3d(${v}px, 0, 0)`
    const f = fractionAt(v)
    o.onMove(f, speed)
    if (locked === null) setIndex(Math.round(f))
  }

  const stopTween = () => {
    cancelAnimationFrame(tweenRaf)
    tweenRaf = 0
  }

  const tweenTo = (to: number, ms: number, done?: () => void) => {
    stopTween()
    const from = x
    if (o.reduced() || Math.abs(to - from) < 1) {
      apply(to)
      done?.()
      return
    }
    const t0 = performance.now()
    let last = from
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / ms)
      const v = from + (to - from) * easeOutCubic(t)
      apply(v, Math.abs(v - last))
      last = v
      if (t < 1) tweenRaf = requestAnimationFrame(frame)
      else {
        tweenRaf = 0
        done?.()
      }
    }
    tweenRaf = requestAnimationFrame(frame)
  }

  const go = (i: number, { animate = true }: { animate?: boolean } = {}) => {
    const n = count()
    if (!n) return
    const target = Math.min(n - 1, Math.max(0, i))
    window.clearTimeout(settleTimer)
    locked = target
    setIndex(target)
    const to = offsetFor(target)
    const distance = Math.abs(to - x)
    const ms = Math.min(800, SNAP_MS + distance * 0.12)
    const finish = () => {
      locked = null
      o.onSettle(target)
    }
    if (!animate) {
      stopTween()
      apply(to)
      finish()
    } else tweenTo(to, ms, finish)
  }

  const settle = () => go(nearest(x))

  // ---- wheel: either axis moves the row, settle shortly after the last event.
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) return
    e.preventDefault()
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? width : 1
    const d = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * unit
    stopTween()
    locked = null
    apply(clamp(x - d), Math.abs(d))
    window.clearTimeout(settleTimer)
    settleTimer = window.setTimeout(settle, SETTLE_DELAY)
  }

  // ---- pointer drag (mouse and touch), horizontal; vertical pans stay native.
  let press: { id: number; x0: number; y0: number; last: number; t: number; v: number; moving: boolean } | null = null

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest('a, button')) return
    stopTween()
    window.clearTimeout(settleTimer)
    locked = null
    dragged = false
    press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, last: e.clientX, t: performance.now(), v: 0, moving: false }
  }

  const onMovePointer = (e: PointerEvent) => {
    if (!press || e.pointerId !== press.id) return
    if (!press.moving) {
      const dx = Math.abs(e.clientX - press.x0)
      const dy = Math.abs(e.clientY - press.y0)
      if (dx < DRAG_START && dy < DRAG_START) return
      if (dy > dx) {
        press = null
        return
      }
      press.moving = true
      dragged = true
      surface.dataset.dragging = 'true'
      try {
        surface.setPointerCapture(e.pointerId)
      } catch {
        /* pointer already gone */
      }
    }
    const now = performance.now()
    const d = e.clientX - press.last
    const dt = Math.max(1, now - press.t)
    press.v = 0.8 * (d / dt) + 0.2 * press.v
    press.last = e.clientX
    press.t = now
    apply(clamp(x + d), Math.abs(d))
  }

  const onUp = (e: PointerEvent) => {
    if (!press || e.pointerId !== press.id) return
    const p = press
    press = null
    delete surface.dataset.dragging
    if (!p.moving) return
    // A stale velocity (finger held still) should not throw.
    const v = performance.now() - p.t > 90 ? 0 : p.v
    const projected = clamp(x + v * THROW)
    go(nearest(projected))
  }

  // ---- keys
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
    const t = e.target as HTMLElement | null
    if (t?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], .site-nav')) return
    let dir: 1 | -1 | 0 = 0
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') dir = 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') dir = -1
    else if (e.key === 'Home') {
      e.preventDefault()
      go(0)
      return
    } else if (e.key === 'End') {
      e.preventDefault()
      go(count() - 1)
      return
    }
    if (!dir) return
    e.preventDefault()
    const now = performance.now()
    if (e.repeat && now - lastKey < KEY_REPEAT_MS) return
    lastKey = now
    step(dir)
  }

  const step = (dir: 1 | -1) => {
    const base = locked ?? cur
    const next = base + dir
    if (next < 0 || next >= count()) return
    go(next)
  }

  const measure = () => {
    width = surface.clientWidth
    centers = o.panels().map((p) => p.offsetLeft + p.offsetWidth / 2)
  }

  const refresh = () => {
    measure()
    stopTween()
    apply(offsetFor(locked ?? cur))
  }

  const ro = new ResizeObserver(() => refresh())
  ro.observe(surface)

  surface.addEventListener('wheel', onWheel, { passive: false })
  surface.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMovePointer)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
  window.addEventListener('keydown', onKey)
  measure()

  return {
    go,
    step,
    index: () => cur,
    consumeDrag: () => {
      const d = dragged
      dragged = false
      return d
    },
    refresh,
    dispose: () => {
      stopTween()
      window.clearTimeout(settleTimer)
      ro.disconnect()
      surface.removeEventListener('wheel', onWheel)
      surface.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMovePointer)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('keydown', onKey)
    },
  }
}
