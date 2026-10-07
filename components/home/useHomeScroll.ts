'use client'

import { useEffect, type RefObject } from 'react'

const LEGACY = { tron: '#5ce1ff', ember: '#b8f4ff' }
const ARES = { tron: '#ff2b2b', ember: '#ff6a2c' }

const DESKTOP = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'
const STATIC = '(max-width: 767px), (prefers-reduced-motion: reduce)'

export function useHomeScroll(
  rootRef: RefObject<HTMLElement | null>,
  wrapperRef: RefObject<HTMLDivElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const root = rootRef.current
    const wrapper = wrapperRef.current
    const content = contentRef.current
    if (!root || !wrapper || !content) return

    const html = document.documentElement
    const previousScrollBehavior = html.style.scrollBehavior
    html.classList.add('tron-home')
    html.style.scrollBehavior = 'auto'
    html.style.setProperty('--tron', LEGACY.tron)
    html.style.setProperty('--ember', LEGACY.ember)

    let cancelled = false
    let kill = () => {}

    void (async () => {
      const gsap = (await import('gsap')).default
      const { ScrollTrigger } = await import('gsap/ScrollTrigger')
      const { ScrollSmoother } = await import('gsap/ScrollSmoother')
      if (cancelled) return

      gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

      const mm = gsap.matchMedia()
      const q = (selector: string) => root.querySelector(selector)

      mm.add(DESKTOP, () => {
        ScrollSmoother.get()?.kill()
        wrapper.classList.add('is-smooth')

        const smoother = ScrollSmoother.create({
          wrapper,
          content,
          smooth: 1.2,
          effects: true,
          smoothTouch: false,
        })

        const hero = q('[data-scene="hero"]')
        const floor = q('[data-hero="floor"]')
        const name = q('[data-hero="name"]')
        const ribbon = q('[data-hero="ribbon"]')
        const meter = q('[data-hero="meter"]')
        const disc = q('[data-hero="disc"]')

        if (hero && floor && meter && disc) {
          const heroTl = gsap.timeline({
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: '+=180%',
              pin: true,
              scrub: 0.8,
            },
          })
          heroTl.fromTo(
            floor,
            { yPercent: 8, scale: 1.05, rotationX: 80, transformPerspective: 520 },
            { yPercent: -16, scale: 1.5, rotationX: 80, transformPerspective: 520, ease: 'none' },
            0,
          )
          if (name) heroTl.fromTo(name, { y: 16 }, { y: -8, ease: 'none' }, 0)
          if (ribbon) {
            heroTl.fromTo(
              ribbon,
              { xPercent: -30, scaleX: 0.3 },
              { xPercent: 18, scaleX: 1, ease: 'none' },
              0,
            )
          }
          heroTl.fromTo(meter, { scaleY: 0.08 }, { scaleY: 1, ease: 'none' }, 0)
          heroTl.fromTo(disc, { rotation: -10 }, { rotation: 32, ease: 'none' }, 0)
        }

        const handoff = q('[data-scene="handoff"]') as HTMLElement | null
        const round = q('[data-handoff="disc-round"]')
        const angular = q('[data-handoff="disc-angular"]')
        const labelGrid = q('[data-handoff="label-grid"]')
        const labelAres = q('[data-handoff="label-ares"]')
        const handoffRibbon = q('[data-handoff="ribbon"]')

        if (handoff && round && angular && labelGrid && labelAres && handoffRibbon) {
          const mix = { t: 0 }
          const handoffTl = gsap.timeline({
            scrollTrigger: {
              trigger: handoff,
              start: 'top top',
              end: '+=150%',
              pin: true,
              scrub: 0.8,
            },
          })
          handoffTl.to(
            mix,
            {
              t: 1,
              ease: 'none',
              onUpdate: () => {
                const tron = gsap.utils.interpolate(LEGACY.tron, ARES.tron, mix.t)
                const ember = gsap.utils.interpolate(LEGACY.ember, ARES.ember, mix.t)
                handoff.style.setProperty('--tron', tron)
                handoff.style.setProperty('--ember', ember)
                html.style.setProperty('--tron', tron)
                html.style.setProperty('--ember', ember)
              },
            },
            0,
          )
          handoffTl.to(round, { opacity: 0, scale: 1.42, rotation: 26, ease: 'none' }, 0)
          handoffTl.fromTo(
            angular,
            { opacity: 0, scale: 0.6, rotation: -22 },
            { opacity: 1, scale: 1, rotation: 0, ease: 'none' },
            0,
          )
          handoffTl.to(labelGrid, { opacity: 0, y: -20, ease: 'none' }, 0)
          handoffTl.fromTo(labelAres, { opacity: 0, y: 20 }, { opacity: 1, y: 0, ease: 'none' }, 0)
          handoffTl.fromTo(handoffRibbon, { scaleX: 0.18 }, { scaleX: 1, ease: 'none' }, 0)
        }

        const work = q('[data-scene="work"]')
        const track = q('[data-work="track"]') as HTMLElement | null
        if (work && track) {
          const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
          if (distance() > 24) {
            gsap.to(track, {
              x: () => -distance(),
              ease: 'none',
              scrollTrigger: {
                trigger: work,
                pin: true,
                scrub: 1,
                start: 'top top',
                end: () => `+=${distance()}`,
                invalidateOnRefresh: true,
              },
            })
          }
        }

        const refresh = () => ScrollTrigger.refresh()
        window.addEventListener('resize', refresh)
        requestAnimationFrame(refresh)
        void document.fonts?.ready.then(() => {
          if (!cancelled) refresh()
        })

        return () => {
          window.removeEventListener('resize', refresh)
          smoother.kill()
          wrapper.classList.remove('is-smooth')
          handoff?.style.removeProperty('--tron')
          handoff?.style.removeProperty('--ember')
          html.style.setProperty('--tron', LEGACY.tron)
          html.style.setProperty('--ember', LEGACY.ember)
        }
      })

      mm.add(STATIC, () => {
        const handoff = root.querySelector('[data-scene="handoff"]')
        if (!handoff) return
        const apply = () => {
          const ares = handoff.getBoundingClientRect().top < window.innerHeight * 0.42
          html.style.setProperty('--tron', ares ? ARES.tron : LEGACY.tron)
          html.style.setProperty('--ember', ares ? ARES.ember : LEGACY.ember)
        }
        apply()
        window.addEventListener('scroll', apply, { passive: true })
        return () => window.removeEventListener('scroll', apply)
      })

      kill = () => {
        mm.revert()
      }
    })()

    return () => {
      cancelled = true
      kill()
      html.classList.remove('tron-home')
      html.style.scrollBehavior = previousScrollBehavior
      html.style.removeProperty('--tron')
      html.style.removeProperty('--ember')
    }
  }, [rootRef, wrapperRef, contentRef])
}
