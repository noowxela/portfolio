import type { EntryId } from './entries'

export type PoseId = 'hello' | EntryId

/**
 * One particle pose: which photo to sample, how to frame it, and how the
 * portrait sits in the scene. Add a pose (or a new photo) here and point an
 * entry at it; the sampler and the morph pick it up without other changes.
 */
export type Pose = {
  /** Public path (withBasePath is applied when loading). */
  image: string
  /** Source crop in 0..1 of the photo: x, y, width, height (y from the top). */
  crop: readonly [number, number, number, number]
  /** Portrait height as a fraction of the stage slot height. */
  height: number
  /** Vertical offset as a fraction of the portrait height (+ is up). */
  offsetY: number
  /** Rotation about X (rad, + leans the top away). */
  tilt: number
  /** Rotation about Y (rad). */
  spin: number
  /** Line-segment length multiplier. */
  lineWidth: number
  /** Z extrusion as a fraction of the portrait height. */
  depth: number
  /** 0 = cyan Tron, 1 = ember red tint. */
  accent: number
}

export const PHOTOS = {
  square: '/portrait/alex-square.webp',
  half: '/portrait/alex-half.webp',
} as const

export const POSES: Record<PoseId, Pose> = {
  // Default "hello": head and shoulders, square-on.
  hello: { image: PHOTOS.square, crop: [0, 0, 1, 1], height: 0.8, offsetY: 0.12, tilt: 0, spin: 0, lineWidth: 1, depth: 0.24, accent: 0 },
  // 01 Work: half body, turned to the right, long streaks.
  work: { image: PHOTOS.half, crop: [0, 0.12, 1, 0.88], height: 0.9, offsetY: 0.02, tilt: 0.06, spin: -0.46, lineWidth: 1.55, depth: 0.3, accent: 0 },
  // 02 Journey: half body turned the other way, ember tint.
  journey: { image: PHOTOS.half, crop: [0.04, 0.18, 0.92, 0.82], height: 0.88, offsetY: 0.03, tilt: -0.1, spin: 0.5, lineWidth: 0.85, depth: 0.32, accent: 0.7 },
  // 03 About: tight face crop, leaning in.
  about: { image: PHOTOS.square, crop: [0.2, 0.05, 0.6, 0.62], height: 0.78, offsetY: 0.12, tilt: 0.16, spin: 0.18, lineWidth: 0.7, depth: 0.2, accent: 0 },
  // 04 Contact: head and chest from the half shot, small turn, warm.
  contact: { image: PHOTOS.half, crop: [0.08, 0.2, 0.84, 0.6], height: 0.82, offsetY: 0.08, tilt: -0.14, spin: -0.24, lineWidth: 1.2, depth: 0.26, accent: 0.35 },
}
