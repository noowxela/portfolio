# SDD: Legacy into Ares homepage

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-07
- **Related:** [docs/architecture.md](../architecture.md)

## 1. Context / current architecture

`/` renders `GalleryShell` from [app/page.tsx](../../app/page.tsx): a sidebar of demos, a live iframe, and a details overlay. [app/about/page.tsx](../../app/about/page.tsx) is a short bio. The root layout pins `NavPill` and loads Inter. There is no GSAP. The site is a static export (`output: 'export'`) with an optional GitHub Pages `basePath`.

## 2. Problem and non-goals

**Problem:** Home is the project case page. It should be its own scroll story: Tron: Legacy cyan on top, a scrubbed handoff, then Tron: Ares red. The gallery stays available, just not as the front door.

**Non-goals:**

- Redesigning the gallery sidebar, iframe stage, or About copy
- WebGL, canvas, or a Three.js grid
- A light-mode version of the home scene
- Deep-linking a home card to a preselected gallery demo
- A custom parallax engine beside ScrollSmoother

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| What should `/` do with the existing gallery? | A scroll story: pinned name, identity, parallax projects, contact. The gallery moves to `/work` unchanged. |
| How do Legacy and Ares share the page? | The upper scene is Legacy cyan. A pinned scrub hands the color to Ares red. Identity, work, and contact stay in Ares. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

`/` becomes a client scroll page. `/work` keeps `GalleryShell`. Desktop uses `ScrollSmoother` (`effects: true`, so `data-speed` and `data-lag` work), plus `ScrollTrigger` pin and scrub on the Legacy hero, the color handoff, and a horizontal project track. The handoff writes `--tron` from `#5ce1ff` to `#ff2b2b`. Phones and `prefers-reduced-motion` skip the smoother and every pin; the handoff is a static cyan-to-red band. The nav pill stays outside the smoother and, on `/`, uses a dark glass edge that follows `--tron`.

**Pros:**

- Uses ScrollSmoother, pin, scrub, and the real data attributes
- Gallery behavior stays on its own route
- Static export still works; the scroll code is client-only

**Cons / risks:**

- Pin plus the mobile address bar can jump if heights use `100vh`; scenes use `100dvh`, and `normalizeScroll` waits until a real jump shows up
- The home scene ignores the light theme surface, so the pill must be restyled on `/`
- A horizontal pin on a narrow screen would trap the scroll, so that pin is desktop-only

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Lenis or a hand-rolled smoother | The page should use ScrollSmoother and its data attributes |
| Three.js grid | Heavier than a CSS perspective grid needs to be |
| Leave the gallery on `/` | Home is the new scroll page |
| Custom attribute engine | ScrollSmoother already reads `data-speed` and `data-lag` |

## 5. Acceptance criteria and verification

Checked in the browser at `http://127.0.0.1:3000` on 2026-10-07.

- [x] Desktop hero stays cyan (`--tron: #5ce1ff`). The handoff pin scrubs to a midpoint mix and then to `#ff2b2b`. Identity and the project track stay red. The nav edge follows the same token.
- [x] Work nav opens `/work`. Selecting My Reborn Car loads `https://noowxela.github.io/car/` in the iframe. Enter the gallery points at `/work/`.
- [x] `/about` still reads. Back to gallery goes to `/work/`.
- [x] At 390px and with `prefers-reduced-motion: reduce` there are no pin spacers and no smoother. Both handoff labels stay visible. Contact and the gallery link are in the page.
- [x] Turning reduced motion off, and resizing 390px → 1200px, restores three pins and does not leave the hero stuck.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-07 | approved | Plan confirmed. Legacy hero, color handoff, Ares identity, work, and exit. Gallery moves to `/work`. |
| 2026-10-07 | implemented | Browser pass on desktop, 390px, and reduced motion. |
