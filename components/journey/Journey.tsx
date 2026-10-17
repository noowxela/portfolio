'use client'

import { useEffect, useRef, useState } from 'react'
import { DiscV2 } from '@/components/home/discs'
import { site } from '@/data/site'
import { withBasePath } from '@/lib/withBasePath'
import { JourneyFallback } from './JourneyFallback'
import { ACTS, BEATS, actAt } from './path'

type Mode = 'pending' | 'webgl' | 'fallback'

const REDUCED = '(prefers-reduced-motion: reduce)'
const SMALL = '(max-width: 767px), (pointer: coarse)'

function canUseWebGL() {
  return typeof window !== 'undefined' && 'WebGLRenderingContext' in window
}

/**
 * /journey: a fixed WebGL stage over a tall scroll track. Scroll progress
 * (gsap ScrollTrigger, scrubbed) drives the camera path and every scene
 * transition; the HUD is plain DOM written straight from the same progress.
 */
export function Journey({ className }: { className?: string }) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const actRef = useRef<HTMLSpanElement>(null)
  const meterRef = useRef<HTMLSpanElement>(null)
  const discRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const skipRef = useRef<() => void>(() => {})
  const [mode, setMode] = useState<Mode>('pending')

  // Pick the mode on the client and follow reduced-motion changes.
  useEffect(() => {
    const reduced = window.matchMedia(REDUCED)
    const pick = () => setMode(reduced.matches || !canUseWebGL() ? 'fallback' : 'webgl')
    queueMicrotask(pick)
    reduced.addEventListener('change', pick)
    return () => reduced.removeEventListener('change', pick)
  }, [])

  // The home page's void ground and auto scroll behaviour.
  useEffect(() => {
    const html = document.documentElement
    const previous = html.style.scrollBehavior
    html.classList.add('tron-home', 'journey-page')
    html.style.scrollBehavior = 'auto'
    return () => {
      html.classList.remove('tron-home', 'journey-page')
      html.style.scrollBehavior = previous
    }
  }, [])

  useEffect(() => {
    if (mode !== 'webgl') return
    const root = rootRef.current
    const stage = stageRef.current
    const track = trackRef.current
    if (!root || !stage || !track) return

    let cancelled = false
    let cleanup = () => {}

    void (async () => {
      const [{ createJourney }, gsapModule, { ScrollTrigger }] = await Promise.all([
        import('./journeyScene'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return
      const gsap = gsapModule.default
      gsap.registerPlugin(ScrollTrigger)

      const small = window.matchMedia(SMALL).matches
      const fontFamily = getComputedStyle(root).fontFamily || 'sans-serif'
      try {
        await document.fonts.load(`600 100px ${fontFamily}`)
      } catch {
        // Fall back to whatever font is there.
      }
      if (cancelled) return
      const scene = createJourney(stage, {
        small,
        fontFamily,
        name: site.name.toLowerCase(),
        onLost: () => setMode('fallback'),
      })
      if (!scene) {
        setMode('fallback')
        return
      }
      root.dataset.ready = 'true'

      let lastAct = ''
      const apply = (p: number) => {
        scene.setProgress(p)
        root.dataset.progress = p.toFixed(3)
        const act = actAt(p)
        if (act.id !== lastAct) {
          lastAct = act.id
          root.dataset.act = act.id
          if (actRef.current) actRef.current.textContent = act.label
        }
        if (meterRef.current) meterRef.current.style.transform = `scaleY(${0.04 + p * 0.96})`
        if (discRef.current) discRef.current.style.transform = `rotate(${-10 + p * 372}deg)`
        if (flashRef.current) flashRef.current.style.opacity = String(scene.flash(p))
        const cta = p >= BEATS.cta
        if ((root.dataset.cta === 'true') !== cta) root.dataset.cta = String(cta)
        root.dataset.hud = p > 0.02 ? 'moving' : 'rest'
      }

      const proxy = { p: 0 }
      const tween = gsap.to(proxy, {
        p: 1,
        ease: 'none',
        onUpdate: () => apply(proxy.p),
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      })
      apply(0)

      skipRef.current = () => {
        const st = tween.scrollTrigger
        if (!st) return
        window.scrollTo(0, st.end)
        st.update()
        st.getTween()?.progress(1)
        tween.progress(1)
        apply(1)
        window.setTimeout(() => ctaRef.current?.focus({ preventScroll: true }), 60)
      }

      const refresh = () => ScrollTrigger.refresh()
      requestAnimationFrame(refresh)

      cleanup = () => {
        skipRef.current = () => {}
        tween.scrollTrigger?.kill()
        tween.kill()
        scene.dispose()
        delete root.dataset.ready
      }
    })()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [mode])

  if (mode === 'fallback') {
    return (
      <main ref={rootRef} className={`tron-root journey-root is-fallback ${className ?? ''}`} data-mode="fallback">
        <div className="tron-scan" aria-hidden />
        <JourneyFallback />
      </main>
    )
  }

  return (
    <main ref={rootRef} className={`tron-root journey-root ${className ?? ''}`} data-mode={mode} data-act="grid">
      <h1 className="hero-name-hidden">{site.name}</h1>
      <p className="hero-name-hidden">
        A scroll-driven ride: from a desk, through the monitor into the Grid, along a neon road, through a portal and
        back to the desk.
      </p>
      <div className="journey-stage" aria-hidden>
        <JourneyFallback poster />
        <div ref={stageRef} className="journey-canvas" />
        <div ref={flashRef} className="journey-flash" />
      </div>
      <div className="tron-scan" aria-hidden />

      <div className="journey-hud" aria-hidden>
        <span ref={actRef} className="hud journey-act">
          {ACTS[0].label}
        </span>
      </div>

      <div className="scroll-stack journey-meter" aria-hidden>
        <div className="scroll-meter">
          <span ref={meterRef} />
        </div>
        <div ref={discRef} className="disc disc-v2">
          <DiscV2 />
        </div>
      </div>

      <button type="button" className="journey-skip hud" onClick={() => skipRef.current()}>
        Skip intro
      </button>

      <a ref={ctaRef} className="journey-cta journey-cta-end" href={withBasePath('/work/')}>
        <span>Enter the Work</span>
        <span aria-hidden>→</span>
      </a>

      <div ref={trackRef} className="journey-track" />
    </main>
  )
}

