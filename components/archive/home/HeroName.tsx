import { site } from '@/data/site'

/** v1 hero name. It sat centered over the grid. The live hero is shown without it. */
export function HeroName() {
  return (
    <h1 className="hero-name" data-hero="name">
      {site.fullName}
    </h1>
  )
}
