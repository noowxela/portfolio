# SDD: Toolkit labels without numbers

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-10
- **Related:** [006-toolkit-row.md](./006-toolkit-row.md), [tron-about.md](../pages/tron-about.md)

## 1. Context / current architecture

Each Toolkit row (`app/about/page.tsx`) puts a tracked label in a `9.5rem` column on the left and the chips on the right. The label is built as `01 — Languages`, with the index padded to two digits. The groups and items live in `site.toolkit`.

## 2. Problem and non-goals

**Problem:** The `01 —`, `02 —` prefixes are not wanted. The label should be the group name only.

**Non-goals:**

- Changing the groups, the items, or the left-right row
- Removing the hairline between rows

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| What should the left label be? | The group name only. No `01 —`, `02 —`. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

Render `group.label` alone. Drop the index from the map. Keep the `9.5rem` column so the chips still start on the same vertical line. “Tools & Platforms” stays the longest label and can still wrap inside that column.

**Pros:**

- The row reads as a name and its chips
- Alignment of the chips does not move

**Cons / risks:**

- None material. The numbers were the only index; the names are already unique.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Shrink the label column now that the numbers are gone | The chips would shift right differently per row if a long name wrapped, or the column would be sized to the longest name and look almost the same |

## 5. Acceptance criteria and verification

- [x] Left labels are Languages, Frontend, Backend, Database, Tools & Platforms
- [x] No `01 —` style prefix on any row
- [x] Chips stay on the right and still line up
- [x] Verify in the browser on `/about`

Verified on `http://127.0.0.1:3000/about/` (2026-10-10). Labels are the five group names. No `01 —` prefix in the page text. Every chip column starts at x 285.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-10 | draft | Drop the numbered prefixes |
| 2026-10-10 | approved | User said yes |
| 2026-10-10 | implemented | Labels are the group names only |
