# Journey

Journey is a scroll-driven ride from a desk, through a grid, and back. It is linked from the Home corner labeled Journey.

## Sub-features

- `journey-open` shows the page and its accessible name.

## How to get to it (user POV)

- Open `/journey/`.
- From Home, choose the corner link `Journey`.

## Driving it with verify.mjs

Preconditions:

- Doctor passes against `http://127.0.0.1:3100`.

- **Open Journey.** Go to `/journey/`. Run `node .cursor/skills/verify-portfolio/verify.mjs drive journey`. A level-1 heading reads `Alex Woon`.
- **Proof.** `artifacts/journey/page.png` shows the ride. `artifacts/journey/main.aria.txt` includes that heading. `artifacts/journey/meta.json` records `/journey/`.

## Gotchas

- The HUD is hidden from assistive tech. Do not assert its act label.
- The heading is visually hidden on the WebGL path. It is still in the accessibility tree.
- This recipe does not scroll the ride. Opening the page is the proof.
