'use client'

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Demo, demoLiveUrl } from '@/data/demos'

type Props = {
  demo: Demo | null
  open: boolean
  onClose: () => void
}

export function DemoNote({ demo, open, onClose }: Props) {
  if (!demo) return null

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[70]">
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50" aria-hidden />
      <div className="fixed inset-0 flex justify-end p-3 sm:p-4">
        <DialogPanel className="flex h-full w-full max-w-md flex-col overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_16px_50px_rgb(0_0_0/0.18)] ring-1 ring-black/5 sm:p-6 dark:bg-[#1a1a1a] dark:ring-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-[#aaa] uppercase">
                Project
              </p>
              <DialogTitle className="mt-1 text-lg font-semibold text-[#111] dark:text-white">
                {demo.name}
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close project notes"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#777] transition-colors hover:bg-black/5 hover:text-[#111] dark:hover:bg-white/8 dark:hover:text-white"
            >
              <svg viewBox="0 0 10 10" aria-hidden className="h-2.5 w-2.5">
                <path
                  d="M2 2L8 8M8 2L2 8"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {demo.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-black/5 px-2 py-0.5 text-[0.65rem] font-medium text-[#555] dark:bg-white/8 dark:text-[#ccc]"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#444] dark:text-[#ccc]">{demo.note}</p>

          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            <a
              href={demoLiveUrl(demo)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#111] px-3.5 py-1.5 text-[0.8rem] font-medium text-white transition hover:bg-black dark:bg-white dark:text-[#111]"
            >
              Open live
            </a>
            {demo.repoUrl ? (
              <a
                href={demo.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-black/10 px-3.5 py-1.5 text-[0.8rem] font-medium text-[#333] transition hover:bg-black/5 dark:border-white/10 dark:text-[#ddd] dark:hover:bg-white/8"
              >
                GitHub
              </a>
            ) : null}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
