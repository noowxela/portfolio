/**
 * Home -> page hand-off. The home plays its exit, then calls `beginRouteExit`:
 * a flag goes to sessionStorage and the global curtain (RouteCurtain) covers
 * the screen. The destination plays its entrance only when it finds a fresh
 * flag for its own path, so direct visits, reloads and back/forward never do.
 */
export const ENTER_KEY = 'route-enter'
/** A flag older than this is stale (navigation failed or the tab slept). */
export const ENTER_TTL = 6000
/** Curtain fail-safe: uncover if the navigation never lands. */
const COVER_TIMEOUT = 5000

export type EnterFlag = { to: string; at: number; reduced: boolean }

export function normalizePath(p: string) {
  const s = p.replace(/\/+$/, '')
  return s === '' ? '/' : s
}

export function readEnterFlag(): EnterFlag | null {
  try {
    const raw = window.sessionStorage.getItem(ENTER_KEY)
    if (!raw) return null
    const f = JSON.parse(raw) as EnterFlag
    return typeof f?.to === 'string' && typeof f.at === 'number' ? f : null
  } catch {
    return null
  }
}

export function clearEnterFlag() {
  try {
    window.sessionStorage.removeItem(ENTER_KEY)
  } catch {
    /* storage blocked: nothing to clear */
  }
}

let coverTimer = 0

/** Flag the destination and drop the curtain after `coverDelay` ms. */
export function beginRouteExit(to: string, { reduced, coverDelay }: { reduced: boolean; coverDelay: number }) {
  const flag: EnterFlag = { to: normalizePath(to), at: Date.now(), reduced }
  try {
    window.sessionStorage.setItem(ENTER_KEY, JSON.stringify(flag))
  } catch {
    /* no storage: the page still navigates, just without the entrance */
  }
  const html = document.documentElement
  const cover = () => {
    html.dataset.curtain = 'cover'
    window.clearTimeout(coverTimer)
    coverTimer = window.setTimeout(() => {
      if (html.dataset.curtain === 'cover') delete html.dataset.curtain
    }, COVER_TIMEOUT)
  }
  if (coverDelay > 0) window.setTimeout(cover, coverDelay)
  else cover()
}

/** Entrance order per page: groups start one after another, items inside a group stagger. */
export const ENTRANCES: Record<string, { selectors: string[]; max?: number }[]> = {
  '/work': [
    { selectors: ['[role="toolbar"][aria-label="Work layout"]'] },
    // Each view's blocks (album stage, caption / sidebar, detail) as whole pieces:
    // fading single albums would show their discs before their sleeves.
    { selectors: ['.h-dvh > *'], max: 6 },
  ],
  // Placeholder until the work-experience journey lands; the 3D ride moved to /noelite2.
  '/journey': [{ selectors: ['.journey-soon-grid'] }, { selectors: ['.journey-soon-copy > *'] }],
  '/noelite2': [
    { selectors: ['.journey-stage'] },
    { selectors: ['.journey-hud', '.journey-meter', '.journey-skip'] },
  ],
  '/about': [
    { selectors: ['.about-hex-field'] },
    { selectors: ['.about-intro > :not(ol)', '.about-intro ol > li'], max: 16 },
    { selectors: ['.about-marquee'] },
    { selectors: ['main footer .grid > *'] },
  ],
}
