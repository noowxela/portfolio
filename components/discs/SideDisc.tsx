'use client'

import { useState } from 'react'
import { GridDisc } from '@/components/gallery/albums/GridDisc'

/** Side SVG on the discs page, with a hollow-core v2 like the centered disc. */
export function SideDisc() {
  const [v2, setV2] = useState(false)

  return (
    <>
      <GridDisc contained signal={v2} />
      <button
        type="button"
        aria-pressed={v2}
        onClick={() => setV2((on) => !on)}
        className={`absolute bottom-5 left-1/2 z-10 -translate-x-1/2 border px-3 py-1 text-[0.72rem] font-medium tracking-[0.14em] uppercase ${
          v2
            ? 'border-[#5ce1ff] text-[#5ce1ff]'
            : 'border-white/25 text-white/70 hover:border-white/50 hover:text-white'
        }`}
      >
        02 v2
      </button>
    </>
  )
}
