# SDD: Grid discs with depth

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-17
- **Related:** [019-grid-side-discs.md](./019-grid-side-discs.md)

## 1. Context / current architecture

`GridDisc` draws two half discs at the viewport edges. They are flat SVGs. Speck bands turn once a minute. The white disc still has two gloss ellipses. The orange disc does not.

## 2. Problem and non-goals

**Problem:** The halves read as lines, not discs. They should turn in space, carry a moving light, and respond when the pointer is over them. The white disc should lose the same two ellipses the orange disc already lost.

**Non-goals:**

- Do not move the discs back to the center.
- Do not recolor the right disc away from `#ff7a18`.
- Do not change the card vinyls, the shelf, or the other work views.
- Do not put a cream bar or an ellipse shadow on either disc.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| What makes it feel alive? | Stated before this SDD: a tilt toward the center, a light traveling the ring, and a rim on the body. User said do it. |
| Hover? | User asked for a mouse hover interaction. |
| Ellipses on the white disc? | Remove them too. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Each disc sits in a perspective box and turns about 50° so the visible face angles toward the page. A radial fill gives the body a lighter rim and a darker well. A short highlight travels the outer ring in about 10 seconds (white on the left, a hotter orange on the right). Hovering a disc increases the tilt. Reduced motion keeps the tilt and the rim and stops the traveling light. Both gloss ellipses are removed from the white disc.

**Pros:**

- Still the same two SVGs. No WebGL.
- Cards stay above the discs, so opening a project still works.

**Cons / risks:**

- The disc box is large. Hover must not steal clicks from the cards or stop the page from scrolling.
- A white sweep on the orange disc would look like the bar that was just removed. The right sweep stays orange.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Spin the whole disc faster | That fights the vinyls on the cards. The light moves; the specks stay slow. |

## 5. Acceptance criteria and verification

- [x] Neither disc has gloss ellipses (count is 0).
- [x] Left tilt is `rotateY(-50deg)`, right is `rotateY(50deg)`. Each body uses a radial rim.
- [x] A highlight travels each ring on a 10s loop. With reduced motion emulated, the sweep animation is `none` and the tilt stays.
- [x] Hover on the left disc moves it to about 66° and scale 1.04, and the sweep speeds up to 3.2s. Opening Mount Replay still works. The grid scroller still moves while the pointer is on a disc.
- [x] Verified in the browser on `/work?v=grid`, 2026-10-17, light and dark.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-17 | approved | User said do it, and asked for hover plus removal of the white disc ellipses |
| 2026-10-17 | implemented | Tilt, traveling light, rim, and hover on the side discs |
