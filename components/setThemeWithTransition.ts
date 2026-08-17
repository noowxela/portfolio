import { flushSync } from 'react-dom'

type SetTheme = (theme: string) => void

export function setThemeWithTransition(setTheme: SetTheme, next: string) {
  const apply = () => setTheme(next)

  if (typeof document === 'undefined') {
    apply()
    return
  }

  const doc = document
  if ('startViewTransition' in doc && typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(() => {
      flushSync(apply)
    })
    return
  }

  const root = doc.documentElement
  root.classList.add('theme-transition')
  apply()
  window.setTimeout(() => root.classList.remove('theme-transition'), 500)
}
