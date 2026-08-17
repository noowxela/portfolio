/** Prefix a public-folder path with `basePath` (needed for `next/image` on GitHub Pages). */
export function withBasePath(src: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  if (!src.startsWith('/') || src.startsWith('//')) return src
  return `${base}${src}`
}
