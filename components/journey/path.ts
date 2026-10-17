/**
 * The fixed camera path for /journey. Scroll progress p (0..1) maps to a
 * camera position and look target through C1 Hermite splines over keyframes
 * placed at p values, so the ride never stops between acts.
 *
 * World: y up, the grid floor is y = 0, the camera travels toward -z.
 */

export type Vec3 = [number, number, number]

export const ACTS = [
  { id: 'grid', label: '01 // The Grid', start: 0, end: 0.26 },
  { id: 'city', label: '02 // Neon City', start: 0.26, end: 0.76 },
  { id: 'portal', label: '03 // Portal Home', start: 0.76, end: 1 },
] as const

export type ActId = (typeof ACTS)[number]['id']

export function actAt(p: number) {
  return ACTS.find((act) => p < act.end) ?? ACTS[ACTS.length - 1]
}

/** Moments the scene keys off. */
export const BEATS = {
  /** Camera crosses the monitor glass. */
  screen: 0.207,
  /** Grid takes over from the room. */
  gridOn: [0.2, 0.29] as const,
  /** Road ride. */
  ride: [0.3, 0.74] as const,
  /** Portal opens. */
  portalOpen: [0.7, 0.81] as const,
  /** Camera passes through the hollow. */
  portalPass: 0.855,
  /** Floor lines gather into the desk wireframe. */
  gather: [0.855, 0.945] as const,
  /** Wireframe resolves into the solid desk. */
  solid: [0.93, 0.995] as const,
  /** Work CTA. */
  cta: 0.965,
}

/** Where the desk set sits at the end of the loop: same framing, further down -z. */
export const END_Z = -262
export const PORTAL_Z = -240
export const PORTAL_Y = 4.2
export const PORTAL_R = 6
export const ROAD_START = -6
export const ROAD_END = -236
export const CITY_START = -16
export const CITY_END = -222

/** Road centre line: straight at both ends, a slow S through the city. */
export function roadX(z: number) {
  const t = (z - CITY_START) / (CITY_END - CITY_START) // 0..1 through the city
  if (t <= 0 || t >= 1) return 0
  const amp = smoothstep(0, 0.15, t) * (1 - smoothstep(0.8, 1, t))
  return amp * (6 * Math.sin(t * Math.PI * 2.4) + 2.2 * Math.sin(t * Math.PI * 5.1))
}

export function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** 0..1 progress of x through [a, b], clamped. */
export function range(x: number, [a, b]: readonly [number, number]) {
  return Math.min(1, Math.max(0, (x - a) / (b - a)))
}

type Key = { p: number; pos: Vec3; look: Vec3 }

export const START_POS: Vec3 = [0, 1.45, 3.4]
export const START_LOOK: Vec3 = [0, 1.2, -6]

function buildKeys(): Key[] {
  const keys: Key[] = [
    { p: 0, pos: START_POS, look: START_LOOK },
    { p: 0.07, pos: [0, 1.36, 2.4], look: [0, 1.16, -6] },
    { p: 0.15, pos: [0, 1.12, 0.85], look: [0, 1.07, -6] },
    { p: 0.205, pos: [0, 1.065, 0.06], look: [0, 1.065, -6] },
    { p: 0.235, pos: [0, 1.04, -1.8], look: [0, 0.98, -10] },
  ]
  // Road ride: sample the road so the camera follows its bends.
  const [r0, r1] = BEATS.ride
  const z0 = -13
  const z1 = -204
  const n = 22
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const p = r0 + (r1 - r0) * t
    const z = z0 + (z1 - z0) * t
    const ahead = z - 11
    keys.push({
      p,
      pos: [roadX(z), 1.0 + 0.12 * Math.sin(t * Math.PI * 3), z],
      look: [roadX(ahead), 0.8 + 0.1 * Math.sin(t * Math.PI * 3 + 1), ahead],
    })
  }
  keys.push(
    { p: 0.8, pos: [0, 2.7, -226], look: [0, 4.1, PORTAL_Z] },
    { p: BEATS.portalPass, pos: [0, PORTAL_Y, PORTAL_Z], look: [0, 3.6, PORTAL_Z - 12] },
    { p: 0.9, pos: [0, 2.7, -249.5], look: [0, 1.5, END_Z - 6] },
    { p: 0.95, pos: [0, 1.62, -256.6], look: [0, 1.22, END_Z - 6] },
    { p: 1, pos: [START_POS[0], START_POS[1], START_POS[2] + END_Z], look: [START_LOOK[0], START_LOOK[1], START_LOOK[2] + END_Z] },
  )
  return keys
}

const KEYS = buildKeys()

/** Catmull-Rom style tangents for non-uniform key times. */
function tangent(i: number, field: 'pos' | 'look', axis: number) {
  const prev = KEYS[Math.max(0, i - 1)]
  const next = KEYS[Math.min(KEYS.length - 1, i + 1)]
  if (prev === next) return 0
  return (next[field][axis] - prev[field][axis]) / (next.p - prev.p)
}

function sample(field: 'pos' | 'look', p: number, out: Vec3): Vec3 {
  const x = Math.min(1, Math.max(0, p))
  let i = 0
  while (i < KEYS.length - 2 && KEYS[i + 1].p < x) i++
  const a = KEYS[i]
  const b = KEYS[i + 1]
  const h = b.p - a.p
  const t = (x - a.p) / h
  const t2 = t * t
  const t3 = t2 * t
  const h00 = 2 * t3 - 3 * t2 + 1
  const h10 = t3 - 2 * t2 + t
  const h01 = -2 * t3 + 3 * t2
  const h11 = t3 - t2
  for (let k = 0; k < 3; k++) {
    // Ends of the path hold still (zero tangent) so p = 0 and p = 1 frame exactly.
    const ma = i === 0 ? 0 : tangent(i, field, k)
    const mb = i + 1 === KEYS.length - 1 ? 0 : tangent(i + 1, field, k)
    out[k] = h00 * a[field][k] + h10 * h * ma + h01 * b[field][k] + h11 * h * mb
  }
  return out
}

export function cameraAt(p: number, pos: Vec3, look: Vec3) {
  sample('pos', p, pos)
  sample('look', p, look)
}
