/**
 * Arrival blip for the branch rail, synthesised with the Web Audio API (no
 * audio files). Browsers only let audio start after a user activation
 * (click, key, tap; a wheel or a bare touchstart is not one), so the
 * AudioContext is created on the first such gesture, and only while
 * `navigator.userActivation` says it is active (no "not allowed to start"
 * warning). Until then `play` is a silent no-op.
 */

/** Pentatonic steps, one per node; HEAD gets a two-note rise instead. */
const NOTES = [523.25, 587.33, 659.25, 783.99, 880]
const HEAD_NOTES = [783.99, 1046.5]
const VOLUME = 0.18
const DECAY_S = 0.19
const MIN_GAP_MS = 120

export type Blip = {
  play: (index: number, head: boolean) => void
  setEnabled: (on: boolean) => void
  dispose: () => void
}

type AudioCtor = typeof AudioContext

export function createBlip(enabled: boolean): Blip {
  let on = enabled
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let last = 0
  const Ctor: AudioCtor | undefined =
    typeof window === 'undefined'
      ? undefined
      : window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext

  const arm = () => {
    if (!on || !Ctor) return
    if (ctx?.state === 'running') return removeGestures()
    const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation
    if (activation && !activation.isActive) return
    try {
      if (!ctx) {
        ctx = new Ctor()
        master = ctx.createGain()
        master.gain.value = VOLUME
        const tone = ctx.createBiquadFilter()
        tone.type = 'lowpass'
        tone.frequency.value = 3200
        master.connect(tone).connect(ctx.destination)
      }
      if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
    } catch {
      ctx = null
    }
    if (ctx?.state === 'running') removeGestures()
  }
  const gestures = ['pointerdown', 'pointerup', 'keydown', 'touchend', 'click'] as const
  const removeGestures = () => gestures.forEach((g) => window.removeEventListener(g, arm, true))
  gestures.forEach((g) => window.addEventListener(g, arm, { capture: true, passive: true }))

  /** One voice: a triangle that glides down a fifth into the note, plus a soft octave sine "chime". */
  const voice = (f: number, at: number) => {
    if (!ctx || !master) return
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, at)
    env.gain.exponentialRampToValueAtTime(1, at + 0.006)
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

  return {
    play: (index, head) => {
      if (!on || !ctx || ctx.state !== 'running') return
      const now = performance.now()
      if (now - last < MIN_GAP_MS) return
      last = now
      const t = ctx.currentTime + 0.005
      if (head) HEAD_NOTES.forEach((f, k) => voice(f, t + k * 0.07))
      else voice(NOTES[Math.min(NOTES.length - 1, Math.max(0, index))], t)
    },
    setEnabled: (next) => {
      on = next
      // Called from the toggle's click, so this counts as the gesture.
      if (on) arm()
    },
    dispose: () => {
      removeGestures()
      if (ctx) void ctx.close().catch(() => {})
      ctx = null
      master = null
    },
  }
}
