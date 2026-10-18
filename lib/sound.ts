/**
 * Site-wide UI sounds, synthesised with the Web Audio API (no audio files).
 *
 * One AudioContext for the whole visit: it is created on the first user
 * activation (click, key, tap; a wheel or a bare touchstart is not one, and
 * only while `navigator.userActivation.isActive`, so Chrome never logs "not
 * allowed to start") and lives on across client-side route changes. Before
 * that every `play*` call is a silent no-op. A single toggle (header speaker
 * button) is saved in `localStorage['gridlog-sound']`, on by default.
 */

export const SOUND_KEY = 'gridlog-sound'

/** The voice shared by every sound (first used for the /journey rail). */
const VOLUME = 0.18
const DECAY_S = 0.19
const LOWPASS_HZ = 3200

/** /journey rail arrival: pentatonic step per node, HEAD gets a two-note rise. */
const ARRIVE_NOTES = [523.25, 587.33, 659.25, 783.99, 880]
const ARRIVE_HEAD = [783.99, 1046.5]
const ARRIVE_GAP_MS = 120

/** Click blip per destination, the same for a header link and its home corner. */
export type SoundTarget = 'home' | 'work' | 'journey' | 'about' | 'contact' | 'discs'
const TARGET_NOTES: Record<SoundTarget, number> = {
  home: 523.25, // C5
  work: 587.33, // D5
  journey: 659.25, // E5
  about: 783.99, // G5
  contact: 880, // A5
  discs: 1046.5, // C6
}
/** Contact window closing: the same voice falling A5 → E5. */
const CLOSE_NOTES = [880, 659.25]

type AudioCtor = typeof AudioContext

let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled: boolean | null = null
let armed = false
let lastArrive = 0
const listeners = new Set<() => void>()

const Ctor = (): AudioCtor | undefined =>
  typeof window === 'undefined'
    ? undefined
    : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext)

export function soundEnabled() {
  if (enabled === null) {
    try {
      enabled = typeof window === 'undefined' ? true : window.localStorage.getItem(SOUND_KEY) !== '0'
    } catch {
      enabled = true
    }
  }
  return enabled
}

/** For `useSyncExternalStore`. */
export function subscribeSound(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function setSoundEnabled(on: boolean) {
  enabled = on
  try {
    window.localStorage.setItem(SOUND_KEY, on ? '1' : '0')
  } catch {
    /* not persisted */
  }
  listeners.forEach((fn) => fn())
  // Called from the toggle's click, so this counts as the gesture.
  if (on) unlock()
}

const GESTURES = ['pointerdown', 'pointerup', 'keydown', 'touchend', 'click'] as const

function unlock() {
  const C = Ctor()
  if (!soundEnabled() || !C) return
  if (ctx?.state === 'running') return
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation
  if (activation && !activation.isActive) return
  try {
    if (!ctx) {
      ctx = new C()
      master = ctx.createGain()
      master.gain.value = VOLUME
      const tone = ctx.createBiquadFilter()
      tone.type = 'lowpass'
      tone.frequency.value = LOWPASS_HZ
      master.connect(tone).connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
  } catch {
    ctx = null
    master = null
  }
}

/** Install the first-gesture unlock once (capture phase, so it runs before any click handler). */
export function armSound() {
  if (armed || typeof window === 'undefined') return
  armed = true
  GESTURES.forEach((g) => window.addEventListener(g, unlock, { capture: true, passive: true }))
}

/** Ready to schedule: on, created under a gesture, not closed. A context still resuming plays as soon as it runs. */
function ready() {
  return !!(soundEnabled() && ctx && master && ctx.state !== 'closed')
}

/** One voice: a triangle that glides down a fifth into the note, plus a soft octave sine "chime". */
function voice(f: number, at: number, gain = 1) {
  if (!ctx || !master) return
  const env = ctx.createGain()
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(gain, at + 0.006)
  env.gain.exponentialRampToValueAtTime(0.0001, at + DECAY_S)
  env.connect(master)

  const zap = ctx.createOscillator()
  zap.type = 'triangle'
  zap.frequency.setValueAtTime(f * 1.5, at)
  zap.frequency.exponentialRampToValueAtTime(f, at + 0.03)
  zap.connect(env)

  const chime = ctx.createOscillator()
  const chimeGain = ctx.createGain()
  chime.type = 'sine'
  chime.frequency.setValueAtTime(f * 2, at)
  chimeGain.gain.setValueAtTime(0.35, at)
  chimeGain.gain.exponentialRampToValueAtTime(0.0001, at + DECAY_S * 0.65)
  chime.connect(chimeGain).connect(env)

  for (const o of [zap, chime]) {
    o.start(at)
    o.stop(at + DECAY_S + 0.02)
  }
  zap.onended = () => env.disconnect()
}

const now = () => (ctx ? ctx.currentTime + 0.005 : 0)

/** /journey: the light cycle settled on a new node (unchanged from the page's own blip). */
export function playArrive(index: number, head: boolean) {
  if (!ready() || ctx!.state !== 'running') return
  const t = performance.now()
  if (t - lastArrive < ARRIVE_GAP_MS) return
  lastArrive = t
  const at = now()
  if (head) ARRIVE_HEAD.forEach((f, k) => voice(f, at + k * 0.07))
  else voice(ARRIVE_NOTES[Math.min(ARRIVE_NOTES.length - 1, Math.max(0, index))], at)
}

/** A header link or home corner was chosen. */
export function playClick(target: SoundTarget) {
  if (!ready()) return
  voice(TARGET_NOTES[target], now())
}

/** Phones: the first tap on a home corner only selects it; a quiet high tick. */
export function playTick() {
  if (!ready()) return
  const at = now()
  const o = ctx!.createOscillator()
  const g = ctx!.createGain()
  o.type = 'sine'
  o.frequency.setValueAtTime(1318.5, at) // E6
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(0.3, at + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05)
  o.connect(g).connect(master!)
  o.start(at)
  o.stop(at + 0.07)
  o.onended = () => g.disconnect()
}

/** The contact window closed: the click voice falling A5 → E5. */
export function playClose() {
  if (!ready()) return
  const at = now()
  CLOSE_NOTES.forEach((f, k) => voice(f, at + k * 0.06, k ? 0.8 : 1))
}

/** Map a route to its click note. */
export function targetFor(href: string): SoundTarget | null {
  const p = href.replace(/\/+$/, '') || '/'
  if (p === '/') return 'home'
  const id = p.slice(1)
  return id in TARGET_NOTES ? (id as SoundTarget) : null
}
