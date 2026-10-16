# SDD: Centered disc v2

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-17
- **Related:** [023-disc-versions.md](./023-disc-versions.md)

## 1. Context / current architecture

`/discs#centered` shows the first grid disc: one centered SVG with a solid core and seven fixed sparks. A row under the header jumps between disc versions.

## 2. Problem and non-goals

**Problem:** A second version of that disc, called 01 v2, should be reachable from a button at the bottom of the Centered section. The core is hollow. Dots in the hole act as a digital signal: the shape changes, and so does the number of dots.

**Non-goals:**

- Do not add a fifth jump target.
- Do not change the disc on `/work`.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Where does v2 live? | Same Centered section. A button at the bottom switches to it. User said "do it". |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** One toggle on the Centered stage. v2 reuses the outer rings and ticks, drops the solid core, and swaps a preset signal every few seconds. Reduced motion holds the first pattern.

**Pros:**

- v1 stays one click away.
- The signal is deterministic, so the first paint matches on server and client.

**Cons / risks:**

- A timed swap reads as a signal change, not a smooth morph between shapes.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| A new `#` section | The user asked for a switch on the 01 section. |

## 5. Acceptance criteria and verification

- [x] The Centered section has a button labeled `01 v2`.
- [x] Pressing it shows a hollow core. Dots travel into the next shape; new dots grow from the center and extras shrink away. Pressing again returns to the solid core.
- [x] Side, Identity, and Blender stay as they are.
- [x] Verify in the browser. On `/discs/#centered`, three samples 500ms apart had different core coordinates (for example `101.9,100.6` then `105.5,101.8`), so the signal moves instead of cutting.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-17 | approved | User said do it after the plan |
| 2026-10-17 | implemented | Dots morph between signals instead of cutting |
