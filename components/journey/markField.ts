import {
  AdditiveBlending,
  BufferAttribute,
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'

/**
 * The particle mark behind the current /journey panel: each step's short
 * label ("2021–23") is rasterised with the page font into a cell grid and
 * drawn as cyan dashes (instanced quads, pixel space). Switching steps sends
 * every dash from where it is to a cell of the next label with a per-particle
 * stagger; wheel / drag speed scatters them and a moving cursor pushes them.
 */

export type MarkFieldOptions = {
  marks: string[]
  fontFamily: string
  small: boolean
  start: number
  onLost: () => void
}

export type MarkField = {
  setMark: (i: number) => void
  /** Cursor position in container px. */
  pointer: (x: number, y: number) => void
  leave: () => void
  /** Row speed (px per frame / event) from the track. */
  stir: (speed: number) => void
  dispose: () => void
  canvas: HTMLCanvasElement
}

const MORPH_S = 1.05
const STAGGER = 0.42
const OPACITY = 0.78
const FADE_IN_S = 0.7
const IDLE_FRAME_MS = 33

const vertex = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aSeed;
  uniform vec2 uRes;
  uniform vec2 uOrigin;
  uniform float uCell;
  uniform float uMix;
  uniform float uTime;
  uniform float uSpread;
  uniform vec2 uPointer;
  uniform float uPush;
  varying float vAlpha;
  varying float vHot;
  varying float vEmber;
  varying vec2 vUv;
  void main() {
    float k = clamp((uMix - aSeed * ${STAGGER.toFixed(2)}) / ${(1 - STAGGER).toFixed(2)}, 0.0, 1.0);
    k = k * k * (3.0 - 2.0 * k);
    float fly = sin(3.14159265 * k);
    vec2 p = mix(aFrom.xy, aTo.xy, k);
    p += vec2(cos(aSeed * 91.0), sin(aSeed * 57.0)) * fly * (18.0 + 30.0 * fract(aSeed * 5.3));
    p += vec2(sin(uTime * 1.3 + aSeed * 40.0), cos(uTime * 1.1 + aSeed * 23.0)) * 0.6;
    p += vec2(sin(aSeed * 271.0), cos(aSeed * 613.0)) * (12.0 + 46.0 * fract(aSeed * 7.13)) * uSpread;
    vec2 world = uOrigin + p;
    vec2 d = world - uPointer;
    float dist = length(d);
    float fall = 1.0 - smoothstep(0.0, 140.0, dist);
    fall *= fall;
    world += d / max(dist, 18.0) * fall * uPush * (16.0 + 30.0 * fract(aSeed * 3.7));
    vHot = clamp(fall * uPush * 1.6 + fly * 0.5, 0.0, 1.0);
    vAlpha = mix(aFrom.z, aTo.z, k);
    vEmber = step(0.93, fract(aSeed * 13.7));
    vec2 size = vec2(uCell * 0.86, uCell * 0.38) * (1.0 + 0.5 * fly);
    vec2 v = world + position.xy * size;
    vUv = position.xy;
    gl_Position = vec4(v.x / uRes.x * 2.0 - 1.0, 1.0 - v.y / uRes.y * 2.0, 0.0, 1.0);
  }
`

const fragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform vec3 uEmberColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vHot;
  varying float vEmber;
  varying vec2 vUv;
  void main() {
    if (vAlpha < 0.02) discard;
    float edge = 1.0 - smoothstep(0.32, 0.5, abs(vUv.x));
    vec3 c = mix(mix(uColor, uEmberColor, vEmber * 0.85), uHot, vHot);
    gl_FragColor = vec4(c * edge, vAlpha * uOpacity * edge);
  }
`

type Target = Float32Array // x, y, alpha per particle

/** Deterministic 0..1 noise per index. */
const hash = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function sampleMarks(marks: string[], fontFamily: string, width: number, height: number, small: boolean) {
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return null
  let fontPx = Math.min(small ? 150 : 250, Math.max(small ? 84 : 110, width * (small ? 0.24 : 0.17)))
  probe.font = `600 ${fontPx}px ${fontFamily}`
  const widest = Math.max(...marks.map((m) => probe.measureText(m).width), 1)
  if (widest > width * 0.92) fontPx *= (width * 0.92) / widest
  fontPx = Math.max(48, Math.min(fontPx, height * 0.62))
  const cell = Math.max(3, Math.round(fontPx / (small ? 34 : 44)))
  const font = `600 ${fontPx}px ${fontFamily}`
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  const cells = marks.map((mark) => {
    ctx.font = font
    const w = Math.ceil(ctx.measureText(mark).width + cell * 4)
    const h = Math.ceil(fontPx * 1.3)
    canvas.width = w
    canvas.height = h
    ctx.font = font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.fillText(mark, w / 2, h / 2)
    const data = ctx.getImageData(0, 0, w, h).data
    const pts: number[] = []
    for (let y = Math.floor(cell / 2); y < h; y += cell) {
      for (let x = Math.floor(cell / 2); x < w; x += cell) {
        if (data[(y * w + x) * 4 + 3] > 140) pts.push(x - w / 2, y - h / 2)
      }
    }
    return pts
  })
  return { cells, cell, fontPx }
}

/** Spread each mark's cells over `n` particles; spare particles sit on a cell, invisible. */
function buildTargets(cells: number[][], n: number): Target[] {
  return cells.map((pts, m) => {
    const t = new Float32Array(n * 3)
    const count = pts.length / 2
    if (!count) return t
    const order = Array.from({ length: count }, (_, i) => i)
    // Stable shuffle per mark, so particles travel instead of sliding in rows.
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(hash(i * 7 + m * 131) * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    const step = count > n ? count / n : 1
    for (let i = 0; i < n; i++) {
      const visible = i < Math.min(n, count)
      const src = visible ? order[Math.floor(i * step)] : order[Math.floor(hash(i * 3 + m) * count)]
      t[i * 3] = pts[src * 2]
      t[i * 3 + 1] = pts[src * 2 + 1]
      t[i * 3 + 2] = visible ? 1 : 0
    }
    return t
  })
}

export function createMarkField(container: HTMLElement, opts: MarkFieldOptions): MarkField | null {
  // Probe on the canvas three will use, so a missing WebGL costs no second context and logs nothing.
  const canvas = document.createElement('canvas')
  const attrs: WebGLContextAttributes = { antialias: false, alpha: true, powerPreference: 'low-power' }
  const context = canvas.getContext('webgl2', attrs) ?? canvas.getContext('webgl', attrs)
  if (!context) return null
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas, context, antialias: false, alpha: true, powerPreference: 'low-power' })
  } catch {
    return null
  }
  canvas.className = 'gl-field-canvas'
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  container.appendChild(canvas)

  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geo = new InstancedBufferGeometry()
  geo.setAttribute('position', new BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3))
  geo.setIndex([0, 1, 2, 0, 2, 3])

  const uniforms = {
    uRes: { value: [1, 1] },
    uOrigin: { value: [0, 0] },
    uCell: { value: 4 },
    uMix: { value: 1 },
    uTime: { value: 0 },
    uSpread: { value: 0 },
    uPointer: { value: [-9999, -9999] },
    uPush: { value: 0 },
    uColor: { value: new Color('#5ce1ff') },
    uHot: { value: new Color('#e7fbff') },
    uEmberColor: { value: new Color('#ff6a2c') },
    uOpacity: { value: 0 },
  }
  const mat = new ShaderMaterial({
    uniforms,
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    // Pixel space flips y, which flips the quads' winding.
    side: DoubleSide,
  })
  const mesh = new Mesh(geo, mat)
  mesh.frustumCulled = false
  scene.add(mesh)

  let targets: Target[] = []
  let n = 0
  let fromAttr: InstancedBufferAttribute | null = null
  let toAttr: InstancedBufferAttribute | null = null
  let seeds: Float32Array = new Float32Array(0)
  let cur = Math.max(0, Math.min(opts.marks.length - 1, opts.start))
  let disposed = false
  let raf = 0
  let lastFrame = 0
  let lastDraw = 0
  let fade = 0
  let spread = 0
  let push = 0
  let pointerLast: { x: number; y: number; t: number } | null = null
  let width = 0
  let height = 0

  const layout = () => {
    width = container.clientWidth
    height = container.clientHeight
    if (width < 2 || height < 2) return false
    renderer.setSize(width, height, false)
    uniforms.uRes.value = [width, height]
    uniforms.uOrigin.value = [width / 2, height * 0.47]
    const sampled = sampleMarks(opts.marks, opts.fontFamily, width, height, opts.small)
    if (!sampled) return false
    uniforms.uCell.value = sampled.cell
    const budget = opts.small ? 2600 : 6500
    n = Math.min(budget, Math.max(...sampled.cells.map((c) => c.length / 2), 1))
    targets = buildTargets(sampled.cells, n)
    if (!fromAttr || fromAttr.count !== n) {
      seeds = new Float32Array(n)
      for (let i = 0; i < n; i++) seeds[i] = hash(i * 1.37 + 0.5)
      fromAttr = new InstancedBufferAttribute(new Float32Array(n * 3), 3)
      toAttr = new InstancedBufferAttribute(new Float32Array(n * 3), 3)
      geo.setAttribute('aFrom', fromAttr)
      geo.setAttribute('aTo', toAttr)
      geo.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1))
      geo.instanceCount = n
    }
    ;(fromAttr.array as Float32Array).set(targets[cur])
    ;(toAttr!.array as Float32Array).set(targets[cur])
    fromAttr.needsUpdate = true
    toAttr!.needsUpdate = true
    uniforms.uMix.value = 1
    return true
  }

  /** Freeze the in-flight positions into aFrom (same easing as the shader, minus jitter). */
  const freeze = () => {
    if (!fromAttr || !toAttr) return
    const a = fromAttr.array as Float32Array
    const b = toAttr.array as Float32Array
    const mix = uniforms.uMix.value
    if (mix >= 1) {
      a.set(b)
    } else {
      for (let i = 0; i < n; i++) {
        let k = Math.min(1, Math.max(0, (mix - seeds[i] * STAGGER) / (1 - STAGGER)))
        k = k * k * (3 - 2 * k)
        for (let c = 0; c < 3; c++) a[i * 3 + c] += (b[i * 3 + c] - a[i * 3 + c]) * k
      }
    }
    fromAttr.needsUpdate = true
  }

  const busy = () => uniforms.uMix.value < 1 || fade < 1 || push > 0.002 || spread > 0.002

  const frame = (now: number) => {
    raf = 0
    if (disposed || document.hidden) return
    const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0
    lastFrame = now
    if (uniforms.uMix.value < 1) uniforms.uMix.value = Math.min(1, uniforms.uMix.value + dt / MORPH_S)
    fade = Math.min(1, fade + dt / FADE_IN_S)
    spread *= Math.exp(-dt * 3.2)
    push *= Math.exp(-dt * 2.6)
    if (spread < 0.002) spread = 0
    if (push < 0.002) push = 0
    // Settled: keep a quiet ~30 fps shimmer instead of 60.
    if (busy() || now - lastDraw >= IDLE_FRAME_MS) {
      lastDraw = now
      uniforms.uTime.value = now / 1000
      uniforms.uSpread.value = Math.min(1.1, spread)
      uniforms.uPush.value = Math.min(1, push)
      uniforms.uOpacity.value = OPACITY * (1 - Math.pow(1 - fade, 2))
      renderer.render(scene, camera)
    }
    kick()
  }

  const kick = () => {
    if (!raf && !disposed && !document.hidden) raf = requestAnimationFrame(frame)
  }

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf)
      raf = 0
      lastFrame = 0
    } else kick()
  }

  const onLost = (e: Event) => {
    e.preventDefault()
    opts.onLost()
  }

  const ro = new ResizeObserver(() => {
    if (container.clientWidth === width && container.clientHeight === height) return
    if (layout()) kick()
  })

  if (!layout()) {
    renderer.dispose()
    canvas.remove()
    return null
  }
  ro.observe(container)
  document.addEventListener('visibilitychange', onVisibility)
  canvas.addEventListener('webglcontextlost', onLost)
  kick()

  return {
    canvas,
    setMark: (i: number) => {
      const next = Math.max(0, Math.min(targets.length - 1, i))
      if (next === cur || !toAttr) return
      freeze()
      cur = next
      ;(toAttr.array as Float32Array).set(targets[cur])
      toAttr.needsUpdate = true
      uniforms.uMix.value = 0
      kick()
    },
    pointer: (x: number, y: number) => {
      const now = performance.now()
      if (pointerLast) {
        const dt = Math.max(8, now - pointerLast.t)
        const speed = Math.hypot(x - pointerLast.x, y - pointerLast.y) / dt
        push = Math.min(1.2, push + speed * 0.09)
      }
      pointerLast = { x, y, t: now }
      uniforms.uPointer.value = [x, y]
      kick()
    },
    leave: () => {
      pointerLast = null
    },
    stir: (speed: number) => {
      spread = Math.min(1.1, spread + Math.abs(speed) * 0.0035)
      kick()
    },
    dispose: () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onLost)
      geo.dispose()
      mat.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
