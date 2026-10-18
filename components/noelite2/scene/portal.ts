import {
  AdditiveBlending,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  RingGeometry,
  ShaderMaterial,
  type BufferGeometry,
  type WebGLRenderer,
} from 'three'
import { createNeon, neonLook } from '@/components/discs/discNeon'
import { BODY_R, HOLLOW_R, bodyTexture, palette } from '@/components/discs/discTextures'
import { PORTAL_R, PORTAL_Y, PORTAL_Z } from '../path'
import { CLU, TRON } from './shared'

/**
 * Act 3: the hollow 02 v3 neon disc as a ring portal. Built from Alex's disc
 * modules (discNeon strips, discTextures body and palette) without touching
 * them; Disc3D itself owns a renderer, so the journey re-assembles the same
 * parts in its own single context. It stands at the end of the road at the
 * 02 v3 resting tilt (30°) and turns square to the camera as it opens.
 */

const THICK = 0.03
const BEVEL = THICK / 2
const HOLLOW = HOLLOW_R / BODY_R
const TILT = (30 * Math.PI) / 180
const OUTER_SPIN = (Math.PI * 2) / 64
const INNER_SPIN = (Math.PI * 2) / 92

function planarUV(geo: BufferGeometry) {
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * 0.5 + 0.5, pos.getY(i) * 0.5 + 0.5)
  uv.needsUpdate = true
  return geo
}

const VEIL_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/** The membrane inside the hollow: rings rippling inward, gone once you are close. */
const VEIL_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uCore;
uniform float uTime;
uniform float uAlpha;
varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  float rings = 0.5 + 0.5 * sin(r * 26.0 + uTime * 5.0);
  rings = pow(rings, 6.0);
  float edge = smoothstep(0.55, 1.0, r);
  vec3 col = mix(uCore, uColor, r) * (rings * 0.55 + edge * 0.8) + uCore * (1.0 - r) * 0.25;
  gl_FragColor = vec4(col * uAlpha, 1.0);
}
`

export function createPortal(renderer: WebGLRenderer) {
  const group = new Group()
  group.position.set(0, PORTAL_Y, PORTAL_Z)
  const rig = new Group()
  const spinner = new Group()
  rig.add(spinner)
  group.add(rig)

  const aniso = renderer.capabilities.getMaxAnisotropy()
  const map = bodyTexture('neon', true, 512, aniso)
  const face = new MeshStandardMaterial({ map, roughness: 0.38, metalness: 0.15 })
  const edge = new MeshStandardMaterial({ color: palette('neon', true).rim, roughness: 0.28, side: DoubleSide })

  const geos = {
    face: planarUV(new RingGeometry(HOLLOW + BEVEL, 1 - BEVEL, 192, 1)),
    back: planarUV(new RingGeometry(HOLLOW + BEVEL, 1 - BEVEL, 192, 1)),
    rim: new CylinderGeometry(1, 1, THICK, 160, 1, true),
    core: new CylinderGeometry(HOLLOW, HOLLOW, THICK, 120, 1, true),
    veil: new CircleGeometry(HOLLOW, 96),
  }
  geos.face.translate(0, 0, THICK / 2)
  geos.back.rotateY(Math.PI)
  geos.back.translate(0, 0, -THICK / 2)
  geos.rim.rotateX(Math.PI / 2)
  geos.core.rotateX(Math.PI / 2)

  const neon = createNeon('neon', THICK / 2)
  neon.setLook(neonLook('neon', true))
  const baseIntensity = neon.material.emissiveIntensity
  const baseGlow = neon.glow.uniforms.uStrength.value as number

  const veilMat = new ShaderMaterial({
    vertexShader: VEIL_VERT,
    fragmentShader: VEIL_FRAG,
    uniforms: {
      uColor: { value: new Color(CLU) },
      uCore: { value: new Color(TRON) },
      uTime: { value: 0 },
      uAlpha: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  })
  const veil = new Mesh(geos.veil, veilMat)

  spinner.add(
    new Mesh(geos.face, face),
    new Mesh(geos.back, face),
    new Mesh(geos.rim, edge),
    new Mesh(geos.core, edge),
    neon.group,
  )
  rig.add(veil)
  rig.scale.setScalar(PORTAL_R)

  const key = new DirectionalLight('#ffe2c8', 1.6)
  key.position.set(-4, 6, 10)
  const fill = new PointLight(CLU, 6, 22, 1.4)
  fill.position.set(0, -2, 4)
  group.add(key, key.target, fill)

  return {
    group,
    /** open: 0 closed..1 fully open; near: 0..1 as the camera reaches the hollow. */
    update(open: number, near: number, time: number) {
      group.visible = open > 0.002
      if (!group.visible) return
      const e = open * open * (3 - 2 * open)
      rig.scale.setScalar(PORTAL_R * (0.04 + 0.96 * e))
      rig.rotation.y = TILT * (1 - e)
      spinner.rotation.z = (1 - e) * Math.PI * 1.4 + time * 0.08
      neon.outer.rotation.z = time * OUTER_SPIN
      neon.inner.rotation.z = -time * INNER_SPIN
      neon.material.emissiveIntensity = baseIntensity * (0.3 + 0.9 * e + near * 0.6)
      neon.glow.uniforms.uStrength.value = baseGlow * (0.4 + 0.8 * e + near)
      veilMat.uniforms.uTime.value = time
      veilMat.uniforms.uAlpha.value = e * (1 - near) * 0.9
      fill.intensity = 6 * e
    },
    dispose() {
      map.dispose()
      face.dispose()
      edge.dispose()
      for (const g of Object.values(geos)) g.dispose()
      neon.dispose()
      veilMat.dispose()
    },
  }
}
