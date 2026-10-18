/** Prefix a public-folder path with Vite's base (`/portfolio/`). */
export function asset(src: string) {
  if (!src.startsWith('/') || src.startsWith('//')) return src
  const base = import.meta.env.BASE_URL
  return `${base}${src.slice(1)}`
}
