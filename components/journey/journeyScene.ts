import {
  Color,
  FogExp2,
  NeutralToneMapping,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import { BEATS, cameraAt, range, smoothstep, type Vec3 } from './path'
import { createEnvironment } from './scene/environment'
import { VOID, createFog, type Part } from './scene/shared'

export type JourneyOptions = { small: boolean }

export type JourneyScene = {
  setProgress: (p: number) => void
  /** Strength of the white-cyan flash as the camera crosses the monitor glass. */
  flash: (p: number) => number
  dispose: () => void
}

/** Fog density along the ride: clear room, thicker Grid, clear again at home. */
function fogAt(p: number) {
  const inGrid = smoothstep(0.2, 0.3, p) * (1 - smoothstep(0.88, 0.97, p))
  return 0.022 + inGrid * 0.016
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

  const scene = new Scene()
  scene.background = new Color(VOID)
  const fog = createFog()
  scene.fog = new FogExp2(VOID, fog.uFogDensity.value)

  const camera = new PerspectiveCamera(48, 1, 0.03, 420)
  const env = createEnvironment(scene, camera, fog)
  const parts: Part[] = []

  // --- State ---------------------------------------------------------------
  let progress = 0
  const pos: Vec3 = [0, 0, 0]
  const look: Vec3 = [0, 0, 0]
  const start = performance.now()

  const place = (p: number) => {
    cameraAt(p, pos, look)
    camera.position.set(pos[0], pos[1], pos[2])
    camera.lookAt(look[0], look[1], look[2])
  }

  const resize = () => {
    const w = container.clientWidth || window.innerWidth
    const h = container.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // Portrait screens widen the lens so the desk still fits.
    camera.fov = camera.aspect < 0.8 ? 64 : camera.aspect < 1.2 ? 56 : 48
    camera.updateProjectionMatrix()
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
      const d = (p - BEATS.screen) / 0.018
      return Math.exp(-d * d) * 0.95
    },
    dispose() {
      stopLoop()
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
