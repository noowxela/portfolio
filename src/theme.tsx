import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

const KEY = 'theme'

type ThemeValue = {
  theme: Theme
  resolvedTheme: Resolved
  setTheme: (theme: string) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

function storedTheme(): Theme {
  try {
    const value = localStorage.getItem(KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    /* private mode */
  }
  return 'system'
}

function resolve(theme: Theme): Resolved {
  if (theme === 'dark' || theme === 'light') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(resolved: Resolved) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.classList.toggle('light', resolved === 'light')
  root.style.colorScheme = resolved
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(storedTheme)
  const resolvedTheme = resolve(theme)

  useEffect(() => {
    apply(resolvedTheme)
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* ignore */
    }
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply(resolve('system'))
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme, resolvedTheme])

  const setTheme = (next: string) => {
    if (next === 'light' || next === 'dark' || next === 'system') setThemeState(next)
  }

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}
