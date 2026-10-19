const KEY = 'portfolio-booted'
const FADE_MS = 400
const FONT_MS = 1500
const CAP_MS = 8000

function routePath() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  let path = window.location.pathname
  if (base && path.startsWith(base)) path = path.slice(base.length) || '/'
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path || '/'
}

/** The lazy route has committed. Home still waits for the portrait. */
export function noteRoutePainted() {
  if (routePath() === '/') return
  window.dispatchEvent(new Event('portfolio-boot-page'))
}

/**
 * First visit only. The shell in index.html already painted `#boot`.
 * This drops it once the display font and this URL's page are ready.
 */
export function startBoot() {
  const root = document.documentElement
  if (!root.classList.contains('booting')) return

  let fontOk = false
  let pageOk = false
  let finished = false
  const cleanups: Array<() => void> = []

  const finish = () => {
    if (finished) return
    finished = true
    for (const stop of cleanups) stop()
    const clear = () => {
      root.classList.remove('booting', 'boot-out')
      try {
        localStorage.setItem(KEY, '1')
      } catch {
        /* private mode: the screen simply plays again next time */
      }
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      clear()
      return
    }
    root.classList.add('boot-out')
    window.setTimeout(clear, FADE_MS)
  }

  const arm = () => {
    if (fontOk && pageOk) finish()
  }

  const markFont = () => {
    if (fontOk) return
    fontOk = true
    arm()
  }
  const markPage = () => {
    if (pageOk) return
    pageOk = true
    arm()
  }

  const fontTimer = window.setTimeout(markFont, FONT_MS)
  cleanups.push(() => window.clearTimeout(fontTimer))
  document.fonts
    .load('600 48px Oxanium')
    .then(() => {
      if (document.fonts.check('600 48px Oxanium')) markFont()
    })
    .catch(markFont)

  const cap = window.setTimeout(() => {
    markFont()
    markPage()
  }, CAP_MS)
  cleanups.push(() => window.clearTimeout(cap))

  if (routePath() === '/') {
    const app = document.getElementById('root')
    if (!app) {
      markPage()
      return
    }
    let imgBound = false
    const check = () => {
      const landing = app.querySelector('.landing-root')
      if (!landing) return
      if (landing.getAttribute('data-ready') === 'true') {
        markPage()
        return
      }
      if (landing.getAttribute('data-mode') !== 'fallback' || imgBound) return
      const img = landing.querySelector<HTMLImageElement>('.landing-fallback img')
      if (!img) return
      imgBound = true
      if (img.complete) markPage()
      else {
        img.addEventListener('load', markPage, { once: true })
        img.addEventListener('error', markPage, { once: true })
      }
    }
    const observer = new MutationObserver(check)
    observer.observe(app, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-ready', 'data-mode'],
    })
    cleanups.push(() => observer.disconnect())
    check()
    return
  }

  const onPage = () => markPage()
  window.addEventListener('portfolio-boot-page', onPage)
  cleanups.push(() => window.removeEventListener('portfolio-boot-page', onPage))
}
