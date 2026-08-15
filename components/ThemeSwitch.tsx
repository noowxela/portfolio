'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}

export default function ThemeSwitch() {
  const { setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  if (!mounted) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="h-[0.95rem] w-[0.95rem] fill-current">
        <circle cx="12" cy="12" r="4" />
      </svg>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="grid h-full w-full place-items-center"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" aria-hidden className="h-[0.95rem] w-[0.95rem] fill-current">
          <path d="M12 3a1 1 0 0 1 1 1v1.06a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm0 15.94a1 1 0 0 1 1 1V21a1 1 0 1 1-2 0v-1.06a1 1 0 0 1 1-1ZM4.22 5.64a1 1 0 0 1 1.42 0l.75.75a1 1 0 0 1-1.42 1.42l-.75-.75a1 1 0 0 1 0-1.42Zm13.21 13.21a1 1 0 0 1 1.42 0l.75.75a1 1 0 0 1-1.42 1.42l-.75-.75a1 1 0 0 1 0-1.42ZM3 12a1 1 0 0 1 1-1h1.06a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm15.94 0a1 1 0 0 1 1-1H21a1 1 0 1 1 0 2h-1.06a1 1 0 0 1-1-1ZM6.34 17.66a1 1 0 0 1 0 1.42l-.75.75a1 1 0 1 1-1.42-1.42l.75-.75a1 1 0 0 1 1.42 0Zm13.32-13.32a1 1 0 0 1 0 1.42l-.75.75a1 1 0 0 1-1.42-1.42l.75-.75a1 1 0 0 1 1.42 0ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden className="h-[0.95rem] w-[0.95rem] fill-current">
          <path d="M21 14.5A7.5 7.5 0 0 1 9.5 3 6.5 6.5 0 1 0 21 14.5Z" />
        </svg>
      )}
    </button>
  )
}
