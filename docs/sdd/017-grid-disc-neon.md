# SDD: Grid disc neon

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `discarded`
- **Date:** 2026-10-16
- **Related:** [architecture.md](../architecture.md), [015-shelf-neon.md](./015-shelf-neon.md), [016-grid-disc.md](./016-grid-disc.md)

## 1. Context / current architecture

The grid (`components/gallery/albums/GridView.tsx`) paints `GridDisc` as a fixed, non-interactive SVG behind the record rows. The outer ring is a `currentColor` stroke (near-black on light, white on dark) with a 1.1px blur and an opacity breathe. Speck bands rotate slowly. The shelf already has a cyan energy bar, `#5ce1ff`, in `ShelfView.tsx` and `.shelf-neon` in `app/globals.css`.

## 2. Problem and non-goals

**Problem:** The disc reads as a flat line drawing. It needs the same kind of neon light as the shelf bar.

**Non-goals:**

- Do not change shelf, coverflow, list, or home.
- Do not add the particle face or the orange beams.
- Do not change card layout, scroll, or the detail overlay.
- Do not recolor the page fill or the “Records” title.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Which neon? | Not asked. Use the shelf cyan `#5ce1ff`, not a new color. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Keep the disc shape from 016. Paint the outer ring as a neon tube: a wide soft cyan halo behind a thin bright `#5ce1ff` core, with the existing top gap. Give the speck bands and the center sparks a softer cyan glow. A short brighter segment travels the outer ring so the light moves, on top of the existing breathe. `prefers-reduced-motion: reduce` stops the travel and the breathe; the glow stays on.

**Pros:**

- Same cyan as the shelf bar and the home accent.
- The disc fill stays close to the page color, so the title contrast from 016 holds.
- Still one SVG in `GridDisc`. No new dependency.

**Cons / risks:**

- A wide halo can wash the cards that sit on the ring. Keep the bloom on the stroke, not a full-disc flood.
- Light mode: cyan on `#eeeeee` is weaker than cyan on black. The core stays saturated so the ring is still visible.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| White glow only | That is a brighter version of the current flat ring. |
| Red or orange | The shelf neon is cyan, and the orange beams were excluded. |
| Neon on every work view | The complaint is about the grid disc. |

## 5. Acceptance criteria and verification

- [ ] On `/work?v=grid`, the outer ring glows cyan, with a bright core, a soft halo, and the gap still at the top.
- [ ] Speck bands and center sparks carry a softer cyan glow.
- [ ] A brighter segment travels the ring. Reduced motion leaves the glow on and holds the segment still.
- [ ] “Records” stays readable in light and dark. Opening a project still works.
- [ ] Shelf, coverflow, and list show no disc neon.
- [ ] Verify in the browser on `/work?v=grid`.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-16 | draft | User called the disc too boring and asked for neon light |
| 2026-10-17 | discarded | Replaced by two side discs in 019. Cyan on the centered disc is not what was asked for. |
