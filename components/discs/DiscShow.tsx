'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createGridDiscs } from '@/components/archive/gallery/gridDiscScene'
import { CenteredDisc } from '@/components/discs/CenteredDisc'
import { SideDisc } from '@/components/discs/SideDisc'
import { withBasePath } from '@/lib/withBasePath'

function Label({ title, note }: { title: string; note: string }) {
  return (
    <div className="pointer-events-none absolute top-4 left-4 z-10 max-w-sm">
      <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-[#5ce1ff] uppercase">{title}</p>
      <p className="mt-1 text-[0.75rem] text-white/70">{note}</p>
    </div>
  )
}

function IdentityStage() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let dispose = () => {}
    let cancelled = false
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    void (async () => {
      if (cancelled) return
      dispose = createGridDiscs(el, reduced, 'studio')
    })()
    return () => {
      cancelled = true
      dispose()
    }
  }, [])
  return <div ref={ref} className="absolute inset-0" />
}

function ModelStage() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const renderer = new WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    el.appendChild(renderer.domElement)

    const scene = new Scene()
    scene.add(new AmbientLight(0xffffff, 0.45))
    const key = new DirectionalLight(0xffffff, 1.6)
    key.position.set(2, 3, 4)
    scene.add(key)
    const camera = new PerspectiveCamera(35, 1, 0.01, 200)
    camera.position.set(0, 0, 4)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enablePan = false
    controls.enableZoom = false
    controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    controls.autoRotateSpeed = 0.7

    const loader = new GLTFLoader()
    loader.load(withBasePath('/models/grid-disc.glb'), (gltf) => {
      const root = gltf.scene
      root.updateMatrixWorld(true)
      const raw = new Box3().setFromObject(root).getSize(new Vector3())
      const thin = [raw.x, raw.y, raw.z].indexOf(Math.min(raw.x, raw.y, raw.z))
      if (thin === 1) root.rotation.x = -Math.PI / 2
      else if (thin === 0) root.rotation.y = Math.PI / 2
      root.updateMatrixWorld(true)
      const box = new Box3().setFromObject(root)
      root.position.sub(box.getCenter(new Vector3()))
      const size = box.getSize(new Vector3())
      const span = Math.max(size.x, size.y, size.z) || 1
      const dist = (span / 2) / Math.tan((35 * Math.PI) / 360) * 1.45
      camera.near = Math.max(dist / 200, 0.01)
      camera.far = dist * 20
      camera.position.set(0, 0, dist)
      camera.updateProjectionMatrix()
      controls.target.set(0, 0, 0)
      controls.update()
      scene.add(root)
    })

    const resize = () => {
      const w = el.clientWidth || 1
      const h = el.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    renderer.setAnimationLoop(() => {
      controls.update()
      renderer.render(scene, camera)
    })
    return () => {
      renderer.setAnimationLoop(null)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])
  return <div ref={ref} className="absolute inset-0" />
}

const STAGES = [
  {
    id: 'centered',
    label: 'Centered',
    title: '01 · Centered SVG',
    note: 'The first grid background. One disc, a gap at the top, speck bands, ticks.',
    body: <CenteredDisc />,
  },
  {
    id: 'side',
    label: 'Side',
    title: '02 · Side SVG',
    note: 'The current grid. White half on the left, orange neon on the right. Hover tips the one under the pointer.',
    body: <SideDisc />,
  },
  {
    id: 'identity',
    label: 'Identity',
    title: '03 · Identity disc',
    note: 'Three.js casing. Thick rim, recessed face, cyan channels on the front only. It turns so the edge shows.',
    body: <IdentityStage />,
  },
  {
    id: 'blender',
    label: 'Blender',
    title: '04 · Blender model',
    note: 'The photo disc as a GLB. Drag to turn it. The back is a plain dark cap.',
    body: <ModelStage />,
  },
] as const

export function DiscShow() {
  const [hash, setHash] = useState('')

  useEffect(() => {
    const read = () => setHash(window.location.hash)
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])

  return (
    <main className="bg-[#0d0d0d] pt-24 text-white">
      <nav
        aria-label="Disc versions"
        className="fixed inset-x-0 top-14 z-40 flex h-10 items-center gap-1 border-b border-white/10 bg-[#0d0d0d]/92 px-3 backdrop-blur-md"
      >
        {STAGES.map((stage) => {
          const current = hash === `#${stage.id}` || (hash === '' && stage.id === 'centered')
          return (
            <a
              key={stage.id}
              href={`#${stage.id}`}
              aria-current={current ? 'true' : undefined}
              className={`px-2.5 py-1 text-[0.72rem] font-medium tracking-wide ${
                current ? 'text-[#5ce1ff]' : 'text-white/55 hover:text-white'
              }`}
            >
              {stage.label}
            </a>
          )
        })}
      </nav>
      {STAGES.map((stage) => (
        <section
          key={stage.id}
          id={stage.id}
          className="relative h-[calc(100dvh-6rem)] scroll-mt-24 overflow-hidden border-b border-white/10 last:border-b-0"
        >
          <Label title={stage.title} note={stage.note} />
          {stage.body}
        </section>
      ))}
    </main>
  )
}
