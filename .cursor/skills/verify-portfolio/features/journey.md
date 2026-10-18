# Journey

`/journey/` is grid.log: Alex's work experience told as a git log on the Tron grid. Five panels sit in one horizontal row, oldest first: Multimedia University (the `edu` branch), Auronex, Oasis Interactive, Trinergy Digital, and a HEAD panel that points to contact links and About. A branch rail at the bottom shows `edu` merging into `main`, nodes labelled `MMU`, `Auronex`, `Oasis`, `Trinergy`, and three dots after Trinergy that are the HEAD button. A particle mark (the years of the current step) sits behind the panels and morphs when the step changes. The Home corner labeled Journey links here.

## Sub-features

- `journey-open` shows the row, its hidden level-1 heading, and the first panel.
- `journey-step` moves to another step. A rail node, wheel, drag or swipe, arrow keys, Home, End, or a click on a dim panel all do it. The URL hash becomes the step's short commit hash (`#ef5e76` is Auronex).
- `journey-deeplink` opens a step from the hash, for example `/journey/#7d3d11` opens Oasis.

## How to get to it (user POV)

- Open `/journey/`.
- From Home, choose the corner link `Journey`. The staged entrance plays under the curtain.
- Choose `Journey` in the site navigation. From Home it plays the same exit and entrance as the corner; from other pages it navigates directly.

## Driving it with verify.mjs

Preconditions:

- Doctor passes against `http://127.0.0.1:3100`.

- **Open and step.** Run `node .cursor/skills/verify-portfolio/verify.mjs drive journey`. It finds the level-1 heading `Journey: … work experience`, the list `Work experience, oldest first` with the heading `Multimedia University`, then clicks the rail node for Auronex. The hash becomes `#ef5e76` and the current panel's heading is `Auronex Sdn Bhd`.
- **Proof.** `artifacts/journey/page.png` shows the Auronex panel lit. `artifacts/journey/main.aria.txt` includes the headings, the list, and the rail buttons. `artifacts/journey/meta.json` records `/journey/#ef5e76`.

## Gotchas

- Headings of linked companies end with ` ↗` in the accessible name. Match them with a pattern, not an exact string.
- The level-1 heading is visually hidden. It is still in the accessibility tree.
- The particle field is built only after the page is idle (and after the Home entrance ends). Wait for `main[data-field="ready"]` before you judge the particles. It never appears with reduced motion or without WebGL; the static years mark shows instead and `main[data-mode="static"]` is set.
- The HEAD rail control is the three dots, a button named `Next commit — available`, not a `.gl-node`. Rail buttons: `main .gl-rail button` (5 of them).
- A short Web Audio blip plays when the row settles on a new step, but only after a click, tap or key press on the page (browser autoplay rules). The speaker button `Sound effects` (`aria-pressed`, class `.sound-toggle`) is in the site header now, not the journey bar; it turns every site sound off, and the choice is saved in `localStorage['gridlog-sound']`.
- On phones, the long Trinergy panel scrolls inside its own body. A vertical swipe scrolls it; a horizontal swipe moves one panel.
