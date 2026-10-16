# SDD: Identity disc

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `discarded`
- **Date:** 2026-10-17
- **Related:** [021-grid-disc-three.md](./021-grid-disc-three.md)

## 1. Context / current architecture

The grid background is two Three.js discs in `gridDiscScene.ts`. Each one is a thin plate, a torus, and speck spheres.

## 2. Problem and non-goals

**Problem:** The disc should read as the TRON: Legacy identity disc: a thick dark device, a beveled rim, concentric channels, and cyan light set into the front face.

**Non-goals:**

- Do not put the light pattern on the back.
- Do not add a bloom post-processing pass.
- Do not change the card vinyls or the other work views.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Which build? | The prompt’s Three.js section. User said try it. Cyan channels, not the earlier orange ring. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Replace the plate mesh with a beveled annular rim, a graphite body, a recessed well, a raised hub, radial spokes, and three cyan channels inset in the front. The back keeps one plain metal groove. Both edge discs use this shape. A short spark still travels the outer channel.

**Pros:**

- Thickness, bevel, and separate parts are real meshes.
- The back is not a copy of the front.

**Cons / risks:**

- Without a bloom pass the cyan is emissive only. A soft additive ring stands in for the glow.
- Two full discs cost more triangles than the old plates.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Another flat ring | The prompt asks for a manufactured casing. |

## 5. Acceptance criteria and verification

- [x] Each disc has a beveled annular rim, a graphite body, a recessed well, a hub, radial spokes, and three cyan channels.
- [x] The channels and spokes are on the front. The back is a dark cap with one metal groove.
- [x] Opening Mount Replay still works.
- [x] Verified in the browser on `/work?v=grid`, 2026-10-17. The discs stay half off the edges, so the visible part is the rim and the cyan channels.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-17 | approved | User asked to generate the identity disc from the shape prompt |
| 2026-10-17 | implemented | Grid discs are identity-disc meshes |
| 2026-10-17 | discarded | User asked to put the SVG discs back |
