import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  Curve,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  NormalBlending,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { BODY_R, type Tone } from '@/components/discs/discTextures'

/**
 * The 02 v2 line art as lit neon strips sitting on the disc face. Everything
 * is in SVG units (centre 100,100, r96 = 1) mapped to the disc plane, with SVG
 * y flipped, so SVG angle θ becomes −θ and "clockwise" means decreasing angle.
 */

const U = 1 / BODY_R
const TAU = Math.PI * 2

/** Outer ring: dasharray "488 40" from 12 o'clock, clockwise, gap just left of the top. */
export const RING = { r: 84, start: Math.PI / 2, length: 488 / 84 }
export const DOTTED = [
  { r: 68, w: 2.4, dash: 0.55, gap: 2.15, o: 0.9, set: 'outer' },
  { r: 63, w: 1.1, dash: 0.35, gap: 2.8, o: 0.55, set: 'outer' },
  { r: 56, w: 1.6, dash: 0.4, gap: 2.5, o: 0.75, set: 'inner' },
  { r: 51, w: 0.8, dash: 0.3, gap: 3.4, o: 0.4, set: 'inner' },
] as const
/** Tick arc: SVG 38°..142° (the bottom), r70.5/72 to 74.2. */
export const TICKS = Array.from({ length: 42 }, (_, i) => ({
  a: -((38 + (i * 104) / 41) * Math.PI) / 180,
  inner: i % 5 === 0 ? 70.5 : 72,
}))

export type NeonLook = {
  tube: string
  intensity: number
  glow: string
  glowStrength: number
  additive: boolean
}

/** Cool white / orange light in dark mode; deeper, saturated strips with less glow in light mode. */
export function neonLook(tone: Tone, dark: boolean): NeonLook {
  if (tone === 'neon') {
    return dark
      ? { tube: '#ff8a24', intensity: 1.45, glow: '#ff7a18', glowStrength: 0.95, additive: true }
      : { tube: '#ff5a00', intensity: 1.05, glow: '#ff6a10', glowStrength: 0.42, additive: false }
  }
  return dark
    ? { tube: '#eef5ff', intensity: 1.6, glow: '#c4dcff', glowStrength: 0.75, additive: true }
    : { tube: '#1f6bff', intensity: 0.95, glow: '#3b82ff', glowStrength: 0.38, additive: false }
}

class Arc extends Curve<Vector3> {
  constructor(
    private r: number,
    private start: number,
    private length: number,
  ) {
    super()
  }
  getPoint(t: number, target = new Vector3()) {
    const a = this.start - t * this.length
    return target.set(Math.cos(a) * this.r, Math.sin(a) * this.r, 0)
  }
}

/** Raised, slightly flattened tube for the outer ring, with round caps. */
function ringGeometry(width: number, top: number) {
  const rad = (width / 2) * U
  const arc = new Arc(RING.r * U, RING.start, RING.length)
  const tube = new TubeGeometry(arc, 240, rad, 10, false)
  const caps = [0, 1].map((t) => {
    const cap = new SphereGeometry(rad, 10, 8)
    const p = arc.getPoint(t)
    cap.translate(p.x, p.y, 0)
    return cap
  })
  const merged = mergeGeometries([tube.toNonIndexed(), ...caps.map((c) => c.toNonIndexed())])
  tube.dispose()
  caps.forEach((c) => c.dispose())
  if (!merged) throw new Error('ring merge failed')
  merged.scale(1, 1, 0.55)
  merged.translate(0, 0, top + rad * 0.25)
  return merged
}

const m4 = new Matrix4()
const q = new Quaternion()
const z = new Vector3(0, 0, 1)
const pos = new Vector3()
const scl = new Vector3()

/** One dotted ring as instanced beads (round-capped dashes of the SVG). */
function dottedRing(ring: (typeof DOTTED)[number], geo: BufferGeometry, mat: MeshStandardMaterial, top: number) {
  const period = ring.dash + ring.gap
  const n = Math.floor((TAU * ring.r) / period)
  const mesh = new InstancedMesh(geo, mat, n)
  const half = ((ring.dash + ring.w) / 2) * 0.86 * U
  const rad = (ring.w / 2) * 0.86 * U
  // Fainter SVG rings are smaller and dimmer: fold the opacity into the bead size.
  const k = 0.7 + 0.3 * ring.o
  for (let i = 0; i < n; i++) {
    const a = -(i / n) * TAU
    pos.set(Math.cos(a) * ring.r * U, Math.sin(a) * ring.r * U, top + rad * 0.2)
    q.setFromAxisAngle(z, a + Math.PI / 2)
    scl.set(half * k, rad * k, rad * 0.55 * k)
    mesh.setMatrixAt(i, m4.compose(pos, q, scl))
  }
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
  return mesh
}

function ticks(mat: MeshStandardMaterial, top: number) {
  const geo = new BoxGeometry(1, 1, 1)
  const mesh = new InstancedMesh(geo, mat, TICKS.length)
  const w = 0.55 * U
  TICKS.forEach((t, i) => {
    const len = (74.2 - t.inner) * U
    const mid = ((74.2 + t.inner) / 2) * U
    pos.set(Math.cos(t.a) * mid, Math.sin(t.a) * mid, top + w * 0.3)
    q.setFromAxisAngle(z, t.a)
    scl.set(len, w, w * 0.6)
    mesh.setMatrixAt(i, m4.compose(pos, q, scl))
  })
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
  return { mesh, geo }
}

const GLOW_VERT = /* glsl */ `
varying vec2 vP;
void main() {
  vP = position.xy * ${BODY_R.toFixed(1)};
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// Analytic glow for every strip in one draw call: distance to the ring arc
// (with round ends), soft bands over the dotted rings, and the tick arc.
const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uStrength;
uniform float uAdditive;
uniform float uRingW;
varying vec2 vP;
const float TAU = 6.28318530718;
float arcDist(vec2 p, float R, float a0, float len) {
  float a = atan(p.y, p.x);
  float t = mod(a0 - a, TAU);
  if (t <= len) return abs(length(p) - R);
  vec2 e0 = R * vec2(cos(a0), sin(a0));
  vec2 e1 = R * vec2(cos(a0 - len), sin(a0 - len));
  return min(length(p - e0), length(p - e1));
}
float g(float d, float w) { return exp(-(d * d) / (w * w)); }
void main() {
  float r = length(vP);
  float d = arcDist(vP, ${RING.r.toFixed(1)}, ${RING.start.toFixed(6)}, ${RING.length.toFixed(6)});
  float glow = g(d, uRingW) * 0.75 + g(d, uRingW * 3.2) * 0.35;
  glow += g(r - 68.0, 2.6) * 0.32 + g(r - 63.0, 2.0) * 0.14;
  glow += g(r - 56.0, 2.2) * 0.24 + g(r - 51.0, 1.8) * 0.1;
  float dt = arcDist(vP, 72.4, ${(-(38 * Math.PI) / 180).toFixed(6)}, ${((104 * Math.PI) / 180).toFixed(6)});
  glow += g(dt, 2.2) * 0.16;
  glow *= uStrength;
  // Additive in dark mode (light on a dark disc); plain alpha tint in light mode.
  gl_FragColor = vec4(uColor, uAdditive > 0.5 ? min(glow, 1.0) : min(glow * 0.8, 0.85));
}
`

export const GLOW_R = 128

export type NeonStrips = {
  group: Group
  outer: Group
  inner: Group
  material: MeshStandardMaterial
  glow: ShaderMaterial
  setLook: (look: NeonLook) => void
  dispose: () => void
}

/** Build the neon strips for one disc. `top` is the face height. */
export function createNeon(tone: Tone, top: number): NeonStrips {
  const neon = tone === 'neon'
  const material = new MeshStandardMaterial({ roughness: 0.22, metalness: 0, toneMapped: true })
  const group = new Group()
  const outer = new Group()
  const inner = new Group()
  group.add(outer, inner)

  const ringGeo = ringGeometry(neon ? 5.6 : 4.2, top)
  group.add(new Mesh(ringGeo, material))

  const bead = new SphereGeometry(1, 10, 6)
  for (const ring of DOTTED) (ring.set === 'outer' ? outer : inner).add(dottedRing(ring, bead, material, top))
  const tick = ticks(material, top)
  group.add(tick.mesh)

  const glowGeo = new PlaneGeometry((GLOW_R / BODY_R) * 2, (GLOW_R / BODY_R) * 2)
  glowGeo.translate(0, 0, top + 0.012)
  const glow = new ShaderMaterial({
    vertexShader: GLOW_VERT,
    fragmentShader: GLOW_FRAG,
    uniforms: {
      uColor: { value: new Color() },
      uStrength: { value: 1 },
      uAdditive: { value: 1 },
      uRingW: { value: neon ? 3.6 : 3 },
    },
    transparent: true,
    depthWrite: false,
  })
  const glowMesh = new Mesh(glowGeo, glow)
  glowMesh.renderOrder = 2
  group.add(glowMesh)

  const setLook = (look: NeonLook) => {
    const c = new Color(look.tube)
    material.color.copy(c).multiplyScalar(0.25)
    material.emissive.copy(c)
    material.emissiveIntensity = look.intensity
    glow.uniforms.uColor.value.set(look.glow)
    glow.uniforms.uStrength.value = look.glowStrength
    glow.uniforms.uAdditive.value = look.additive ? 1 : 0
    glow.blending = look.additive ? AdditiveBlending : NormalBlending
    glow.needsUpdate = true
  }

  return {
    group,
    outer,
    inner,
    material,
    glow,
    setLook,
    dispose: () => {
      ringGeo.dispose()
      bead.dispose()
      tick.geo.dispose()
      glowGeo.dispose()
      material.dispose()
      glow.dispose()
    },
  }
}
