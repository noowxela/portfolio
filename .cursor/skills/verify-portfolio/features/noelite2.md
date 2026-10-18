# Noelite 2

Noelite 2 is the scroll-driven ride from a desk, through a grid, and back (it lived at `/journey/` until 2026-10-18). It is not linked from the header, the Home corners, or `/journey/`. Open it by URL.

## Sub-features

- `noelite2-open` shows the page and its accessible name.

## How to get to it (user POV)

- Open `/noelite2/`.

## Driving it with verify.mjs

Preconditions:

- Doctor passes against `http://127.0.0.1:3100`.

- **Open Noelite 2.** Go to `/noelite2/`. Run `node .cursor/skills/verify-portfolio/verify.mjs drive noelite2`. A level-1 heading reads `Alex Woon`.
- **Proof.** `artifacts/noelite2/page.png` shows the ride. `artifacts/noelite2/main.aria.txt` includes that heading. `artifacts/noelite2/meta.json` records `/noelite2/`.

## Gotchas

- The HUD is hidden from assistive tech. Do not assert its act label.
- The heading is visually hidden on the WebGL path. It is still in the accessibility tree.
- This recipe does not scroll the ride. Opening the page is the proof.
