import { Color, type IUniform } from 'three'

export const TRON = '#5ce1ff'
export const EMBER = '#b8f4ff'
export const VOID = '#050507'
export const CLU = '#ff8a24'

/** Fog uniforms shared by every custom shader, updated once per frame. */
export type FogUniforms = {
  uFogColor: IUniform<Color>
  uFogDensity: IUniform<number>
}

export function createFog(): FogUniforms {
  return { uFogColor: { value: new Color(VOID) }, uFogDensity: { value: 0.03 } }
}

export const FOG_GLSL = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogDensity;
float fogAmount(float dist) {
  float d = uFogDensity * dist;
  return 1.0 - exp(-d * d);
}
`

export type Part = {
  update: (p: number, time: number) => void
  dispose: () => void
}
