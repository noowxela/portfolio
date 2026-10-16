'use client'

import { useSyncExternalStore } from 'react'
import { Demo } from '@/data/demos'
import { UI_PREVIEW } from '@/lib/uiPreview'
import { CoverflowStage } from './CoverflowStage'
import { GalleryShell } from './GalleryShell'
import { CrateView } from './albums/CrateView'
import { GridView } from './albums/GridView'
import { ShelfView } from './albums/ShelfView'

const VERSIONS = [
  { id: '0', label: 'V0 Coverflow' },
  { id: '1', label: 'V1 Shelf' },
  { id: '2', label: 'V2 Grid' },
  { id: '3', label: 'V3 Crate' },
  { id: 'list', label: 'List' },
] as const
type Version = (typeof VERSIONS)[number]['id']

const DEFAULT: Version = '1'
const STORAGE_KEY = 'work-preview-version'
const EVENT = 'work-preview-version'

function isVersion(v: string | null): v is Version {
  return VERSIONS.some((x) => x.id === v)
}

/** URL `?v=` wins, then localStorage, then V1. */
function readVersion(): Version {
  if (!UI_PREVIEW) return DEFAULT
  const fromUrl = new URLSearchParams(window.location.search).get('v')
  if (isVersion(fromUrl)) return fromUrl
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isVersion(stored) ? stored : DEFAULT
}

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  window.addEventListener(EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(EVENT, onChange)
  }
}

function setVersion(v: Version) {
  window.localStorage.setItem(STORAGE_KEY, v)
  const url = new URL(window.location.href)
  url.searchParams.set('v', v)
  window.history.replaceState(window.history.state, '', url)
  window.dispatchEvent(new Event(EVENT))
}

/** Dev-only row under the site header for switching Work layouts. */
function PreviewRow({ version }: { version: Version }) {
  return (
    <div
      role="toolbar"
      aria-label="Work layout preview"
      className="fixed inset-x-0 top-14 z-40 flex h-8 items-center gap-1 overflow-x-auto border-b border-dashed border-[#e8756a]/60 bg-[#fff8f6]/95 px-3 font-mono text-[0.62rem] whitespace-nowrap text-[#555] backdrop-blur-sm dark:bg-[#1a1210]/95 dark:text-[#bbb]"
    >
      <span className="mr-1 rounded bg-[#e8756a] px-1.5 py-px text-[0.55rem] font-bold tracking-[0.12em] text-white">
        PREVIEW
      </span>
      {VERSIONS.map((v) => (
        <button
          key={v.id}
          type="button"
          aria-pressed={version === v.id}
          onClick={() => setVersion(v.id)}
          className={`h-6 cursor-pointer rounded px-2 transition-colors ${
            version === v.id
              ? 'bg-[#111] text-white dark:bg-white dark:text-[#111]'
              : 'hover:bg-black/6 hover:text-[#111] dark:hover:bg-white/8 dark:hover:text-white'
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}

export function WorkView({ demos }: { demos: Demo[] }) {
  const version = useSyncExternalStore(subscribe, readVersion, () => DEFAULT)

  return (
    // --work-top: header (3.5rem) plus the preview row (2rem) when it is shown.
    <div style={{ ['--work-top' as string]: UI_PREVIEW ? '5.5rem' : '3.5rem' }}>
      {UI_PREVIEW ? <PreviewRow version={version} /> : null}
      {version === '0' ? <CoverflowStage demos={demos} /> : null}
      {version === '1' ? <ShelfView demos={demos} /> : null}
      {version === '2' ? <GridView demos={demos} /> : null}
      {version === '3' ? <CrateView demos={demos} /> : null}
      {version === 'list' ? <GalleryShell demos={demos} /> : null}
    </div>
  )
}
