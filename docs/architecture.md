# Architecture

Next.js App Router static export. Home is a GSAP scroll story. The demo gallery lives at `/work`. About stays a short page.

## Stack

- Next.js 16, React 19, Tailwind CSS v4
- GSAP `ScrollTrigger` and `ScrollSmoother` on `/` only
- `next-themes` for light, dark, and system on the gallery and About
- Static export (`output: 'export'`). GitHub Pages sets `GITHUB_PAGES=true`, which adds `basePath: /portfolio`

## Routes

| Route | What it renders |
| --- | --- |
| `/` | Legacy-to-Ares scroll story (`components/home/`) |
| `/work` | `GalleryShell`: sidebar, live iframe, project details |
| `/about` | Bio and contact |

`app/layout.tsx` wraps every route with Inter, metadata, `ThemeProviders`, and the fixed header (`NavPill`). The smoother wrapper exists only inside the home page, so the header stays `position: fixed` outside it.

A section-by-section walkthrough of the home page is in [tron-home.md](./pages/tron-home.md). 中文版：[tron-home.zh.md](./pages/tron-home.zh.md).

About is written up the same way in [tron-about.md](./pages/tron-about.md). 中文版：[tron-about.zh.md](./pages/tron-about.zh.md).

## Home scroll

`TronHome` is a client component. `useHomeScroll` loads GSAP in the browser.

Desktop (`min-width: 768px` and no reduced motion):

1. `ScrollSmoother` with `effects: true` reads `data-speed` (parallax) and `data-lag` (trailing).
2. A pinned scrub on the hero moves the cyan grid and the corner disc.
3. A pinned scrub on the handoff writes `--tron` from Legacy cyan `#5ce1ff` to Ares red `#ff2b2b`.
4. A pinned scrub moves the featured-project track sideways.

The hero section keeps its own cyan `--tron`. Identity, work, and exit keep red. The nav edge follows the token on `html`, which the handoff timeline updates.

Phones and `prefers-reduced-motion` do not create the smoother or any pin. Scenes stack. The handoff is a static gradient. A scroll listener still flips the nav token when the band passes.

## Data

- `data/site.ts` — name, role, tagline, contact
- `data/demos.ts` — gallery items. `featured: true` picks the three cards on the home track
- `data/headerNavLinks.ts` — Home, Work, About

## Theme

The home page paints its own night scene and does not follow the light theme. Gallery and About still follow `next-themes`. While `/` is mounted, `html` gets `tron-home` and `scroll-behavior: auto` so CSS smooth scroll does not fight ScrollSmoother.
