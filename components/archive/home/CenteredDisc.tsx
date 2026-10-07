import { LegacyDisc } from '../../home/discs'

/** v1 hero disc. It sat centered behind the name. The live hero uses DiscV2 beside the corner label. */
export function CenteredDisc() {
  return (
    <div className="disc-slot" aria-hidden>
      <div className="disc disc-legacy">
        <LegacyDisc />
      </div>
    </div>
  )
}
