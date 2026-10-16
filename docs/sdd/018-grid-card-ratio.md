# SDD: Grid cards at 16:9

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-17
- **Related:** [architecture.md](../architecture.md), [013-work-albums.md](./013-work-albums.md), [016-grid-disc.md](./016-grid-disc.md)

## 1. Context / current architecture

`AlbumCover` (`components/gallery/albums/AlbumCover.tsx`) is a square sleeve (`aspect-square`). The shelf overrides that with `!aspect-[16/10]`. The grid does not: each cell in `GridView.tsx` is `pt-[22%]` with a disc at `w-[84%]` behind a square cover. Screenshots use `object-cover object-left-top`, so the square crop cuts the sides of a landscape shot.

## 2. Problem and non-goals

**Problem:** The grid card the user selected should be 16:9 so the screenshot reads as a frame, not a square crop.

**Non-goals:**

- Do not change shelf, coverflow, list, or the detail overlay.
- Do not change the column count (2 / 3 / 4).
- Do not change the background disc from 016.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Which cards? | The grid sleeve the user selected. Shelf already has its own ratio. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Pass `!aspect-[16/9]` on the grid `AlbumCover` only. Shrink the peeking disc so it still rises above the sleeve and does not hang past the bottom of a shorter card: padding-top about 18% of the cell, disc width about 54% (a 16:9 card is 56% as tall as it is wide, so an 84% disc would be taller than the whole cell).

**Pros:**

- Same override the shelf already uses. `AlbumCover` stays square by default.
- Landscape screenshots keep more of the page and less of a top-left square crop.

**Cons / risks:**

- Four columns of 16:9 cards are shorter, so the title band covers more of the picture. The two-line caption stays; if it crowds the shot, that is a follow-up, not a column change.
- The disc must be retuned in the same change. Leaving it at 84% width makes the vinyl larger than the sleeve.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Change `AlbumCover`’s default ratio | Shelf and any future square use would move with it. |
| Use the shelf’s 16:10 | The request is 16:9. |

## 5. Acceptance criteria and verification

- [x] Grid sleeves are 16:9 (measured 1.778). Shelf sleeves stay 16:10 (measured 1.6).
- [x] The vinyl peeks above each sleeve (45px on desktop, 40px at 390px) and ends short of the card bottom (−50px / −43px).
- [x] Opening Mount Replay still works. Sleeve titles stay white on the cover gradient in light and dark.
- [x] Verified in the browser on `/work?v=grid`, 2026-10-17, desktop and a 390px-wide viewport (2 columns).

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-17 | draft | User asked for the selected grid card to be 16:9 |
| 2026-10-17 | approved | User said yes |
| 2026-10-17 | implemented | Grid sleeves 16:9; disc peek retuned |
