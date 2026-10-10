# SDD: Full-width hobbies marquee

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-10
- **Related:** [008-hobbies-marquee.md](./008-hobbies-marquee.md), [tron-about.md](../pages/tron-about.md)

## 1. Context / current architecture

The hobbies strip (`app/about/page.tsx`, `.about-marquee` in `components/home/tron.css`) sits inside the About article, which is `max-w-2xl` and centered. `main` also has side padding (`px-6`, `sm:px-10`). The strip clips to that column. Names are separated by a muted middot (`·`). There is no rule on the strip. The loop, the second `aria-hidden` copy, and the reduced-motion wrap are already in place.

## 2. Problem and non-goals

**Problem:** The marquee should be the full width of the screen, with a border on the top and the bottom, and `/` between the names instead of `·`.

**Non-goals:**

- Changing the seven hobbies or their order
- Changing the Toolkit or the footer columns
- Speeding up or slowing the 28 second loop

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| What should change? | Full screen width, border top and bottom, `/` instead of the dot. Suggestions welcome. |
| What happens under the pointer? | The scroll pauses, and the color changes too. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

Move the strip out of the article so the `max-w-2xl` column does not clip it. The `Hobbies` label stays in the column. The strip is a sibling between the article and the footer. It cancels the page padding (`px-6`, `sm:px-10`) with matching negative margins, so the band meets both edges of the viewport. `100vw` was not used: on a padded parent it overshoots and can add a sideways scrollbar. The measured band is exactly the viewport width.

Top and bottom borders use the same hairline as the footer: `border-black/10` in light mode, `border-white/10` in dark. About `0.9rem` of padding keeps the type off the rules.

The separator becomes ` / ` in the same muted `#888`.

Two extras, because a full-width ticker otherwise slices a word on the screen edge (the current strip already shows `ime` for Anime):

- A short fade on the left and right edges, so a name dissolves instead of being cut. Reduced motion turns the fade off, because the names wrap and should stay fully visible.
- The scroll pauses while the pointer is over the strip, and the names shift to the page cyan `#5ce1ff` (the same accent as the role line). The slash stays `#888`. Color eases over about `0.25s`. On leave, the scroll resumes and the names return to `#333` / `#ddd`. Reduced motion still has no scroll, and the same cyan still applies while the pointer is over the names.

**Pros:**

- The band reads as a full-width rule, not a line trapped in the column
- `/` is the separator asked for
- The fade, the pause, and the cyan shift make the wide band readable and show that it can be touched

**Cons / risks:**

- `100vw` can be slightly wider than the layout once a classic scrollbar is present, which would add a sideways scroll. macOS overlay scrollbars do not do this. If a sideways bar appears, switch the width to `100%` of a full-bleed wrapper instead of `100vw`.
- The fade hides the first and last fraction of a name on purpose. It is short (about 6% of the width).

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Keep the strip in the column and only add borders | It would still be `max-w-2xl`, not the screen |
| Put the Hobbies label on the left edge of the screen | The rest of the type stays in the column. Only the band goes wide |

## 5. Acceptance criteria and verification

- [x] The scrolling band is the width of the viewport, not the text column
- [x] It has a top border and a bottom border in light and dark
- [x] Names are separated by `/`, not `·`
- [x] The edges fade, and the strip pauses while the pointer is over it
- [x] While paused, the names turn cyan (`#5ce1ff`) and the slash stays muted
- [x] Reduced motion still shows all seven names, still, with no fade. Hover still turns them cyan
- [x] The Hobbies label stays in the column, above the band
- [x] Verify in the browser on `/about`, including a hover pause and the color change

Verified on `http://localhost:3000/about/` at 905px wide (2026-10-10):

- The band runs from x 0 to x 905. No sideways scroll. Top and bottom borders are 1px. Padding is 14.4px (`0.9rem`). Separator content is `" / "` in `#888`. The edge mask fades at 6% and 94%. The track was moving.
- Forced hover: animation `paused`, transform held over 400ms, name color `rgb(92, 225, 255)`, slash stayed `rgb(136, 136, 136)`.
- Reduced motion: animation `none`, mask `none`, seven names visible, band still 905px wide. Hover still turns the names cyan.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-10 | draft | Full-width band, rules, slash, fade, hover pause |
| 2026-10-10 | draft | Hover also shifts the names to the page cyan |
| 2026-10-10 | approved | User said approve |
| 2026-10-10 | implemented | Full-width band, slash, fade, pause, cyan |
