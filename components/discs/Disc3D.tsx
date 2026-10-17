'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PlaneGeometry,
  PerspectiveCamera,
  PMREMGenerator,
  Raycaster,
  RingGeometry,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
  type Texture,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GridDisc } from '@/components/gallery/albums/GridDisc'
import {
  BODY_R,
  HALO_R,
  HOLE_R,
  LABEL_R,
  createLabel,
  faceTextures,
  grooveTextures,
  haloTexture,
  palette,
  type Tone,
} from '@/components/discs/discTextures'
import { type Dot, type Live, mix, signal as signalFrame } from '@/components/discs/signalFrames'

/** Same props as GridDisc, so it can stand in for the SVG discs. */
export type Disc3DProps = { contained?: boolean; signal?: boolean }

const THICK = 0.03
const BEVEL = THICK / 2
const HOLE = HOLE_R / BODY_R
const LABEL = LABEL_R / BODY_R
const FOV = 35
const CAM_Z = 10
const TILT = (50 * Math.PI) / 180
const HOVER_TILT = (16 * Math.PI) / 180
const IDLE_SPIN = (Math.PI * 2) / 24
const DISC_PX = (w: number, h: number) => Math.min(Math.min(w, h) * 0.78, 760)

/** Planar UVs over the unit disc, so every ring samples the same face texture. */
function planarUV(geo: BufferGeometry) {
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * 0.5 + 0.5, pos.getY(i) * 0.5 + 0.5)
  uv.needsUpdate = true
  return geo
}

function labelUV(geo: BufferGeometry) {
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) / LABEL) * 0.5 + 0.5, (pos.getY(i) / LABEL) * 0.5 + 0.5)
  }
  uv.needsUpdate = true
  return geo
}

function edgeGeometry() {
  const pts: Vector2[] = []
  const steps = 10
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI / 2 - (i / steps) * Math.PI
    pts.push(new Vector2(1 - BEVEL + BEVEL * Math.cos(a), (THICK / 2) * Math.sin(a)))
  }
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
  label: MeshPhysicalMaterial
  hit: Mesh
  drawLabel: (tone: Tone, dark: boolean, signal: boolean, dots: Live[]) => void
  textures: Texture[]
  hover: number
  from: Dot[]
  to: Dot[]
  next: number
  phase: 'hold' | 'morph'
  phaseStart: number
}

/**
 * Three.js version of the 02 v2 side discs: two thin vinyl discs with bevelled
 * edges, grooves, the SVG art as the face, the signal core as the centre label
 * and a spindle hole. One canvas, dpr ≤ 2, and it stops when offscreen.
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
    const geos = {
      face: planarUV(new RingGeometry(LABEL, 1 - BEVEL, 256, 1)),
      back: planarUV(new RingGeometry(HOLE, 1 - BEVEL, 256, 1)),
      label: labelUV(new RingGeometry(HOLE, LABEL, 128, 1)),
      edge: edgeGeometry(),
      hole: new CylinderGeometry(HOLE, HOLE, THICK, 48, 1, true),
      halo: new PlaneGeometry((HALO_R / BODY_R) * 2, (HALO_R / BODY_R) * 2),
    }
    geos.back.rotateY(Math.PI)
    geos.back.translate(0, 0, -THICK / 2)
    geos.face.translate(0, 0, THICK / 2)
    geos.label.translate(0, 0, THICK / 2)
    geos.hole.rotateX(Math.PI / 2)
    geos.halo.translate(0, 0, THICK / 2 + 0.004)
    const halo = haloTexture(512)
    const haloMat = new MeshBasicMaterial({
      map: halo,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      opacity: 0.55,
    })
    const holeMat = new MeshStandardMaterial({ color: 0x050505, roughness: 0.9, side: BackSide })

    const vinyl = (extra: Partial<ConstructorParameters<typeof MeshPhysicalMaterial>[0]> = {}) =>
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
        emissive: 0xffffff,
        ...extra,
      })

    const isDark = () => document.documentElement.classList.contains('dark')
    let dark = isDark()

    const discs: DiscParts[] = (['plain', 'neon'] as Tone[]).map((tone) => {
      const rig = new Group()
      const spinner = new Group()
      rig.add(spinner)
      const face = vinyl()
      const back = vinyl({ emissiveIntensity: 0 })
      const edge = new MeshPhysicalMaterial({ roughness: 0.28, clearcoat: 0.5, side: DoubleSide })
      const lab = createLabel(1024, maxAniso)
      const label = new MeshPhysicalMaterial({
        map: lab.map,
        emissiveMap: lab.emissive,
        emissive: 0xffffff,
        roughness: 0.5,
        clearcoat: 0.2,
      })
      const hit = new Mesh(geos.face, face)
      spinner.add(hit, new Mesh(geos.back, back), new Mesh(geos.label, label), new Mesh(geos.edge, edge), new Mesh(geos.hole, holeMat))
      // Start the two discs at different angles, like the SVG signal offsets.
      spinner.rotation.z = tone === 'neon' ? 1.9 : 0.4
      if (tone === 'neon') {
        const glow = new Mesh(geos.halo, haloMat)
        glow.renderOrder = 2
        spinner.add(glow)
      }
      scene.add(rig)
      const offset = tone === 'neon' ? 3 : 0
      return {
        tone,
        rig,
        spinner,
        face,
        back,
        edge,
        label,
        hit,
        drawLabel: lab.draw,
        textures: [lab.map, lab.emissive],
        hover: 0,
        from: signalFrame(offset),
        to: signalFrame(offset + 1),
        next: offset + 1,
        phase: 'hold' as const,
        phaseStart: performance.now(),
      }
    })

    const live = (d: Dot[]): Live[] => d.map((dot) => ({ ...dot, opacity: 1 }))

    const paint = () => {
      for (const d of discs) {
        for (const t of [d.face.map, d.face.emissiveMap, d.back.map]) t?.dispose()
        const tex = faceTextures(d.tone, dark, 2048, maxAniso)
        const p = palette(d.tone, dark)
        const neon = d.tone === 'neon'
        d.face.map = tex.map
        d.face.emissiveMap = tex.emissive
        d.face.emissiveIntensity = neon ? 1.15 : dark ? 0.55 : 0
        d.back.map = tex.back
        d.edge.color.set(p.rim)
        d.label.emissiveIntensity = neon ? 1.3 : signal ? 0.9 : dark ? 0.5 : 0
        d.face.needsUpdate = true
        d.back.needsUpdate = true
        d.drawLabel(d.tone, dark, signal, live(d.from))
      }
    }
    paint()

    // Layout: match the SVG version (min(78vmin, 760px) discs half off each edge, tilted ±50°).
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
    let lastLabel = 0
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
        // so take the viewing angle back out to keep the same apparent ±50° tilt.
        const view = Math.atan2(Math.abs(d.rig.position.x), CAM_Z)
        d.rig.rotation.set(pitch, side * (TILT + HOVER_TILT * d.hover - view) + yaw, 0)
        d.spinner.scale.setScalar(1 + 0.04 * d.hover)
        // Clockwise, like the SVG rings.
        d.spinner.rotation.z -= spin * dt * (d.hover ? 1 + 1.8 * d.hover : 1)

        if (signal && !reduced) {
          if (d.phase === 'hold' && now - d.phaseStart >= 800) {
            d.phase = 'morph'
            d.phaseStart = now
          }
          if (d.phase === 'morph' && now - lastLabel > 33) {
            const t = Math.min(1, (now - d.phaseStart) / 1700)
            d.drawLabel(d.tone, dark, true, mix(d.from, d.to, t))
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
      if (signal && !reduced && now - lastLabel > 33) lastLabel = now

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
        for (const t of [d.face.map, d.face.emissiveMap, d.back.map, ...d.textures]) t?.dispose()
        d.face.dispose()
        d.back.dispose()
        d.edge.dispose()
        d.label.dispose()
      }
      holeMat.dispose()
      haloMat.dispose()
      halo.dispose()
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
