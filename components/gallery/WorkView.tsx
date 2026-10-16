'use client'

import { useState } from 'react'
import { Demo } from '@/data/demos'
import { CoverflowStage } from './CoverflowStage'
import { GalleryShell } from './GalleryShell'

type View = 'coverflow' | 'list'

/** Work page: coverflow by default, with the previous sidebar layout one click away. */
export function WorkView({ demos }: { demos: Demo[] }) {
  const [view, setView] = useState<View>('coverflow')

  return (
    <>
      {view === 'coverflow' ? <CoverflowStage demos={demos} /> : <GalleryShell demos={demos} />}
      <div
        role="group"
        aria-label="Work layout"
        className="fixed right-4 bottom-4 z-40 inline-flex rounded-full bg-white p-1 text-[0.7rem] font-medium shadow-[0_1px_6px_rgb(0_0_0/0.08)] ring-1 ring-black/5 dark:bg-[#1a1a1a] dark:shadow-[0_1px_6px_rgb(0_0_0/0.3)] dark:ring-white/10"
      >
        {(['coverflow', 'list'] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={`h-7 cursor-pointer rounded-full px-3 transition-colors duration-150 ${
              view === v
                ? 'bg-[#111] text-white dark:bg-white dark:text-[#111]'
                : 'text-[#555] hover:text-[#111] dark:text-[#aaa] dark:hover:text-white'
            }`}
          >
            {v === 'coverflow' ? 'Coverflow' : 'List'}
          </button>
        ))}
      </div>
    </>
  )
}
