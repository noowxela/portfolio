/**
 * Serve dist/ the way GitHub Pages serves this site:
 * mounted at /portfolio/, directory URLs gain a trailing slash, unknown paths are 404.html.
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const port = Number(process.env.VERIFY_PORT || process.env.PORT || 3100)
const host = '127.0.0.1'
const base = '/portfolio'

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
}

function send(res, file, status) {
  res.writeHead(status, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${host}`)
  const pathname = decodeURIComponent(url.pathname)
  if (pathname === base) {
    res.writeHead(301, { Location: `${base}/${url.search}` })
    res.end()
    return
  }
  if (pathname !== base && !pathname.startsWith(`${base}/`)) {
    send(res, path.join(dist, '404.html'), 404)
    return
  }
  let rel = pathname.slice(base.length)
  if (!path.extname(rel)) {
    if (!rel.endsWith('/')) {
      res.writeHead(301, { Location: `${pathname}/${url.search}` })
      res.end()
      return
    }
    rel += 'index.html'
  }
  const file = path.resolve(dist, `.${rel}`)
  if (file.startsWith(dist) && fs.existsSync(file) && fs.statSync(file).isFile()) {
    send(res, file, 200)
    return
  }
  const missing = path.join(dist, '404.html')
  if (fs.existsSync(missing)) send(res, missing, 404)
  else {
    res.writeHead(404)
    res.end('not found')
  }
})

server.listen(port, host, () => {
  console.log(`pages http://${host}:${port}${base}/`)
})
