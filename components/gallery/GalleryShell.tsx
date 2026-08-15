'use client'

import { useState, useSyncExternalStore } from 'react'
import { Demo } from '@/data/demos'
import { DemoSidebar } from './DemoSidebar'
import { DemoStage } from './DemoStage'
import { IdentityChip } from './IdentityChip'

function subscribeMobile(onChange: () => void) {
  const mq = window.matchMedia('(max-width: 639px)')
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia('(max-width: 639px)').matches,
    () => false,
  )
}

export function GalleryShell({ demos }: { demos: Demo[] }) {
  const isMobile = useIsMobile()
  const [selected, setSelected] = useState<Demo>(demos[0])
  const [userCollapsed, setUserCollapsed] = useState<boolean | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const collapsed = userCollapsed ?? isMobile

  const handleSelect = (demo: Demo) => {
    setSelected(demo)
    setDetailOpen(false)
    if (isMobile) setUserCollapsed(true)
  }

  const handleToggleDetail = (demo: Demo) => {
    if (selected.name === demo.name) {
      setDetailOpen((open) => !open)
      return
    }
    setSelected(demo)
    setDetailOpen(true)
    if (isMobile) setUserCollapsed(true)
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[#eeeeee] font-sans dark:bg-[#0d0d0d]">
      <DemoSidebar
        demos={demos}
        selected={selected}
        collapsed={collapsed}
        detailOpen={detailOpen}
        onSelect={handleSelect}
        onToggleDetail={handleToggleDetail}
        onToggle={() => setUserCollapsed(!(userCollapsed ?? isMobile))}
      />
      <main className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden p-4 sm:p-6">
        <DemoStage
          demo={selected}
          detailOpen={detailOpen}
          onCloseDetail={() => setDetailOpen(false)}
        />
      </main>
      <IdentityChip />
    </div>
  )
}
