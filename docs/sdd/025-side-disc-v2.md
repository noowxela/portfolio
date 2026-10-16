# SDD: Side disc v2

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-17
- **Related:** [024-centered-disc-v2.md](./024-centered-disc-v2.md)

## 1. Context / current architecture

`/discs#side` shows the live grid's two half discs. `/discs#centered` already has an `01 v2` button that opens the core and morphs a dot signal. The work grid mounts `GridDisc` with no extra props.

## 2. Problem and non-goals

**Problem:** The Side section needs the same kind of v2: a button that opens both cores and runs the moving signal.

**Non-goals:**

- Do not change the disc on `/work`.
- Do not add a new jump target.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| How should it match 01? | Same hollow core and traveling dots. User said make it. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** `GridDisc` takes an optional `signal` flag. The discs page wraps it in `SideDisc` with an `02 v2` button. The right half starts on a later signal so the two cores are not copies.

**Pros:**

- `/work` still calls `GridDisc` with the flag off.

**Cons / risks:**

- Each half runs its own timer, so the two signals are not locked together.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Turn v2 on for the work grid | The user asked for the Side section on the discs page. |

## 5. Acceptance criteria and verification

- [x] Side section has an `02 v2` button.
- [x] Pressing it opens both cores and the dots move. Pressing again restores the solid cores.
- [x] `/work` grid still uses the solid side discs. `GridView` mounts `GridDisc` with `signal` left off.
- [x] Verify in the browser. `/discs/#side` with `02 v2` on: both halves have a hole. The left dots moved between samples. The right half starts on a later signal, so its later dots were still waiting to travel. The button uses the same toggle as `01 v2`.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-17 | approved | User asked for a side v2 like 01 v2 |
| 2026-10-17 | implemented | Both half discs open a traveling signal |
