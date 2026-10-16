// One-off: capture each embeddable demo at 1440x900 into public/thumbs/<slug>.webp.
// Usage: node scripts/shoot-thumbs.mjs [slug ...]
// Playwright only writes PNG/JPEG, so each frame is re-encoded to WebP by Chrome's canvas encoder.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const root = path.resolve(import.meta.dirname, '..')
const src = await readFile(path.join(root, 'data/demos.ts'), 'utf8')

// Parse the demos array without a TS loader: one object literal per `{ name: ... }` block.
const demos = [...src.matchAll(/\{\s*name:[\s\S]*?\n {2}\}/g)].map(([block]) => ({
  slug: block.match(/slug: '([^']+)'/)?.[1],
  embedUrl: block.match(/embedUrl: '([^']+)'/)?.[1],
  shotUrl: block.match(/shotUrl: '([^']+)'/)?.[1],
  embeddable: !/embeddable: false/.test(block),
}))

const only = process.argv.slice(2)
const targets = demos.filter((d) => d.slug && d.embedUrl && d.embeddable && (!only.length || only.includes(d.slug)))

async function toWebp(encoder, png) {
  const dataUrl = await encoder.evaluate(async (b64) => {
    const img = new Image()
    img.src = `data:image/png;base64,${b64}`
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.naturalWidth
    c.height = img.naturalHeight
    c.getContext('2d').drawImage(img, 0, 0)
    return c.toDataURL('image/webp', 0.8)
  }, png.toString('base64'))
  return Buffer.from(dataUrl.split(',')[1], 'base64')
}

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' }) // uses installed Google Chrome; set PW_CHANNEL= to use Playwright's bundled build
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const encoder = await browser.newPage()
for (const demo of targets) {
  const webp = path.join(root, `public/thumbs/${demo.slug}.webp`)
  try {
    await page.goto(demo.shotUrl ?? demo.embedUrl, { waitUntil: 'networkidle', timeout: 30_000 }).catch(() => {})
    await page.waitForTimeout(Number(process.env.SHOT_WAIT ?? 2500)) // let canvases / WebGL settle; heavy WebGL sites need SHOT_WAIT=8000+
    const png = await page.screenshot()
    await writeFile(webp, await toWebp(encoder, png))
    console.log('ok  ', demo.slug)
  } catch (err) {
    console.log('fail', demo.slug, err.message)
  }
}
await browser.close()
