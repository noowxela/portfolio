# Noelite

Noelite is the previous scroll home: introduction, identity, selected work, and contact. It is not linked from the header.

## Sub-features

- `noelite-open` shows the introduction scene.

## How to get to it (user POV)

- Open `/noelite/`.

## Driving it with verify.mjs

Preconditions:

- Doctor passes against `http://127.0.0.1:3100`.

- **Open Noelite.** Go to `/noelite/`. Run `node .cursor/skills/verify-portfolio/verify.mjs drive noelite`. A region named `Introduction` is present.
- **Proof.** `artifacts/noelite/page.png` shows the introduction. `artifacts/noelite/main.aria.txt` includes `Introduction`. `artifacts/noelite/meta.json` records `/noelite/`.

## Gotchas

- This is not `/`. Home no longer has an `Introduction` region.
- The page is tall. The screenshot is the first viewport.
- Reduced motion still leaves the introduction region in place.
