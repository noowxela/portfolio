import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  type PerspectiveCamera,
} from 'three'
import { EMBER, TRON } from './shared'

/**
 * The hero's mosaic name ("alex woon" in short cyan strokes) rebuilt inside
 * the journey scene, so the page keeps a single WebGL context. Same grid as
 * the home mosaic: 112 columns, cells 1 × 0.62, strokes 0.78 × 0.26.
 */

const COLS = 112
const CELL_H = 0.62
const SAMPLE_PX = 12
const SLICES = 2

function sample(text: string, fontFamily: string) {
  const width = COLS * SAMPLE_PX
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return { cells: [] as [number, number][], rows: 0 }
  probe.font = `600 100px ${fontFamily}`
  const fontSize = Math.floor((100 * width * 0.94) / (probe.measureText(text).width || 1))
  const rowPx = SAMPLE_PX * CELL_H
  const rows = Math.ceil((fontSize * 1.05) / rowPx)
  const c = document.createElement('canvas')
  c.width = width
  c.height = Math.ceil(rows * rowPx)
  const ctx = c.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { cells: [], rows: 0 }
  ctx.fillStyle = '#fff'
  ctx.font = `600 ${fontSize}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, c.height / 2 + fontSize * 0.04)
  const { data } = ctx.getImageData(0, 0, c.width, c.height)
  const cells: [number, number][] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      let sum = 0
      let n = 0
      for (let y = Math.floor(row * rowPx + rowPx * 0.2); y <= Math.min(c.height - 1, row * rowPx + rowPx * 0.8); y += 2) {
        for (let x = Math.floor(col * SAMPLE_PX + SAMPLE_PX * 0.2); x <= col * SAMPLE_PX + SAMPLE_PX * 0.8; x += 2) {
          sum += data[(y * c.width + x) * 4 + 3]
          n++
        }
      }
      if (n && sum / n > 110) cells.push([col, row])
    }
  }
  return { cells, rows }
}

export function createName(text: string, fontFamily: string, camera: PerspectiveCamera) {
  const group = new Group()
  const inner = new Group()
  group.add(inner)
  const { cells, rows } = sample(text, fontFamily)
  const geo = new BoxGeometry(0.78, 0.26, 0.32)
  const mat = new MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  })
  const count = Math.max(1, cells.length * SLICES)
  const mesh = new InstancedMesh(geo, mat, count)
  const m = new Matrix4()
  const tron = new Color(TRON)
  const ember = new Color(EMBER)
  const tmp = new Color()
  let i = 0
  for (const [col, row] of cells) {
    const jitter = Math.abs((Math.sin(col * 12.9898 + row * 78.233) * 43758.5453) % 1)
    for (let s = 0; s < SLICES; s++) {
      m.makeTranslation(col - (COLS - 1) / 2, ((rows - 1) / 2 - row) * CELL_H, -s * 0.55 + jitter * 0.18)
      mesh.setMatrixAt(i, m)
      const b = (s === 0 ? 1 : 0.32) * (0.82 + jitter * 0.18)
      tmp.copy(tron).lerp(ember, 0.25 * jitter).multiplyScalar(b)
      mesh.setColorAt(i, tmp)
      i++
    }
  }
  mesh.count = i
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  inner.add(mesh)

  // Rest spot in the opening view: above the monitor, toward the horizon.
  const REST = { y: 2.9, z: -16 }
  group.position.set(0, REST.y, REST.z)

  return {
    group,
    update(opacity: number, time: number) {
      group.visible = opacity > 0.003
      mat.opacity = opacity
      // Keep the name about 43% of the view wide, like the home hero (narrower on portrait).
      const dist = 19.4
      const viewH = 2 * dist * Math.tan((camera.fov * Math.PI) / 360)
      const viewW = viewH * camera.aspect
      const width = Math.min(viewW * (camera.aspect < 1 ? 0.84 : 0.43), 12)
      inner.scale.setScalar(width / COLS)
      // The home mosaic floats 10px over ~4.5 s.
      inner.position.y = Math.sin((time / 4.5) * Math.PI * 2) * 0.08
    },
    dispose() {
      geo.dispose()
      mat.dispose()
      mesh.dispose()
    },
  }
}
