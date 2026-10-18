# Journey

`/journey/` is a temporary Tron "coming soon" page until the work-experience journey lands. The 3D scroll ride moved to `/noelite2/`. The Home corner labeled Journey still links here.

## Sub-features

- `journey-open` shows the stub, its heading, and the link to `/noelite2/`.

## How to get to it (user POV)

- Open `/journey/`.
- From Home, choose the corner link `Journey`.

## Driving it with verify.mjs

Preconditions:

- Doctor passes against `http://127.0.0.1:3100`.

- **Open Journey.** Go to `/journey/`. Run `node .cursor/skills/verify-portfolio/verify.mjs drive journey`. A level-1 heading reads `Journey` and a link reads `Ride the 3D journey`.
- **Proof.** `artifacts/journey/page.png` shows the stub. `artifacts/journey/main.aria.txt` includes the heading and link. `artifacts/journey/meta.json` records `/journey/`.

## Gotchas

- This page is replaced when the work-experience journey is built; update this file then.
