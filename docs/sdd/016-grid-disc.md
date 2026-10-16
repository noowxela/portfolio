# SDD: Grid disc background

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-16
- **Related:** [architecture.md](../architecture.md), [013-work-albums.md](./013-work-albums.md)

## 1. Context / current architecture

`/work` switches among shelf, coverflow, grid, and list. The grid (`components/gallery/albums/GridView.tsx`) is one scrolling page: a title (“Collection / Records”) and rows of sleeves. The page fill is `#eeeeee` in light mode and `#0d0d0d` in dark mode. Nothing sits behind the cards.

## 2. Problem and non-goals

**Problem:** The grid background is a flat field. It should carry an animated disc like the reference photo: a dark circle, a thick light ring with a gap at the top, speckled inner bands, a dark well, and tick marks along the lower inner edge.

**Non-goals:**

- Do not draw the particle face from the earlier picture, or the orange beams.
- Do not add the disc to shelf, coverflow, list, or home.
- Do not change card layout, scroll parallax, or the detail overlay.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Where does it go? | The grid page the user selected, behind the records. |
| What should move? | Stated before this SDD: speck bands drift, the outer ring breathes, reduced motion holds still. User said do it. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** A fixed, non-interactive SVG centered in the viewport, rendered only by `GridView`. The record rows sit above it (`z-10`) so they scroll over the disc and the disc stays put. Strokes use `currentColor`: near-black on the light page, white on the dark page. Speck groups rotate slowly in opposite directions. The outer ring’s opacity breathes. `prefers-reduced-motion: reduce` stops both.

**Pros:**

- One decorative layer. No change to the scroller or the overlay (`z-70`).
- The header (`z-50`) and the view switcher (`z-40`) stay above it.
- Light and dark each get a ring that can be seen on that page fill.

**Cons / risks:**

- A large disc can sit under the “Records” title. The title must stay readable, so the disc fill stays close to the page color and the ring carries the contrast.
- A fast spin would fight the discs on the cards. The background turns on a roughly one-minute loop.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Disc on every work view | The request points at the grid page only. |
| Scroll the disc away with the cards | It is a backdrop, not another row. |

## 5. Acceptance criteria and verification

- [x] Grid shows a centered disc: gap at the top of the outer ring, speck bands, dark well, lower tick marks.
- [x] Specks drift (`grid-disc-spin`, 64s and 92s reverse) and the ring breathes (`grid-disc-breathe`). With `prefers-reduced-motion: reduce` emulated, both animations are `none` and the ring stays at opacity 0.9.
- [x] Cards scroll over the disc. Opening Mount Replay still works. The disc has `pointer-events: none`.
- [x] Shelf, coverflow, and list render zero `.grid-disc-spin` nodes.
- [x] Light and dark both keep the ring and the “Records” title readable (white on dark, near-black on light).
- [x] Verified in the browser on `/work?v=grid`, 2026-10-16.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-16 | approved | User said do it after the disc was described |
| 2026-10-16 | implemented | Grid disc on `/work?v=grid`; other views unchanged |
