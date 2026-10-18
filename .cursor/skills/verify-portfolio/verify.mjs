#!/usr/bin/env node
/**
 * Drive the portfolio site for verification.
 * Usage, from the portfolio repo root:
 *   node .cursor/skills/verify-portfolio/verify.mjs launch
 *   node .cursor/skills/verify-portfolio/verify.mjs doctor
 *   node .cursor/skills/verify-portfolio/verify.mjs drive <about|home|work|discs>
 *   node .cursor/skills/verify-portfolio/verify.mjs cleanup
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(SKILL_DIR, '../../..')
const STATE_DIR = path.join(ROOT, '.verify')
const STATE_FILE = path.join(STATE_DIR, 'run.json')
const LOG_FILE = path.join(STATE_DIR, 'server.log')
const ARTIFACTS = path.join(SKILL_DIR, 'artifacts')
const PORT = Number(process.env.VERIFY_PORT || 3100)
const BASE = `http://127.0.0.1:${PORT}`

function readState() {
  if (!fs.existsSync(STATE_FILE)) return null
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
}

function alive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port }, () => {
      socket.end()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
  })
}

async function waitReady(port, timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`)
      if (res.status === 200) return
    } catch {
      // server still booting
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`portfolio did not answer 200 on ${BASE}/ within ${timeoutMs}ms. See ${LOG_FILE}`)
}

async function launch() {
  const existing = readState()
  if (existing && alive(existing.pid)) {
    throw new Error(`verification server already running as pid ${existing.pid} on port ${existing.port}. Run cleanup first.`)
  }
  if (await portOpen(PORT)) {
    throw new Error(`port ${PORT} is already taken. Refusing to share it. Set VERIFY_PORT to a free port.`)
  }
  fs.mkdirSync(STATE_DIR, { recursive: true })
  const log = fs.openSync(LOG_FILE, 'a')
  fs.writeSync(log, `\n--- build ${new Date().toISOString()} ---\n`)
  const build = spawn('npx', ['next', 'build'], {
    cwd: ROOT,
    stdio: ['ignore', log, log],
    env: { ...process.env, GITHUB_PAGES: '' },
  })
  const buildCode = await new Promise((resolve) => build.on('close', resolve))
  if (buildCode !== 0) {
    fs.closeSync(log)
    throw new Error(`next build exited ${buildCode}. See ${LOG_FILE}`)
  }
  const child = spawn('npx', ['--yes', 'serve', 'out', '-l', `tcp://127.0.0.1:${PORT}`, '--no-clipboard'], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, GITHUB_PAGES: '' },
  })
  child.unref()
  fs.closeSync(log)
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({ pid: child.pid, port: PORT, startedAt: new Date().toISOString(), mode: 'serve out' }, null, 2),
  )
  try {
    await waitReady(PORT, 120000)
  } catch (error) {
    try {
      process.kill(-child.pid, 'SIGTERM')
    } catch {
      // already gone
    }
    throw error
  }
  console.log(JSON.stringify({ ok: true, url: BASE, pid: child.pid, port: PORT, mode: 'serve out', log: LOG_FILE }))
}

function doctor() {
  const state = readState()
  const problems = []
  if (!state) problems.push('no .verify/run.json — this run did not launch a server')
  else if (!alive(state.pid)) problems.push(`pid ${state.pid} is not running`)
  else if (state.port !== PORT) problems.push(`state port ${state.port} does not match VERIFY_PORT ${PORT}`)
  const report = {
    ok: problems.length === 0,
    url: state ? `http://127.0.0.1:${state.port}` : null,
    pid: state?.pid ?? null,
    port: state?.port ?? null,
    problems,
  }
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) process.exit(1)
}

async function browser() {
  const state = readState()
  if (!state || !alive(state.pid)) throw new Error('doctor would fail: launch the verification server first')
  // A leftover PLAYWRIGHT_BROWSERS_PATH can point at a browser build for another CPU.
  // Playwright reads it when the module loads, so drop it before the import.
  if (process.env.PLAYWRIGHT_BROWSERS_PATH?.includes('cursor-sandbox-cache')) {
    delete process.env.PLAYWRIGHT_BROWSERS_PATH
  }
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  page.setDefaultTimeout(20000)
  return {
    page,
    base: `http://127.0.0.1:${state.port}`,
    async close() {
      await browser.close()
    },
  }
}

async function proof(name, page, main) {
  const dir = path.join(ARTIFACTS, name)
  fs.mkdirSync(dir, { recursive: true })
  const aria = await main.ariaSnapshot()
  fs.writeFileSync(path.join(dir, 'main.aria.txt'), aria)
  await page.screenshot({ path: path.join(dir, 'page.png'), fullPage: false })
  fs.writeFileSync(
    path.join(dir, 'meta.json'),
    JSON.stringify({ feature: name, url: page.url(), at: new Date().toISOString() }, null, 2),
  )
  console.log(JSON.stringify({ ok: true, feature: name, url: page.url(), artifacts: dir }))
}

async function drive(feature) {
  const session = await browser()
  const { page, base } = session
  try {
    if (feature === 'about') {
      await page.goto(`${base}/about/`, { waitUntil: 'networkidle' })
      const main = page.locator('main')
      await main.getByRole('heading', { level: 1, name: 'Alex Woon Jun Rong' }).waitFor()
      await main.getByRole('heading', { level: 2, name: 'Focus' }).waitFor()
      await main.getByRole('heading', { level: 2, name: 'What I work in' }).waitFor()
      await proof('about', page, main)
      return
    }
    if (feature === 'home') {
      await page.goto(`${base}/`, { waitUntil: 'networkidle' })
      const entries = page.getByRole('navigation', { name: 'Home' })
      await entries.getByRole('link', { name: 'Work' }).waitFor()
      await page.getByRole('heading', { level: 1, name: 'alex woon' }).waitFor()
      await page.getByRole('navigation', { name: 'Site navigation' }).getByRole('link', { name: 'alexW' }).waitFor()
      await proof('home', page, entries)
      return
    }
    if (feature === 'journey') {
      await page.goto(`${base}/journey/`, { waitUntil: 'networkidle' })
      await page.getByRole('heading', { level: 1, name: 'Journey' }).waitFor()
      await page.getByRole('link', { name: /Ride the 3D journey/ }).waitFor()
      await proof('journey', page, page.locator('main'))
      return
    }
    if (feature === 'noelite2') {
      await page.goto(`${base}/noelite2/`, { waitUntil: 'networkidle' })
      const heading = page.getByRole('heading', { level: 1, name: 'Alex Woon' })
      await heading.waitFor()
      await proof('noelite2', page, page.locator('main'))
      return
    }
    if (feature === 'noelite') {
      await page.goto(`${base}/noelite/`, { waitUntil: 'networkidle' })
      const intro = page.getByRole('region', { name: 'Introduction' })
      await intro.waitFor()
      await proof('noelite', page, intro)
      return
    }
    if (feature === 'work') {
      await page.goto(`${base}/work/?v=grid`, { waitUntil: 'networkidle' })
      const grid = page.getByRole('button', { name: 'Grid' })
      await grid.waitFor()
      if ((await grid.getAttribute('aria-pressed')) !== 'true') await grid.click()
      await page.getByRole('list', { name: 'Projects' }).waitFor()
      await page.getByRole('button', { name: 'Mount Replay, open details' }).waitFor()
      if ((await grid.getAttribute('aria-pressed')) !== 'true') throw new Error('Grid button is not pressed')
      if (!page.url().includes('v=grid')) throw new Error(`url is ${page.url()}, expected v=grid`)
      await proof('work', page, page.getByRole('toolbar', { name: 'Work layout' }))
      return
    }
    if (feature === 'discs') {
      await page.goto(`${base}/discs/#side`, { waitUntil: 'networkidle' })
      const side = page.locator('#side')
      await side.getByRole('button', { name: '02 v3 · 3D' }).click()
      await side.locator('canvas').waitFor()
      const pressed = await side.getByRole('button', { name: '02 v3 · 3D' }).getAttribute('aria-pressed')
      if (pressed !== 'true') throw new Error('02 v3 · 3D is not pressed')
      await proof('discs', page, side)
      return
    }
    throw new Error(`unknown feature ${feature}. Use about, home, work, discs, journey, noelite, or noelite2.`)
  } finally {
    await session.close()
  }
}

function cleanup() {
  const state = readState()
  if (state && alive(state.pid)) {
    try {
      process.kill(-state.pid, 'SIGTERM')
    } catch {
      try {
        process.kill(state.pid, 'SIGTERM')
      } catch {
        // already gone
      }
    }
  }
  fs.rmSync(STATE_DIR, { recursive: true, force: true })
  console.log(JSON.stringify({ ok: true, stopped: state?.pid ?? null, artifacts: ARTIFACTS }))
}

const [cmd, arg] = process.argv.slice(2)
try {
  if (cmd === 'launch') await launch()
  else if (cmd === 'doctor') doctor()
  else if (cmd === 'drive') await drive(arg)
  else if (cmd === 'cleanup') cleanup()
  else {
    console.error('usage: verify.mjs launch|doctor|drive <about|home|work|discs>|cleanup')
    process.exit(2)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
