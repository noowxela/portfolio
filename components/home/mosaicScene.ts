import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'

/**
 * Pixel-mosaic name for the Legacy hero. Two layers of short horizontal
 * strokes (one InstancedMesh each) sampled from text drawn on an offscreen
 * canvas. "alex woon" faces the camera, "noowxela" faces the back and is laid
 * out mirrored so it reads correctly once the object is turned around.
 *
 * Hover does not move the object. The pointer is projected onto the face that
 * is showing, and the bricks near it ease toward the viewer (a magnetic bulge).
 */

export type MosaicOptions = {
  front: string
  back: string
  color: string
  ember: string
  fontFamily: string
  reducedMotion: boolean
}

const COLS = 112
const CELL_W = 1
const CELL_H = 0.62
const STROKE_W = 0.78
const STROKE_H = 0.26
const STROKE_D = 0.32
const LAYER_Z = 2.6
const SLICES = 3
const SLICE_GAP = 0.55
const SAMPLE_PX = 12

// Bulge: gaussian falloff in world units (1 unit = one tile width).
const BULGE_SIGMA = 2.6
const BULGE_RADIUS = BULGE_SIGMA * 2.6
const BULGE_AMP = 7
const BULGE_AMP_REDUCED = 2

type Cell = { col: number; row: number }

function sampleText(text: string, fontFamily: string): { cells: Cell[]; rows: number } {
  const width = COLS * SAMPLE_PX
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return { cells: [], rows: 0 }

  const weight = 600
  probe.font = `${weight} 100px ${fontFamily}`
  const measured = probe.measureText(text).width || 1
  const fontSize = Math.floor((100 * width * 0.94) / measured)

  const rowPx = SAMPLE_PX * (CELL_H / CELL_W)
  const rows = Math.ceil((fontSize * 1.05) / rowPx)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = Math.ceil(rows * rowPx)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { cells: [], rows: 0 }

  ctx.fillStyle = '#fff'
  ctx.font = `${weight} ${fontSize}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, canvas.height / 2 + fontSize * 0.04)

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const cells: Cell[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      // Average alpha over the cell's center area.
      let sum = 0
      let count = 0
      const x0 = Math.floor(col * SAMPLE_PX + SAMPLE_PX * 0.2)
      const x1 = Math.floor(col * SAMPLE_PX + SAMPLE_PX * 0.8)
      const y0 = Math.floor(row * rowPx + rowPx * 0.2)
      const y1 = Math.min(canvas.height - 1, Math.floor(row * rowPx + rowPx * 0.8))
      for (let y = y0; y <= y1; y += 2) {
        for (let x = x0; x <= x1; x += 2) {
          sum += data[(y * canvas.width + x) * 4 + 3]
          count++
        }
      }
      if (count && sum / count > 110) cells.push({ col, row })
    }
  }
  return { cells, rows }
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Shortest signed angle from a to b. */
function angleDelta(a: number, b: number) {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

type Layer = {
  side: 1 | -1
  mesh: InstancedMesh
  material: MeshBasicMaterial
  rows: number
  /** Per instance: base brightness, row (for the scan band), owning cell. */
  base: Float32Array
  rowOf: Float32Array
  cellOf: Int32Array
  /** Per instance: resting local z. */
  baseZ: Float32Array
  /** Per cell: local x/y, current push (0..1), first instance index. */
  cellX: Float32Array
  cellY: Float32Array
  push: Float32Array
  firstInstance: Int32Array
  /** grid[row * COLS + col] = cell index, or -1. */
  grid: Int32Array
  /** Cells that are pushed or easing back. */
  active: Int32Array
  activeCount: number
  isActive: Uint8Array
}

function buildLayer(
  text: string,
  fontFamily: string,
  geometry: BoxGeometry,
  side: 1 | -1,
): Layer {
  const { cells, rows } = sampleText(text, fontFamily)
  const material = new MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const cellCount = cells.length
  const count = cellCount * SLICES
  const mesh = new InstancedMesh(geometry, material, Math.max(1, count))
  mesh.count = count
  // Matrices are pure translations, written straight into the buffer.
  const matrix = new Matrix4()
  const white = new Color(1, 1, 1)

  const layer: Layer = {
    side,
    mesh,
    material,
    rows,
    base: new Float32Array(count),
    rowOf: new Float32Array(count),
    cellOf: new Int32Array(count),
    baseZ: new Float32Array(count),
    cellX: new Float32Array(cellCount),
    cellY: new Float32Array(cellCount),
    push: new Float32Array(cellCount),
    firstInstance: new Int32Array(cellCount),
    grid: new Int32Array(COLS * Math.max(1, rows)).fill(-1),
    active: new Int32Array(Math.max(1, cellCount)),
    activeCount: 0,
    isActive: new Uint8Array(Math.max(1, cellCount)),
  }

  let i = 0
  cells.forEach(({ col, row }, c) => {
    // Back layer columns run mirrored so the text reads right from behind.
    const x = (col - (COLS - 1) / 2) * CELL_W * side
    const y = ((rows - 1) / 2 - row) * CELL_H
    const jitter = (Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1
    layer.cellX[c] = x
    layer.cellY[c] = y
    layer.firstInstance[c] = i
    layer.grid[row * COLS + col] = c
    for (let s = 0; s < SLICES; s++) {
      // Slice 0 is the face, deeper slices sink toward the core and dim.
      const z = side * (LAYER_Z - s * SLICE_GAP + jitter * 0.18)
      matrix.makeTranslation(x, y, z)
      mesh.setMatrixAt(i, matrix)
      layer.baseZ[i] = z
      layer.base[i] = (s === 0 ? 1 : s === 1 ? 0.42 : 0.18) * (0.82 + Math.abs(jitter) * 0.18)
      layer.rowOf[i] = row
      layer.cellOf[i] = c
      mesh.setColorAt(i, white)
      i++
    }
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  return layer
}

export function createMosaic(container: HTMLElement, opts: MosaicOptions): () => void {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  } catch {
    container.dataset.mosaic = 'fallback'
    return () => {
      delete container.dataset.mosaic
    }
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  const canvas = renderer.domElement
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.display = 'block'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  container.appendChild(canvas)

  const scene = new Scene()
  const camera = new PerspectiveCamera(30, 1, 1, 1000)
  const group = new Group()
  scene.add(group)

  const geometry = new BoxGeometry(STROKE_W * CELL_W, STROKE_H, STROKE_D)
  const front = buildLayer(opts.front, opts.fontFamily, geometry, 1)
  const back = buildLayer(opts.back, opts.fontFamily, geometry, -1)
  group.add(front.mesh, back.mesh)

  const tron = new Color(opts.color)
  const ember = new Color(opts.ember)
  const backTint = tron.clone().lerp(ember, 0.35)
  const tmp = new Color()

  const maxRows = Math.max(front.rows, back.rows)
  const objectW = COLS * CELL_W
  const objectH = maxRows * CELL_H

  // --- Sizing -------------------------------------------------------------
  const fit = () => {
    const w = container.clientWidth || 1
    const h = container.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    const halfFov = (camera.fov * Math.PI) / 360
    const byWidth = (objectW * 1.08) / (2 * Math.tan(halfFov) * camera.aspect)
    const byHeight = (objectH * 1.5) / (2 * Math.tan(halfFov))
    camera.position.set(0, 0, Math.max(byWidth, byHeight) + LAYER_Z)
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
  }
  fit()
  const resizeObserver = new ResizeObserver(fit)
  resizeObserver.observe(container)

  // --- Interaction state --------------------------------------------------
  let yaw = 0
  let pitch = 0
  let velocity = 0
  let dragging = false
  let lastX = 0
  let lastY = 0
  let lastT = 0
  let pointerInside = false
  let pointerX = 0 // client coords of the hovering pointer
  let pointerY = 0

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return
    dragging = true
    velocity = 0
    lastX = e.clientX
    lastY = e.clientY
    lastT = performance.now()
    container.setPointerCapture(e.pointerId)
    container.dataset.dragging = 'true'
  }
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') {
      pointerInside = true
      pointerX = e.clientX
      pointerY = e.clientY
    }
    if (!dragging) return
    const now = performance.now()
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    const step = dx * 0.0085
    yaw += step
    pitch = Math.max(-0.38, Math.min(0.38, pitch + dy * 0.004))
    const dt = Math.max(1, now - lastT)
    velocity = velocity * 0.6 + (step / dt) * 16 * 0.4 // radians per ~frame
    lastX = e.clientX
    lastY = e.clientY
    lastT = now
  }
  const onUp = (e: PointerEvent) => {
    if (e.pointerType === 'touch') pointerInside = false
    if (!dragging) return
    dragging = false
    if (container.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId)
    delete container.dataset.dragging
    if (opts.reducedMotion || performance.now() - lastT > 80) velocity = 0
  }
  const onLeave = () => {
    pointerInside = false
  }

  container.addEventListener('pointerdown', onDown)
  container.addEventListener('pointermove', onMove)
  container.addEventListener('pointerup', onUp)
  container.addEventListener('pointercancel', onUp)
  container.addEventListener('pointerleave', onLeave)

  // --- Bulge --------------------------------------------------------------
  // Scratch objects, reused every frame.
  const inverse = new Matrix4()
  const rayOrigin = new Vector3()
  const rayDir = new Vector3()
  const amp = opts.reducedMotion ? BULGE_AMP_REDUCED : BULGE_AMP
  const twoSigmaSq = 2 * BULGE_SIGMA * BULGE_SIGMA
  const radiusSq = BULGE_RADIUS * BULGE_RADIUS
  const colReach = Math.ceil(BULGE_RADIUS / CELL_W)
  const rowReach = Math.ceil(BULGE_RADIUS / CELL_H)

  /** Pointer projected onto a layer's face plane, in group-local x/y. */
  const hit = { x: 0, y: 0 }
  const projectPointer = (layer: Layer): boolean => {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return false
    const nx = ((pointerX - rect.left) / rect.width) * 2 - 1
    const ny = -((pointerY - rect.top) / rect.height) * 2 + 1
    rayOrigin.copy(camera.position)
    rayDir.set(nx, ny, 0.5).unproject(camera).sub(rayOrigin).normalize()
    inverse.copy(group.matrixWorld).invert()
    rayOrigin.applyMatrix4(inverse)
    rayDir.transformDirection(inverse)
    if (Math.abs(rayDir.z) < 1e-4) return false
    const t = (layer.side * LAYER_Z - rayOrigin.z) / rayDir.z
    if (t <= 0) return false
    hit.x = rayOrigin.x + rayDir.x * t
    hit.y = rayOrigin.y + rayDir.y * t
    return true
  }

  const target = (layer: Layer, c: number, on: boolean) => {
    if (!on) return 0
    const dx = layer.cellX[c] - hit.x
    const dy = layer.cellY[c] - hit.y
    const d2 = dx * dx + dy * dy
    return d2 > radiusSq ? 0 : Math.exp(-d2 / twoSigmaSq)
  }

  const activate = (layer: Layer, c: number) => {
    if (layer.isActive[c]) return
    layer.isActive[c] = 1
    layer.active[layer.activeCount++] = c
  }

  /** Ease pushed cells; returns whether any matrix changed. */
  const updateBulge = (layer: Layer, on: boolean, dt: number) => {
    if (on) {
      // Pull in cells around the pointer via the grid (local x is mirrored on the back).
      const col0 = Math.round(hit.x / (CELL_W * layer.side) + (COLS - 1) / 2)
      const row0 = Math.round((layer.rows - 1) / 2 - hit.y / CELL_H)
      const rMin = Math.max(0, row0 - rowReach)
      const rMax = Math.min(layer.rows - 1, row0 + rowReach)
      const cMin = Math.max(0, col0 - colReach)
      const cMax = Math.min(COLS - 1, col0 + colReach)
      for (let r = rMin; r <= rMax; r++) {
        for (let col = cMin; col <= cMax; col++) {
          const c = layer.grid[r * COLS + col]
          if (c >= 0 && target(layer, c, true) > 0.002) activate(layer, c)
        }
      }
    }
    if (!layer.activeCount) return

    const arrive = opts.reducedMotion ? 1 : 1 - Math.pow(0.8, dt)
    const leave = opts.reducedMotion ? 1 : 1 - Math.pow(0.88, dt)
    const array = layer.mesh.instanceMatrix.array as Float32Array
    let lo = Infinity
    let hi = -1
    let n = 0
    for (let k = 0; k < layer.activeCount; k++) {
      const c = layer.active[k]
      const goal = target(layer, c, on)
      const cur = layer.push[c]
      let next = cur + (goal - cur) * (goal > cur ? arrive : leave)
      if (goal === 0 && next < 0.002) next = 0
      layer.push[c] = next
      const first = layer.firstInstance[c]
      const offset = layer.side * next * amp
      for (let s = 0; s < SLICES; s++) {
        const i = first + s
        array[i * 16 + 14] = layer.baseZ[i] + offset
      }
      if (first < lo) lo = first
      if (first + SLICES - 1 > hi) hi = first + SLICES - 1
      if (next > 0) {
        layer.active[n++] = c
      } else {
        layer.isActive[c] = 0
      }
    }
    layer.activeCount = n
    const attr = layer.mesh.instanceMatrix
    attr.clearUpdateRanges()
    attr.addUpdateRange(lo * 16, (hi - lo + 1) * 16)
    attr.needsUpdate = true
  }

  // --- Render loop --------------------------------------------------------
  let visible = true
  let raf = 0
  let prev = performance.now()
  const start = prev

  const paint = (layer: Layer, tint: Color, opacity: number, time: number) => {
    layer.material.opacity = opacity
    layer.mesh.visible = opacity > 0.01
    if (!layer.mesh.visible || !layer.mesh.instanceColor) return
    // A soft scan band rolls down the rows, like a CRT refresh.
    const band = opts.reducedMotion ? -99 : ((time * 0.35) % 1.6) * layer.rows * 1.25 - layer.rows * 0.2
    for (let i = 0; i < layer.base.length; i++) {
      const d = Math.abs(layer.rowOf[i] - band)
      const scan = d < 3 ? (1 - d / 3) * 0.55 : 0
      const pushed = layer.push[layer.cellOf[i]]
      const k = layer.base[i] * (1 + scan + pushed * 0.7)
      tmp.copy(tint).lerp(ember, Math.min(1, scan * 0.8 + pushed * 0.6)).multiplyScalar(k)
      layer.mesh.setColorAt(i, tmp)
    }
    layer.mesh.instanceColor.needsUpdate = true
  }

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (!visible) return
    const dt = Math.min(3, (now - prev) / 16.67)
    prev = now

    if (!dragging) {
      // Inertia, then settle on whichever face is nearest.
      if (Math.abs(velocity) > 0.0008) {
        yaw += velocity * dt
        velocity *= Math.pow(0.93, dt)
      } else {
        velocity = 0
        const rest = Math.round(yaw / Math.PI) * Math.PI
        yaw += angleDelta(yaw, rest) * (1 - Math.pow(opts.reducedMotion ? 0.7 : 0.92, dt))
      }
      pitch += (0 - pitch) * (1 - Math.pow(0.9, dt))
    }

    group.rotation.set(pitch, yaw, 0)
    group.updateMatrixWorld()

    const facing = Math.cos(yaw) * Math.cos(pitch)
    const shown = facing >= 0 ? front : back
    const hover = pointerInside && !dragging && Math.abs(facing) > 0.5 && projectPointer(shown)
    updateBulge(front, hover && shown === front, dt)
    updateBulge(back, hover && shown === back, dt)

    const time = (now - start) / 1000
    paint(front, tron, smoothstep(-0.12, 0.42, facing), time)
    paint(back, backTint, smoothstep(-0.12, 0.42, -facing), time)

    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(frame)

  const io = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true
    prev = performance.now()
  })
  io.observe(container)

  return () => {
    cancelAnimationFrame(raf)
    io.disconnect()
    resizeObserver.disconnect()
    container.removeEventListener('pointerdown', onDown)
    container.removeEventListener('pointermove', onMove)
    container.removeEventListener('pointerup', onUp)
    container.removeEventListener('pointercancel', onUp)
    container.removeEventListener('pointerleave', onLeave)
    delete container.dataset.dragging
    front.mesh.dispose()
    back.mesh.dispose()
    front.material.dispose()
    back.material.dispose()
    geometry.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
    canvas.remove()
  }
}
