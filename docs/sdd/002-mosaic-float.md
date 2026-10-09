# SDD: Mosaic idle float

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-09
- **Related:** [docs/architecture.md](../architecture.md), [001-tron-home.md](./001-tron-home.md), [tron-home.md](../pages/tron-home.md)

## 1. Context / current architecture

The Legacy hero (`components/home/HeroScene.tsx`) centers `HeroMosaic`. The stage is a Three.js canvas (`mosaicScene.ts`): "alex woon" on the front, "noowxela" on the back. Drag turns it; on release it coasts and settles on the nearest face. The canvas is not on the GSAP scroll timeline.

Under the canvas, `HeroMosaic.tsx` renders a static HUD line, "Drag to turn" (`.hero-mosaic-hint`). It is `aria-hidden`. The stage already sets `cursor: grab` and `data-dragging` while the pointer is down.

## 2. Problem and non-goals

**Problem:** "Drag to turn" is extra copy. The name itself sits still, so nothing invites a drag.

**Non-goals:**

- Changing the mosaic geometry, hover bulge, scan band, or drag physics
- Adding a new label in place of "Drag to turn"
- Putting the mosaic on the hero scroll timeline

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| What should replace the hint? | No copy. The name should float so people try to drag it. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

Remove the hint paragraph and `.hero-mosaic-hint`. Give `.hero-mosaic-stage` a slow vertical float (about 10px, ~4.5s, ease-in-out, infinite). While `data-dragging="true"`, pause the animation so the grab feels planted. `prefers-reduced-motion: reduce` keeps the stage still. The fallback plain-text state floats with the same stage, because the animation is on the wrapper.

**Pros:**

- The invitation is motion, not a caption
- CSS only; the Three.js loop stays as it is
- Drag and reduced motion stay predictable

**Cons / risks:**

- A float that is too large reads as decoration and fights the grab. Keep the travel small.
- Pausing mid-bob can leave the stage a few pixels off center until the next idle cycle. Acceptable; do not snap it, which would jump under the pointer.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Idle yaw inside `mosaicScene.ts` | "Floating" is a lift, and a yaw loop fights the settle-to-face math |
| Keep a quieter hint and float it | The copy is what should go |

## 5. Acceptance criteria and verification

- [x] "Drag to turn" is gone from the hero
- [x] The mosaic name drifts up and down slowly while idle
- [x] Pressing and dragging stops the drift; release lets it float again; turning still coasts and settles
- [x] With reduced motion, the name stays still and drag still works
- [x] Verify in the browser on `/`: idle float, drag, release

Verified on `http://localhost:3000/` (2026-10-09):

- Hint text absent. Stage animation `mosaic-float`, `4.5s`, `running`. Transform moved from `translateY(-5.6px)` to `translateY(-9.5px)` over 700ms. Canvas present.
- Pointer down set `data-dragging` and `animation-play-state: paused` (transform held at `-9.9px`). Pointer up cleared the flag, play state returned to `running`, and the transform moved again (`-8.2px` after 500ms).
- `prefers-reduced-motion: reduce` set `animation-name: none` and `transform: none`. Canvas still mounted. Hint still absent.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-09 | draft | Remove the drag hint; idle-float the mosaic stage |
| 2026-10-09 | approved | User said yes |
| 2026-10-09 | implemented | Hint removed; CSS float pauses while dragging |
