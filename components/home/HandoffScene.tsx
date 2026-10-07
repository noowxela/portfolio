import { AresMark, LegacyDisc } from './discs'

export function HandoffScene() {
  return (
    <section className="scene scene-handoff" data-scene="handoff" aria-label="Transition">
      <div className="grid-pit" aria-hidden>
        <div className="grid-floor grid-floor-static" />
      </div>
      <div className="ribbon ribbon-handoff" data-handoff="ribbon" aria-hidden>
        <span />
      </div>
      <div className="scene-frame" aria-hidden />
      <div className="handoff-stack">
        <p className="hud">System rewrite</p>
        <div className="handoff-mark">
          <div className="disc-layer" data-handoff="disc-round">
            <LegacyDisc />
          </div>
          <div className="disc-layer" data-handoff="disc-angular">
            <AresMark />
          </div>
        </div>
        <div className="handoff-labels">
          <p className="handoff-word" data-handoff="label-grid">
            Grid
          </p>
          <p className="handoff-word" data-handoff="label-ares">
            Ares
          </p>
        </div>
      </div>
    </section>
  )
}
