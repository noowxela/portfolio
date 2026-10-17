import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  type PerspectiveCamera,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CITY_END, CITY_START, ROAD_END, ROAD_START, roadX } from '../path'
import { CLU, EMBER, FOG_GLSL, TRON, type FogUniforms } from './shared'

/**
 * Act 2: the neon city. Everything is procedural and drawn in a handful of
 * draw calls: one instanced box mesh for every tower (edges and window bands
 * are drawn in the shader), one road strip, instanced light cycles with
 * light-wall trails, and instanced gates over the road.
 */

const ROAD_W = 3.2

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// --- Towers -----------------------------------------------------------------

const TOWER_VERT = /* glsl */ `
attribute vec3 aOffset;
attribute vec3 aSize;
attribute vec3 aColor;
attribute float aSeed;
uniform float uCamZ;
uniform float uRise;
varying vec3 vColor;
varying vec3 vWorld;
varying vec2 vFace;
varying vec2 vDim;
varying float vSide;
varying float vSeed;
void main() {
  // Towers grow out of the grid as the ride reaches them.
  float ahead = uCamZ - aOffset.z;
  float grow = 1.0 - smoothstep(55.0, 95.0, ahead);
  grow *= uRise;
  grow = max(grow, 0.001);
  vec3 size = vec3(aSize.x, aSize.y * grow, aSize.z);
  vec3 p = aOffset + position * size;
  vec3 n = abs(normal);
  vDim = n.x > 0.5 ? size.zy : n.y > 0.5 ? size.xz : size.xy;
  vFace = uv * vDim;
  vSide = 1.0 - n.y;
  vColor = aColor;
  vSeed = aSeed;
  vec4 world = modelMatrix * vec4(p, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const TOWER_FRAG = /* glsl */ `
${FOG_GLSL}
varying vec3 vColor;
varying vec3 vWorld;
varying vec2 vFace;
varying vec2 vDim;
varying float vSide;
varying float vSeed;
float hash(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  vec2 e = min(vFace, vDim - vFace);
  float d = min(e.x, e.y);
  float fw = fwidth(d) + 1e-4;
  float edge = 1.0 - smoothstep(0.02, 0.02 + fw * 1.5, d);
  float halo = exp(-d * 9.0) * 0.35;
  // Window bands on the walls: rows of neon strips, some rows dark.
  float row = floor(vWorld.y * 1.4 + vSeed * 7.0);
  float lit = step(0.45, hash(row + vSeed * 91.0));
  float band = step(fract(vWorld.y * 1.4 + vSeed * 7.0), 0.16) * lit * vSide;
  float cols = step(0.3, fract(vFace.x * 1.6 + vSeed));
  band *= cols;
  vec3 body = vec3(0.006, 0.01, 0.016) + vColor * 0.025;
  vec3 col = body + vColor * (edge * 1.5 + halo + band * 0.55);
  // Roofs catch a little more light.
  col += vColor * (1.0 - vSide) * 0.04;
  float dist = length(vWorld - cameraPosition);
  // Thinner fog up high, so the far skyline still reads over the haze.
  float fogK = fogAmount(dist) * mix(1.0, 0.45, smoothstep(3.0, 40.0, vWorld.y));
  col = mix(col, uFogColor, fogK);
  gl_FragColor = vec4(col, 1.0);
}
`

function createTowers(fog: FogUniforms, small: boolean) {
  const rand = rng(20261017)
  const near = small ? 200 : 460
  const far = small ? 50 : 130
  const total = near + far
  const offset = new Float32Array(total * 3)
  const size = new Float32Array(total * 3)
  const color = new Float32Array(total * 3)
  const seed = new Float32Array(total)
  const palette = [new Color(TRON), new Color(TRON), new Color(TRON), new Color(EMBER), new Color(CLU)]
  const weights = [0.32, 0.25, 0.15, 0.18, 0.1]
  const pick = () => {
    let r = rand()
    for (let i = 0; i < weights.length; i++) {
      if ((r -= weights[i]) <= 0) return palette[i]
    }
    return palette[0]
  }
  for (let i = 0; i < total; i++) {
    const isFar = i >= near
    const z = CITY_START - 4 - rand() * (CITY_START - CITY_END - 8)
    const side = rand() < 0.5 ? -1 : 1
    const w = isFar ? 4 + rand() * 8 : 1 + rand() * 3.4
    const dd = isFar ? 4 + rand() * 8 : 1 + rand() * 3.4
    const gap = isFar ? 55 + rand() * 90 : ROAD_W / 2 + 1.6 + w / 2 + Math.pow(rand(), 1.6) * 42
    const x = roadX(z) + side * gap
    const h = isFar ? 18 + rand() * 46 : 1.5 + Math.pow(rand(), 2.2) * 16 + gap * 0.22
    offset.set([x, 0, z], i * 3)
    size.set([w, h, dd], i * 3)
    const c = pick().clone().multiplyScalar(isFar ? 0.7 : 0.75 + rand() * 0.35)
    color.set([c.r, c.g, c.b], i * 3)
    seed[i] = rand()
  }
  const box = new BoxGeometry(1, 1, 1)
  box.translate(0, 0.5, 0)
  const geo = new InstancedBufferGeometry()
  geo.index = box.index
  geo.setAttribute('position', box.attributes.position)
  geo.setAttribute('normal', box.attributes.normal)
  geo.setAttribute('uv', box.attributes.uv)
  geo.setAttribute('aOffset', new InstancedBufferAttribute(offset, 3))
  geo.setAttribute('aSize', new InstancedBufferAttribute(size, 3))
  geo.setAttribute('aColor', new InstancedBufferAttribute(color, 3))
  geo.setAttribute('aSeed', new InstancedBufferAttribute(seed, 1))
  geo.instanceCount = total
  const mat = new ShaderMaterial({
    vertexShader: TOWER_VERT,
    fragmentShader: TOWER_FRAG,
    uniforms: { ...fog, uCamZ: { value: 0 }, uRise: { value: 0 } },
  })
  const mesh = new Mesh(geo, mat)
  mesh.frustumCulled = false
  return {
    mesh,
    mat,
    dispose() {
      box.dispose()
      geo.dispose()
      mat.dispose()
    },
  }
}

// --- Road -------------------------------------------------------------------

const ROAD_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const ROAD_FRAG = /* glsl */ `
${FOG_GLSL}
uniform vec3 uColor;
uniform vec3 uHot;
uniform float uTime;
uniform float uOn;
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  float u = abs(vUv.x);
  float z = vUv.y;
  float fw = fwidth(u) + 1e-4;
  float edge = smoothstep(0.93 - fw, 0.95, u) * (1.0 - smoothstep(0.985, 1.0, u));
  float edgeGlow = exp(-(1.0 - u) * 14.0) * 0.6;
  float lane = (1.0 - smoothstep(0.012, 0.012 + fw * 1.5, abs(u - 0.5))) * 0.35;
  float dash = step(fract(z * 0.22), 0.45) * (1.0 - smoothstep(0.015, 0.015 + fw * 1.5, u));
  // Light pulses racing down the road.
  float pulse = exp(-pow((fract((z + uTime * 26.0) / 48.0) - 0.5) * 22.0, 2.0));
  vec3 col = vec3(0.004, 0.008, 0.012);
  col += uColor * (edge * 1.7 + edgeGlow + lane + dash * 0.9);
  col += uHot * pulse * (edge + edgeGlow) * 0.9;
  col *= uOn;
  float dist = length(vWorld - cameraPosition);
  col = mix(col, uFogColor, fogAmount(dist));
  gl_FragColor = vec4(col, 1.0);
}
`

function createRoad(fog: FogUniforms) {
  const steps = 520
  const pos = new Float32Array((steps + 1) * 2 * 3)
  const uv = new Float32Array((steps + 1) * 2 * 2)
  const index: number[] = []
  let along = 0
  let prevX = roadX(ROAD_START)
  let prevZ = ROAD_START
  for (let i = 0; i <= steps; i++) {
    const z = ROAD_START + ((ROAD_END - ROAD_START) * i) / steps
    const x = roadX(z)
    const dz = -0.5
    const dx = roadX(z + dz) - x
    const len = Math.hypot(dx, dz)
    // Normal to the road direction, in the floor plane.
    const nx = -dz / len
    const nz = dx / len
    along += Math.hypot(x - prevX, z - prevZ)
    prevX = x
    prevZ = z
    for (let s = 0; s < 2; s++) {
      const side = s === 0 ? -1 : 1
      const k = i * 2 + s
      pos.set([x + nx * side * (ROAD_W / 2), 0.012, z + nz * side * (ROAD_W / 2)], k * 3)
      uv.set([side, along], k * 2)
    }
    if (i < steps) {
      const a = i * 2
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(pos, 3))
  geo.setAttribute('uv', new BufferAttribute(uv, 2))
  geo.setIndex(index)
  geo.computeVertexNormals()
  const mat = new ShaderMaterial({
    vertexShader: ROAD_VERT,
    fragmentShader: ROAD_FRAG,
    uniforms: {
      ...fog,
      uColor: { value: new Color(TRON) },
      uHot: { value: new Color(EMBER) },
      uTime: { value: 0 },
      uOn: { value: 0 },
    },
    side: DoubleSide,
  })
  const mesh = new Mesh(geo, mat)
  mesh.frustumCulled = false
  return {
    mesh,
    mat,
    dispose() {
      geo.dispose()
      mat.dispose()
    },
  }
}

// --- Light cycles ------------------------------------------------------------

const TRAIL_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vColor;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vColor = instanceColor;
  vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const TRAIL_FRAG = /* glsl */ `
${FOG_GLSL}
uniform float uOn;
varying vec2 vUv;
varying vec3 vColor;
varying vec3 vWorld;
void main() {
  // uv.x: 0 at the tail, 1 at the bike. uv.y: 0 at the floor, 1 at the top.
  float fade = pow(vUv.x, 1.6);
  float core = exp(-pow((vUv.y - 0.5) * 3.2, 2.0));
  float top = smoothstep(0.86, 1.0, vUv.y) * 1.4;
  vec3 col = vColor * (fade * (0.45 + core * 0.5 + top));
  float dist = length(vWorld - cameraPosition);
  col *= (1.0 - fogAmount(dist)) * uOn;
  gl_FragColor = vec4(col, 1.0);
}
`

type Cycle = { lane: number; speed: number; phase: number }

function createCycles(fog: FogUniforms, small: boolean) {
  const rand = rng(7)
  const n = small ? 6 : 12
  const cycles: Cycle[] = Array.from({ length: n }, (_, i) => ({
    lane: [-1.3, 1.0, -1.0, 1.3][i % 4],
    // Speed relative to the camera: every bike pulls away from it.
    speed: 3 + rand() * 9,
    phase: rand() * 400,
  }))
  const bikeGeo = new BoxGeometry(0.16, 0.16, 0.62)
  bikeGeo.translate(0, 0.1, 0)
  const bikeMat = new MeshBasicMaterial({ toneMapped: false })
  const bikes = new InstancedMesh(bikeGeo, bikeMat, n)
  const TRAIL = 9
  const trailGeo = new PlaneGeometry(TRAIL, 0.42)
  // Plane in the YZ plane, from the bike back along +z.
  trailGeo.rotateY(Math.PI / 2)
  trailGeo.translate(0, 0.21, TRAIL / 2 + 0.3)
  const trailMat = new ShaderMaterial({
    vertexShader: TRAIL_VERT,
    fragmentShader: TRAIL_FRAG,
    uniforms: { ...fog, uOn: { value: 0 } },
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const trails = new InstancedMesh(trailGeo, trailMat, n)
  const colors = [new Color(TRON), new Color(EMBER), new Color(TRON), new Color(CLU)]
  for (let i = 0; i < n; i++) {
    const c = colors[i % colors.length].clone()
    bikes.setColorAt(i, c.clone().multiplyScalar(1.6))
    trails.setColorAt(i, c)
  }
  bikes.frustumCulled = false
  trails.frustumCulled = false
  const o = new Object3D()
  const tmp = new Color()
  /**
   * Bikes live in a window ahead of the camera: they fade in at MIN units ahead
   * (their trail tail still well clear), pull away, and fade out into the haze
   * at MAX before wrapping. They also fade out before the end of the road.
   */
  const MIN = 14
  const MAX = 110
  return {
    group: [bikes, trails],
    update(time: number, on: number, camZ: number) {
      trailMat.uniforms.uOn.value = on
      for (let i = 0; i < n; i++) {
        const c = cycles[i]
        const ahead = MIN + ((c.phase + time * c.speed) % (MAX - MIN))
        const z = Math.min(ROAD_START, camZ - ahead)
        const fade =
          smooth(MIN, MIN + 10, ahead) * (1 - smooth(MAX - 22, MAX, ahead)) * smooth(ROAD_END + 6, ROAD_END + 30, z)
        const x = roadX(z)
        const dx = roadX(z - 0.6) - x
        const yaw = Math.atan2(-dx, 0.6)
        const nx = Math.cos(yaw)
        const nz = -Math.sin(yaw)
        o.position.set(x + nx * c.lane, 0, z + nz * c.lane)
        o.rotation.set(0, yaw, 0)
        o.scale.setScalar(on > 0.01 && fade > 0.002 ? 1 : 0.0001)
        o.updateMatrix()
        bikes.setMatrixAt(i, o.matrix)
        trails.setMatrixAt(i, o.matrix)
        const base = colors[i % colors.length]
        bikes.setColorAt(i, tmp.copy(base).multiplyScalar(1.6 * fade))
        trails.setColorAt(i, tmp.copy(base).multiplyScalar(fade))
      }
      bikes.instanceMatrix.needsUpdate = true
      trails.instanceMatrix.needsUpdate = true
      if (bikes.instanceColor) bikes.instanceColor.needsUpdate = true
      if (trails.instanceColor) trails.instanceColor.needsUpdate = true
    },
    dispose() {
      bikeGeo.dispose()
      bikeMat.dispose()
      trailGeo.dispose()
      trailMat.dispose()
      bikes.dispose()
      trails.dispose()
    },
  }
}

// --- Gates --------------------------------------------------------------------

function createGates() {
  const posts = [
    new BoxGeometry(0.07, 4.2, 0.07).translate(-3.1, 2.1, 0),
    new BoxGeometry(0.07, 4.2, 0.07).translate(3.1, 2.1, 0),
    new BoxGeometry(6.27, 0.07, 0.07).translate(0, 4.2, 0),
    new BoxGeometry(5.0, 0.03, 0.03).translate(0, 3.85, 0),
  ]
  const geo = mergeGeometries(posts)
  for (const p of posts) p.dispose()
  const mat = new MeshBasicMaterial({
    color: new Color(TRON).multiplyScalar(1.3),
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
  const zs: number[] = []
  for (let z = -34; z > CITY_END + 10; z -= 21) zs.push(z)
  const mesh = new InstancedMesh(geo, mat, zs.length)
  const m = new Matrix4()
  const o = new Object3D()
  zs.forEach((z, i) => {
    const x = roadX(z)
    const yaw = Math.atan2(-(roadX(z - 0.6) - x), 0.6)
    o.position.set(x, 0, z)
    o.rotation.set(0, yaw, 0)
    o.updateMatrix()
    m.copy(o.matrix)
    mesh.setMatrixAt(i, m)
  })
  mesh.frustumCulled = false
  return {
    mesh,
    mat,
    dispose() {
      geo.dispose()
      mat.dispose()
      mesh.dispose()
    },
  }
}

export function createCity(fog: FogUniforms, camera: PerspectiveCamera, small: boolean) {
  const group = new Group()
  const towers = createTowers(fog, small)
  const road = createRoad(fog)
  const cycles = createCycles(fog, small)
  const gates = createGates()
  group.add(towers.mesh, road.mesh, ...cycles.group, gates.mesh)

  return {
    group,
    /** rise: towers out of the grid (0..1); on: road and traffic lights (0..1). */
    update(rise: number, on: number, time: number) {
      group.visible = on > 0.002 || rise > 0.002
      if (!group.visible) return
      towers.mat.uniforms.uCamZ.value = camera.position.z
      towers.mat.uniforms.uRise.value = rise
      towers.mesh.visible = rise > 0.002
      road.mat.uniforms.uTime.value = time
      road.mat.uniforms.uOn.value = on
      cycles.update(time, on, camera.position.z)
      gates.mat.opacity = rise * 0.9
      gates.mesh.visible = rise > 0.002
    },
    dispose() {
      towers.dispose()
      road.dispose()
      cycles.dispose()
      gates.dispose()
    },
  }
}
