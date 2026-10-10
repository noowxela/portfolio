# SDD: About hobbies marquee

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-10
- **Related:** [005-about-toolkit.md](./005-about-toolkit.md), [tron-about.md](../pages/tron-about.md)

## 1. Context / current architecture

`/about` is a still page. The column (`max-w-2xl` in `app/about/page.tsx`) is the name, the role, the bio, Focus, then the Toolkit. The contact footer follows the article. There is no hobbies list and no marquee. Copy for the page lives in `data/site.ts`. Light ground is `#eeeeee`, dark is `#0d0d0d`. Small labels are tracked uppercase in `#888`.

## 2. Problem and non-goals

**Problem:** After the Toolkit, About should show a marquee of hobbies.

**Non-goals:**

- Putting the marquee on the home scroll
- Linking a hobby to anything
- Changing the Toolkit rows

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| What goes in the marquee, and where? | After the Toolkit. Badminton, Billiard, PickleBall, Hiking, Anime, Movie, Food and Drink. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

Add `site.hobbies` with those seven names, in that order, including the capital B in PickleBall. After the Toolkit `<ol>`, still inside the article, render a tracked label `Hobbies` (same style as Focus) and a clipping strip. The strip holds the list twice, side by side, and a CSS animation slides it from `0` to `-50%` over about 28 seconds, linear, infinite, so the loop has no gap. Names use the body color (`#333` / `#ddd`). A muted middot separates them. The second copy is `aria-hidden` so a screen reader hears the list once. `prefers-reduced-motion: reduce` turns the animation off and lets the names wrap in place. The strip stays inside the column, so it does not run into the page edges.

**Pros:**

- The hobbies move, which is what a marquee is for
- The list lives with the rest of the About copy
- Reduced motion still shows every name

**Cons / risks:**

- Inside `max-w-2xl` the travel is short, so the same names come back quickly. 28 seconds keeps it readable. Faster would be harder to read.
- Two copies in the DOM. Only the first is exposed to assistive tech.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| A static chip row like the Toolkit | That is a list, not a marquee |
| A full-bleed strip wider than the column | About’s type stays in the one column |

## 5. Acceptance criteria and verification

- [x] The marquee sits after the Toolkit and before the footer
- [x] The seven hobbies appear in the order above, with PickleBall spelled that way
- [x] The strip scrolls continuously and loops without a blank gap
- [x] With reduced motion, the names stay still and all of them are visible
- [x] Verify in the browser on `/about`: the scroll, and reduced motion

Verified on `http://127.0.0.1:3000/about/` (2026-10-10):

- Headings run Focus, What I work in, Hobbies, Contact. The seven names are in order, and the second copy is `aria-hidden`.
- Animation `about-marquee`, 28s. Transform moved from about `-389px` to `-399px` over 400ms. The visible strip shows the end of one copy running into the next (Movie, Food and Drink, then Badminton again).
- With `prefers-reduced-motion: reduce`, animation is `none`, the track wraps, the second copy is hidden, and the seven names stay visible.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-10 | draft | Hobbies marquee after the Toolkit |
| 2026-10-10 | approved | User said yes |
| 2026-10-10 | implemented | Scrolling hobbies strip after the Toolkit |
