# SDD: Disc tilt 70 degrees

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-17
- **Related:** [025-side-disc-v2.md](./025-side-disc-v2.md), [020-grid-disc-depth.md](./020-grid-disc-depth.md)

## 1. Context / current architecture

The side discs rest at ±50° around the vertical axis. The SVG version sets that in `app/globals.css` (`.grid-disc-side-left` / `.grid-disc-side-right`). Hover adds 16°, so the CSS hover pose is ±66°. `Disc3D` copies the same numbers: `TILT` is 50° and `HOVER_TILT` is 16°, then subtracts the off-axis camera angle so the discs still look like ±50°.

## 2. Problem and non-goals

**Problem:** The 02 v3 Three.js discs should rest at 30° instead of 50°. The first pass used 70°; the user then asked for 30°.

**Non-goals:**

- Do not change the SVG discs, including the CSS tilt and the 02 v2 button.
- Do not change the spin, the drag limits, or the hover scale.
- Do not change how far the discs sit off the edges.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Which angle? | The rest tilt we just described, currently ±50°. User said change it to 70°. |
| Which discs? | 02 v3 3D only. User said modify that version, not the SVG. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** `Disc3D` is only mounted by the `02 v3 · 3D` button. Set `TILT` to 30° there. Hover still adds 16°, so the 3D hover pose is ±46°. Leave `globals.css` at ±50° / ±66°.

**Pros:**

- v1 and v2 stay on the SVG angle.
- Hover on v3 still leans further than rest, by the same 16°.

**Cons / risks:**

- 30° shows more of the face than the 50° SVG discs. Hover reaches 46°.
- If WebGL fails, v3 falls back to `GridDisc`, which stays at 50°.
- `Disc3D` still subtracts the camera's side angle, so the mesh yaw is not a raw 30°. The apparent tilt is 30°.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Also change the SVG CSS | User asked for 02 v3 3D only. |
| Set hover to 70° as well | Hover would no longer tip further than rest. |

## 5. Acceptance criteria and verification

- [x] On `/discs#side` with `02 v3 · 3D` selected, the discs rest at an apparent ±30°.
- [x] Hover still adds 16° in code (`HOVER_TILT` unchanged), so the 3D pose is ±46°.
- [x] The SVG CSS stays at ±50° / ±66°.
- [x] Drag limits and idle spin are unchanged.
- [x] Checked `/discs#side` in the browser on 2026-10-17. `02 v3 · 3D` renders a canvas and the discs show more of the face than the 70° pose.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-17 | draft | Rest tilt 50° → 70°, hover stays +16° |
| 2026-10-17 | approved | User said change 02 v3 3D only |
| 2026-10-17 | implemented | `TILT` in `Disc3D` is 70°. SVG CSS unchanged. |
| 2026-10-17 | implemented | User asked for 30°. `TILT` is 30°. |
