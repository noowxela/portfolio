# SDD: About toolkit

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-10
- **Related:** [docs/architecture.md](../architecture.md), [tron-about.md](../pages/tron-about.md)

## 1. Context / current architecture

`/about` (`app/about/page.tsx`) is a still page. It is not on the home scroll. A hex field sits behind a centered column (`max-w-2xl`). The column is the name, the role, two bio paragraphs, then a Focus list from `site.highlights`. A three-column contact footer follows. Light ground is `#eeeeee`, dark is `#0d0d0d`. Body type is Inter. The name uses Oxanium. Small labels (Focus, footer columns) are tracked uppercase at `0.7rem` in `#888`.

There is no skills list. `data/site.ts` holds identity, contact, and the three highlights.

## 2. Problem and non-goals

**Problem:** About says what the work is about, but not the stack. A Toolkit should sit on About, after Focus and before the footer, in the same structure as the reference: an eyebrow, a title, then numbered groups of outlined chips.

**Non-goals:**

- The sage ground and brown type from the reference
- A new scene on the home scroll
- Linking a chip to a demo
- Replacing the Focus list

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Where should the Toolkit go? | On About, after Focus and before the contact footer. |
| How should it look? | The same structure, in About’s current type and colors. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

Add `site.toolkit` in `data/site.ts`: five groups, in this order, with these labels.

| | Group | Items |
| --- | --- | --- |
| 01 | Languages | JavaScript, TypeScript, PHP, Python, Dart |
| 02 | Frontend | Vue.js, Nuxt.js, React.js, Next.js, React Native, Expo |
| 03 | Backend | Laravel, Express.js, NestJS |
| 04 | Database | SQL Server, MySQL, Oracle, MongoDB |
| 05 | Tools & Platforms | Git, Selenium, Playwright, Flutter, Electron, Windows IIS, Cursor |

Render them in the About column. Eyebrow `What I work in`, same tracked label as Focus. Title `Toolkit` in Oxanium, smaller than the name (`clamp(1.8rem, 4vw, 2.4rem)`), `#111` / `#f4feff`. Each group is a row: `01 — Languages` in the small label style, a hairline (`border-black/10`, `border-white/10` in dark), then chips that wrap. A chip is a `span` with a 1px border, `0.8rem` type, and horizontal padding. Chips are not links. The footer stays where it is.

**Pros:**

- The stack lives next to the bio, in data, not hardcoded in the page
- Light and dark come from classes already used on About
- The home film does not change

**Cons / risks:**

- Five rows make About longer. The column stays `max-w-2xl`, so chips wrap instead of widening the page.
- `Tools & Platforms` is a long row label. It stays on one line at `max-w-2xl` and wraps only if the viewport is very narrow.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Sage page matching the reference pixel for pixel | About already has a ground, type, and hex field |
| Put the groups on the identity scene | That scene is three short panels inside the film |

## 5. Acceptance criteria and verification

- [x] About shows Toolkit after Focus and before the footer
- [x] Five numbered groups, in the order above, with those exact items
- [x] Chips wrap inside the column on a narrow viewport
- [x] Light and dark both keep readable type and a visible chip border
- [x] Focus, the bio, and the footer are unchanged
- [x] Verify in the browser on `/about`, light and dark, and a narrow width

Verified on `http://127.0.0.1:3000/about/` (2026-10-10):

- Headings run Focus, What I work in, Contact. Groups are 01 Languages through 05 Tools & Platforms, with the listed chips.
- Dark: title `#f4feff`, Oxanium, chip border 1px at 25% white. Light: title `#111`, chip text `#333`, border 20% black, rule 10% black.
- At 390px wide, Tools & Platforms wraps to two rows and the page does not scroll sideways.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-10 | draft | Toolkit on About, current type and colors |
| 2026-10-10 | approved | User said yes |
| 2026-10-10 | implemented | Five chip groups after Focus |
