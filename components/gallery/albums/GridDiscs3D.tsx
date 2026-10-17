'use client'

import { useEffect, useRef, type RefObject } from 'react'
import {
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  RingGeometry,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
  type BufferGeometry,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { Demo } from '@/data/demos'
import { createNeon } from '@/components/discs/discNeon'
import { BODY_R, HOLLOW_R, bodyTexture, grooveTextures, palette } from '@/components/discs/discTextures'
import { tagColor } from './tagColor'

/**
 * One WebGL canvas for every Grid disc. Each sleeve keeps an empty square slot;
 * every frame the 02 v3 disc model is drawn into that slot's rect with
 * viewport + scissor (drei's View pattern, by hand). One scene, one set of
 * geometry, materials and textures; only the tag colour and pose change per disc.
 *
 * The canvas sits inside the grid content, under the cards (so sleeves cover the
 * lower half of each disc, like the SVG) and never takes pointer events. It is
 * one viewport tall plus a margin and is moved to the scroll position each frame,
 * so between frames it scrolls with the page and the discs stay on their sleeves.
 * It is clipped to the content box so it never adds scrollable overflow.
 */

const THICK = 0.03
const BEVEL = THICK / 2
const HOLLOW = HOLLOW_R / BODY_R
/** Viewport is this many slot widths, so the glow and the hover lift have room. */
const PAD = 1.5
const FOV = 20
const CAM_Z = PAD / Math.tan((FOV * Math.PI) / 360)
/** Extra canvas above and below the viewport, in CSS px. */
const OVER = 120
/** Rest pose: the disc leans back out of the sleeve; hover brings it upright. */
const LEAN = -0.5
const LEAN_HOVER = -0.18

function planarUV(geo: BufferGeometry) {
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * 0.5 + 0.5, pos.getY(i) * 0.5 + 0.5)
  uv.needsUpdate = true
  return geo
}

function edgeGeometry(radius: number, dir: 1 | -1) {
  const pts: Vector2[] = []
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI / 2 - (i / 10) * Math.PI
    pts.push(new Vector2(radius - dir * BEVEL + dir * BEVEL * Math.cos(a), (THICK / 2) * Math.sin(a)))
  }
  if (dir === -1) pts.reverse()
  const geo = new LatheGeometry(pts, 128)
  geo.rotateX(Math.PI / 2)
  return geo
}

/** tagColor() gives `hsl(h s% l%)` (space syntax), which Color.setStyle does not parse. */
function tagLinear(seed: string, dark: boolean) {
  const m = /hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/.exec(tagColor(seed))
  const h = m ? Number(m[1]) / 360 : 0
  // Brighter, more saturated than the label colour so it reads as a lit tube.
  return new Color().setHSL(h, 0.9, dark ? 0.62 : 0.55)
}

export type GridDiscDriver = (angleDeg: number) => void

type Props = {
  demos: Demo[]
  slots: RefObject<(HTMLDivElement | null)[]>
  scroller: RefObject<HTMLDivElement | null>
  content: RefObject<HTMLDivElement | null>
  /** Hands GridView the frame function; its gsap tick calls it with the spin angle after it moves the rows. */
  onDriver: (driver: GridDiscDriver | null) => void
  reduceMotion: boolean
  onFail: () => void
}

export function GridDiscs3D({ demos, slots, scroller, content, onDriver, reduceMotion, onFail }: Props) {
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = wrap.current
    const sc = scroller.current
    const ct = content.current
    if (!host || !sc || !ct) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let renderer: WebGLRenderer
    try {
      // MSAA only at dpr 1; at dpr 2 the buffer is already supersampled and MSAA would cost ~4× memory.
      renderer = new WebGLRenderer({ alpha: true, antialias: dpr < 2, powerPreference: 'high-performance' })
    } catch {
      onFail()
      return
    }
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = NeutralToneMapping
    renderer.autoClear = false
    const canvas = renderer.domElement
    canvas.style.display = 'block'
    canvas.setAttribute('aria-hidden', 'true')
    host.appendChild(canvas)

    const maxAniso = renderer.capabilities.getMaxAnisotropy()
    const scene = new Scene()
    const pmrem = new PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const envMap = pmrem.fromScene(room, 0.04).texture
    room.dispose()
    pmrem.dispose()
    scene.environment = envMap
    scene.environmentIntensity = 0.6
    const key = new DirectionalLight(0xffffff, 2.2)
    key.position.set(-3, 4.5, 6)
    scene.add(key)
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 50)
    camera.position.set(0, 0, CAM_Z)

    // The shared disc model: same build as Disc3D (bevelled vinyl, grooves, hollow core, neon strips).
    const grooves = grooveTextures(1024, maxAniso)
    const body = bodyTexture('plain', true, 512, maxAniso)
    const geos = {
      face: planarUV(new RingGeometry(HOLLOW + BEVEL, 1 - BEVEL, 160, 1)),
      back: planarUV(new RingGeometry(HOLLOW + BEVEL, 1 - BEVEL, 160, 1)),
      rim: edgeGeometry(1, 1),
      core: edgeGeometry(HOLLOW, -1),
    }
    geos.back.rotateY(Math.PI)
    geos.back.translate(0, 0, -THICK / 2)
    geos.face.translate(0, 0, THICK / 2)
    const vinyl = new MeshPhysicalMaterial({
      map: body,
      roughness: 1,
      roughnessMap: grooves.roughness,
      normalMap: grooves.normal,
      metalness: 0,
      ior: 1.6,
      anisotropy: 1,
      anisotropyMap: grooves.anisotropy,
      clearcoat: 0.35,
      clearcoatRoughness: 0.22,
    })
    const edge = new MeshPhysicalMaterial({ color: palette('plain', true).rim, roughness: 0.28, clearcoat: 0.5, side: DoubleSide })
    const neon = createNeon('neon', THICK / 2)
    neon.material.emissiveIntensity = 1.45
    const rig = new Group()
    const spinner = new Group()
    rig.add(spinner)
    spinner.add(new Mesh(geos.face, vinyl), new Mesh(geos.back, vinyl), new Mesh(geos.rim, edge), new Mesh(geos.core, edge), neon.group)
    scene.add(rig)

    const isDark = () => document.documentElement.classList.contains('dark')
    let dark = isDark()
    let colors: Color[] = []
    const paint = () => {
      colors = demos.map((d) => tagLinear(d.tags[0] ?? d.name, dark))
      // Records stay black in both themes; light mode just glows less.
      neon.glow.uniforms.uStrength.value = dark ? 0.95 : 0.7
    }
    paint()
    const hover = demos.map(() => 0)

    let width = 0
    let height = 0
    let angle = 0
    let lastNow = performance.now()

    const frame = (angleDeg: number) => {
      if (document.hidden) return
      angle = angleDeg
      const now = performance.now()
      const dt = Math.min(0.05, (now - lastNow) / 1000)
      lastNow = now
      const sR = sc.getBoundingClientRect()
      const cR = ct.getBoundingClientRect()
      const w = ct.clientWidth
      const h = sc.clientHeight + OVER * 2
      if (w !== width || h !== height) {
        width = w
        height = h
        renderer.setSize(w, h)
      }
      // Pin the canvas to the scroller's viewport (minus the margin), inside the scrolling content.
      const top = sR.top - OVER
      host.style.transform = `translate3d(0, ${top - cR.top}px, 0)`

      renderer.setScissorTest(false)
      renderer.clear()
      renderer.setScissorTest(true)
      const list = slots.current ?? []
      for (let i = 0; i < demos.length; i++) {
        const slot = list[i]
        if (!slot) continue
        const r = slot.getBoundingClientRect()
        const s = r.width
        if (s < 2) continue
        const v = s * PAD
        const x = r.left - cR.left + s / 2 - v / 2
        const y = r.top - top + s / 2 - v / 2
        // Cull anything outside the canvas.
        if (x > width || x + v < 0 || y > height || y + v < 0) continue

        const group = slot.parentElement?.parentElement
        const on = group ? group.matches(':hover') || group.matches(':focus-within') : false
        const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 10)
        hover[i] += ((on ? 1 : 0) - hover[i]) * k

        rig.rotation.x = LEAN + (LEAN_HOVER - LEAN) * hover[i]
        // Same spin as the SVG: rotate(angle + i·41°), clockwise.
        const a = ((angle + i * 41) * Math.PI) / 180
        spinner.rotation.z = -a
        neon.outer.rotation.z = -a * 0.35
        neon.inner.rotation.z = a * 1.4
        const c = colors[i]
        neon.material.color.copy(c).multiplyScalar(0.25)
        neon.material.emissive.copy(c)
        neon.material.emissiveIntensity = 1.35 + 0.35 * hover[i]
        neon.glow.uniforms.uColor.value.copy(c)

        const gy = height - (y + v)
        renderer.setViewport(x, gy, v, v)
        renderer.setScissor(x, gy, v, v)
        renderer.render(scene, camera)
      }
    }

    // GridView drives frames from its gsap tick. With reduced motion it does not tick,
    // so render once per change (scroll, resize, hover/focus, theme) at a fixed angle.
    let raf = 0
    const request = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        frame(0)
      })
    }
    onDriver(reduceMotion ? null : frame)
    const events: [EventTarget, string][] = reduceMotion
      ? [
          [sc, 'scroll'],
          [window, 'resize'],
          [ct, 'pointerover'],
          [ct, 'pointerout'],
          [ct, 'focusin'],
          [ct, 'focusout'],
        ]
      : [[window, 'resize']]
    events.forEach(([t, e]) => t.addEventListener(e, request, { passive: true }))
    const onVisible = () => {
      lastNow = performance.now()
      request()
    }
    document.addEventListener('visibilitychange', onVisible)
    const theme = new MutationObserver(() => {
      if (isDark() === dark) return
      dark = isDark()
      paint()
      request()
    })
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    request()

    const onLost = (e: Event) => {
      e.preventDefault()
      onDriver(null)
      onFail()
    }
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      onDriver(null)
      cancelAnimationFrame(raf)
      events.forEach(([t, e]) => t.removeEventListener(e, request))
      document.removeEventListener('visibilitychange', onVisible)
      theme.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      Object.values(geos).forEach((g) => g.dispose())
      Object.values(grooves).forEach((t) => t.dispose())
      body.dispose()
      vinyl.dispose()
      edge.dispose()
      neon.dispose()
      envMap.dispose()
      renderer.dispose()
      canvas.remove()
    }
  }, [demos, slots, scroller, content, onDriver, reduceMotion, onFail])

  // The outer layer clips to the content box: a translated canvas would otherwise grow the scroller's overflow.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div ref={wrap} className="absolute inset-x-0 top-0 will-change-transform" />
    </div>
  )
}
