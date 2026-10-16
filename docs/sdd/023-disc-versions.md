# SDD: Disc versions page

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-17
- **Related:** [016-grid-disc.md](./016-grid-disc.md), [020-grid-disc-depth.md](./020-grid-disc-depth.md), [022-identity-disc.md](./022-identity-disc.md)

## 1. Context / current architecture

The nav is Home, Work, About. The live grid uses the SVG side discs. Earlier discs still exist: the first centered SVG can be redrawn from that version, the identity-disc scene is in `components/archive/gallery/gridDiscScene.ts`, and the Blender file is `public/models/grid-disc.glb`.

## 2. Problem and non-goals

**Problem:** A temporary page, linked beside About, should show each disc version.

**Non-goals:**

- Do not change the disc on `/work`.
- Do not treat this page as a finished section of the site.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Where? | A nav item after About. User asked for the page. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** `/discs` is four full-height frames. Centered SVG, the current side SVG, one identity disc turning in the middle, and the GLB with drag to turn. The side SVG gets a `contained` flag so it stays in the frame.

**Pros:**

- Each version is the real drawing or mesh, not a screenshot.
- `/work` still mounts the SVG the same way when `contained` is omitted.

**Cons / risks:**

- The flat Three.js plate that sat between the SVG and the identity disc was overwritten, so it is not on this page.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Replace the grid | The user wants the SVG grid kept, and a separate board. |

## 5. Acceptance criteria and verification

- [x] Nav shows Discs after About.
- [x] `/discs` shows the centered SVG, the side SVG, the identity disc, and the GLB.
- [x] `/work?v=grid` still uses the side SVG.
- [x] Verify in the browser. `http://localhost:3000/discs/` — nav order Work, About, Discs. Stage 01 is the centered white disc. Stage 02 is the white left half and the orange right half. Stage 03 is one identity disc with cyan rings. Stage 04 is the Blender GLB, front ring and plain dark back, drag to turn. `GridView` still mounts `GridDisc` with no `contained` flag.
- [x] A row under the header jumps with `#centered`, `#side`, `#identity`, and `#blender`. Checked: Side lands at 96px (under the row), Identity and Blender update the hash and the current link.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-17 | approved | User asked for a temporary page beside About |
| 2026-10-17 | implemented | Four stages checked in the browser |
