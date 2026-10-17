# SDD: Grid background discs in 3D

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-17
- **Related:** [019-grid-side-discs.md](./019-grid-side-discs.md), [021-grid-disc-three.md](./021-grid-disc-three.md), [026-disc-tilt-70.md](./026-disc-tilt-70.md)

## 1. Context / current architecture

`GridView` draws two large SVG half discs behind the grid (`GridDisc`: fixed, `z-0`, one half off each side, `min(78vmin, 760px)`), and an SVG `Disc` peeking out of each sleeve that a gsap tick turns with scroll velocity. The 02 v3 three.js disc (`Disc3D`, `discNeon`, `discTextures`; 30° tilt) lives on `/discs` and takes the same props as `GridDisc`.

## 2. Problem and non-goals

**Problem:** The two background discs behind the Grid should be the 02 v3 3D disc.

**Non-goals:**

- Do not change the small album discs in the sleeves. They stay the shared SVG `Disc`.
- Do not change Shelf, Coverflow or List.
- Do not change `Disc3D`, `discNeon`, `discTextures` or the 30° tilt.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Which discs go 3D? | "dont touch the album disc, i mean the background disc change to the 3d disc." Only the two `GridDisc` side discs. |
| How many contexts? | One: `Disc3D` draws both discs in one canvas. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** `GridView` renders `Disc3D` (loaded with `next/dynamic`, `ssr: false`) where it rendered `<GridDisc />`. Uncontained `Disc3D` is the same layer as the SVG: `fixed inset-0 z-0`, `pointer-events: none`, under the `z-10` grid content. It sizes the discs like the CSS (`min(78vmin, 760px)`, half off each edge), follows the `dark` class on `<html>`, caps dpr at 2, pauses offscreen or in a hidden tab, renders on demand with reduced motion, and returns the SVG `GridDisc` if WebGL can't be created. Hover tilt comes from a raycast on window `pointermove`, so the canvas never takes pointer events.

**Pros:**

- One WebGL context, no new disc code; `Disc3D` is reused untouched.
- Album discs, row parallax and the sleeve spin are exactly as before.

**Cons / risks:**

- `Disc3D` reads `window` scroll for its spin boost; the Grid scrolls an inner element, so the background discs keep their idle spin only. The SVG discs had no scroll response either.
- Hover tilt now also reacts when the pointer is over a card in front of a disc (the SVG only tipped where the disc was uncovered).
- Without WebGL, three logs one "Error creating WebGL context" console error before the SVG fallback appears.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| 3D album discs from one shared renderer (`GridDiscs3D`, b9017d6) | Wrong discs; reverted and the file removed. |
| A new shared renderer for the background discs | `Disc3D` already draws both in one canvas. |

## 5. Acceptance criteria and verification

- [x] `/work/?v=2` creates exactly one WebGL context (`webgl2`), one canvas; 11 SVG album discs, no `.grid-disc-side` SVG.
- [x] Canvas host is `position: fixed`, `z-index: 0`, `pointer-events: none`; points over the discs hit the scroller/content, not the canvas.
- [x] Scroller height unchanged after scrolling to the end; the document doesn't scroll.
- [x] Reduced motion renders on demand only. With WebGL blocked the SVG `GridDisc` returns.
- [x] Typecheck, lint and `GITHUB_PAGES=true` build pass. Checked in headless Chrome on 2026-10-17: dark and light, 1440px and 390px, top and mid-scroll; `/discs` still works.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-17 | implemented | First pass made the album discs 3D (b9017d6). |
| 2026-10-17 | implemented | Corrected: album discs back to SVG, background side discs are 02 v3 3D via `Disc3D`. |
