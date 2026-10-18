# Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3001/portfolio/](http://localhost:3001/portfolio/). This branch keeps port 3000 free for the Next checkout. Preview is [http://localhost:3002/portfolio/](http://localhost:3002/portfolio/).

| Route | Page |
| --- | --- |
| `/` | Legacy-to-Ares scroll story |
| `/work` | Demo gallery |
| `/about` | Bio and contact |

`gsap` (ScrollTrigger and ScrollSmoother) is a dependency of the home page only. No env vars are required for local dev.

```bash
npm run build   # dist/: Vite build plus one HTML shell per route
npm run lint
npm run typecheck
```

`VITE_SITE_URL` defaults to `https://noowxela.github.io/portfolio`. GitHub Pages publishes `dist/` at `/portfolio/`.
