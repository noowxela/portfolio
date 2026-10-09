# SDD: Mosaic at the end of the lane

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-09
- **Related:** [docs/architecture.md](../architecture.md), [002-mosaic-float.md](./002-mosaic-float.md), [tron-home.md](../pages/tron-home.md)

## 1. Context / current architecture

The Legacy hero grid (`.scene-hero .grid-pit`) fills the bottom 69% of the section. The floor is tilted 80 degrees with `transform-origin: center top`, so the lanes meet at the top edge of that pit: 31% down the hero. That edge is the far end of the lane.

`.hero-mosaic` is centered at `top: 44%`, `width: min(94vw, 980px)`, stage height `clamp(160px, 28vw, 320px)`. On a typical desktop that canvas is about 850×250 and covers the near lanes as well as the horizon. It is not on the hero scroll timeline. The idle float from [002-mosaic-float.md](./002-mosaic-float.md) is a 10px CSS bob on the stage.

## 2. Problem and non-goals

**Problem:** The name reads as close and mid-field. It should sit a bit farther away, at the end of the grid lane.

**Non-goals:**

- Changing drag, hover, the scan band, or the idle float
- Putting the mosaic on the scroll timeline so it recedes with the floor
- Changing the grid tilt, pit height, or the disc

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Where should the name sit? | Farther back, at the end of the grid lane. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

Shrink the stage so the name reads farther: width `min(58vw, 620px)`, height `clamp(112px, 16vw, 190px)`. Center it at `top: 48%` with `translate(-50%, -50%)`. The pit's geometric top is at 31%, but its mask fades the floor out before that edge, so 31% is empty sky. 48% is where the lanes are still visible: the far end of the lane. The 10px float stays on the stage. Phones and reduced motion use the same placement.

**Pros:**

- The name lands where the lanes converge
- CSS only; the Three.js camera and the drag loop stay as they are
- Still large enough to grab

**Cons / risks:**

- A fixed horizon position does not follow the floor as scroll scales it from `1.05` to `1.5` and shifts it up. By the end of the pin the lanes will have pulled away from the name. Accepted for this change.
- Too small and the strokes get hard to read. The floor is `620px` wide, not a speck.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Pull the Three.js camera back and leave the CSS box where it is | The box would still cover the near lanes |
| Tween the mosaic with the floor on the hero pin | The ask is where it sits, and the mosaic stays off that timeline |

## 5. Acceptance criteria and verification

- [x] At rest, the mosaic sits on the visible end of the lane, not across the near lanes and not in the empty sky
- [x] It is visibly smaller than the previous ~850px-wide canvas, and the name is still readable
- [x] Idle float still runs
- [x] Verify in the browser on `/` at a desktop width

Verified on `http://localhost:3000/` at 905×599 (2026-10-09). Centering on the pit top (31%) put the letters in the masked sky, above the grid. Centering at 48% seats them where the lanes converge. Canvas measured 525×145 on that viewport (cap is 620×190). Animation name `mosaic-float`. Screenshot: the name rests on the far grid, smaller than before, still readable.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-09 | draft | Park the mosaic on the grid horizon and scale it down |
| 2026-10-09 | approved | User said yes |
| 2026-10-09 | implemented | Centered at 48%; 31% was above the visible lanes |
