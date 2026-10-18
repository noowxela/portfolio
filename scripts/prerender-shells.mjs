import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import meta from '../src/routes.meta.json' with { type: 'json' }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const origin = (process.env.VITE_SITE_URL || 'https://noowxela.github.io/portfolio').replace(/\/$/, '')
const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

function canonical(routePath) {
  return routePath === '' || routePath === '404' ? `${origin}/` : `${origin}/${routePath}/`
}

function fill(html, route) {
  const url = canonical(route.path)
  const image = `${origin}/og.png`
  const robots = route.noindex ? 'noindex' : 'index,follow'
  const fields = {
    title: route.title,
    description: route.description,
    canonical: url,
    'og:title': route.title,
    'og:description': route.description,
    'og:url': url,
    'og:image': image,
    'twitter:title': route.title,
    'twitter:description': route.description,
    'twitter:image': image,
    robots,
  }
  return html.replace(/<(title|meta|link)\b[^>]*data-shell="([^"]+)"[^>]*>/g, (tag, element, key) => {
    const value = fields[key]
    if (value == null) return tag
    if (element === 'title') return `<title data-shell="title">${value}</title>`
    if (tag.includes('content="')) return tag.replace(/content="[^"]*"/, `content="${value.replaceAll('"', '&quot;')}"`)
    return tag.replace(/href="[^"]*"/, `href="${value}"`)
  })
}

for (const route of meta) {
  const html = fill(shell, route)
  if (route.path === '' ) {
    fs.writeFileSync(path.join(dist, 'index.html'), html)
    continue
  }
  const dir = path.join(dist, route.path === '404' ? '' : route.path)
  const file = route.path === '404' ? path.join(dist, '404.html') : path.join(dir, 'index.html')
  if (route.path !== '404') fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(file, html)
}

const urls = meta.filter((route) => !route.noindex).map((route) => `  <url><loc>${canonical(route.path)}</loc></url>`)
fs.writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
)
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`)
console.log(`prerendered ${meta.length} shells`)
