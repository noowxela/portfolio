import {
  BackSide,
  Color,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type PerspectiveCamera,
  type Scene,
} from 'three'
import { FOG_GLSL, TRON, VOID, type FogUniforms } from './shared'

const FLOOR_VERT = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

const FLOOR_FRAG = /* glsl */ `
${FOG_GLSL}
uniform vec3 uColor;
uniform vec3 uCam;
uniform float uIntensity;
uniform float uGlow;
uniform float uCell;
uniform float uPulse;
uniform float uTime;
uniform float uHaze;
varying vec3 vWorld;
void main() {
  vec2 g = vWorld.xz / uCell;
  vec2 w = fwidth(g);
  vec2 cell = abs(fract(g - 0.5) - 0.5);
  vec2 px = cell / max(w, vec2(1e-4));
  float line = 1.0 - min(min(px.x, px.y), 1.0);
  // Thin lines alias into a wash far away: fade them as cells shrink below a few pixels.
  float fw = max(w.x, w.y);
  float far = 1.0 - smoothstep(0.08, 0.5, fw);
  vec2 d = cell * uCell;
  float glow = exp(-min(d.x, d.y) * 22.0) * uGlow;
  float dist = length(vWorld.xz - uCam.xz);
  // A pulse that runs out from the camera along the grid, Tron-style.
  float ring = exp(-pow((dist - mod(uTime * 9.0, 60.0)) * 0.35, 2.0)) * uPulse;
  float lit = line * uIntensity * mix(0.25, 1.0, far) + glow * far + ring * line;
  vec3 col = uColor * lit;
  col += uColor * 0.018 * uIntensity;
  col = mix(col, uFogColor + uColor * uHaze, fogAmount(dist));
  gl_FragColor = vec4(col, 1.0);
}
`

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;
}
`

const SKY_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uVoid;
uniform vec3 uDome;
uniform float uHorizon;
uniform float uDomeStrength;
varying vec3 vDir;
void main() {
  vec3 dir = normalize(vDir);
  float band = exp(-abs(dir.y - 0.01) * 14.0) * uHorizon;
  float dome = pow(max(dot(dir, normalize(uDome)), 0.0), 18.0) * uDomeStrength;
  vec3 col = uVoid + uColor * (band * 0.22 + dome * 0.16);
  gl_FragColor = vec4(col, 1.0);
}
`

export function createEnvironment(scene: Scene, camera: PerspectiveCamera, fog: FogUniforms) {
  const floorGeo = new PlaneGeometry(700, 700, 1, 1)
  floorGeo.rotateX(-Math.PI / 2)
  const floorMat = new ShaderMaterial({
    vertexShader: FLOOR_VERT,
    fragmentShader: FLOOR_FRAG,
    uniforms: {
      ...fog,
      uColor: { value: new Color(TRON) },
      uCam: { value: new Vector3() },
      uIntensity: { value: 0.55 },
      uGlow: { value: 0 },
      uCell: { value: 1 },
      uPulse: { value: 0 },
      uTime: { value: 0 },
      uHaze: { value: 0.1 },
    },
  })
  const floor = new Mesh(floorGeo, floorMat)
  floor.frustumCulled = false
  floor.renderOrder = -1
  scene.add(floor)

  const skyGeo = new SphereGeometry(1, 32, 16)
  const skyMat = new ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms: {
      uColor: { value: new Color(TRON) },
      uVoid: { value: new Color(VOID) },
      uDome: { value: new Vector3(0, 0.12, -1) },
      uHorizon: { value: 0.6 },
      uDomeStrength: { value: 1 },
    },
    side: BackSide,
    depthWrite: false,
    depthTest: false,
  })
  const sky = new Mesh(skyGeo, skyMat)
  sky.frustumCulled = false
  sky.renderOrder = -10
  sky.scale.setScalar(100)
  scene.add(sky)

  return {
    floorUniforms: floorMat.uniforms,
    skyUniforms: skyMat.uniforms,
    update(time: number) {
      const c = camera.position
      floor.position.set(Math.round(c.x), 0, Math.round(c.z))
      floorMat.uniforms.uCam.value.copy(c)
      floorMat.uniforms.uTime.value = time
      sky.position.copy(c)
    },
    dispose() {
      floorGeo.dispose()
      floorMat.dispose()
      skyGeo.dispose()
      skyMat.dispose()
    },
  }
}
