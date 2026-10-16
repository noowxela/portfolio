# SDD: Work coverflow

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-16
- **Related:** [docs/architecture.md](../architecture.md), `swiper/extra/index_iframe_coverflow.html`

## 1. Context / current architecture

`/work` rendered `GalleryShell`: a sidebar of SVG thumbnails (`DemoSidebar`) and one live iframe (`DemoStage`). `DemoStage` renders the iframe at window size and scales it down to fit. Demos live in `data/demos.ts`. The site is a static export on GitHub Pages under `/portfolio`, so public paths go through `withBasePath`.

## 2. Problem and non-goals

**Problem:** The Work page should read like the iframe coverflow experiment: angled cards of live sites, with the centre one in focus.

**Non-goals:**

- More than one live iframe at a time
- Changing the demo list, the header, or Home and About
- Removing the sidebar layout

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Which option? | Option A: Swiper coverflow, live iframe only on the active slide, screenshots elsewhere. |
| Style? | Reuse the existing stage logic and fit the portfolio style. |
| Keep the old layout? | Only if cheap. It is: a Coverflow / List toggle. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

- `swiper` from npm with EffectCoverflow, Navigation, Pagination, Keyboard, A11y and Mousewheel. `centeredSlides`, `slidesPerView: 'auto'`, slide click centres it.
- Real 1440x900 WebP screenshots from `scripts/shoot-thumbs.mjs` (`shot` field). `demoThumb()` falls back to the SVG `thumb`. Movies App and Teppan Catch are `embeddable: false` (503 / 404 at the time of writing).
- The scaling logic moves to `useScaledFrame` and is shared by `DemoStage` and `CoverflowStage`. The coverflow renders the iframe at the screenshot size (1440x900) so it lines up with the 16:10 card on any screen.
- Only the active slide mounts the iframe, with `pointer-events: none` until **Interact** is on. While interacting, Swiper drag, wheel and keyboard are off so the demo gets them. Changing slide turns Interact off.
- Info card below the stage: name, New / Featured chips, blurb, tags, Open live and Repo (`PillButton`). Palette `#eeeeee` / `#0d0d0d`, white / `#1a1a1a` surfaces, Inter.
- Under 640px: rotate 12, depth 60. `prefers-reduced-motion`: rotate 0, depth 0, speed 0. Swiper remounts when either changes.
- Non-active slides are `aria-hidden`, and slides more than one away are also `inert`. Arrow keys move the carousel. A polite live region announces `Project n of N: name`.
- `WorkView` holds a fixed Coverflow / List toggle (bottom right; `IdentityChip` is bottom left). It is not remembered across visits.

**Pros:** one live page at a time, real previews, the old layout still one click away.

**Cons / risks:** adds `swiper` (and `playwright` as a dev dependency for the screenshot script). Screenshots go stale until the script is run again. A slide change reloads the iframe.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Hand-rolled CSS 3D, as in the experiment | Rebuilding swipe, keyboard and a11y by hand |
| Screenshot-only carousel | Loses the live centre card |

## 5. Acceptance criteria and verification

- [x] `npm run lint` and `GITHUB_PAGES=true npm run build` pass
- [x] Exactly one iframe, inside `.swiper-slide-active`; it follows ArrowRight
- [x] iframe `pointer-events` is `none`, then `auto` after Interact
- [x] No console errors; `scrollWidth` / `scrollHeight` equal the viewport (no page scroll)
- [x] Mobile 390x844 uses the flatter effect; reduced motion has 0deg rotation
- [x] Light and dark

Verified with headless Chrome on `http://localhost:3000/work/` at 1440x900 (light, dark, Interact, ArrowRight x2, reduced motion) and 390x844 (light, dark).

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-16 | approved | Option A |
| 2026-10-16 | implemented | Coverflow is the Work page, List toggle keeps the sidebar |
