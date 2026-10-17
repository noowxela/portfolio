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

/**
 * Canvas and data textures for Disc3D, in the same 200×200 SVG units as GridDisc:
 * centre (100, 100), body r96, hollow core r44. The disc mesh has radius 1 = r96.
 */

export type Tone = 'plain' | 'neon'

export type Palette = {
  core: string
  shade: string
  rim: string
  well: string
  art: string
}

export const BODY_R = 96
export const HOLLOW_R = 44

export function palette(tone: Tone, dark: boolean): Palette {
  const base = dark
    ? { core: '#050505', shade: '#101010', rim: '#3d3d3d', well: '#020202' }
    : { core: '#f4f4f4', shade: '#d8d8d8', rim: '#9c9c9c', well: '#f7f7f7' }
  return { ...base, art: tone === 'neon' ? '#ff7a18' : dark ? '#ffffff' : '#2c2c2c' }
}

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

/** Body gradient for the face and back. The line art is real geometry in Disc3D now. */
export function bodyTexture(tone: Tone, dark: boolean, size: number, anisotropy: number) {
  const { c, ctx } = canvas(size)
  faceSpace(ctx, size)
  body(ctx, palette(tone, dark))
  return colorTexture(c, anisotropy)
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
      else g = 0.16
      rough[k] = 255
      rough[k + 1] = g * 255
      rough[k + 2] = 0
      rough[k + 3] = 255

      // Radial direction stretches the highlight into the vinyl "bow tie".
      const strength = grooved ? 0.55 + 0.4 * Math.pow(Math.sin(phi * 2 + 0.6), 2) : 0.15
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
