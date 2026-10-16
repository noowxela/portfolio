import {
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  Clock,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Path,
  PerspectiveCamera,
  PointLight,
  Raycaster,
  Scene,
  Shape,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
  type Material,
} from 'three'

const CYAN = 0x5ce1ff

type Disc = {
  group: Group
  grooves: Group
  sweep: Group
  glow: MeshStandardMaterial
  baseYaw: number
  yaw: number
  hover: number
}

function cylinder(radius: number, height: number, material: Material, z: number) {
  const mesh = new Mesh(new CylinderGeometry(radius, radius, height, 96), material)
  mesh.rotation.x = Math.PI / 2
  mesh.position.z = z
  return mesh
}

function annulus(outer: number, inner: number, depth: number, material: Material, z: number) {
  const shape = new Shape()
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false)
  const hole = new Path()
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const mesh = new Mesh(
    new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.015,
      bevelSegments: 2,
      curveSegments: 72,
    }),
    material,
  )
  mesh.position.z = z - depth / 2
  return mesh
}

function band(radius: number, tube: number, material: Material, z: number) {
  const mesh = new Mesh(new TorusGeometry(radius, tube, 12, 96), material)
  mesh.position.z = z
  return mesh
}

/** Identity disc: thick casing, beveled rim, cyan channels inset in the front face. */
function identityDisc(yaw: number): Disc {
  const group = new Group()
  const graphite = new MeshStandardMaterial({ color: 0x14161a, metalness: 0.72, roughness: 0.46 })
  const recess = new MeshStandardMaterial({ color: 0x07080a, metalness: 0.35, roughness: 0.62 })
  const metal = new MeshStandardMaterial({ color: 0x3a4048, metalness: 0.9, roughness: 0.22 })
  const glow = new MeshStandardMaterial({
    color: 0x062830,
    emissive: CYAN,
    emissiveIntensity: 2.4,
    roughness: 0.3,
  })

  const body = cylinder(0.82, 0.08, graphite, 0)
  const rim = annulus(1, 0.86, 0.12, metal, 0)
  const frontChamfer = band(0.97, 0.028, metal, 0.052)
  const backChamfer = band(0.97, 0.028, metal, -0.052)
  const face = cylinder(0.8, 0.016, graphite, 0.05)
  const well = cylinder(0.5, 0.012, recess, 0.046)
  const hub = cylinder(0.14, 0.028, metal, 0.064)

  const channels = new Group()
  for (const radius of [0.76, 0.6, 0.34]) {
    channels.add(band(radius, 0.02, recess, 0.05))
    channels.add(band(radius, 0.007, glow, 0.058))
    const halo = band(
      radius,
      0.02,
      new MeshBasicMaterial({
        color: CYAN,
        transparent: true,
        opacity: 0.22,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
      0.056,
    )
    channels.add(halo)
  }
  channels.add(band(0.2, 0.01, glow, 0.066))

  const spokes = new Group()
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const spoke = new Mesh(new BoxGeometry(0.22, 0.012, 0.008), metal)
    spoke.position.set(Math.cos(angle) * 0.36, Math.sin(angle) * 0.36, 0.06)
    spoke.rotation.z = angle
    spokes.add(spoke)
  }
  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2
    const segment = new Mesh(new BoxGeometry(0.012, 0.04, 0.008), glow)
    segment.position.set(Math.cos(angle) * 0.76, Math.sin(angle) * 0.76, 0.062)
    segment.rotation.z = angle
    spokes.add(segment)
  }

  const back = cylinder(0.9, 0.012, recess, -0.058)
  const backGroove = band(0.42, 0.012, metal, -0.066)

  const sweep = new Group()
  const spark = new Mesh(
    new BoxGeometry(0.016, 0.07, 0.01),
    new MeshBasicMaterial({ color: 0xe8fdff }),
  )
  spark.position.set(0.76, 0, 0.066)
  sweep.add(spark)

  group.add(body, rim, frontChamfer, backChamfer, face, well, hub, channels, spokes, back, backGroove, sweep)
  group.traverse((obj) => {
    obj.userData.disc = group
  })

  return { group, grooves: spokes, sweep, glow, baseYaw: yaw, yaw, hover: 0 }
}

function paint(disc: Disc, dark: boolean) {
  disc.glow.emissiveIntensity = dark ? 2.4 : 3.2
}

/** Two lit half-discs, or one disc in the middle when mode is studio. */
export function createGridDiscs(
  el: HTMLElement,
  reducedMotion: boolean,
  mode: 'edges' | 'studio' = 'edges',
): () => void {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  el.appendChild(renderer.domElement)

  const scene = new Scene()
  const camera = new PerspectiveCamera(35, 1, 0.1, 50)
  camera.position.set(0, 0, 8)

  scene.add(new AmbientLight(0xffffff, 0.38))
  const key = new DirectionalLight(0xffffff, 1.7)
  key.position.set(0, 1.4, 6)
  scene.add(key)
  const neonLight = new PointLight(CYAN, 4, 9, 2)
  scene.add(neonLight)

  const discs = mode === 'studio' ? [identityDisc(0.55)] : [identityDisc(0.85), identityDisc(-0.85)]
  const left = discs[0]
  const right = discs[1] ?? null
  for (const disc of discs) scene.add(disc.group)

  const dark = () => document.documentElement.classList.contains('dark')
  const apply = () => {
    paint(left, dark())
    if (right) paint(right, dark())
  }
  apply()

  const resize = () => {
    const w = el.clientWidth || 1
    const h = el.clientHeight || 1
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    const halfH = Math.tan((35 * Math.PI) / 180 / 2) * camera.position.z
    const halfW = halfH * camera.aspect
    const diameter = mode === 'studio' ? Math.min(halfH, halfW) * 1.35 : Math.min(halfH * 1.7, halfW * 1.05)
    const scale = diameter / 2
    if (mode === 'studio') {
      left.group.scale.setScalar(scale)
      left.group.position.set(0, 0, 0)
      neonLight.position.set(0, 0.4, 2)
      return
    }
    for (const disc of discs) disc.group.scale.setScalar(scale)
    left.group.position.set(-halfW, 0, 0)
    right?.group.position.set(halfW, 0, 0)
    neonLight.position.set(halfW * 0.65, 0, 2)
  }
  resize()

  const raycaster = new Raycaster()
  const pointer = new Vector2()
  const clock = new Clock()
  let sweep = 0

  const onPointer = (event: PointerEvent) => {
    const rect = el.getBoundingClientRect()
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    ) {
      for (const disc of discs) disc.hover = 0
      return
    }
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(discs.map((disc) => disc.group), true)
    const hit = hits[0]?.object.userData.disc as Group | undefined
    for (const disc of discs) disc.hover = hit === disc.group ? 1 : 0
  }

  const tick = () => {
    const dt = clock.getDelta()
    if (!reducedMotion && !document.hidden) {
      const fast = discs.some((disc) => disc.hover > 0)
      sweep += dt * (fast ? 1.9 : 0.62)
      if (mode === 'studio') left.yaw += dt * 0.35
      else {
        left.grooves.rotation.z += dt * 0.12
        if (right) right.grooves.rotation.z -= dt * 0.08
      }
    }
    for (const disc of discs) {
      disc.sweep.rotation.z = sweep
      const target = disc.baseYaw + disc.hover * (disc.baseYaw >= 0 ? 0.28 : -0.28)
      if (mode !== 'studio') disc.yaw += (target - disc.yaw) * 0.08
      disc.group.rotation.y = disc.yaw
    }
    renderer.render(scene, camera)
  }

  const ro = new ResizeObserver(resize)
  ro.observe(el)
  window.addEventListener('pointermove', onPointer)
  const theme = new MutationObserver(apply)
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  renderer.setAnimationLoop(tick)

  return () => {
    renderer.setAnimationLoop(null)
    ro.disconnect()
    theme.disconnect()
    window.removeEventListener('pointermove', onPointer)
    scene.traverse((obj) => {
      if (obj instanceof Mesh) {
        obj.geometry.dispose()
        const material = obj.material as Material | Material[]
        if (Array.isArray(material)) material.forEach((item) => item.dispose())
        else material.dispose()
      }
    })
    renderer.dispose()
    renderer.domElement.remove()
  }
}
