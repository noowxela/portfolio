import { DiscV2 } from '@/components/home/discs'
import { site } from '@/data/site'
import { asset } from '@/lib/asset'

/**
 * Plain 2D version of the Legacy hero with the Work CTA. Shown for
 * prefers-reduced-motion, when WebGL is unavailable, and as the poster
 * before the 3D scene is ready.
 */
export function JourneyFallback({ poster = false }: { poster?: boolean }) {
  return (
    <section
      className={`scene scene-hero journey-fallback ${poster ? 'is-poster' : ''}`}
      data-journey="fallback"
      aria-label="Introduction"
    >
      <div className="grid-pit" aria-hidden>
        <div className="grid-floor" />
      </div>
      <div className="hero-glow" aria-hidden />
      <div className="hero-copy">
        <p className="hero-role">{site.role} · {site.location}</p>
        <h1 className="hero-name">{site.name}</h1>
        {!poster && (
          <a className="journey-cta" href={asset('/work/')}>
            <span>Enter the Work</span>
            <span aria-hidden>→</span>
          </a>
        )}
      </div>
      <div className="scroll-stack">
        <div className="disc disc-v2" aria-hidden>
          <DiscV2 />
        </div>
      </div>
    </section>
  )
}
