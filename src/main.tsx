import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import interUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'
import oxaniumUrl from '@fontsource/oxanium/files/oxanium-latin-600-normal.woff2?url'
import './fonts.css'
import './globals.css'
import { startBoot } from './boot'
import { router } from './routes'

for (const href of [interUrl, oxaniumUrl]) {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'font'
  link.type = 'font/woff2'
  link.crossOrigin = 'anonymous'
  link.href = href
  document.head.appendChild(link)
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<RouterProvider router={router} />)
startBoot()
