import { flushSync } from 'react-dom'

type SetTheme = (theme: string) => void

export function setThemeWithTransition(setTheme: SetTheme, next: string) {
  const apply = () => setTheme(next)

  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    document.startViewTransition(() => {
      flushSync(apply)
    })
    return
  }

  const root = document.documentElement
  root.classList.add('theme-transition')
  apply()
  window.setTimeout(() => root.classList.remove('theme-transition'), 500)
}
