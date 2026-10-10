# SDD: Toolkit row layout

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-10
- **Related:** [005-about-toolkit.md](./005-about-toolkit.md), [tron-about.md](../pages/tron-about.md)

## 1. Context / current architecture

About’s Toolkit (`app/about/page.tsx`, data in `site.toolkit`) is five groups. Each group stacks: a tracked label (`01 — Languages`), a hairline, then chips on the next line. The column is `max-w-2xl`. Chips wrap. Light and dark borders are already in place. See [005-about-toolkit.md](./005-about-toolkit.md).

## 2. Problem and non-goals

**Problem:** The group name should sit on the left and the chips on the right, on the same row.

**Non-goals:**

- Changing the five groups or their items
- Changing the eyebrow, the Toolkit title, Focus, or the footer
- Moving the Toolkit off About

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| What layout? | Group on the left, items on the right. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

Each group becomes one flex row, aligned to the top. The label keeps its tracked style and takes a fixed `9.5rem` column, so “Tools & Platforms” can wrap to a second line instead of pushing the chips off. The chip list is `flex: 1`, still wrapping, with no hairline between the label and the chips. A hairline stays on the row itself (`border-t`), so the groups still separate. Same light and dark borders. The row is the layout at every width; on a phone the chips just wrap in the space that remains.

**Pros:**

- The group and its items read as one line, which is the layout asked for
- The items and the title stay as they are

**Cons / risks:**

- On a 390px screen the right side is narrower, so a long group wraps to two chip rows. That is the same wrapping as now, in a shorter measure.
- `9.5rem` is tight for “05 — Tools & Platforms”. The label wraps inside that column rather than growing and squeezing the chips.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Stack again under 640px | The ask is left and right, including on a phone |
| Let the label be as wide as its text | “Tools & Platforms” would eat the chip column |

## 5. Acceptance criteria and verification

- [x] Each group is one row: label on the left, chips on the right
- [x] The five groups and their items are unchanged
- [x] Chips still wrap, and the page does not scroll sideways at 390px
- [x] Light and dark borders stay readable
- [x] Verify in the browser on `/about` at desktop width and at 390px

Verified on `http://127.0.0.1:3000/about/` (2026-10-10):

- At 905px, all five rows have the label’s right edge (269) left of the first chip (285), on the same line. No sideways scroll.
- At 390px, the same left-right split holds. Tools & Platforms wraps the label inside the column and the chips wrap to four rows. No sideways scroll.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-10 | draft | Group label left, chips right |
| 2026-10-10 | approved | User said yes |
| 2026-10-10 | implemented | Each group is a left-right row |
