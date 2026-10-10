# SDD: Cleaner hobbies marquee

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-10
- **Related:** [009-marquee-full-width.md](./009-marquee-full-width.md), [tron-about.md](../pages/tron-about.md)

## 1. Context / current architecture

The hobbies band (`.about-marquee` in `components/home/tron.css`) is full viewport width, with a 1px rule on the top and bottom, ` / ` between names, a 6% edge fade, and a cyan pause on hover. The `Hobbies` label stays in the `max-w-2xl` column above the band. The footer, `mt-24` below, has its own top rule.

On the page the band reads as a thin ticker. A word is still cut at the left edge (`Ball / Hiking…`). The label sits in the column while the line runs to the screen edge, so they do not belong to each other. The footer rule then floats in the empty space under the band.

## 2. Problem and non-goals

**Problem:** The marquee looks unfinished. The cut word, the pinched rules, and the label floating above the line are what make it ugly.

**Non-goals:**

- Giving up the full width, the slash, the top and bottom rules, or the hover pause
- Changing the seven hobbies
- Restyling the Toolkit

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| What is wrong? | The marquee looks ugly. |
| What about the Hobbies label? | Do not show it. |
| What about the hover color? | Do not change the color. Pause only. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

Keep the full-width band, the rules, the slash, and the hover pause. The names keep their normal color while paused. The cyan shift that is on the page now comes off. Change how the band is drawn.

- Drop the short fade. It still leaves a readable fragment of a word. Pad the scrolling track so a name is not sliced on the screen edge: the loop starts inset, and the fade, if any, is long enough that a cut letter is not readable (transparent through 14%, solid by 22%).
- Set the names in Oxanium, the same face as the About title, at `1.15rem`, with more air around the slash (`1.1rem` either side). The band padding grows from `0.9rem` to `1.25rem` so the type is not pinched by the rules.
- Remove the `Hobbies` label. The band is the section. The heading is not moved into the bar. The heading's `mt-16` moves onto the band (`margin-top: 4rem`) so the names do not sit on the Toolkit chips.
- Pull the footer up (`mt-24` to `mt-16`) so its rule is not a second lonely line under a big gap.
- In the still reduced-motion list, the slash after the last name is omitted. The scrolling loop keeps it, because that slash joins the two copies.

**Pros:**

- The names are the whole bar. Nothing sits above them or beside them
- A chopped word is no longer the first thing you read
- The type matches the rest of About instead of looking like body copy squeezed between two lines

**Cons / risks:**

- A longer fade hides more of the edge. That is the point. The names are still readable across the middle.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Put the Hobbies label inside the band | The label is not wanted |
| Put the strip back inside the column | Full width was asked for. The problem is the drawing, not the width |

## 5. Acceptance criteria and verification

- [x] No readable chopped word at the left or right edge
- [x] The `Hobbies` label is gone. The band is only the names
- [x] Names are Oxanium, with clear space around each `/`
- [x] Rules, full width, slash, and hover pause stay. The names do not change color on hover
- [x] The footer is closer, so its rule is not stranded
- [x] Reduced motion still shows every name, still, inside the band
- [x] Verify in the browser on `/about`, including hover

Verified on `http://localhost:3000/about/` at 905×691, dark mode.

- Headings are Focus, What I work in, Contact, Social, Others. There is no Hobbies heading.
- The band is 0–905px, matching the viewport. `scrollWidth` is 905, so there is no sideways scroll. Top rule is 1px. Padding is 20px (`1.25rem`). Top margin is 64px. Footer margin is 64px (`mt-16`).
- Names are Oxanium at 18.4px (`1.15rem`), `#ddd` (`rgb(221, 221, 221)`). The slash is `/` in `#888`, with 17.6px (`1.1rem`) on either side. The mask is transparent through 14% and solid by 22%.
- Forced hover pauses `about-marquee` (28s). The name color stays `rgb(221, 221, 221)`. The slash stays `rgb(136, 136, 136)`.
- With `prefers-reduced-motion: reduce`, the animation is `none`, the mask is `none`, the second copy is hidden, and the seven names wrap in the full-width band. The slash after Food and Drink is `none`.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-10 | draft | Label inside the band, longer fade, roomier type |
| 2026-10-10 | draft | No Hobbies label. The band is only the names |
| 2026-10-10 | draft | Hover pauses only. No color change |
| 2026-10-10 | approved | Build the cleaner band |
| 2026-10-10 | implemented | No label, pause only, longer fade, roomier type |
