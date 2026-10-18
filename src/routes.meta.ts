import meta from './routes.meta.json'

export type RoutePath = '' | 'work' | 'journey' | 'about' | 'noelite' | 'noelite2' | 'discs' | '404'

export type RouteMeta = {
  path: RoutePath
  title: string
  description: string
  noindex?: boolean
}

export const routeMeta = meta as RouteMeta[]

export function siteOrigin() {
  const fromVite = import.meta.env?.VITE_SITE_URL
  const fromNode = typeof process !== 'undefined' ? process.env.VITE_SITE_URL : undefined
  return (fromVite || fromNode || 'https://noowxela.github.io/portfolio').replace(/\/$/, '')
}

export function metaFor(path: RoutePath) {
  const found = routeMeta.find((item) => item.path === path)
  if (!found) throw new Error(`missing route meta for ${path}`)
  return found
}

export function canonicalUrl(path: RoutePath, origin = siteOrigin()) {
  return path === '' || path === '404' ? `${origin}/` : `${origin}/${path}/`
}

export function ogImage(origin = siteOrigin()) {
  return `${origin}/og.png`
}
