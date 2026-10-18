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
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { withBasePath } from '@/lib/withBasePath'
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
  dispose: () => void
}

const FOV = 30
const CAM_Z = 10
const PUSH_RADIUS = 120
const PUSH_GAIN = 2.2

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
    float twinkle = 0.85 + 0.15 * sin(uTime * 2.0 + aRand.x * 40.0);
    vAlpha = uFade * twinkle * (0.22 + 0.78 * lum) * (1.0 - trail.w * 0.75);
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

  const count = opts.small ? 9000 : 22000
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
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const points = new Mesh(geo, mat)
  points.frustumCulled = false
  turn.add(points)

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
    const tw = Math.max(16, Math.round(width / 4))
    const th = Math.max(16, Math.round(height / 4))
    trailRead.setSize(tw, th)
    trailWrite.setSize(tw, th)
    trailMat.uniforms.uAspect.value = width / height
    trailMat.uniforms.uRadius.value = 70 / height
    layout()
    wake()
  }

  // ---- Pointer (mouse only) ----
  const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, dist: 0, inside: false }
  let speed = 0
  let push = 0
  let trailEnergy = 0
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
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

  // ---- Poses ----
  const samples = new Map<PoseId, PoseSample>()
  const images = new Map<string, Promise<HTMLImageElement>>()
  const getSample = async (id: PoseId) => {
    const cached = samples.get(id)
    if (cached) return cached
    const pose = POSES[id]
    let img = images.get(pose.image)
    if (!img) {
      img = loadImage(withBasePath(pose.image))
      images.set(pose.image, img)
    }
    const sample = samplePose(await img, pose, count)
    samples.set(id, sample)
    return sample
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

  const applyPose = (id: PoseId, sample: PoseSample, first: boolean) => {
    const pose: Pose = POSES[id]
    poseId = id
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

  const isBusy = () =>
    fade < 1 ||
    push > 0.002 ||
    trailEnergy > 0.004 ||
    !!morphTween?.isActive() ||
    !!viewTween?.isActive() ||
    (pointer.inside && pointer.dist > 0)

  const frame = (now: number) => {
    raf = 0
    if (disposed || lost) return
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
    last = now
    time += dt
    const u = mat.uniforms

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
    const reveal = 0
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
    if (trailEnergy > 0.004 || moving) {
      tu.uPrev.value = trailRead.texture
      renderer.setRenderTarget(trailWrite)
      renderer.render(trailScene, trailCam)
      renderer.setRenderTarget(null)
      const t = trailRead
      trailRead = trailWrite
      trailWrite = t
      u.uTrail.value = trailRead.texture
    } else if (trailEnergy <= 0.004 && trailEnergy > 0) {
      trailEnergy = 0
      renderer.setRenderTarget(trailRead)
      renderer.clear()
      renderer.setRenderTarget(null)
    }

    if (ready) fade = Math.min(1, fade + dt / 0.7)
    u.uFade.value = fade
    u.uTime.value = time

    turn.rotation.set(tween.tilt, tween.spin, 0)
    renderer.render(scene, camera)
    if (isBusy()) schedule()
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
    dispose: () => {
      disposed = true
      stop()
      morphTween?.kill()
      viewTween?.kill()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('webglcontextlost', onLost)
      geo.dispose()
      quad.dispose()
      mat.dispose()
      trailGeo.dispose()
      trailMat.dispose()
      trailRead.dispose()
      trailWrite.dispose()
      renderer.dispose()
      canvas.remove()
    },
  }
}
