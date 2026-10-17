# SDD: Grid discs in 3D

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-17
- **Related:** [026-disc-tilt-70.md](./026-disc-tilt-70.md), [021-grid-disc-three.md](./021-grid-disc-three.md)

## 1. Context / current architecture

`GridView` puts an SVG `Disc` (the vinyl with a tag-colour label) in each sleeve. A gsap tick turns every disc with scroll velocity and moves rows for parallax. `Disc` is shared with `ShelfView`. The 02 v3 three.js disc (`Disc3D`, `discNeon`, `discTextures`) lives on `/discs`.

## 2. Problem and non-goals

**Problem:** The Grid discs should be the 02 v3 3D disc, in each project's tag colour, without one WebGL context per album.

**Non-goals:**

- Do not change Shelf, Coverflow or List, or the shared SVG `Disc`.
- Do not change the `GridDisc` side discs behind the grid.
- Do not change `Disc3D` on `/discs`.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Which disc? | The 02 v3 disc: grooved vinyl, hollow core, neon strips. Strip colour comes from `tagColor` instead of orange/white. |
| How many contexts? | One. The browser limit is about 16 and 11 renderers would be heavy. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** `GridDiscs3D` owns one renderer and one disc model. Each sleeve keeps an empty square slot. `GridView`'s tick moves the rows, then calls the 3D frame with the spin angle. The frame reads each slot's rect and draws the model into it with viewport + scissor. Only the pose and tag colour change between draws. The canvas is one viewport tall plus 120px, sits inside the grid content under the cards (`-z-10`, clipped to the content box, `pointer-events: none`) and is moved to the scroll position each frame. Between frames it scrolls with the page, so discs stay on their sleeves. Discs off the canvas are skipped. dpr ≤ 2, MSAA only at dpr 1. Reduced motion renders once per scroll, resize, hover or theme change at a fixed angle. If WebGL fails, the SVG `Disc` comes back.

**Pros:**

- One context, one draw list, shared geometry, materials and textures.
- Sleeves cover the lower half of each disc with no masking.
- Hover and focus lift still come from the CSS on the slot wrapper.

**Cons / risks:**

- The SVG label text (project name, tags) is gone from the disc. The sleeve still shows both.
- The model build is duplicated from `Disc3D` (rings, bevels) so `Disc3D` stays untouched.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| One `Disc3D` per album | 11 contexts. |
| Fixed full-viewport canvas over the grid | Lags one frame behind compositor scrolling and would sit over the cards. |
| A translated canvas without the clip layer | Its transform grew the scroller's overflow, so the page kept scrolling into empty space. |

## 5. Acceptance criteria and verification

- [x] `/work?v=grid` creates exactly one WebGL context; 11 slots, no SVG discs.
- [x] Discs line up with their sleeves while scrolling: the canvas pin error is 0px every frame, and the disc silhouettes measure the same offset from the slot centre in every row.
- [x] Hover lifts the disc 10%; clicking the sleeve opens the overlay; the canvas never receives pointer events.
- [x] Reduced motion renders on demand only. With WebGL disabled the SVG discs return.
- [x] Lint and `GITHUB_PAGES=true` build pass. Checked in headless Chrome on 2026-10-17: dark, light, mid-scroll, hover, 390px mobile, reduced motion.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-17 | implemented | Grid discs are 02 v3 3D, one shared renderer. |
