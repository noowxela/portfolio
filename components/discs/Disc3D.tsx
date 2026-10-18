import { useEffect, useRef, useState } from 'react'
import {
  DirectionalLight,
  DoubleSide,
  Group,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Quaternion,
  Raycaster,
  RingGeometry,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GridDisc } from '@/components/gallery/albums/GridDisc'
import { createNeon, neonLook, type NeonStrips } from '@/components/discs/discNeon'
import { BODY_R, HOLLOW_R, bodyTexture, grooveTextures, palette, type Tone } from '@/components/discs/discTextures'
import { type Dot, type Live, mix, signal as signalFrame } from '@/components/discs/signalFrames'

/** Same props as GridDisc, so it can stand in for the SVG discs. */
export type Disc3DProps = { contained?: boolean; signal?: boolean }

const THICK = 0.03
const BEVEL = THICK / 2
const HOLLOW = HOLLOW_R / BODY_R
const FOV = 35
const CAM_Z = 10
const TILT = (30 * Math.PI) / 180
const HOVER_TILT = (16 * Math.PI) / 180
const IDLE_SPIN = (Math.PI * 2) / 24
/** The SVG's own ring spin (64 s one way, 92 s back), on top of the disc's turn. */
const OUTER_SPIN = (Math.PI * 2) / 64
const INNER_SPIN = (Math.PI * 2) / 92
const MAX_DOTS = 32
const DISC_PX = (w: number, h: number) => Math.min(Math.min(w, h) * 0.78, 760)

const SPARKS: Dot[] = [
  { x: 100, y: 104, r: 0.9 },
  { x: 91, y: 96, r: 0.45 },
  { x: 112, y: 98, r: 0.4 },
  { x: 106, y: 116, r: 0.3 },
  { x: 88, y: 112, r: 0.28 },
  { x: 116, y: 110, r: 0.22 },
  { x: 97, y: 88, r: 0.25 },
]

/** Planar UVs over the unit disc, so every ring samples the same face texture. */
function planarUV(geo: BufferGeometry) {
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * 0.5 + 0.5, pos.getY(i) * 0.5 + 0.5)
  uv.needsUpdate = true
  return geo
}

/** Rounded edge, outward at the rim (dir 1) or inward round the hollow (dir -1). */
function edgeGeometry(radius: number, dir: 1 | -1) {
  const pts: Vector2[] = []
  const steps = 10
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI / 2 - (i / steps) * Math.PI
    pts.push(new Vector2(radius - dir * BEVEL + dir * BEVEL * Math.cos(a), (THICK / 2) * Math.sin(a)))
  }
  if (dir === -1) pts.reverse()
  const geo = new LatheGeometry(pts, 192)
  geo.rotateX(Math.PI / 2)
  return geo
}

type DiscParts = {
  tone: Tone
  rig: Group
  spinner: Group
  face: MeshPhysicalMaterial
  back: MeshPhysicalMaterial
  edge: MeshPhysicalMaterial
  neon: NeonStrips
  dots: InstancedMesh
  hit: Mesh
  hover: number
  from: Dot[]
  to: Dot[]
  next: number
  phase: 'hold' | 'morph'
  phaseStart: number
}

const m4 = new Matrix4()
const q = new Quaternion()
const p3 = new Vector3()
const s3 = new Vector3()

/** Signal dots float in the hollow core as small lit points, in SVG units. */
function placeDots(mesh: InstancedMesh, dots: Live[]) {
  const n = Math.min(dots.length, MAX_DOTS)
  for (let i = 0; i < n; i++) {
    const d = dots[i]
    const r = Math.max(d.r * 1.5, 0.55) * d.opacity
    p3.set((d.x - 100) / BODY_R, (100 - d.y) / BODY_R, 0)
    s3.setScalar(r / BODY_R)
    mesh.setMatrixAt(i, m4.compose(p3, q, s3))
  }
  mesh.count = n
  mesh.instanceMatrix.needsUpdate = true
}

/**
 * Three.js version of the 02 v2 side discs: two thin vinyl discs with bevelled
 * edges and grooves, a hollow core, and the SVG line art as raised neon strips
 * with a soft glow. One canvas, dpr ≤ 2, and it stops when offscreen.
 */
export function Disc3D({ contained = false, signal = false }: Disc3DProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
    } catch {
      queueMicrotask(() => setFailed(true))
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = SRGBColorSpace
    // Neutral keeps the neon orange from washing out to peach.
    renderer.toneMapping = NeutralToneMapping
    renderer.toneMappingExposure = 1
    const canvas = renderer.domElement
    canvas.style.cssText = `width:100%;height:100%;display:block;touch-action:${contained ? 'pan-y' : 'auto'}`
    canvas.setAttribute('aria-hidden', 'true')
    el.appendChild(canvas)

    const maxAniso = renderer.capabilities.getMaxAnisotropy()
    const scene = new Scene()
    const pmrem = new PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const envMap = pmrem.fromScene(room, 0.04).texture
    room.dispose()
    pmrem.dispose()
    scene.environment = envMap
    scene.environmentIntensity = 0.6

    const key = new DirectionalLight(0xffffff, 2.4)
    key.position.set(-3, 4.5, 6)
    scene.add(key)
    const fill = new DirectionalLight(0xffe2c8, 0.6)
    fill.position.set(4, -2, 3)
    scene.add(fill)

    const camera = new PerspectiveCamera(FOV, 1, 0.1, 100)
    camera.position.set(0, 0, CAM_Z)

    const grooves = grooveTextures(1024, maxAniso)
    // A real cut-out: the faces are rings from the hollow to the rim, joined by rounded walls.
    const geos = {
      face: planarUV(new RingGeometry(HOLLOW + BEVEL, 1 - BEVEL, 256, 1)),
      back: planarUV(new RingGeometry(HOLLOW + BEVEL, 1 - BEVEL, 256, 1)),
      rim: edgeGeometry(1, 1),
      core: edgeGeometry(HOLLOW, -1),
      dot: new SphereGeometry(1, 10, 8),
    }
    geos.back.rotateY(Math.PI)
    geos.back.translate(0, 0, -THICK / 2)
    geos.face.translate(0, 0, THICK / 2)

    const vinyl = () =>
      new MeshPhysicalMaterial({
        roughness: 1,
        roughnessMap: grooves.roughness,
        normalMap: grooves.normal,
        metalness: 0,
        ior: 1.6,
        specularIntensity: 1,
        anisotropy: 1,
        anisotropyMap: grooves.anisotropy,
        clearcoat: 0.35,
        clearcoatRoughness: 0.22,
      })

    const isDark = () => document.documentElement.classList.contains('dark')
    let dark = isDark()

    const discs: DiscParts[] = (['plain', 'neon'] as Tone[]).map((tone) => {
      const rig = new Group()
      const spinner = new Group()
      rig.add(spinner)
      const face = vinyl()
      const back = vinyl()
      const edge = new MeshPhysicalMaterial({ roughness: 0.28, clearcoat: 0.5, side: DoubleSide })
      const neon = createNeon(tone, THICK / 2)
      const dots = new InstancedMesh(geos.dot, neon.material, MAX_DOTS)
      dots.frustumCulled = false
      const hit = new Mesh(geos.face, face)
      spinner.add(hit, new Mesh(geos.back, back), new Mesh(geos.rim, edge), new Mesh(geos.core, edge), neon.group, dots)
      // Start the two discs at different angles, like the SVG signal offsets.
      spinner.rotation.z = tone === 'neon' ? 1.9 : 0.4
      scene.add(rig)
      const offset = tone === 'neon' ? 3 : 0
      const from = signal ? signalFrame(offset) : SPARKS
      placeDots(dots, from.map((d) => ({ ...d, opacity: 1 })))
      return {
        tone,
        rig,
        spinner,
        face,
        back,
        edge,
        neon,
        dots,
        hit,
        hover: 0,
        from,
        to: signalFrame(offset + 1),
        next: offset + 1,
        phase: 'hold' as const,
        phaseStart: performance.now(),
      }
    })

    const paint = () => {
      for (const d of discs) {
        d.face.map?.dispose()
        const map = bodyTexture(d.tone, dark, 1024, maxAniso)
        d.face.map = map
        d.back.map = map
        d.edge.color.set(palette(d.tone, dark).rim)
        d.neon.setLook(neonLook(d.tone, dark))
        d.face.needsUpdate = true
        d.back.needsUpdate = true
      }
    }
    paint()

    // Layout: match the SVG size (min(78vmin, 760px) discs half off each edge). 02 v3 rests at ±30°.
    let width = 1
    let height = 1
    const resize = () => {
      width = el.clientWidth || 1
      height = el.clientHeight || 1
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      const perPx = (2 * CAM_Z * Math.tan((FOV * Math.PI) / 360)) / height
      const disc = DISC_PX(width, height)
      const out = Math.max(0, (disc - width + 64) / 2)
      for (const d of discs) {
        const side = d.tone === 'plain' ? -1 : 1
        d.rig.scale.setScalar((disc / 2) * perPx)
        d.rig.position.set(side * (width / 2 + out) * perPx, 0, 0)
      }
      dirty = true
    }

    // Interaction state.
    let dirty = true
    let dragging = false
    let lastX = 0
    let lastY = 0
    let yaw = 0
    let pitch = 0
    let boost = 0
    let lastScroll = window.scrollY
    const pointer = new Vector2(2, 2)
    const raycaster = new Raycaster()
    let hovered: DiscParts | null = null

    const pick = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        hovered = null
        return
      }
      pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(discs.map((d) => d.hit), false)[0]
      hovered = discs.find((d) => d.hit === hit?.object) ?? null
    }

    const onMove = (e: PointerEvent) => {
      if (dragging) {
        yaw = Math.max(-0.9, Math.min(0.9, yaw + (e.clientX - lastX) * 0.006))
        pitch = Math.max(-0.7, Math.min(0.7, pitch + (e.clientY - lastY) * 0.006))
        lastX = e.clientX
        lastY = e.clientY
      } else {
        pick(e.clientX, e.clientY)
      }
      dirty = true
    }
    const onDown = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      canvas.setPointerCapture(e.pointerId)
    }
    const onUp = () => {
      dragging = false
    }
    const onLeave = () => {
      hovered = null
      dirty = true
    }
    const onScroll = () => {
      const y = window.scrollY
      if (!reduced) boost = Math.max(-6, Math.min(6, boost + (y - lastScroll) * 0.01))
      lastScroll = y
      dirty = true
    }

    const target = contained ? canvas : window
    target.addEventListener('pointermove', onMove as EventListener)
    if (contained) {
      canvas.addEventListener('pointerdown', onDown)
      canvas.addEventListener('pointerup', onUp)
      canvas.addEventListener('pointercancel', onUp)
      canvas.addEventListener('pointerleave', onLeave)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const theme = new MutationObserver(() => {
      if (isDark() === dark) return
      dark = isDark()
      paint()
      dirty = true
    })
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    let frames = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      let moving = false

      // Spring the drag back to rest once released.
      if (!dragging && (Math.abs(yaw) > 1e-4 || Math.abs(pitch) > 1e-4)) {
        const k = 1 - Math.exp(-dt * 3)
        yaw -= yaw * k
        pitch -= pitch * k
        moving = true
      }
      boost *= Math.exp(-dt * 1.8)
      if (Math.abs(boost) < 1e-3) boost = 0
      const spin = reduced ? 0 : IDLE_SPIN + boost
      if (spin !== 0) moving = true

      for (const d of discs) {
        const side = d.tone === 'plain' ? -1 : 1
        const goal = hovered === d ? 1 : 0
        const k = 1 - Math.exp(-dt * (reduced ? 60 : 6))
        if (Math.abs(goal - d.hover) > 1e-3) {
          d.hover += (goal - d.hover) * k
          moving = true
        } else d.hover = goal
        // The SVG discs each get their own perspective; here one camera sees them off-axis,
        // so take the viewing angle back out to keep the apparent ±30° tilt.
        const view = Math.atan2(Math.abs(d.rig.position.x), CAM_Z)
        d.rig.rotation.set(pitch, side * (TILT + HOVER_TILT * d.hover - view) + yaw, 0)
        d.spinner.scale.setScalar(1 + 0.04 * d.hover)
        // Clockwise, like the SVG rings.
        d.spinner.rotation.z -= spin * dt * (1 + 1.8 * d.hover)
        if (!reduced) {
          // Dotted rings keep their own counter-rotation, as in the SVG.
          d.neon.outer.rotation.z -= OUTER_SPIN * dt
          d.neon.inner.rotation.z += (spin + INNER_SPIN) * dt
        }

        if (signal && !reduced) {
          if (d.phase === 'hold' && now - d.phaseStart >= 800) {
            d.phase = 'morph'
            d.phaseStart = now
          }
          if (d.phase === 'morph') {
            const t = Math.min(1, (now - d.phaseStart) / 1700)
            placeDots(d.dots, mix(d.from, d.to, t))
            if (t >= 1) {
              d.from = d.to
              d.next += 1
              d.to = signalFrame(d.next)
              d.phase = 'hold'
              d.phaseStart = now
            }
            moving = true
          }
        }
      }

      if (!moving && !dirty) return
      dirty = false
      renderer.render(scene, camera)
      frames += 1
      if (frames % 10 === 0) el.dataset.frames = String(frames)
    }

    // Only run while on screen and the tab is visible.
    let onscreen = false
    const sync = () => {
      const run = onscreen && !document.hidden
      if (run && el.dataset.state !== 'running') {
        last = performance.now()
        dirty = true
        renderer.setAnimationLoop(tick)
      } else if (!run && el.dataset.state !== 'paused') {
        renderer.setAnimationLoop(null)
      }
      el.dataset.state = run ? 'running' : 'paused'
      el.dataset.frames = String(frames)
    }
    const io = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting
      sync()
    })
    io.observe(el)
    document.addEventListener('visibilitychange', sync)

    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    const onLost = (e: Event) => {
      e.preventDefault()
      renderer.setAnimationLoop(null)
    }
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      renderer.setAnimationLoop(null)
      io.disconnect()
      ro.disconnect()
      theme.disconnect()
      document.removeEventListener('visibilitychange', sync)
      target.removeEventListener('pointermove', onMove as EventListener)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('webglcontextlost', onLost)
      window.removeEventListener('scroll', onScroll)
      for (const d of discs) {
        d.face.map?.dispose()
        d.face.dispose()
        d.back.dispose()
        d.edge.dispose()
        d.neon.dispose()
        d.dots.dispose()
      }
      Object.values(grooves).forEach((t) => t.dispose())
      Object.values(geos).forEach((g) => g.dispose())
      envMap.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }, [contained, signal])

  if (failed) return <GridDisc contained={contained} signal={signal} />

  return (
    <div
      ref={ref}
      aria-hidden
      className={contained ? 'absolute inset-0 overflow-hidden' : 'pointer-events-none fixed inset-0 z-0 overflow-hidden'}
    />
  )
}
