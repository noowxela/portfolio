import Link from 'next/link'
import { site } from '@/data/site'

const links = [
  { href: `mailto:${site.email}`, label: 'Email', external: false },
  { href: site.github, label: 'GitHub', external: true },
  { href: site.linkedin, label: 'LinkedIn', external: true },
  { href: site.resume, label: 'Resume', external: true },
]

export function ExitScene() {
  return (
    <section className="scene scene-exit" data-scene="exit" aria-label="Contact">
      <div className="grid-pit grid-pit-exit" aria-hidden>
        <div className="grid-floor grid-floor-static" />
      </div>
      <div className="scene-frame" aria-hidden />
      <div className="exit-copy">
        <p className="hud" data-lag="0.45">
          04 // Signal
        </p>
        <h2>Enter the gallery</h2>
        <p className="exit-lead" data-lag="0.3">
          {site.role} · {site.location}
        </p>
        <Link href="/work" className="exit-cta">
          Enter the gallery
        </Link>
        <ul className="exit-links">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
