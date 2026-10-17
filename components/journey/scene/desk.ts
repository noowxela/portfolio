import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  EdgesGeometry,
  Group,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  ShaderMaterial,
  type Material,
} from 'three'
import { FOG_GLSL, TRON, type FogUniforms } from './shared'

/**
 * The desk and monitor, the room the journey starts and ends in. One solid
 * set, one edge wireframe of the same parts. The wireframe's vertices carry a
 * second position on the grid floor (`aFrom`), so the floor lines can gather
 * into the desk at the end of the loop.
 */

export const SCREEN = { x: 0, y: 1.08, z: 0, w: 0.74, h: 0.43 }

type PartSpec = {
  geo: BufferGeometry
  at: [number, number, number]
  mat: 'body' | 'bezel' | 'strip' | 'mug'
}

function parts(): PartSpec[] {
  const box = (w: number, h: number, d: number) => new BoxGeometry(w, h, d)
  return [
    // Desk top and slab legs.
    { geo: box(1.9, 0.05, 0.8), at: [0, 0.745, 0.12], mat: 'body' },
    { geo: box(0.05, 0.72, 0.74), at: [-0.89, 0.36, 0.12], mat: 'body' },
    { geo: box(0.05, 0.72, 0.74), at: [0.89, 0.36, 0.12], mat: 'body' },
    { geo: box(1.73, 0.18, 0.025), at: [0, 0.6, -0.22], mat: 'body' },
    // Monitor: bezel, back, neck, foot.
    { geo: box(0.78, 0.47, 0.035), at: [0, SCREEN.y, -0.0195], mat: 'bezel' },
    { geo: box(0.5, 0.3, 0.05), at: [0, SCREEN.y - 0.01, -0.06], mat: 'bezel' },
    { geo: box(0.05, 0.27, 0.035), at: [0, 0.9, -0.1], mat: 'bezel' },
    { geo: box(0.28, 0.014, 0.19), at: [0, 0.777, -0.07], mat: 'bezel' },
    // Keyboard, mouse, mug.
    { geo: box(0.46, 0.018, 0.15), at: [0, 0.779, 0.27], mat: 'bezel' },
    { geo: box(0.06, 0.02, 0.1), at: [0.36, 0.78, 0.28], mat: 'bezel' },
    { geo: new CylinderGeometry(0.04, 0.036, 0.1, 20, 1, false), at: [-0.56, 0.82, 0.16], mat: 'mug' },
    // Neon strips: under the desk's front edge and the keyboard's front lip.
    { geo: box(1.82, 0.006, 0.006), at: [0, 0.716, 0.52], mat: 'strip' },
    { geo: box(0.44, 0.003, 0.003), at: [0, 0.77, 0.346], mat: 'strip' },
  ]
}

const SCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/** The monitor shows the hero: a perspective grid under a glowing horizon. */
const SCREEN_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
uniform float uPush;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  float horizon = 0.56;
  vec3 col = vec3(0.008, 0.016, 0.024);
  // Horizon glow (the hero dome).
  float glow = exp(-abs(uv.y - horizon) * 9.0);
  col += uColor * glow * (0.3 + uPush * 0.5);
  if (uv.y < horizon) {
    float depth = 0.16 / max(horizon - uv.y, 0.002);
    float z = depth + uTime * (0.25 + uPush * 3.5);
    float x = (uv.x - 0.5) * depth * 2.4;
    vec2 g = vec2(x, z);
    vec2 w = fwidth(g);
    vec2 c = abs(fract(g - 0.5) - 0.5) / max(w, vec2(1e-4));
    float line = 1.0 - min(min(c.x, c.y), 1.0);
    float fade = smoothstep(0.0, 0.22, horizon - uv.y);
    col += uColor * line * fade * (0.9 + uPush * 0.7);
  }
  // A band of light sweeping down, and scanlines.
  float sweep = exp(-pow((fract(uTime * 0.12) - (1.0 - uv.y)) * 12.0, 2.0));
  col += uColor * sweep * 0.05;
  col *= 0.86 + 0.14 * sin(uv.y * 420.0);
  // Close up, the centre burns white: the way in.
  float d = length((uv - 0.5) * vec2(1.6, 1.0));
  col += mix(uColor, vec3(1.0), 0.6) * smoothstep(0.75, 1.0, uPush) * (1.2 - d);
  float vignette = smoothstep(0.85, 0.35, d);
  col *= mix(0.55, 1.0, vignette);
  gl_FragColor = vec4(col, uOpacity);
}
`

const WIRE_VERT = /* glsl */ `
attribute vec3 aFrom;
attribute float aDelay;
uniform float uGather;
varying float vLift;
varying vec3 vWorld;
void main() {
  float t = clamp((uGather - aDelay) / (1.0 - 0.45), 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(aFrom, position, t);
  vLift = t;
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const WIRE_FRAG = /* glsl */ `
${FOG_GLSL}
uniform vec3 uColor;
uniform float uAlpha;
varying float vLift;
varying vec3 vWorld;
void main() {
  float dist = length(vWorld - cameraPosition);
  vec3 col = uColor * (0.8 + 0.6 * vLift);
  gl_FragColor = vec4(col * (1.0 - fogAmount(dist)), uAlpha);
}
`

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** Edge wireframe of every part with a start position on a floor grid line per segment. */
function wireGeometry(specs: PartSpec[]) {
  const positions: number[] = []
  const m = new Matrix4()
  for (const spec of specs) {
    if (spec.mat === 'strip') continue
    const edges = new EdgesGeometry(spec.geo, 20)
    m.makeTranslation(spec.at[0], spec.at[1], spec.at[2])
    edges.applyMatrix4(m)
    const arr = edges.attributes.position.array as ArrayLike<number>
    for (let i = 0; i < arr.length; i++) positions.push(arr[i])
    edges.dispose()
  }
  const count = positions.length / 3
  const from = new Float32Array(count * 3)
  const delay = new Float32Array(count)
  for (let s = 0; s < count; s += 2) {
    const ax = positions[s * 3]
    const az = positions[s * 3 + 2]
    const bz = positions[(s + 1) * 3 + 2]
    // Both ends start on the same floor line (x = whole cell), spread out along it.
    const lineX = Math.round(ax + (hash(s) - 0.5) * 9)
    const slide = (hash(s + 7) - 0.5) * 14
    const along = Math.abs(bz - az) + 0.6 + hash(s + 3) * 1.2
    from.set([lineX, 0.004, az + slide], s * 3)
    from.set([lineX, 0.004, az + slide - along], (s + 1) * 3)
    const d = hash(s + 11) * 0.45
    delay[s] = d
    delay[s + 1] = d
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geo.setAttribute('aFrom', new BufferAttribute(from, 3))
  geo.setAttribute('aDelay', new BufferAttribute(delay, 1))
  return geo
}

export function createDesk(fog: FogUniforms) {
  const group = new Group()
  const specs = parts()
  const tron = new Color(TRON)

  const mats = {
    body: new MeshStandardMaterial({ color: '#141b22', roughness: 0.62, metalness: 0.3 }),
    bezel: new MeshStandardMaterial({ color: '#07090c', roughness: 0.4, metalness: 0.5 }),
    mug: new MeshStandardMaterial({ color: '#1b2430', roughness: 0.35, metalness: 0.1 }),
    strip: new MeshBasicMaterial({ color: tron, toneMapped: false }),
  }
  const solids: Mesh[] = []
  for (const spec of specs) {
    const mesh = new Mesh(spec.geo, mats[spec.mat])
    mesh.position.set(...spec.at)
    group.add(mesh)
    solids.push(mesh)
  }

  const screenGeo = new PlaneGeometry(SCREEN.w, SCREEN.h)
  const screenMat = new ShaderMaterial({
    vertexShader: SCREEN_VERT,
    fragmentShader: SCREEN_FRAG,
    uniforms: {
      uColor: { value: tron.clone() },
      uTime: { value: 0 },
      uPush: { value: 0 },
      uOpacity: { value: 1 },
    },
    transparent: true,
  })
  const screen = new Mesh(screenGeo, screenMat)
  screen.position.set(SCREEN.x, SCREEN.y, SCREEN.z + 0.0005)
  group.add(screen)

  const wireGeo = wireGeometry(specs)
  const wireMat = new ShaderMaterial({
    vertexShader: WIRE_VERT,
    fragmentShader: WIRE_FRAG,
    uniforms: {
      ...fog,
      uColor: { value: tron.clone() },
      uGather: { value: 1 },
      uAlpha: { value: 0.2 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const wire = new LineSegments(wireGeo, wireMat)
  wire.frustumCulled = false
  wire.renderOrder = 3
  group.add(wire)

  // Lights: dim fill, a cool key, and the monitor's own glow on the desk.
  const ambient = new AmbientLight('#9fd8ff', 0.35)
  const key = new DirectionalLight('#dff6ff', 1.1)
  key.position.set(-2, 3, 3)
  key.target.position.set(0, 0.8, 0)
  const rim = new DirectionalLight(TRON, 1.4)
  rim.position.set(1.5, 2, -3)
  rim.target.position.set(0, 0.8, 0)
  const glow = new PointLight(TRON, 1.6, 2.6, 1.6)
  glow.position.set(0, SCREEN.y, 0.25)
  group.add(ambient, key, key.target, rim, rim.target, glow)

  const solidMats: Material[] = [mats.body, mats.bezel, mats.mug, mats.strip]
  let lastOpacity = 1

  return {
    group,
    /**
     * solid: 0..1 opacity of the real desk; wire: wireframe alpha;
     * gather: 0 = lines on the floor, 1 = lines on the desk; push: monitor zoom-in glow.
     */
    set(solid: number, wireAlpha: number, gather: number, push: number, time: number) {
      if (solid !== lastOpacity) {
        const transparent = solid < 0.999
        for (const m of solidMats) {
          if (m.transparent !== transparent) {
            m.transparent = transparent
            m.needsUpdate = true
          }
          m.opacity = solid
          m.depthWrite = solid > 0.5
        }
        lastOpacity = solid
      }
      for (const mesh of solids) mesh.visible = solid > 0.003
      screen.visible = solid > 0.003
      screenMat.uniforms.uOpacity.value = solid
      screenMat.uniforms.uPush.value = push
      screenMat.uniforms.uTime.value = time
      wireMat.uniforms.uAlpha.value = wireAlpha
      wireMat.uniforms.uGather.value = gather
      wire.visible = wireAlpha > 0.003
      glow.intensity = 1.6 * solid + push * 2
      ambient.intensity = 0.35 * solid
    },
    dispose() {
      for (const spec of specs) spec.geo.dispose()
      for (const m of Object.values(mats)) m.dispose()
      screenGeo.dispose()
      screenMat.dispose()
      wireGeo.dispose()
      wireMat.dispose()
    },
  }
}
