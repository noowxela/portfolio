import gsap from 'gsap'
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  HalfFloatType,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Texture,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { asset } from '@/lib/asset'
import { POSES, type Pose, type PoseId } from './poses'
import { loadImage, samplePose, type PoseSample } from './sampler'

export type Slot = { cx: number; cy: number; w: number; h: number }

export type PortraitOptions = {
  small: boolean
  reducedMotion: boolean
  /** Mouse push and photo reveal: only for (hover:hover) and (pointer:fine). */
  pointerEffects: boolean
  /** Where the portrait sits, in CSS px relative to the container. */
  getSlot: () => Slot
  tron: string
  ember: string
  onReady?: () => void
  onLost?: () => void
}

export type PortraitScene = {
  setPose: (id: PoseId) => void
  /** True while a drag is in progress or just moved past the tap threshold. */
  wasDrag: () => boolean
  /** Page exit: stream the particles to (x, y) (CSS px in the container) and fade out. */
  exit: (x: number, y: number, duration: number) => void
  dispose: () => void
}

const FOV = 30
const CAM_Z = 10
const PUSH_RADIUS = 120
const PUSH_GAIN = 2.2
const TILT_MAX = 0.45
/** Gap between the front and back particle sheets (portrait height = 1). */
const LAYER_GAP = 0.04
/** Share of a pose's depth used for each sheet's outward relief. */
const RELIEF = 0.22
/** Alpha of the sheet facing away from the camera (no see-through double image head-on). */
const AWAY_ALPHA = 0.06
/** Below this the dust is under a pixel and the reveal is invisible. */
const TRAIL_EPS = 0.02

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
/** Frame-rate independent approach factor for a rate in 1/s. */
const approach = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)

const particleVertex = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec3 aColFrom;
  attribute vec3 aColTo;
  attribute vec4 aRand;
  attribute float aSide;

  uniform float uMorph;
  uniform float uFade;
  uniform float uPush;
  uniform float uPuff;
  uniform float uLine;
  uniform float uThick;
  uniform float uAccent;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform sampler2D uTrail;
  uniform vec3 uTron;
  uniform vec3 uEmber;
  uniform float uAway;
  uniform float uExit;
  uniform vec2 uTarget;

  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vCorner;

  float easeInOut(float t) {
    return t < 0.5 ? 2.0 * t * t : 1.0 - pow(-2.0 * t + 2.0, 2.0) / 2.0;
  }

  void main() {
    // Staggered morph: each particle starts up to 0.4 of the tween late.
    float k = easeInOut(clamp((uMorph - aRand.x * 0.4) / 0.6, 0.0, 1.0));
    vec3 p = mix(aFrom, aTo, k);
    p.z += sin(k * 3.14159) * (aRand.y - 0.5) * 0.25;
    vec3 col = mix(aColFrom, aColTo, k);

    // Fast spin puffs the cloud outward.
    vec3 outward = normalize(vec3(p.xy, p.z * 2.0) + vec3(aRand.zw - 0.5, aRand.y - 0.5) * 0.6);
    p += outward * uPuff * (0.05 + 0.25 * aRand.w);

    // Two sheets (front +z, back -z): the one facing away fades to a whisper.
    float facing = normalize(normalMatrix * vec3(0.0, 0.0, aSide)).z;
    float face = mix(uAway, 1.0, smoothstep(-0.2, 0.3, facing));

    vec4 clip = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    vec2 px = (clip.xy / clip.w * 0.5 + 0.5) * uRes;

    // Speed-driven push: away from the cursor inside the radius.
    vec2 dm = px - uMouse;
    float dist = length(dm);
    float fall = 1.0 - smoothstep(0.0, ${PUSH_RADIUS.toFixed(1)}, dist);
    vec2 dir = dist > 0.001 ? dm / dist : vec2(0.0);
    vec2 push = dir * fall * uPush * mix(8.0, 22.0, aRand.z) * ${PUSH_GAIN.toFixed(2)};

    // Dust left by fast sweeps (trail texture), settling back as it decays.
    vec4 trail = texture2D(uTrail, clamp(px / uRes, 0.0, 1.0));
    float dust = trail.z;
    vec2 rdir = normalize(vec2(aRand.w - 0.5, aRand.y - 0.5) + 0.0001);
    vec2 disp = push + (rdir * mix(10.0, 52.0, aRand.w) + trail.xy * 26.0) * dust;

    // Page exit: each particle (staggered) bursts, then streams into the chosen
    // corner on a curved path, thinning out as it arrives.
    float ex = clamp((uExit - aRand.x * 0.3) / 0.7, 0.0, 1.0);
    if (uExit > 0.0) {
      vec2 toT = uTarget - px;
      vec2 side = normalize(vec2(-toT.y, toT.x) + 0.0001);
      disp += toT * pow(ex, 1.7) * mix(0.78, 1.0, aRand.z)
        + side * sin(ex * 3.14159) * mix(-55.0, 55.0, aRand.w)
        + rdir * sin(ex * 3.14159) * mix(6.0, 40.0, aRand.y);
    }
    float moved = length(disp);

    // Short line segment, horizontal-ish at rest, streaking along its motion.
    float ang = (aRand.y - 0.5) * 0.5;
    vec2 rest = vec2(cos(ang), sin(ang));
    vec2 axis = normalize(mix(rest, disp / max(moved, 0.0001), clamp(moved / 14.0, 0.0, 1.0)));
    vec2 nrm = vec2(-axis.y, axis.x);
    float len = uLine * (0.55 + aRand.y * 0.9) * (1.0 + min(moved, 60.0) * 0.04);
    vec2 offPx = disp + axis * position.x * len + nrm * position.y * uThick;
    clip.xy += offPx / uRes * 2.0 * clip.w;
    gl_Position = clip;

    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 neon = mix(uTron * 0.3, mix(uTron, vec3(1.0), 0.62), lum);
    neon = mix(neon, col, 0.12);
    vec3 warm = uEmber * (0.35 + 0.9 * lum);
    float accent = clamp(uAccent * step(aRand.w, 0.55 + 0.45 * uAccent) + dust * 0.85, 0.0, 1.0);
    vColor = mix(neon, warm, accent);
    // Exit: brighten to hot cyan, a few embers among them.
    vColor = mix(vColor, mix(uTron, vec3(1.0), 0.55), ex * 0.6);
    vColor = mix(vColor, uEmber, ex * step(aRand.w, 0.12));
    float twinkle = 0.85 + 0.15 * sin(uTime * 2.0 + aRand.x * 40.0);
    float exitAlpha = (1.0 + sin(ex * 3.14159) * 0.35) * (1.0 - smoothstep(0.55, 1.0, ex));
    vAlpha = face * uFade * twinkle * (0.22 + 0.78 * lum) * (1.0 - trail.w * 0.75) * exitAlpha;
    vCorner = position.xy;
  }
`

const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vCorner;
  void main() {
    float across = 1.0 - smoothstep(0.15, 0.5, abs(vCorner.y));
    float along = 1.0 - smoothstep(0.32, 0.5, abs(vCorner.x));
    float a = vAlpha * across * along;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
  }
`

const photoVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/** The real photo, visible only where the cursor trail's reveal channel is. */
const photoFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uTrail;
  uniform vec4 uCrop;
  uniform vec2 uResPx;
  uniform float uOpacity;
  uniform vec3 uTron;
  varying vec2 vUv;
  void main() {
    float r = texture2D(uTrail, gl_FragCoord.xy / uResPx).w;
    vec2 tuv = vec2(uCrop.x + vUv.x * uCrop.z, 1.0 - (uCrop.y + (1.0 - vUv.y) * uCrop.w));
    vec4 c = texture2D(uMap, tuv);
    float show = smoothstep(0.03, 0.55, r);
    float rim = smoothstep(0.02, 0.18, r) * (1.0 - smoothstep(0.18, 0.5, r));
    vec3 col = mix(c.rgb, c.rgb * vec3(0.86, 1.0, 1.06), 0.5) + uTron * rim * 0.55;
    // Soft crop edges (the bottom most), so the shirt never ends on a hard line.
    float edge = smoothstep(0.0, 0.2, vUv.y) * smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);
    col *= 0.9;
    float a = c.a * edge * max(show, rim * 0.6) * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
  }
`

const quadVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

/** Trail: x,y = stroke direction, z = dust, w = photo reveal. */
const trailFragment = /* glsl */ `
  uniform sampler2D uPrev;
  uniform vec2 uA;
  uniform vec2 uB;
  uniform vec2 uDir;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uDust;
  uniform float uReveal;
  uniform float uDecayDust;
  uniform float uDecayReveal;
  varying vec2 vUv;
  void main() {
    vec4 prev = texture2D(uPrev, vUv);
    prev.xyz *= uDecayDust;
    prev.w *= uDecayReveal;
    vec2 s = vec2(uAspect, 1.0);
    vec2 pa = vUv * s - uA * s;
    vec2 ba = (uB - uA) * s;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    float d = length(pa - ba * h);
    float stroke = 1.0 - smoothstep(0.0, uRadius, d);
    prev.xy = mix(prev.xy, uDir, stroke * uDust);
    prev.z = max(prev.z, stroke * uDust);
    prev.w = max(prev.w, (1.0 - smoothstep(uRadius * 0.4, uRadius * 1.6, d)) * uReveal);
    gl_FragColor = prev;
  }
`

export function createPortraitScene(container: HTMLElement, opts: PortraitOptions): PortraitScene | null {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
  } catch {
    return null
  }
  if (!renderer.getContext()) return null
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  renderer.setPixelRatio(dpr)
  renderer.setClearColor(0x000000, 0)
  const canvas = renderer.domElement
  canvas.setAttribute('aria-hidden', 'true')
  container.appendChild(canvas)

  let disposed = false
  let lost = false
  const onLost = (e: Event) => {
    e.preventDefault()
    lost = true
    stop()
    opts.onLost?.()
  }
  canvas.addEventListener('webglcontextlost', onLost)

  // Two sheets of `half` particles each: front (+z) and back (-z, mirrored in x).
  const half = opts.small ? 5000 : 15000
  const count = half * 2
  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100)
  camera.position.set(0, 0, CAM_Z)

  // Scene graph: place (slot position + scale) > turn (tilt / yaw).
  const place = new Group()
  const turn = new Group()
  place.add(turn)
  scene.add(place)

  // ---- Particles ----
  const quad = new PlaneGeometry(1, 1)
  const geo = new InstancedBufferGeometry()
  geo.index = quad.index
  geo.setAttribute('position', quad.getAttribute('position'))
  geo.setAttribute('uv', quad.getAttribute('uv'))
  const from = new Float32Array(count * 3)
  const to = new Float32Array(count * 3)
  const colFrom = new Float32Array(count * 3)
  const colTo = new Float32Array(count * 3)
  const rand = new Float32Array(count * 4)
  for (let i = 0; i < rand.length; i++) rand[i] = Math.random()
  const aFrom = new InstancedBufferAttribute(from, 3)
  const aTo = new InstancedBufferAttribute(to, 3)
  const aColFrom = new InstancedBufferAttribute(colFrom, 3)
  const aColTo = new InstancedBufferAttribute(colTo, 3)
  geo.setAttribute('aFrom', aFrom)
  geo.setAttribute('aTo', aTo)
  geo.setAttribute('aColFrom', aColFrom)
  geo.setAttribute('aColTo', aColTo)
  geo.setAttribute('aRand', new InstancedBufferAttribute(rand, 4))
  const side = new Float32Array(count)
  for (let i = 0; i < count; i++) side[i] = i < half ? 1 : -1
  geo.setAttribute('aSide', new InstancedBufferAttribute(side, 1))
  geo.instanceCount = count

  // ---- Trail (ping-pong, quarter resolution) ----
  const makeTarget = () =>
    new WebGLRenderTarget(4, 4, {
      type: HalfFloatType,
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthBuffer: false,
    })
  let trailRead = makeTarget()
  let trailWrite = makeTarget()
  const trailMat = new ShaderMaterial({
    vertexShader: quadVertex,
    fragmentShader: trailFragment,
    uniforms: {
      uPrev: { value: trailRead.texture },
      uA: { value: [0, 0] },
      uB: { value: [0, 0] },
      uDir: { value: [0, 0] },
      uAspect: { value: 1 },
      uRadius: { value: 0.06 },
      uDust: { value: 0 },
      uReveal: { value: 0 },
      uDecayDust: { value: 1 },
      uDecayReveal: { value: 1 },
    },
    depthTest: false,
    depthWrite: false,
  })
  const trailGeo = new BufferGeometry()
  trailGeo.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3))
  trailGeo.setAttribute('uv', new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2))
  const trailScene = new Scene()
  trailScene.add(new Mesh(trailGeo, trailMat))
  const trailCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const tron = new Color(opts.tron)
  const ember = new Color(opts.ember)
  const mat = new ShaderMaterial({
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    uniforms: {
      uMorph: { value: 1 },
      uFade: { value: 0 },
      uPush: { value: 0 },
      uPuff: { value: 0 },
      uLine: { value: 4 },
      uThick: { value: 1.2 },
      uAccent: { value: 0 },
      uTime: { value: 0 },
      uRes: { value: [1, 1] },
      uMouse: { value: [-9999, -9999] },
      uTrail: { value: trailRead.texture },
      uTron: { value: tron },
      uEmber: { value: ember },
      uAway: { value: AWAY_ALPHA },
      uExit: { value: 0 },
      uTarget: { value: [0, 0] },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const points = new Mesh(geo, mat)
  points.frustumCulled = false
  points.renderOrder = 1
  turn.add(points)

  // ---- Photo plane for the reveal ----
  const photoGeo = new PlaneGeometry(1, 1)
  const photoMat = new ShaderMaterial({
    vertexShader: photoVertex,
    fragmentShader: photoFragment,
    uniforms: {
      uMap: { value: null as Texture | null },
      uTrail: { value: trailRead.texture },
      uCrop: { value: [0, 0, 1, 1] },
      uResPx: { value: [1, 1] },
      uOpacity: { value: 0 },
      uTron: { value: tron },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })
  // One plane per sheet. Front-side only, so each shows just from its own side;
  // the back one is turned 180° and reads the right way round from behind.
  const photo = new Mesh(photoGeo, photoMat)
  const photoBack = new Mesh(photoGeo, photoMat)
  photoBack.rotation.y = Math.PI
  for (const m of [photo, photoBack]) {
    m.renderOrder = 0
    m.visible = opts.pointerEffects
    turn.add(m)
  }
  const textures = new Map<string, Texture>()
  const textureFor = (src: string, img: HTMLImageElement) => {
    let tex = textures.get(src)
    if (!tex) {
      tex = new Texture(img)
      tex.minFilter = LinearFilter
      tex.generateMipmaps = false
      tex.needsUpdate = true
      textures.set(src, tex)
    }
    return tex
  }

  // ---- Layout ----
  let width = 1
  let height = 1
  const view = { scale: 1, offsetY: 0, aspect: 1, height: 0.84 }
  const layout = () => {
    const slot = opts.getSlot()
    const worldPerPx = (2 * CAM_Z * Math.tan((FOV * Math.PI) / 360)) / height
    const fitPx = Math.min(slot.h * view.height, (slot.w * 0.94) / view.aspect)
    const s = fitPx * worldPerPx * view.scale
    place.scale.setScalar(s)
    place.position.set((slot.cx - width / 2) * worldPerPx, (height / 2 - slot.cy) * worldPerPx + view.offsetY * s, 0)
  }
  const resize = () => {
    const r = container.getBoundingClientRect()
    width = Math.max(1, r.width)
    height = Math.max(1, r.height)
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    mat.uniforms.uRes.value = [width, height]
    photoMat.uniforms.uResPx.value = [width * dpr, height * dpr]
    const tw = Math.max(16, Math.round(width / 4))
    const th = Math.max(16, Math.round(height / 4))
    trailRead.setSize(tw, th)
    trailWrite.setSize(tw, th)
    trailMat.uniforms.uAspect.value = width / height
    trailMat.uniforms.uRadius.value = 70 / height
    layout()
    wake()
  }

  let exiting = false

  // ---- Pointer (mouse only) ----
  const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, dist: 0, inside: false }
  let speed = 0
  let push = 0
  let trailEnergy = 0
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || exiting) return
    const r = container.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    if (pointer.inside) pointer.dist += Math.hypot(x - pointer.x, y - pointer.y)
    else {
      pointer.px = x
      pointer.py = y
    }
    pointer.x = x
    pointer.y = y
    pointer.inside = true
    wake()
  }
  const onLeave = () => {
    pointer.inside = false
  }
  if (opts.pointerEffects) {
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
  }

  // ---- Drag / wheel rotation ----
  const spin = { yaw: 0, vel: 0, tilt: 0, puff: 0 }
  const drag = { on: false, id: -1, x: 0, y: 0, t: 0, moved: 0 }
  let tiltTween: gsap.core.Tween | null = null
  const onDown = (e: PointerEvent) => {
    if (e.button !== 0 || drag.on || exiting) return
    drag.on = true
    drag.id = e.pointerId
    drag.x = e.clientX
    drag.y = e.clientY
    drag.t = performance.now()
    drag.moved = 0
    spin.vel = 0
    tiltTween?.kill()
    container.setPointerCapture?.(e.pointerId)
    wake()
  }
  const onDrag = (e: PointerEvent) => {
    if (!drag.on || e.pointerId !== drag.id) return
    const now = performance.now()
    const dt = Math.max(0.008, (now - drag.t) / 1000)
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    drag.moved += Math.abs(dx) + Math.abs(dy)
    drag.x = e.clientX
    drag.y = e.clientY
    drag.t = now
    // Narrow screens turn faster, so a thumb swipe can reach the back.
    const dYaw = dx * Math.max(0.0065, Math.PI / (0.75 * width))
    spin.yaw += dYaw
    spin.tilt = clamp(spin.tilt + dy * 0.004, -TILT_MAX, TILT_MAX)
    spin.vel += (dYaw / dt - spin.vel) * 0.5
    wake()
  }
  const onUp = (e: PointerEvent) => {
    if (!drag.on || e.pointerId !== drag.id) return
    drag.on = false
    // A pause before release kills the throw.
    if (performance.now() - drag.t > 90 || opts.reducedMotion) spin.vel = 0
    spin.vel = clamp(spin.vel, -14, 14)
    tiltTween = gsap.to(spin, { tilt: 0, duration: opts.reducedMotion ? 0 : 0.9, ease: 'power2.out', onUpdate: wake })
    wake()
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    const d = clamp((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 16 : 1), -120, 120)
    if (opts.reducedMotion) spin.yaw += d * 0.004
    else spin.vel = clamp(spin.vel + d * 0.012, -10, 10)
    wake()
  }
  container.addEventListener('pointerdown', onDown)
  container.addEventListener('pointermove', onDrag)
  container.addEventListener('pointerup', onUp)
  container.addEventListener('pointercancel', onUp)
  container.addEventListener('wheel', onWheel, { passive: false })

  // ---- Poses ----
  type Layered = PoseSample & { img: HTMLImageElement; surface: number }
  const samples = new Map<PoseId, Layered>()
  const images = new Map<string, Promise<HTMLImageElement>>()
  const getSample = async (id: PoseId) => {
    const cached = samples.get(id)
    if (cached) return cached
    const pose = POSES[id]
    let img = images.get(pose.image)
    if (!img) {
      img = loadImage(asset(pose.image))
      images.set(pose.image, img)
    }
    const loaded = await img
    const sample = { ...layered(samplePose(loaded, pose, half)), img: loaded }
    samples.set(id, sample)
    return sample
  }

  /** Build both sheets from one sample: same image, back mirrored in x, relief facing outward. */
  const layered = (s: PoseSample) => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    let mean = 0
    for (let i = 0; i < half; i++) {
      const x = s.positions[i * 3]
      const y = s.positions[i * 3 + 1]
      const z = LAYER_GAP / 2 + s.positions[i * 3 + 2] * RELIEF
      mean += z
      const f = i * 3
      const b = (half + i) * 3
      positions[f] = x
      positions[f + 1] = y
      positions[f + 2] = z
      positions[b] = -x
      positions[b + 1] = y
      positions[b + 2] = -z
      for (let c = 0; c < 3; c++) colors[f + c] = colors[b + c] = s.colors[i * 3 + c]
    }
    return { positions, colors, aspect: s.aspect, surface: mean / Math.max(1, half) }
  }

  let poseId: PoseId | null = null
  let wanted: PoseId = 'hello'
  let morphTween: gsap.core.Tween | null = null
  let viewTween: gsap.core.Tween | null = null
  const tween = { tilt: 0, spin: 0 }

  /** Freeze the in-flight morph into `from` so a new one starts where the particles are. */
  const captureCurrent = () => {
    const m = mat.uniforms.uMorph.value as number
    for (let i = 0; i < count; i++) {
      const k = ease(clamp((m - rand[i * 4] * 0.4) / 0.6, 0, 1))
      const lift = Math.sin(k * Math.PI) * (rand[i * 4 + 1] - 0.5) * 0.25
      for (let c = 0; c < 3; c++) {
        const j = i * 3 + c
        from[j] = from[j] + (to[j] - from[j]) * k + (c === 2 ? lift : 0)
        colFrom[j] = colFrom[j] + (colTo[j] - colFrom[j]) * k
      }
    }
  }

  const applyPose = (id: PoseId, sample: Layered, first: boolean) => {
    const pose: Pose = POSES[id]
    poseId = id
    // The reveal photo jumps to the new pose and fades in as the morph lands.
    photoMat.uniforms.uMap.value = textureFor(pose.image, sample.img)
    photoMat.uniforms.uCrop.value = [...pose.crop]
    photo.scale.set(sample.aspect, 1, 1)
    photoBack.scale.set(sample.aspect, 1, 1)
    photo.position.z = sample.surface
    photoBack.position.z = -sample.surface
    morphTween?.kill()
    viewTween?.kill()
    if (first) {
      from.set(sample.positions)
      colFrom.set(sample.colors)
    } else {
      captureCurrent()
    }
    to.set(sample.positions)
    colTo.set(sample.colors)
    aFrom.needsUpdate = true
    aTo.needsUpdate = true
    aColFrom.needsUpdate = true
    aColTo.needsUpdate = true
    const instant = first || opts.reducedMotion
    const duration = instant ? 0 : 1.25
    const u = mat.uniforms
    u.uMorph.value = instant ? 1 : 0
    morphTween = gsap.to(u.uMorph, { value: 1, duration, ease: 'none', onUpdate: wake })
    const target = {
      tilt: pose.tilt,
      spin: pose.spin,
      line: (opts.small ? 3.4 : 4.2) * pose.lineWidth,
      accent: pose.accent,
      scale: 1,
      offsetY: pose.offsetY,
      aspect: sample.aspect,
      height: pose.height,
    }
    const state = {
      tilt: tween.tilt,
      spin: tween.spin,
      line: u.uLine.value as number,
      accent: u.uAccent.value as number,
      scale: view.scale,
      offsetY: view.offsetY,
      aspect: view.aspect,
      height: view.height,
    }
    if (first) Object.assign(state, target)
    viewTween = gsap.to(state, {
      ...target,
      duration: instant ? 0 : 1.1,
      ease: 'power2.inOut',
      onUpdate: () => {
        tween.tilt = state.tilt
        tween.spin = state.spin
        u.uLine.value = state.line
        u.uAccent.value = state.accent
        view.scale = state.scale
        view.offsetY = state.offsetY
        view.aspect = state.aspect
        view.height = state.height
        layout()
        wake()
      },
    })
    wake()
  }

  const setPose = (id: PoseId) => {
    if (exiting) return
    wanted = id
    if (id === poseId) return
    void getSample(id).then((sample) => {
      if (disposed || wanted !== id) return
      applyPose(id, sample, poseId === null)
    })
  }

  // ---- Loop ----
  let raf = 0
  let last = 0
  let time = 0
  let fade = 0
  let ready = false

  // Either face can be the resting one: settle to the nearest half turn.
  const restYaw = () => Math.round(spin.yaw / Math.PI) * Math.PI
  const sway = !opts.reducedMotion
  let tick = 0
  let exitTween: gsap.core.Tween | null = null
  let exited = false

  const isBusy = () =>
    fade < 1 ||
    drag.on ||
    Math.abs(spin.vel) > 0.002 ||
    Math.abs(spin.yaw - restYaw()) > 0.0005 ||
    spin.puff > 0.002 ||
    !!tiltTween?.isActive() ||
    push > 0.002 ||
    trailEnergy > TRAIL_EPS ||
    !!morphTween?.isActive() ||
    !!viewTween?.isActive() ||
    !!exitTween?.isActive() ||
    (pointer.inside && pointer.dist > 0)

  const frame = (now: number) => {
    raf = 0
    if (disposed || lost) return
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
    last = now
    time += dt
    const u = mat.uniforms
    const busy = isBusy()
    // Idle sway only: render every other frame (~30 fps).
    if (!busy && sway && tick++ % 2 === 1) {
      schedule()
      return
    }

    // Inertia, then a slow return to facing front once the throw dies out.
    if (!drag.on) {
      spin.yaw += spin.vel * dt
      spin.vel *= Math.exp(-dt * 2.4)
      if (Math.abs(spin.vel) < 0.002) spin.vel = 0
      if (Math.abs(spin.vel) < 0.35) {
        const rest = restYaw()
        spin.yaw += (rest - spin.yaw) * approach(1.6, dt)
        if (Math.abs(rest - spin.yaw) < 0.0005) spin.yaw = rest
      }
    }
    const puffTarget = opts.reducedMotion ? 0 : smooth(2.5, 9, Math.abs(spin.vel))
    spin.puff += (puffTarget - spin.puff) * approach(puffTarget > spin.puff ? 12 : 3, dt)
    if (spin.puff < 0.002 && puffTarget === 0) spin.puff = 0
    u.uPuff.value = spin.puff

    // Mouse speed (px/s) and push strength with fast attack, slow release.
    const inst = dt > 0 ? pointer.dist / dt : 0
    pointer.dist = 0
    speed += (inst - speed) * approach(inst > speed ? 30 : 8, dt)
    const target = pointer.inside ? 0.8 * (1 - Math.exp(-speed / 700)) : 0
    push += (target - push) * approach(target > push ? 18 : 5, dt)
    if (push < 0.001 && target === 0) push = 0
    u.uPush.value = push
    u.uMouse.value = [pointer.x, height - pointer.y]

    // Trail: dust for fast sweeps, reveal for any movement.
    const dust = opts.pointerEffects ? smooth(500, 2400, speed) : 0
    const reveal = opts.pointerEffects ? smooth(30, 900, speed) : 0
    const tu = trailMat.uniforms
    const moving = pointer.inside && Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py) > 0.5
    tu.uA.value = [pointer.px / width, 1 - pointer.py / height]
    tu.uB.value = [pointer.x / width, 1 - pointer.y / height]
    const dx = pointer.x - pointer.px
    const dy = pointer.py - pointer.y
    const dl = Math.hypot(dx, dy) || 1
    tu.uDir.value = [dx / dl, dy / dl]
    tu.uDust.value = moving ? dust : 0
    tu.uReveal.value = moving ? reveal : 0
    tu.uDecayDust.value = Math.exp(-dt * 1.8)
    tu.uDecayReveal.value = Math.exp(-dt * 1.5)
    pointer.px = pointer.x
    pointer.py = pointer.y
    trailEnergy = Math.max(trailEnergy * Math.exp(-dt * 1.5), moving ? Math.max(dust, reveal) : 0)
    if (trailEnergy > TRAIL_EPS || moving) {
      tu.uPrev.value = trailRead.texture
      renderer.setRenderTarget(trailWrite)
      renderer.render(trailScene, trailCam)
      renderer.setRenderTarget(null)
      const t = trailRead
      trailRead = trailWrite
      trailWrite = t
      u.uTrail.value = trailRead.texture
      photoMat.uniforms.uTrail.value = trailRead.texture
    } else if (trailEnergy <= TRAIL_EPS && trailEnergy > 0) {
      trailEnergy = 0
      renderer.setRenderTarget(trailRead)
      renderer.clear()
      renderer.setRenderTarget(null)
    }

    if (ready) fade = Math.min(1, fade + dt / 0.7)
    u.uFade.value = fade
    const m = u.uMorph.value as number
    // The flat photo only reads face-on (from either side): hide the reveal while turned.
    const turned = Math.abs(spin.yaw - restYaw()) + Math.abs(spin.tilt) + spin.puff
    const gone = 1 - clamp((u.uExit.value as number) * 4, 0, 1)
    photoMat.uniforms.uOpacity.value = fade * smooth(0.75, 1, m) * (1 - smooth(0.08, 0.3, turned)) * gone
    u.uTime.value = time

    const swayYaw = sway ? Math.sin(time * 0.42) * 0.07 : 0
    const swayTilt = sway ? Math.sin(time * 0.29 + 1) * 0.025 : 0
    turn.rotation.set(tween.tilt + spin.tilt + swayTilt, tween.spin + spin.yaw + swayYaw, 0)
    renderer.render(scene, camera)
    if (exited) return
    if (isBusy() || sway) schedule()
  }

  const schedule = () => {
    if (!raf && !disposed && !lost && !document.hidden) raf = requestAnimationFrame(frame)
  }
  function wake() {
    if (!raf) last = 0
    schedule()
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  const onVisibility = () => (document.hidden ? stop() : wake())
  document.addEventListener('visibilitychange', onVisibility)
  const ro = new ResizeObserver(resize)
  ro.observe(container)
  resize()

  // First pose, then warm the rest in idle time so hover morphs start at once.
  void getSample('hello').then((sample) => {
    if (disposed) return
    applyPose('hello', sample, true)
    ready = true
    opts.onReady?.()
    wake()
    if (wanted !== 'hello') setPose(wanted)
    const rest = (Object.keys(POSES) as PoseId[]).filter((id) => id !== 'hello')
    const warm = () => {
      const id = rest.shift()
      if (!id || disposed) return
      void getSample(id).then(() => setTimeout(warm, 30))
    }
    setTimeout(warm, 200)
  }).catch(() => opts.onLost?.())

  return {
    setPose,
    wasDrag: () => drag.moved > 8,
    exit: (x, y, duration) => {
      if (exiting) return
      exiting = true
      pointer.inside = false
      drag.on = false
      spin.vel = 0
      mat.uniforms.uTarget.value = [x, height - y]
      exitTween = gsap.to(mat.uniforms.uExit, {
        value: 1,
        duration,
        ease: 'power1.in',
        onUpdate: wake,
        onComplete: () => {
          // One last (empty) frame, then stop drawing until unmount.
          wake()
          requestAnimationFrame(() => (exited = true))
        },
      })
      wake()
    },
    dispose: () => {
      disposed = true
      stop()
      morphTween?.kill()
      viewTween?.kill()
      tiltTween?.kill()
      exitTween?.kill()
      ro.disconnect()
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('pointermove', onDrag)
      container.removeEventListener('pointerup', onUp)
      container.removeEventListener('pointercancel', onUp)
      container.removeEventListener('wheel', onWheel)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('webglcontextlost', onLost)
      geo.dispose()
      quad.dispose()
      mat.dispose()
      photoGeo.dispose()
      photoMat.dispose()
      textures.forEach((t) => t.dispose())
      trailGeo.dispose()
      trailMat.dispose()
      trailRead.dispose()
      trailWrite.dispose()
      renderer.dispose()
      // Free the context now (listener is gone), so a back-navigation remount never holds two.
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
