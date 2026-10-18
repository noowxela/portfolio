import { lazy, Suspense, useState } from 'react'
import { GridDisc } from '@/components/gallery/albums/GridDisc'

// three.js only loads when v3 is picked.
const Disc3D = lazy(() => import('@/components/discs/Disc3D').then((m) => ({ default: m.Disc3D })))

type Version = 'v1' | 'v2' | 'v3'

const VERSIONS = [
  { id: 'v2', label: '02 v2' },
  { id: 'v3', label: '02 v3 · 3D' },
] as const

/** Side SVG on the discs page, with a hollow-core v2 like the centered disc, and a three.js v3. */
export function SideDisc() {
  const [version, setVersion] = useState<Version>('v1')

  return (
    <>
      {version === 'v3' ? (
        <Suspense fallback={null}>
          <Disc3D contained signal />
        </Suspense>
      ) : (
        <GridDisc contained signal={version === 'v2'} />
      )}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {VERSIONS.map((v) => {
          const on = version === v.id
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={on}
              onClick={() => setVersion(on ? 'v1' : v.id)}
              className={`border px-3 py-1 text-[0.72rem] font-medium tracking-[0.14em] whitespace-nowrap uppercase ${
                on
                  ? 'border-[#5ce1ff] text-[#5ce1ff]'
                  : 'border-white/25 text-white/70 hover:border-white/50 hover:text-white'
              }`}
            >
              {v.label}
            </button>
          )
        })}
      </div>
    </>
  )
}
