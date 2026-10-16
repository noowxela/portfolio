# SDD: Grid side discs

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-17
- **Related:** [architecture.md](../architecture.md), [016-grid-disc.md](./016-grid-disc.md), [017-grid-disc-neon.md](./017-grid-disc-neon.md)

## 1. Context / current architecture

`GridDisc` is one SVG, fixed and centered, behind the grid rows. It does not scroll and does not take clicks. The ring is near-black on the light page and white on the dark page. Speck bands drift. The outer ring breathes. The small vinyls behind each 16:9 card are separate (`Disc` in `GridView.tsx`).

017 proposed a cyan glow on that centered disc. It was never built.

## 2. Problem and non-goals

**Problem:** The background disc should not sit in the center. Two copies, one at the left edge and one at the right, each cut so only half shows. The left half keeps the current color. The right half is orange neon.

**Non-goals:**

- Do not change the vinyls behind the cards.
- Do not add the particle face.
- Do not put these discs on shelf, coverflow, list, or home.
- Do not recolor the page or the “Records” title.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Which disc? | The centered background disc. The user said it is nice and should leave the center. |
| Which orange? | Not asked. A bright orange neon, `#ff7a18`, not the shelf cyan and not the home red. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** `GridDisc` renders the same SVG twice. Each is the current size. The left one’s center sits on the left edge of the viewport, so the right half of that disc is what you see, in the current near-black / white strokes. The right one’s center sits on the right edge, so the left half shows, stroked in `#ff7a18` with a soft orange halo and a bright core. Both keep the slow counter-rotation and the breathe. Reduced motion holds them still. On a narrow screen the two arcs would meet in the middle, so each center shifts further off-screen until a gap remains.

**Pros:**

- The center of the page stays open for the cards and the title.
- Left disc is the one already approved in 016. Only placement changes.
- Orange neon is only on the right, which is what was asked.

**Cons / risks:**

- A half disc at the edge can sit under the first and last card in a row. The discs stay `z-0` and `pointer-events: none`, so the cards stay on top and still open.
- Orange on `#eeeeee` is weaker than orange on black. The core stays saturated so the right arc still reads in light mode.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Cyan neon on the centered disc (017) | The disc should leave the center, and the new light is orange, on the right only. |
| Recolor both discs | The left one stays the current color. |
| Crop the card vinyls | Those are the sleeves, not the background disc. |

## 5. Acceptance criteria and verification

- [x] `/work?v=grid` shows no full disc in the center. On a 1493px desktop the visible arcs are separated by 733px.
- [x] The left half is white in dark mode (`rgb(255, 255, 255)`) and near-black in light mode (`rgb(44, 44, 44)`). Its center sits on the left edge.
- [x] The right half is `#ff7a18` with a drop-shadow halo. The cream core stroke and the two gloss ellipses were removed from this disc after they read as a white bar and an oval shadow. Its center sits on the right edge.
- [x] Both use `grid-disc-spin`. With reduced motion emulated, spin and breathe are `none` and the orange glow stays.
- [x] Opening Mount Replay still works. The discs have `pointer-events: none`.
- [x] Shelf renders zero `.grid-disc-side` nodes. The discs are only mounted from `GridView`.
- [x] Verified in the browser on `/work?v=grid`, 2026-10-17, light and dark, plus a 390px width (86px gap, no overlap).

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-17 | draft | User wants the background disc split to the left and right edges |
| 2026-10-17 | approved | User said build it |
| 2026-10-17 | implemented | Two half discs on the grid edges |
