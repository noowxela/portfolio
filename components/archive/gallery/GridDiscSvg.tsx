/** SVG side discs, kept when the grid background moved to Three.js. Not mounted. */
const TICKS = Array.from({ length: 42 }, (_, i) => {
  const deg = 38 + (i * 104) / 41
  const a = (deg * Math.PI) / 180
  const inner = i % 5 === 0 ? 70.5 : 72
  return {
    x1: 100 + Math.cos(a) * inner,
    y1: 100 + Math.sin(a) * inner,
    x2: 100 + Math.cos(a) * 74.2,
    y2: 100 + Math.sin(a) * 74.2,
  }
})

const SPARKS = [
  [100, 104, 0.9],
  [91, 96, 0.45],
  [112, 98, 0.4],
  [106, 116, 0.3],
  [88, 112, 0.28],
  [116, 110, 0.22],
  [97, 88, 0.25],
] as const

const RING = {
  fill: 'none',
  strokeLinecap: 'round',
  strokeDasharray: '488 40',
  transform: 'rotate(-90 100 100)',
} as const

function DiscFace({ tone }: { tone: 'plain' | 'neon' }) {
  const neon = tone === 'neon'
  const glowId = `grid-disc-glow-${tone}`
  const bodyId = `grid-disc-body-${tone}`
  return (
    <div className={`grid-disc-side ${neon ? 'grid-disc-side-right' : 'grid-disc-side-left'}`}>
      <div className="grid-disc-tilt">
        <svg
          viewBox="0 0 200 200"
          className={`h-full w-full ${neon ? 'grid-disc-neon text-[#ff7a18]' : 'text-[#2c2c2c] dark:text-white'}`}
        >
          <defs>
            <radialGradient id={bodyId} cx={neon ? '32%' : '68%'} cy="46%" r="58%">
              <stop offset="0%" stopColor="var(--disc-core)" />
              <stop offset="62%" stopColor="var(--disc-shade)" />
              <stop offset="100%" stopColor="var(--disc-rim)" />
            </radialGradient>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="100" cy="100" r="96" fill={`url(#${bodyId})`} />
          <g className="grid-disc-breathe" filter={neon ? undefined : `url(#${glowId})`}>
            <circle cx="100" cy="100" r="84" stroke="currentColor" strokeWidth={neon ? 5.6 : 4.2} {...RING} />
          </g>
          <g className="grid-disc-sweep">
            <circle
              cx="100"
              cy="100"
              r="84"
              fill="none"
              stroke={neon ? '#ffc48a' : '#ffffff'}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeDasharray="32 496"
              transform="rotate(-90 100 100)"
            />
          </g>
          <g className="grid-disc-spin text-current">
            <circle
              cx="100"
              cy="100"
              r="68"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray="0.55 2.15"
              opacity="0.9"
            />
            <circle
              cx="100"
              cy="100"
              r="63"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeDasharray="0.35 2.8"
              opacity="0.55"
            />
          </g>
          <g className="grid-disc-spin grid-disc-spin-reverse">
            <circle
              cx="100"
              cy="100"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="0.4 2.5"
              opacity="0.75"
            />
            <circle
              cx="100"
              cy="100"
              r="51"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeDasharray="0.3 3.4"
              opacity="0.4"
            />
          </g>
          {TICKS.map((tick) => (
            <line
              key={`${tone}-${tick.x1}-${tick.y1}`}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="currentColor"
              strokeWidth="0.35"
              opacity="0.7"
            />
          ))}
          <circle cx="100" cy="100" r="46" fill="var(--disc-well)" />
          <circle cx="100" cy="100" r="46" fill="none" stroke="var(--disc-rim)" strokeWidth="1.1" opacity="0.85" />
          {SPARKS.map(([x, y, r]) => (
            <circle key={`${tone}-${x}-${y}`} cx={x} cy={y} r={r} fill="currentColor" opacity="0.55" />
          ))}
        </svg>
      </div>
    </div>
  )
}

/** Backdrop for the grid: two tilted half discs. Hover tips the one under the pointer. */
export function GridDiscSvg() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <DiscFace tone="plain" />
      <DiscFace tone="neon" />
    </div>
  )
}
