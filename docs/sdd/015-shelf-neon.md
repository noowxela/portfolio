# SDD: Shelf neon bar

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-16
- **Related:** [architecture.md](../architecture.md), [013-work-albums.md](./013-work-albums.md)

## 1. Context / current architecture

`/work` renders `WorkView`, which switches among shelf, coverflow, grid, and list. The shelf (`components/gallery/albums/ShelfView.tsx`) is a full-viewport column: header offset, then a stage (`role="listbox"`, “Projects shelf”), then the caption. The stage background is the page fill, `#eeeeee` in light mode and `#0d0d0d` in dark mode. Albums sit in a 3D row in the center. Nothing is drawn behind them except that flat fill.

## 2. Problem and non-goals

**Problem:** The shelf stage reads as an empty wall. A horizontal neon bar behind the albums should read as an energy light.

**Non-goals:**

- Do not add the bar to coverflow, grid, list, or the home page.
- Do not change album motion, hit targets, or the caption.
- Do not add a second color, a vertical beam, or a particle field.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Where does it go? | The element the user selected: the shelf stage, behind the records. |
| What color? | Not stated. Default in this SDD: the site cyan `#5ce1ff`, the same accent as the header. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Inside the shelf stage, before the album row, add one `aria-hidden` layer with `pointer-events-none`. It is a full-width horizontal band, vertically centered on the stage. A 2px core in `#5ce1ff` sits on a wide blurred bloom. Opacity breathes slowly (about 4s). `prefers-reduced-motion: reduce` holds it steady. The albums stay above it in the existing 3D layer, so scrolling and clicking are unchanged.

**Pros:**

- One decorative element, no new state and no change to the scroller.
- Cyan matches the header accent already on this page.
- The bloom reads in both the light gray and the dark stage.

**Cons / risks:**

- A bright bar can compete with the center sleeve. Keep the core thin and the bloom soft so the album stays the subject.
- On a short phone the band must stay inside the stage, not under the caption. Centering it in the stage does that.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Bar on every work view | The request points at the shelf stage only. |
| Red Ares beam | The work page accent in the header is cyan, not the home-page handoff red. |

## 5. Acceptance criteria and verification

- [x] Shelf stage shows a horizontal cyan bar behind the albums, edge to edge, centered in the stage.
- [x] The bar glows and breathes. Reduced motion leaves it still.
- [x] Scrolling albums, focusing the center sleeve, and opening a record still work. The bar does not receive clicks.
- [x] Coverflow, grid, and list do not show the bar.
- [x] Light and dark backgrounds both keep the bar visible without hiding the center album.
- [x] Verify in the browser: open `/work` on the shelf, scroll the row, toggle the theme, switch to another view and back.

Verified in the browser on 2026-10-16. On the shelf the bar spans the stage (1493px), sits on the vertical center, uses `#5ce1ff`, ignores pointer events, and runs `shelf-neon`. Opening the center album still shows details. Grid has no bar. Light and dark both keep the sleeve in front of the glow.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-16 | draft | Cyan energy bar behind the shelf |
| 2026-10-16 | approved | User said yes build |
| 2026-10-16 | implemented | Cyan bar behind the shelf; verified in the browser |
