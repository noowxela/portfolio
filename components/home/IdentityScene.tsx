import { site } from '@/data/site'

const layers = [
  { speed: '0.72', lag: '0.16' },
  { speed: '0.96', lag: '0.36' },
  { speed: '1.16', lag: '0.52' },
]

export function IdentityScene() {
  return (
    <section className="scene scene-identity" data-scene="identity" aria-label="Identity">
      <div className="scene-frame" aria-hidden />
      <div className="identity-copy">
        <p className="hud" data-lag="0.2">
          02 // Ares
        </p>
        <h2 className="identity-name" data-speed="0.88">
          {site.fullName}
        </h2>
        <p className="identity-lead" data-lag="0.4">
          {site.tagline}
        </p>
        <p className="identity-meta">{site.education}</p>
      </div>
      <ul className="identity-panels">
        {site.highlights.map((item, index) => (
          <li
            key={item}
            className="panel"
            data-speed={layers[index]?.speed}
            data-lag={layers[index]?.lag}
          >
            <span className="hud">0{index + 1}</span>
            <p>{item}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
