# SDD: Grid discs in Three.js

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `discarded`
- **Date:** 2026-10-17
- **Related:** [architecture.md](../architecture.md), [020-grid-disc-depth.md](./020-grid-disc-depth.md)

## 1. Context / current architecture

The grid background is two SVG halves in `GridDisc.tsx`, tilted with CSS. Three.js is already a dependency and draws the home mosaic. The SVG discs do not have a real edge or a light that moves across a surface.

## 2. Problem and non-goals

**Problem:** Keep the current disc, then try the same two halves as lit meshes.

**Non-goals:**

- Do not delete the SVG version.
- Do not change the card vinyls or the other work views.
- Do not add a postprocessing bloom pass.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Where does the SVG go? | The existing `components/archive/` folder, beside the home and about archives. |
| Which 3D library? | Three.js, already used by the home mosaic. User said try it. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Copy the SVG component to `components/archive/gallery/GridDiscSvg.tsx`. Replace the mounted `GridDisc` with a transparent canvas. `gridDiscScene.ts` builds two discs (a cylinder, a rim, a broken torus, a traveling spark). The left ring stays white or near-black. The right ring is emissive `#ff7a18` with an additive halo. Centers sit on the viewport edges. Pointer move raycasts for the hover tilt. The canvas does not take clicks. Reduced motion holds the spark still.

**Pros:**

- Real thickness and a light on the metal, which CSS tilt cannot do.
- Three stays out of the server render via a dynamic import, same as the mosaic.

**Cons / risks:**

- A full-viewport canvas costs a frame loop on the grid page. It stops when the component unmounts.
- The first frame waits on the dynamic import, so the discs pop in.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Keep editing the SVG | The request is to try a mesh. |

## 5. Acceptance criteria and verification

- [x] The SVG component is `components/archive/gallery/GridDiscSvg.tsx` and is not mounted.
- [x] `/work?v=grid` shows two mesh discs, left neutral and right orange, half off each edge.
- [x] Opening Mount Replay still works. The canvas has `pointer-events: none`. Hover raycasts from window pointer moves.
- [x] Light and dark both keep the discs behind the title, which stays readable.
- [x] Verified in the browser on `/work?v=grid`, 2026-10-17.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-17 | approved | User asked to archive the SVG disc and try Three.js |
| 2026-10-17 | implemented | Grid background is a Three.js canvas; SVG kept in archive |
| 2026-10-17 | discarded | User put the SVG discs back on the grid |
