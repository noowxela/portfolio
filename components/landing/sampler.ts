import type { Pose } from './poses'

export type PoseSample = {
  /** Unit-height positions (x scaled by aspect), N * 3. z is the relief, >= 0. */
  positions: Float32Array
  /** Linear-ish photo colour 0..1, N * 3. */
  colors: Float32Array
  /** Crop aspect (width / height). */
  aspect: number
}

const SAMPLE_H = 300

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function boxBlur(src: Float32Array, w: number, h: number, r: number) {
  const tmp = new Float32Array(src.length)
  const out = new Float32Array(src.length)
  const n = 2 * r + 1
  for (let y = 0; y < h; y++) {
    let acc = 0
    for (let x = -r; x <= r; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))]
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = acc / n
      acc += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)]
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / n
      acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]
    }
  }
  return out
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`portrait: failed to load ${src}`))
    img.src = src
  })
}

/**
 * Wall colour from the crop border, or null when the border is already
 * transparent (the shipped photos carry a cut-out alpha). Photos without
 * alpha are masked by their contrast against this colour instead.
 */
function wallColor(data: Uint8ClampedArray, w: number, h: number) {
  const rs: number[] = []
  const gs: number[] = []
  const bs: number[] = []
  let total = 0
  const take = (x: number, y: number) => {
    total++
    const i = (y * w + x) * 4
    if (data[i + 3] < 128) return
    rs.push(data[i])
    gs.push(data[i + 1])
    bs.push(data[i + 2])
  }
  for (let x = 0; x < w; x += 2) {
    take(x, 0)
    take(x, 1)
  }
  for (let y = 0; y < h * 0.6; y += 2) {
    take(0, y)
    take(1, y)
    take(w - 1, y)
    take(w - 2, y)
  }
  if (rs.length < total * 0.3) return null
  const mid = (a: number[]) => a.sort((p, q) => p - q)[a.length >> 1]
  return [mid(rs), mid(gs), mid(bs)] as const
}

/**
 * Sample `count` particles from a photo crop. Placement is weighted by alpha
 * and brightness; depth comes from luminance plus a per-row "body" bulge so
 * the portrait has volume when it turns. Seeded, so a pose always samples
 * the same way.
 */
export function samplePose(img: HTMLImageElement, pose: Pose, count: number, seed = 7): PoseSample {
  const [cx, cy, cw, ch] = pose.crop
  const sx = cx * img.naturalWidth
  const sy = cy * img.naturalHeight
  const sw = cw * img.naturalWidth
  const sh = ch * img.naturalHeight
  const aspect = sw / sh
  const H = SAMPLE_H
  const W = Math.max(8, Math.round(H * aspect))
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('portrait: no 2D context')
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)
  const { data } = ctx.getImageData(0, 0, W, H)

  const wall = wallColor(data, W, H)
  const N = W * H
  const lum = new Float32Array(N)
  const alpha = new Float32Array(N)
  for (let i = 0, p = 0; p < N; p++, i += 4) {
    const r = data[i] / 255
    const g = data[i + 1] / 255
    const b = data[i + 2] / 255
    let a = data[i + 3] / 255
    if (wall) {
      const d = Math.hypot(r - wall[0] / 255, g - wall[1] / 255, b - wall[2] / 255)
      a *= smooth(0.07, 0.18, d)
    }
    lum[p] = 0.299 * r + 0.587 * g + 0.114 * b
    alpha[p] = a
  }

  // Local contrast: normalise each pixel against the figure around it (blur
  // weighted by alpha, so the cut-out edge does not glow), then blend with a
  // global stretch. Glasses, eyes and mouth survive as gaps in the particles.
  const la = new Float32Array(N)
  const l2a = new Float32Array(N)
  for (let p = 0; p < N; p++) {
    la[p] = lum[p] * alpha[p]
    l2a[p] = lum[p] * lum[p] * alpha[p]
  }
  const R = Math.round(H / 30)
  const bA = boxBlur(alpha, W, H, R)
  const bL = boxBlur(la, W, H, R)
  const bL2 = boxBlur(l2a, W, H, R)
  const figure: number[] = []
  for (let p = 0; p < N; p++) if (alpha[p] > 0.9) figure.push(lum[p])
  figure.sort((x, y) => x - y)
  const lo = figure.length ? figure[Math.floor(figure.length * 0.03)] : 0
  const hi = figure.length ? figure[Math.floor(figure.length * 0.97)] : 1
  const tone = new Float32Array(N)
  for (let p = 0; p < N; p++) {
    const wA = Math.max(1e-3, bA[p])
    const mean = bL[p] / wA
    const sd = Math.sqrt(Math.max(0, bL2[p] / wA - mean * mean))
    const local = 0.5 + (lum[p] - mean) / (3 * Math.max(0.035, sd))
    const global = (lum[p] - lo) / Math.max(0.05, hi - lo)
    tone[p] = Math.min(1, Math.max(0, 0.55 * local + 0.45 * global))
  }
  const weight = new Float32Array(N)
  for (let p = 0; p < N; p++) {
    const t = tone[p]
    const y = Math.floor(p / W) / H
    // Thin the bottom edge so the crop does not end on a hard line.
    const taper = 1 - smooth(0.84, 1, y) * 0.85
    weight[p] = smooth(0.55, 0.95, alpha[p]) * taper * (0.08 + 0.92 * Math.pow(t, 1.25))
  }

  // Per-row horizontal extent of the figure, for the body bulge.
  const rowL = new Float32Array(H)
  const rowR = new Float32Array(H)
  for (let y = 0; y < H; y++) {
    let l = -1
    let r = -1
    for (let x = 0; x < W; x++) {
      if (alpha[y * W + x] > 0.5) {
        if (l < 0) l = x
        r = x
      }
    }
    rowL[y] = l
    rowR[y] = r
  }

  const cdf = new Float32Array(W * H)
  let acc = 0
  for (let p = 0; p < W * H; p++) {
    acc += weight[p]
    cdf[p] = acc
  }

  const rand = mulberry32(seed)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  for (let n = 0; n < count; n++) {
    let p = 0
    if (acc > 0) {
      // Stratified along the scanline CDF: even coverage, no clumps.
      const target = ((n + rand()) / count) * acc
      let lo = 0
      let hi = cdf.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (cdf[mid] < target) lo = mid + 1
        else hi = mid
      }
      p = lo
    }
    const x = p % W
    const y = (p / W) | 0
    const fx = x + rand()
    const fy = y + rand()
    const l = tone[p]
    let bulge = 0.4
    if (rowR[y] > rowL[y]) {
      const mid = (rowL[y] + rowR[y]) / 2
      const half = (rowR[y] - rowL[y]) / 2 + 1
      const u = Math.min(1, Math.abs(fx - mid) / half)
      bulge = Math.sqrt(1 - u * u)
    }
    positions[n * 3] = (fx / W - 0.5) * aspect
    positions[n * 3 + 1] = 0.5 - fy / H
    // Relief (0..depth): how far this particle stands out from its sheet.
    positions[n * 3 + 2] = pose.depth * (0.62 * bulge + 0.38 * l) + rand() * 0.012
    // Photo hue at the stretched brightness: the shader reads luminance from it.
    const i = p * 4
    const k = l / Math.max(0.02, lum[p])
    colors[n * 3] = Math.min(1, (data[i] / 255) * k)
    colors[n * 3 + 1] = Math.min(1, (data[i + 1] / 255) * k)
    colors[n * 3 + 2] = Math.min(1, (data[i + 2] / 255) * k)
  }
  return { positions, colors, aspect }
}
