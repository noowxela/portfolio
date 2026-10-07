import type { CSSProperties } from 'react'
import { site } from '@/data/site'
import { DiscV2 } from './discs'

const mistPieces = [
  { left: '8%', from: '3%', to: '34%', w: '20%', h: '7%', dur: '18s', delay: '-4s', drift: '-5%', depth: 'far' },
  { left: '36%', from: '1%', to: '30%', w: '24%', h: '8%', dur: '22s', delay: '-12s', drift: '4%', depth: 'far' },
  { left: '66%', from: '6%', to: '36%', w: '18%', h: '6%', dur: '16s', delay: '-2s', drift: '7%', depth: 'far' },
  { left: '50%', from: '4%', to: '28%', w: '16%', h: '6%', dur: '20s', delay: '-9s', drift: '-3%', depth: 'far' },
  { left: '22%', from: '12%', to: '40%', w: '18%', h: '7%', dur: '19s', delay: '-15s', drift: '6%', depth: 'far' },
  { left: '82%', from: '2%', to: '32%', w: '14%', h: '6%', dur: '21s', delay: '-6s', drift: '-8%', depth: 'far' },
  { left: '4%', from: '16%', to: '56%', w: '18%', h: '9%', dur: '13s', delay: '-7s', drift: '-8%', depth: 'near' },
  { left: '30%', from: '10%', to: '54%', w: '20%', h: '10%', dur: '15s', delay: '-5s', drift: '3%', depth: 'near' },
  { left: '56%', from: '20%', to: '60%', w: '16%', h: '8%', dur: '14s', delay: '-9s', drift: '9%', depth: 'near' },
  { left: '76%', from: '8%', to: '52%', w: '14%', h: '7%', dur: '17s', delay: '-1s', drift: '-3%', depth: 'near' },
  { left: '18%', from: '24%', to: '62%', w: '14%', h: '8%', dur: '12s', delay: '-6s', drift: '5%', depth: 'near' },
  { left: '42%', from: '32%', to: '60%', w: '12%', h: '8%', dur: '16s', delay: '-11s', drift: '-6%', depth: 'near' },
  { left: '64%', from: '28%', to: '58%', w: '12%', h: '7%', dur: '18s', delay: '-3s', drift: '7%', depth: 'near' },
  { left: '0%', from: '36%', to: '62%', w: '11%', h: '7%', dur: '13s', delay: '-8s', drift: '4%', depth: 'near' },
  { left: '26%', from: '40%', to: '62%', w: '10%', h: '6%', dur: '11s', delay: '-2s', drift: '-4%', depth: 'near' },
  { left: '88%', from: '22%', to: '56%', w: '12%', h: '7%', dur: '15s', delay: '-13s', drift: '-5%', depth: 'near' },
]

export function HeroScene() {
  return (
    <section className="scene scene-hero" data-scene="hero" aria-label="Introduction">
      <div className="grid-pit" aria-hidden>
        <div className="grid-floor" data-hero="floor">
          <div className="hero-mist" data-hero="mist">
            {mistPieces.map((piece) => (
              <span
                key={`${piece.left}-${piece.delay}`}
                className={`mist-piece mist-${piece.depth}`}
                style={
                  {
                    left: piece.left,
                    top: `calc((${piece.from} + ${piece.to}) / 2)`,
                    width: piece.w,
                    height: piece.h,
                    animationDuration: piece.dur,
                    animationDelay: piece.delay,
                    '--drift': piece.drift,
                    '--from': piece.from,
                    '--to': piece.to,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </div>
      </div>
      <h1 className="hero-name-hidden">{site.name}</h1>
      <div className="scroll-stack">
        <div className="scroll-meter" aria-hidden>
          <span data-hero="meter" />
        </div>
        <div className="disc disc-v2" data-hero="disc">
          <DiscV2 />
        </div>
      </div>
    </section>
  )
}
