# Architecture

Vite SPA with one HTML shell per route. Home (`/`) is one full-screen stage: the name, four corner entries and a 3D particle portrait. The previous GSAP scroll story lives on at `/noelite`. The demo gallery lives at `/work`. About stays a short page.

## Stack

- Vite 8, React 19, React Router 8, Tailwind CSS v4 (`@tailwindcss/vite`)
- Three.js for the home particle portrait (`components/landing/`), the `/journey` particle mark, the `/noelite` mosaic and `/noelite2`
- GSAP for the portrait pose tweens on `/`; `ScrollTrigger` and `ScrollSmoother` on `/noelite` only
- A small theme provider (class on `html`, `localStorage['theme']`, system default) for light, dark, and system on the gallery and About
- GitHub Pages base path is always `/portfolio/`. `scripts/prerender-shells.mjs` writes each route's title and Open Graph tags into `dist/`

## Routes

| Route | What it renders |
| --- | --- |
| `/` | Full-screen stage: centred name, corner entries 01–04, particle portrait, contact window (`components/landing/`, [SDD 029](./sdd/029-portrait-home.md), [walkthrough](./pages/portrait-home.md)) |
| `/noelite` | The previous home: Legacy-to-Ares scroll story (`components/home/`) |
| `/work` | `GalleryShell`: sidebar, live iframe, project details |
| `/about` | Bio and contact |
| `/discs` | Temporary board of the disc versions |
| `/journey` | grid.log: work experience as a horizontal git log with a branch rail and a particle years mark (`components/journey/`, `data/experience.ts`, [SDD 030](./sdd/030-journey-gridlog.md), [walkthrough](./pages/journey-gridlog.md)) |
| `/noelite2` | Preview: scroll-driven 3D ride, desk → Grid → neon city → disc portal → desk (`components/noelite2/`, [SDD 028](./sdd/028-journey-home.md)); was `/journey` until 2026-10-18 |

`src/RootLayout.tsx` wraps every route with `ThemeProvider`, the fixed header (`NavPill`), and `RouteCurtain`. Fonts are self-hosted in `src/fonts.css`. The smoother wrapper exists only inside `/noelite`, so the header stays `position: fixed` outside it. `NavPill` uses its dark Tron bar on `/`, `/noelite`, `/noelite2` and `/journey`.

The new home is written up in [portrait-home.md](./pages/portrait-home.md). A section-by-section walkthrough of the scroll story (now `/noelite`) is in [tron-home.md](./pages/tron-home.md). 中文版：[tron-home.zh.md](./pages/tron-home.zh.md).

The `/journey` page is written up in [journey-gridlog.md](./pages/journey-gridlog.md).

About is written up the same way in [tron-about.md](./pages/tron-about.md). 中文版：[tron-about.zh.md](./pages/tron-about.zh.md).

## Home stage (`/`)

The first visit in a browser paints a static loading screen from `index.html` before the bundle runs (`#boot`, class `booting` on `html`, remembered as `localStorage['portfolio-booted']`). `src/boot.ts` keeps it up until Oxanium 600 is ready and, on `/`, the portrait sets `data-ready` (or the fallback photo settles). Other first URLs wait until that route has rendered. It fades in 0.4s, or drops immediately when `prefers-reduced-motion` is set, and gives up after 8s. Later visits skip it. See [SDD 033](./sdd/033-first-load.md).

`Landing` is a client component. It renders the DOM (name, corner entries, contact window, static fallback) and lazy-loads `portraitScene.ts`, which owns the page's single `WebGLRenderer`. Photos are sampled into instanced line-segment particles (`sampler.ts`), each entry has a pose in `poses.ts`, and the render loop runs only while something moves (idle sway renders at ~30 fps; with reduced motion nothing renders at rest). Details in [SDD 029](./sdd/029-portrait-home.md).

Clicking Work, Journey or About plays an exit on the home (name glitch, particles stream into the corner), drops the global `RouteCurtain` (mounted in `app/layout.tsx`), and `router.push`es after 720 ms. The destination plays a staggered entrance only when it finds the home's fresh `sessionStorage['route-enter']` flag for its own path, so direct visits, reloads and back / forward are untouched. See [portrait-home.md](./pages/portrait-home.md#leaving-for-a-page-work-journey-about).

## `/noelite` scroll (previous home)

`TronHome` is a client component. `useHomeScroll` loads GSAP in the browser.

Desktop (`min-width: 768px` and no reduced motion):

1. `ScrollSmoother` with `effects: true` reads `data-speed` (parallax) and `data-lag` (trailing).
2. A pinned scrub on the hero moves the cyan grid and the corner disc, and carries the mosaic name up with the horizon while scaling it from 1 to 0.62.
3. A pinned scrub on the handoff writes `--tron` from Legacy cyan `#5ce1ff` to Ares red `#ff2b2b`.
4. A pinned scrub moves the featured-project track sideways.

The hero section keeps its own cyan `--tron`. Identity, work, and exit keep red. The nav edge follows the token on `html`, which the handoff timeline updates.

Phones and `prefers-reduced-motion` do not create the smoother or any pin. Scenes stack. The handoff is a static gradient. A scroll listener still flips the nav token when the band passes.

## Data

- `data/site.ts` — name, role, tagline, contact
- `data/demos.ts` — gallery items. `featured: true` picks the three cards on the `/noelite` track
- `data/headerNavLinks.ts` — Home, Work, Journey, About, Discs. On `/`, Work / Journey / About play the home's exit transition (see [portrait-home.md](./pages/portrait-home.md#leaving-for-a-page-work-journey-about)). Discs stays out of the header until the clock is clicked three times in a row, and the next three clicks hide it again.

## Theme

The home page (`/`), `/noelite`, `/noelite2` and `/journey` paint their own night scene and do not follow the light theme. Gallery and About still follow `next-themes`. While `/noelite` is mounted, `html` gets `tron-home` and `scroll-behavior: auto` so CSS smooth scroll does not fight ScrollSmoother. `/` adds `tron-home` and `landing-page` (no page scroll).
