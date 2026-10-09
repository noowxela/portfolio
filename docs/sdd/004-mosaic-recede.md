# SDD: Mosaic recedes with the hero scroll

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-09
- **Related:** [docs/architecture.md](../architecture.md), [003-mosaic-horizon.md](./003-mosaic-horizon.md), [tron-home.md](../pages/tron-home.md)

## 1. Context / current architecture

Desktop hero scroll (`useHomeScroll.ts`, `min-width: 768px` and no reduced motion) pins the hero for `+=180%` and scrubs one timeline. The floor goes from `yPercent: 8, scale: 1.05` to `yPercent: -16, scale: 1.5`, still tilted at 80 degrees. Its transform origin is the top edge, so that edge — the far end of the lane — slides up by 24% of the floor's height. The near grid grows toward the camera.

`.hero-mosaic` is not on that timeline. It stays centered at `top: 48%` with `translate(-50%, -50%)`. By the end of the pin the lanes have left it behind. The idle float is a CSS animation on `.hero-mosaic-stage`, the child, so a transform on the parent does not remove the bob.

Phones and `prefers-reduced-motion` do not create this timeline.

## 2. Problem and non-goals

**Problem:** When the hero scrolls, the mosaic name should move with the far end of the lane and read as going farther away.

**Non-goals:**

- Tilting the name onto the floor (`rotationX: 80` would lay the letters flat)
- Changing drag, the scan band, or the 10px idle float
- Adding a pin on phones or under reduced motion

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| What should the name do on scroll? | Move together with the scroll, farther away. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

On the existing hero timeline, scrub `.hero-mosaic` (`data-hero="mosaic"`) from `{ x: 0, y: 0, xPercent: -50, yPercent: -50, scale: 1 }` to `{ x: 0, xPercent: -50, yPercent: -50, y: -24% of the floor height, scale: 0.62 }`, `ease: 'none'`. `x: 0` is required: GSAP reads the CSS `translate(-50%, -50%)` as a pixel offset, and without clearing it the name shifts left by half its width. The `y` matches the horizon's travel (floor `yPercent` 8 → -16). The scale makes the same name read farther, not just higher. The float stays on the stage. The hero `ScrollTrigger` sets `invalidateOnRefresh` so the floor height is re-read on resize. Phones and reduced motion keep the resting placement.

**Pros:**

- The name stays on the end of the lane while that end moves
- It shrinks on the same scrub as the floor, so the two stay in step
- The float and the drag target are untouched

**Cons / risks:**

- `0.62` is a guess at "farther". Too small and the strokes are hard to grab near the end of the pin. It stays large enough to drag.
- GSAP owns the parent's transform for the whole pin. The centering percents have to live in the tween, or the name jumps off center when the timeline starts.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Parent the mosaic inside `.grid-floor` | It would inherit the 80 degree tilt |
| Only slide it up, same size | It would move, but it would not read as farther away |

## 5. Acceptance criteria and verification

- [x] At the start of the hero pin the name is where it sits now, on the far lanes
- [x] Scrubbing the pin moves the name up with the horizon and scales it down to about 0.62
- [x] At the end of the pin it is smaller and higher, still readable, and still centered
- [x] The idle float still runs
- [x] Under 768px, the name stays at the resting placement
- [x] Verify in the browser on `/`: rest, mid-pin, end of pin

Verified on `http://localhost:3000/` at 905×599 (2026-10-09):

- Scroll 0: centered (center x 453), 525×145, `translate(-50%, -50%)`, sitting on the far lanes. Float `mosaic-float`.
- Scroll 539 (mid-pin): centered, 425×117, `y: -50px`, scale 0.81.
- Scroll 1078 (end of pin): centered, 325×90, `y: -99px` (24% of the 413px floor), scale 0.62. The name is higher and smaller. The floor has scaled up, so most of the grid has left the frame.
- At 390px wide the inline transform is empty, so the scroll tween is not applied. The name stays centered on the resting placement.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-09 | draft | Scrub the mosaic up and smaller with the hero floor |
| 2026-10-09 | approved | User said yes |
| 2026-10-09 | implemented | Name rises with the horizon and scales to 0.62 |
