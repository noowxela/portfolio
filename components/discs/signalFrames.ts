/** Signal shapes for the hollow disc core, shared by the SVG and 3D discs. */

export type Dot = { x: number; y: number; r: number }
export type Live = Dot & { opacity: number }

function smooth(t: number) {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

export function mix(from: Dot[], to: Dot[], t: number): Live[] {
  const n = Math.max(from.length, to.length)
  const out: Live[] = []
  for (let i = 0; i < n; i++) {
    const start = (i / Math.max(n - 1, 1)) * 0.42
    const e = smooth((t - start) / 0.58)
    const a = from[i]
    const b = to[i]
    if (a && b) {
      out.push({
        x: a.x + (b.x - a.x) * e,
        y: a.y + (b.y - a.y) * e,
        r: a.r + (b.r - a.r) * e,
        opacity: 1,
      })
    } else if (b) {
      out.push({
        x: 100 + (b.x - 100) * e,
        y: 100 + (b.y - 100) * e,
        r: b.r * e,
        opacity: e,
      })
    } else if (a) {
      out.push({
        x: a.x + (100 - a.x) * e,
        y: a.y + (100 - a.y) * e,
        r: a.r * (1 - e),
        opacity: 1 - e,
      })
    }
  }
  return out.filter((dot) => dot.opacity > 0.04 && dot.r > 0.04)
}

function polar(deg: number, radius: number, r = 0.55): Dot {
  const a = (deg * Math.PI) / 180
  return { x: 100 + Math.cos(a) * radius, y: 100 + Math.sin(a) * radius, r }
}

export function signal(frame: number): Dot[] {
  const kind = frame % 6
  if (kind === 0) {
    return Array.from({ length: 9 }, (_, i) => polar(-36 + i * 9, 22, i % 3 === 0 ? 1.05 : 0.4))
  }
  if (kind === 1) {
    const dots: Dot[] = [{ x: 100, y: 100, r: 1.15 }]
    for (let i = 1; i <= 3; i++) {
      dots.push({ x: 100 + i * 7, y: 100, r: 0.4 })
      dots.push({ x: 100 - i * 7, y: 100, r: 0.4 })
      dots.push({ x: 100, y: 100 + i * 7, r: 0.4 })
      dots.push({ x: 100, y: 100 - i * 7, r: 0.4 })
    }
    return dots
  }
  if (kind === 2) {
    return [polar(18, 6, 1.2), polar(150, 16, 0.45), polar(250, 10, 0.7), polar(320, 22, 0.35)]
  }
  if (kind === 3) {
    return Array.from({ length: 14 }, (_, i) => polar(i * (360 / 14) + 8, i % 2 === 0 ? 26 : 16, i % 2 === 0 ? 0.5 : 0.28))
  }
  if (kind === 4) {
    const dots: Dot[] = []
    const cols = [
      { x: -14, n: 4 },
      { x: 0, n: 9 },
      { x: 12, n: 6 },
    ]
    for (const col of cols) {
      for (let i = 0; i < col.n; i++) {
        dots.push({ x: 100 + col.x, y: 100 - ((col.n - 1) * 3.2) / 2 + i * 3.2, r: 0.42 })
      }
    }
    return dots
  }
  return Array.from({ length: 11 }, (_, i) => ({
    x: 82 + i * 3.4,
    y: 118 - i * 3.1,
    r: i % 4 === 0 ? 0.95 : 0.32,
  }))
}
