import { useSyncExternalStore } from 'react'
import { Demo } from '@/data/demos'
import { CoverflowStage } from './CoverflowStage'
import { GalleryShell } from './GalleryShell'
import { GridView } from './albums/GridView'
import { ShelfView } from './albums/ShelfView'

const VIEWS = [
  { id: 'coverflow', label: 'Coverflow' },
  { id: 'shelf', label: 'Shelf' },
  { id: 'grid', label: 'Grid' },
  { id: 'list', label: 'List' },
] as const
type View = (typeof VIEWS)[number]['id']

const DEFAULT: View = 'shelf'
const STORAGE_KEY = 'work-view'
const LEGACY_STORAGE_KEY = 'work-preview-version'
const EVENT = 'work-view-change'

/** Values from the old preview row (?v=0..3); the Crate view (3) was removed, so it falls back to Shelf. */
const LEGACY: Record<string, View> = { '0': 'coverflow', '1': 'shelf', '2': 'grid', '3': 'shelf' }

function toView(v: string | null): View | null {
  if (!v) return null
  if (VIEWS.some((x) => x.id === v)) return v as View
  return LEGACY[v] ?? null
}

/** URL `?v=` wins, then localStorage (new key, then the old preview key), then Shelf. */
function readView(): View {
  return (
    toView(new URLSearchParams(window.location.search).get('v')) ??
    toView(window.localStorage.getItem(STORAGE_KEY)) ??
    toView(window.localStorage.getItem(LEGACY_STORAGE_KEY)) ??
    DEFAULT
  )
}

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  window.addEventListener(EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(EVENT, onChange)
  }
}

function setView(v: View) {
  window.localStorage.setItem(STORAGE_KEY, v)
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
  const url = new URL(window.location.href)
  url.searchParams.set('v', v)
  window.history.replaceState(window.history.state, '', url)
  window.dispatchEvent(new Event(EVENT))
}

/** View switcher: slim monospace row under the site header, with the PREVIEW tag (kept by request). */
function ViewSwitcher({ view }: { view: View }) {
  return (
    <div
      role="toolbar"
      aria-label="Work layout"
      className="fixed inset-x-0 top-14 z-40 flex h-8 items-center gap-1 overflow-x-auto border-b border-dashed border-[#e8756a]/60 bg-[#fff8f6]/95 px-3 font-mono text-[0.62rem] whitespace-nowrap text-[#555] backdrop-blur-sm dark:bg-[#1a1210]/95 dark:text-[#bbb]"
    >
      <span aria-hidden className="mr-1 rounded bg-[#e8756a] px-1.5 py-px text-[0.55rem] font-bold tracking-[0.12em] text-white">
        PREVIEW
      </span>
      {VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          aria-pressed={view === v.id}
          onClick={() => setView(v.id)}
          className={`h-6 cursor-pointer rounded px-2 transition-colors ${
            view === v.id
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
  const view = useSyncExternalStore(subscribe, readView, () => DEFAULT)

  return (
    // --work-top: site header (3.5rem) plus the switcher row (2rem). Every layout pads by it.
    <div style={{ ['--work-top' as string]: '5.5rem' }}>
      <ViewSwitcher view={view} />
      {view === 'coverflow' ? <CoverflowStage demos={demos} /> : null}
      {view === 'shelf' ? <ShelfView demos={demos} /> : null}
      {view === 'grid' ? <GridView demos={demos} /> : null}
      {view === 'list' ? <GalleryShell demos={demos} /> : null}
    </div>
  )
}
