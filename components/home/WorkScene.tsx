import Image from 'next/image'
import Link from 'next/link'
import type { Demo } from '@/data/demos'
import { withBasePath } from '@/lib/withBasePath'

const speeds = ['0.94', '1', '1.06']
const lags = ['0.18', '0.34', '0.5']

export function WorkScene({ demos }: { demos: Demo[] }) {
  if (demos.length === 0) return null

  return (
    <section className="scene scene-work" data-scene="work" aria-label="Selected work">
      <div className="scene-frame" aria-hidden />
      <header className="work-head">
        <p className="hud">03 // Selected</p>
        <h2>Work</h2>
      </header>
      <div className="work-track" data-work="track">
        {demos.map((demo, index) => (
          <Link
            key={demo.slug}
            href="/work"
            className="work-card"
            data-speed={speeds[index] ?? '1'}
            data-lag={lags[index] ?? '0.3'}
          >
            <span className="hud">0{index + 1}</span>
            <span className="work-thumb">
              <Image
                src={withBasePath(demo.thumb)}
                alt=""
                fill
                sizes="(min-width: 768px) 460px, 92vw"
              />
            </span>
            <span className="work-name">{demo.name}</span>
            <span className="work-blurb">{demo.blurb}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
