import {
  CanvasTexture,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three'
import type { Live } from '@/components/discs/signalFrames'

/**
 * Canvas and data textures for Disc3D. Every drawing here uses the same 200×200
 * SVG units as GridDisc: centre (100, 100), body r96, ring r84, dotted rings
 * r68/63/56/51, ticks r70.5–74.2, core r44/46. The disc mesh has radius 1 = r96.
 */

export type Tone = 'plain' | 'neon'

export type Palette = {
  core: string
  shade: string
  rim: string
  well: string
  art: string
}

export const NEON = '#ff7a18'
export const SIGNAL_WELL = '#0d0d0d'
export const BODY_R = 96
export const LABEL_R = 46
export const SIGNAL_R = 44
export const HOLE_R = 2.3

export function palette(tone: Tone, dark: boolean): Palette {
  const base = dark
    ? { core: '#050505', shade: '#101010', rim: '#3d3d3d', well: '#020202' }
    : { core: '#f4f4f4', shade: '#d8d8d8', rim: '#9c9c9c', well: '#f7f7f7' }
  return { ...base, art: tone === 'neon' ? NEON : dark ? '#ffffff' : '#2c2c2c' }
}

const TICKS = Array.from({ length: 42 }, (_, i) => {
  const deg = 38 + (i * 104) / 41
  return { a: (deg * Math.PI) / 180, inner: i % 5 === 0 ? 70.5 : 72 }
})

const SPARKS = [
  [100, 104, 0.9],
  [91, 96, 0.45],
  [112, 98, 0.4],
  [106, 116, 0.3],
  [88, 112, 0.28],
  [116, 110, 0.22],
  [97, 88, 0.25],
] as const

const DOTTED = [
  { r: 68, w: 2.4, dash: [0.55, 2.15], o: 0.9 },
  { r: 63, w: 1.1, dash: [0.35, 2.8], o: 0.55 },
  { r: 56, w: 1.6, dash: [0.4, 2.5], o: 0.75 },
  { r: 51, w: 0.8, dash: [0.3, 3.4], o: 0.4 },
]

function canvas(size: number) {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable')
  return { c, ctx }
}

function colorTexture(c: HTMLCanvasElement, anisotropy: number) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = anisotropy
  t.minFilter = LinearMipmapLinearFilter
  t.magFilter = LinearFilter
  return t
}

/** The SVG face art (ring, dotted rings, ticks), drawn in SVG units into a ctx already scaled to them. */
function drawArt(ctx: CanvasRenderingContext2D, tone: Tone, color: string) {
  const neon = tone === 'neon'
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  // Outer ring: dasharray "488 40" rotated -90°, so the gap sits just left of 12 o'clock.
  ctx.lineWidth = neon ? 5.6 : 4.2
  ctx.beginPath()
  ctx.arc(100, 100, 84, -Math.PI / 2, -Math.PI / 2 + 488 / 84)
  ctx.stroke()
  ctx.shadowBlur = 0
  for (const ring of DOTTED) {
    ctx.globalAlpha = ring.o
    ctx.lineWidth = ring.w
    ctx.setLineDash(ring.dash)
    ctx.beginPath()
    ctx.arc(100, 100, ring.r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.setLineDash([])
  ctx.globalAlpha = 0.7
  ctx.lineWidth = 0.35
  ctx.lineCap = 'butt'
  for (const t of TICKS) {
    ctx.beginPath()
    ctx.moveTo(100 + Math.cos(t.a) * t.inner, 100 + Math.sin(t.a) * t.inner)
    ctx.lineTo(100 + Math.cos(t.a) * 74.2, 100 + Math.sin(t.a) * 74.2)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/** Map the whole disc (SVG 4..196) onto the canvas. */
function faceSpace(ctx: CanvasRenderingContext2D, size: number) {
  const s = size / (BODY_R * 2)
  ctx.setTransform(s, 0, 0, s, -(100 - BODY_R) * s, -(100 - BODY_R) * s)
}

function body(ctx: CanvasRenderingContext2D, p: Palette) {
  const g = ctx.createRadialGradient(100, 100, 0, 100, 100, BODY_R)
  g.addColorStop(0, p.core)
  g.addColorStop(0.62, p.shade)
  g.addColorStop(1, p.rim)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 200, 200)
}

/** Colour and emissive maps for the grooved face, plus a plain map for the back. */
export function faceTextures(tone: Tone, dark: boolean, size: number, anisotropy: number) {
  const p = palette(tone, dark)
  const neon = tone === 'neon'

  const color = canvas(size)
  faceSpace(color.ctx, size)
  body(color.ctx, p)
  drawArt(color.ctx, tone, p.art)

  const back = canvas(256)
  faceSpace(back.ctx, 256)
  body(back.ctx, p)

  const glow = canvas(size)
  faceSpace(glow.ctx, size)
  glow.ctx.fillStyle = '#000'
  glow.ctx.fillRect(0, 0, 200, 200)
  if (neon) {
    // The SVG's drop-shadow glow, baked into the emissive map.
    glow.ctx.save()
    glow.ctx.filter = 'blur(3px)'
    glow.ctx.globalAlpha = 0.8
    drawArt(glow.ctx, tone, NEON)
    glow.ctx.restore()
  }
  drawArt(glow.ctx, tone, p.art)

  return {
    map: colorTexture(color.c, anisotropy),
    emissive: colorTexture(glow.c, anisotropy),
    back: colorTexture(back.c, 1),
  }
}

/**
 * Additive halo for the neon disc, standing in for the SVG drop-shadow glow.
 * Covers SVG r0..HALO_R so it can spill past the rim.
 */
export const HALO_R = 128
export function haloTexture(size: number) {
  const { c, ctx } = canvas(size)
  const s = size / (HALO_R * 2)
  const px = (v: number) => (v - 100 + HALO_R) * s
  ctx.filter = `blur(${Math.round(size / 40)}px)`
  ctx.strokeStyle = NEON
  ctx.lineCap = 'round'
  ctx.lineWidth = 9 * s
  ctx.globalAlpha = 0.85
  ctx.beginPath()
  ctx.arc(px(100), px(100), 84 * s, -Math.PI / 2, -Math.PI / 2 + 488 / 84)
  ctx.stroke()
  ctx.filter = `blur(${Math.round(size / 14)}px)`
  ctx.lineWidth = 26 * s
  ctx.globalAlpha = 0.45
  ctx.stroke()
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/** Centre label canvas: the core well, sparks, or the live signal dots. Covers SVG r46. */
export function createLabel(size: number, anisotropy: number) {
  const color = canvas(size)
  const glow = canvas(size)
  const map = colorTexture(color.c, anisotropy)
  const emissive = colorTexture(glow.c, anisotropy)

  const draw = (tone: Tone, dark: boolean, signal: boolean, dots: Live[]) => {
    const p = palette(tone, dark)
    const s = size / (LABEL_R * 2)
    for (const { ctx } of [color, glow]) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, size, size)
      ctx.setTransform(s, 0, 0, s, -(100 - LABEL_R) * s, -(100 - LABEL_R) * s)
    }
    const c = color.ctx
    const g = glow.ctx
    g.fillStyle = '#000'
    g.fillRect(0, 0, 200, 200)
    // Body colour under the well, so the r44..46 band matches the face.
    c.fillStyle = p.core
    c.fillRect(0, 0, 200, 200)
    if (signal) {
      c.fillStyle = SIGNAL_WELL
      c.beginPath()
      c.arc(100, 100, SIGNAL_R, 0, Math.PI * 2)
      c.fill()
    } else {
      c.fillStyle = p.well
      c.beginPath()
      c.arc(100, 100, LABEL_R, 0, Math.PI * 2)
      c.fill()
      c.strokeStyle = p.rim
      c.globalAlpha = 0.85
      c.lineWidth = 1.1
      c.beginPath()
      c.arc(100, 100, LABEL_R - 0.6, 0, Math.PI * 2)
      c.stroke()
      c.globalAlpha = 1
    }
    const list = signal
      ? dots
      : SPARKS.map(([x, y, r]) => ({ x, y, r, opacity: 0.55 }))
    // The signal sits on a near-black well in both themes, so plain dots stay light there.
    const dotColor = tone === 'neon' ? NEON : signal ? '#ffffff' : p.art
    for (const ctx of [c, g]) {
      ctx.fillStyle = dotColor
      for (const d of list) {
        ctx.globalAlpha = d.opacity
        ctx.beginPath()
        ctx.arc(d.x, d.y, Math.max(d.r, 0.18), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    map.needsUpdate = true
    emissive.needsUpdate = true
  }

  return { map, emissive, draw }
}

function dataTexture(data: Uint8Array, size: number, anisotropy: number): Texture {
  const t = new DataTexture(data, size, size, RGBAFormat)
  t.colorSpace = NoColorSpace
  t.wrapS = RepeatWrapping
  t.wrapT = RepeatWrapping
  t.minFilter = LinearMipmapLinearFilter
  t.magFilter = LinearFilter
  t.generateMipmaps = true
  t.anisotropy = anisotropy
  t.needsUpdate = true
  return t
}

/** Smooth bands between the SVG rings, like track gaps. */
const GAPS = [
  [58.6, 60.4],
  [65.2, 66.2],
  [76.2, 79.2],
  [88.4, 89.6],
]
const GROOVE_IN = 47.5
const GROOVE_OUT = 93.6

/**
 * Groove detail shared by every disc: a normal map of concentric ridges, a
 * roughness map (G channel) with a slight angular wobble so the sheen travels
 * as the disc turns, and an anisotropy map (radial direction, strength in B).
 */
export function grooveTextures(size: number, anisotropy: number) {
  const normal = new Uint8Array(size * size * 4)
  const rough = new Uint8Array(size * size * 4)
  const aniso = new Uint8Array(size * size * 4)
  const period = 0.78
  for (let j = 0; j < size; j++) {
    // DataTexture rows run bottom-up (flipY off), so row j is v = j/size.
    const y = ((j + 0.5) / size) * 2 - 1
    for (let i = 0; i < size; i++) {
      const x = ((i + 0.5) / size) * 2 - 1
      const k = (j * size + i) * 4
      const rr = Math.hypot(x, y)
      const r = rr * BODY_R
      const cx = rr > 0 ? x / rr : 1
      const cy = rr > 0 ? y / rr : 0
      const phi = Math.atan2(y, x)
      const grooved = r >= GROOVE_IN && r <= GROOVE_OUT && !GAPS.some(([a, b]) => r >= a && r <= b)
      // Ridges: slope of h(r) = cos(2πr/p), with a little per-track variation in depth.
      let slope = 0
      if (grooved) {
        const depth = 0.75 + 0.25 * Math.sin(r * 0.9)
        slope = -Math.sin((2 * Math.PI * r) / period) * depth
      }
      const nx = -slope * cx * 0.9
      const ny = -slope * cy * 0.9
      const nl = Math.hypot(nx, ny, 1)
      normal[k] = ((nx / nl) * 0.5 + 0.5) * 255
      normal[k + 1] = ((ny / nl) * 0.5 + 0.5) * 255
      normal[k + 2] = ((1 / nl) * 0.5 + 0.5) * 255
      normal[k + 3] = 255

      const wobble = 0.5 + 0.5 * Math.sin(phi * 3 + r * 0.07)
      let g = 0.2
      if (grooved) g = 0.3 + 0.12 * wobble
      else if (r > GROOVE_OUT) g = 0.24
      else if (r > LABEL_R) g = 0.16
      rough[k] = 255
      rough[k + 1] = g * 255
      rough[k + 2] = 0
      rough[k + 3] = 255

      // Radial direction stretches the highlight into the vinyl "bow tie".
      const strength = grooved ? 0.55 + 0.4 * Math.pow(Math.sin(phi * 2 + 0.6), 2) : r > LABEL_R ? 0.15 : 0
      aniso[k] = (cx * 0.5 + 0.5) * 255
      aniso[k + 1] = (cy * 0.5 + 0.5) * 255
      aniso[k + 2] = strength * 255
      aniso[k + 3] = 255
    }
  }
  return {
    normal: dataTexture(normal, size, anisotropy),
    roughness: dataTexture(rough, size, anisotropy),
    anisotropy: dataTexture(aniso, size, anisotropy),
  }
}
