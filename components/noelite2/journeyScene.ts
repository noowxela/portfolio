import {
  Color,
  FogExp2,
  Group,
  NeutralToneMapping,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import { BEATS, END_Z, cameraAt, range, smoothstep, type Vec3 } from './path'
import { createCity } from './scene/city'
import { createDesk } from './scene/desk'
import { createName } from './scene/name'
import { createPortal } from './scene/portal'
import { createEnvironment } from './scene/environment'
import { VOID, createFog, type Part } from './scene/shared'

export type JourneyOptions = {
  small: boolean
  fontFamily: string
  name: string
  /** Called if the GPU drops the context; the page then shows the 2D hero. */
  onLost?: () => void
}

export type JourneyScene = {
  setProgress: (p: number) => void
  /** Strength of the white-cyan flash as the camera crosses the monitor glass. */
  flash: (p: number) => number
  dispose: () => void
}

/** Fog density along the ride: clear room, thicker Grid, clear again at home. */
function fogAt(p: number) {
  const inGrid = smoothstep(0.2, 0.3, p) * (1 - smoothstep(0.88, 0.97, p))
  return 0.022 + inGrid * 0.008
}

export function createJourney(container: HTMLElement, opts: JourneyOptions): JourneyScene | null {
  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({
      antialias: !opts.small,
      alpha: false,
      powerPreference: 'high-performance',
    })
  } catch {
    return null
  }
  const dpr = Math.min(window.devicePixelRatio || 1, opts.small ? 1.5 : 2)
  renderer.setPixelRatio(dpr)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NeutralToneMapping
  renderer.setClearColor(new Color(VOID), 1)
  const canvas = renderer.domElement
  canvas.setAttribute('aria-hidden', 'true')
  container.appendChild(canvas)
  const onLost = (e: Event) => {
    e.preventDefault()
    opts.onLost?.()
  }
  canvas.addEventListener('webglcontextlost', onLost)

  const scene = new Scene()
  scene.background = new Color(VOID)
  const fog = createFog()
  scene.fog = new FogExp2(VOID, fog.uFogDensity.value)

  const camera = new PerspectiveCamera(48, 1, 0.03, 420)
  const env = createEnvironment(scene, camera, fog)
  const parts: Part[] = []

  // The room: desk, monitor and the mosaic name. It opens the ride at the
  // origin and is moved to END_Z for the landing, so the loop closes on the same view.
  const homeSet = new Group()
  const desk = createDesk(fog)
  const name = createName(opts.name, opts.fontFamily, camera)
  homeSet.add(desk.group, name.group)
  scene.add(homeSet)

  // Act 2: the city rises out of the grid, then sinks back as the portal opens.
  const city = createCity(fog, camera, opts.small)
  scene.add(city.group)
  parts.push({
    update(p, time) {
      const rise = range(p, [0.22, 0.32]) * (1 - range(p, [0.76, 0.84]))
      const on = range(p, [0.21, 0.28]) * (1 - range(p, [0.8, 0.86]))
      city.update(rise, on, time)
    },
    dispose: () => city.dispose(),
  })

  // Act 3: the disc portal opens at the end of the road.
  const portal = createPortal(renderer)
  scene.add(portal.group)
  parts.push({
    update(p, time) {
      const open = p < 0.68 || p > 0.875 ? 0 : range(p, BEATS.portalOpen)
      portal.update(open, range(p, [0.82, BEATS.portalPass]), time)
    },
    dispose: () => portal.dispose(),
  })
  parts.push({
    update(p, time) {
      const landing = p >= 0.5
      homeSet.position.z = landing ? END_Z : 0
      homeSet.visible = p < 0.32 || p > 0.8
      if (!homeSet.visible) return
      if (!landing) {
        desk.set(1, 0.18, 1, range(p, [0.05, BEATS.screen]), time)
        name.update(1 - range(p, [0.15, 0.2]), time)
      } else {
        const solid = range(p, BEATS.solid)
        const wire = range(p, [0.84, 0.87]) * (1 - 0.82 * solid)
        // White-hot and wider while the lines gather, cooling to the opening's faint edges.
        const hot = range(p, [0.84, 0.87]) * (1 - range(p, [0.93, 0.985]))
        desk.set(solid, wire, range(p, BEATS.gather), 0, time, hot)
        name.update(range(p, [0.9, 0.985]), time)
      }
    },
    dispose() {
      desk.dispose()
      name.dispose()
    },
  })

  // --- State ---------------------------------------------------------------
  let progress = 0
  const pos: Vec3 = [0, 0, 0]
  const look: Vec3 = [0, 0, 0]
  const start = performance.now()

  // Narrow portrait screens: dolly the opening/closing pose back along the view
  // so the whole desk fits. Same offset at both ends, so the loop still closes.
  let back = 0
  const BACK_DIR: Vec3 = [0, 0.0266, 1]
  const place = (p: number) => {
    cameraAt(p, pos, look)
    const w = back * (1 - smoothstep(0.03, 0.14, p) + smoothstep(0.9, 0.985, p))
    const ox = BACK_DIR[0] * w
    const oy = BACK_DIR[1] * w
    const oz = BACK_DIR[2] * w
    camera.position.set(pos[0] + ox, pos[1] + oy, pos[2] + oz)
    camera.lookAt(look[0] + ox, look[1] + oy, look[2] + oz)
  }

  const resize = () => {
    const w = container.clientWidth || window.innerWidth
    const h = container.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Portrait screens widen the lens so the desk still fits.
    camera.fov = camera.aspect < 0.8 ? 64 : camera.aspect < 1.2 ? 56 : 48
    camera.updateProjectionMatrix()
    // Desk front corners sit 2.88 in front of the start pose and ±0.95 wide; keep ~15% margin.
    const tanH = Math.tan((camera.fov * Math.PI) / 360) * camera.aspect
    back = Math.min(2.5, Math.max(0, 1.12 / tanH - 2.88))
    desk.setViewport(camera.fov, h)
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(container)

  const frame = () => {
    const time = (performance.now() - start) / 1000
    const p = progress
    place(p)

    const density = fogAt(p)
    fog.uFogDensity.value = density
    ;(scene.fog as FogExp2).density = density

    // Room grid (the hero floor) to the glowing Tron grid and back.
    const grid = range(p, BEATS.gridOn) * (1 - range(p, [0.9, 0.98]))
    env.floorUniforms.uIntensity.value = 0.5 + grid * 0.6
    env.floorUniforms.uGlow.value = grid * 0.55
    env.floorUniforms.uPulse.value = grid * 0.9
    env.skyUniforms.uHorizon.value = 0.55 + grid * 0.6
    env.skyUniforms.uDomeStrength.value = 1 - grid
    env.floorUniforms.uHaze.value = env.skyUniforms.uHorizon.value * 0.2
    env.update(time)

    for (const part of parts) part.update(p, time)
    renderer.render(scene, camera)
  }

  // --- Loop: paused while the tab is hidden --------------------------------
  let raf = 0
  const loop = () => {
    raf = requestAnimationFrame(loop)
    frame()
  }
  const startLoop = () => {
    if (!raf && !document.hidden) raf = requestAnimationFrame(loop)
  }
  const stopLoop = () => {
    cancelAnimationFrame(raf)
    raf = 0
  }
  const onVisibility = () => (document.hidden ? stopLoop() : startLoop())
  document.addEventListener('visibilitychange', onVisibility)
  startLoop()

  return {
    setProgress(p) {
      progress = Math.min(1, Math.max(0, p))
    },
    flash(p) {
      // Short and asymmetric: a quick rise just before the crossing, a slightly
      // longer fade after it, so the cut is hidden without a white-out.
      const pulse = (at: number, before: number, after: number) => {
        const d = (p - at) / (p < at ? before : after)
        return Math.exp(-d * d)
      }
      return pulse(BEATS.screen, 0.0045, 0.009) * 0.72 + pulse(BEATS.portalPass, 0.006, 0.009) * 0.38
    },
    dispose() {
      stopLoop()
      canvas.removeEventListener('webglcontextlost', onLost)
      document.removeEventListener('visibilitychange', onVisibility)
      ro.disconnect()
      for (const part of parts) part.dispose()
      env.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
    },
  }
}
