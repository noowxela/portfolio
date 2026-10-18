# Discs

Discs is a board of disc versions. The Side section has SVG versions and a 3D version.

## Sub-features

- `discs-side` shows the Side section.
- `discs-v3` turns on `02 v3 · 3D` and mounts a canvas.

## How to get to it (user POV)

- Open `/discs/#side`.
- Choose `Side` in the disc-version bar.
- Choose the button `02 v3 · 3D`.

## Driving it with verify.mjs

Preconditions:

- Doctor passes against `http://127.0.0.1:3100`.

- **Open 02 v3.** Go to `/discs/#side` and press `02 v3 · 3D`. Run `node .cursor/skills/verify-portfolio/verify.mjs drive discs`. The button's pressed state is true. The Side section contains a `canvas`.
- **Proof.** `artifacts/discs/page.png` shows the side board with the 3D button pressed. `artifacts/discs/main.aria.txt` includes `02 v3 · 3D`. The drive does not assert that every SVG on `/discs/` is gone. Other stages on that page still use SVG.

## Gotchas

- The header does not show `Discs` until the clock is triple-clicked. Use the URL.
- The first paint of the WebGL canvas can be black for a moment. Wait until the canvas element exists; a missing canvas is the failure, not a dark frame.
- `02 v2` is the SVG signal variant. Proving v3 does not prove v2.
- Choosing `02 v3 · 3D` again turns it off and returns to the SVG discs.
