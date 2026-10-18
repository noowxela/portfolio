import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { RootLayout } from './RootLayout'

type PageModule = { default: ComponentType }

export const loaders = {
  '/': () => import('./pages/Home'),
  '/work': () => import('./pages/Work'),
  '/journey': () => import('./pages/Journey'),
  '/about': () => import('./pages/About'),
  '/noelite': () => import('./pages/Noelite'),
  '/noelite2': () => import('./pages/Noelite2'),
  '/discs': () => import('./pages/Discs'),
} satisfies Record<string, () => Promise<PageModule>>

function normalize(href: string) {
  const path = href.split(/[?#]/)[0] || '/'
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1)
  return path
}

/** Warm the route module. Vite preloads its CSS and imports. Repeat calls are free. */
export function preloadRoute(href: string) {
  const load = loaders[normalize(href) as keyof typeof loaders]
  if (load) void load()
}

function lazyPage(load: () => Promise<PageModule>) {
  return async () => {
    const mod = await load()
    return { Component: mod.default }
  }
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: RootLayout,
      children: [
        { index: true, lazy: lazyPage(loaders['/']) },
        { path: 'work', lazy: lazyPage(loaders['/work']) },
        { path: 'journey', lazy: lazyPage(loaders['/journey']) },
        { path: 'about', lazy: lazyPage(loaders['/about']) },
        { path: 'noelite', lazy: lazyPage(loaders['/noelite']) },
        { path: 'noelite2', lazy: lazyPage(loaders['/noelite2']) },
        { path: 'discs', lazy: lazyPage(loaders['/discs']) },
        { path: '*', lazy: lazyPage(() => import('./pages/NotFound')) },
      ],
    },
  ],
  { basename },
)
