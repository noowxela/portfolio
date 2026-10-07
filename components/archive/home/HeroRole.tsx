import { site } from '@/data/site'

/** v1 hero role. It sat under the name. The live hero is shown without it. */
export function HeroRole() {
  return (
    <p className="hero-role" data-lag="0.45">
      {site.role}
      <span> · {site.location}</span>
    </p>
  )
}
