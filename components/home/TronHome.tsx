'use client'

import { useRef } from 'react'
import type { Demo } from '@/data/demos'
import { ExitScene } from './ExitScene'
import { HandoffScene } from './HandoffScene'
import { HeroScene } from './HeroScene'
import { IdentityScene } from './IdentityScene'
import { useHomeScroll } from './useHomeScroll'
import { WorkScene } from './WorkScene'

export function TronHome({ demos, className }: { demos: Demo[]; className?: string }) {
  const rootRef = useRef<HTMLElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  useHomeScroll(rootRef, wrapperRef, contentRef)

  return (
    <main ref={rootRef} className={`tron-root ${className ?? ''}`}>
      <div className="tron-scan" aria-hidden />
      <div ref={wrapperRef} className="smooth-wrapper" id="smooth-wrapper">
        <div ref={contentRef} className="smooth-content" id="smooth-content">
          <HeroScene />
          <HandoffScene />
          <IdentityScene />
          <WorkScene demos={demos} />
          <ExitScene />
        </div>
      </div>
    </main>
  )
}
