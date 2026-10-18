import { useLocation } from 'react-router'
import { useEffect, useRef } from 'react'
import { clearEnterFlag, ENTER_TTL, ENTRANCES, normalizePath, readEnterFlag, type EnterFlag } from './routeTransition'
import './route-transition.css'

const GROUP_GAP = 90
const STEP = 45
const MAX_DELAY = 520
const ITEM_MS = 520
const REVEAL_MS = 260

/**
 * Tag the destination's elements for the staggered entrance. Only CSS hooks
 * are added (a data attribute and two custom properties), never new markup.
 */
function tagEntrance(path: string) {
  const tagged: HTMLElement[] = []
  const seen = new Set<Element>()
  let start = 0
  const tag = (el: HTMLElement, delay: number) => {
    const cs = getComputedStyle(el)
    // A 3D parent would be flattened by the filter: animate its children instead.
    if (cs.transformStyle === 'preserve-3d') {
      Array.from(el.children).forEach((c) => c instanceof HTMLElement && tag(c, delay))
      return
    }
    // Leave elements with their own animation (marquees, pulses) alone.
    if (cs.animationName !== 'none' || cs.display === 'none') return
    const anims = [cs.filter === 'none' ? 'route-enter-fade' : '', cs.translate === 'none' ? 'route-enter-rise' : '', cs.clipPath === 'none' ? 'route-enter-wipe' : '']
      .filter(Boolean)
      .join(', ')
    if (!anims) return
    el.dataset.routeEnter = ''
    el.style.setProperty('--route-enter-anims', anims)
    el.style.setProperty('--route-enter-delay', `${Math.round(delay)}ms`)
    tagged.push(el)
  }
  for (const group of ENTRANCES[path] ?? []) {
    const els = Array.from(document.querySelectorAll<HTMLElement>(group.selectors.join(','))).filter((el) => {
      if (seen.has(el)) return false
      seen.add(el)
      const r = el.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && r.top < window.innerHeight
    })
    const list = els.slice(0, group.max ?? 12)
    if (!list.length) continue
    list.forEach((el, i) => tag(el, Math.min(MAX_DELAY, start + i * STEP)))
    start = Math.min(MAX_DELAY, start + GROUP_GAP + Math.min(list.length - 1, 4) * STEP * 0.5)
  }
  return tagged
}

function untag(els: HTMLElement[]) {
  for (const el of els) {
    delete el.dataset.routeEnter
    el.style.removeProperty('--route-enter-anims')
    el.style.removeProperty('--route-enter-delay')
  }
}

/** Global curtain + destination entrance for the home page transition. */
export function RouteCurtain() {
  const { pathname } = useLocation()
  const pending = useRef<EnterFlag | null>(null)

  useEffect(() => {
    const html = document.documentElement
    const path = normalizePath(pathname)
    let flag = readEnterFlag()
    clearEnterFlag()
    if (!flag && pending.current) flag = pending.current
    const fresh = !!flag && flag.to === path && Date.now() - flag.at < ENTER_TTL
    pending.current = fresh ? flag : null

    if (!fresh || !flag) {
      delete html.dataset.curtain
      return
    }

    let tagged: HTMLElement[] = []
    const timers: number[] = []
    let raf = 0
    html.dataset.curtain = 'cover'
    html.dataset.enter = path.slice(1)
    if (!flag.reduced) tagged = tagEntrance(path)
    // Two frames so the tagged start state is painted under the curtain first.
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        html.classList.add('route-enter')
        html.dataset.curtain = 'reveal'
        pending.current = null
      })
    })
    const total = flag.reduced ? 260 : REVEAL_MS + MAX_DELAY + ITEM_MS + 80
    const finish = () => {
      html.classList.remove('route-enter')
      delete html.dataset.enter
      if (html.dataset.curtain === 'reveal') delete html.dataset.curtain
      untag(tagged)
    }
    timers.push(window.setTimeout(finish, total))
    return () => {
      cancelAnimationFrame(raf)
      timers.forEach((t) => window.clearTimeout(t))
      finish()
    }
  }, [pathname])

  return (
    <div className="route-curtain" aria-hidden>
      <div className="route-curtain-line" />
    </div>
  )
}
