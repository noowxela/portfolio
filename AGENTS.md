This site is a Vite + React Router SPA. It is not a Next.js app. Do not add `app/`, `next.config`, or `next/*` imports.

`npm run dev` is Vite on port **3001**, strict, at [http://localhost:3001/portfolio/](http://localhost:3001/portfolio/). Preview is port **3002**. Leave **3000** for the other checkout. Do not use Vite's default 5173.

`vite.config.ts` sets `base: '/portfolio/'` for dev and production. In-app links stay unprefixed (`/work`). Public files go through `asset()` in `lib/asset.ts`. Do not read `NEXT_PUBLIC_*` or `GITHUB_PAGES`.

Do not wrap the tree in `<StrictMode>`. A double mount creates and destroys the WebGL scenes twice.

GitHub Pages publishes `dist/` from `.github/workflows/deploy-pages.yml`. `npm run build` is `tsc --noEmit`, `vite build`, then `scripts/prerender-shells.mjs` (one HTML shell per route). `VITE_SITE_URL` defaults to `https://noowxela.github.io/portfolio`.

Theme lives in `src/theme.tsx`. The storage key is `theme`. The blocking script in `index.html` sets `html.dark` before first paint.

Do not change disc tilt in `components/discs/*`. A `React.lazy` import is the only edit that belongs there.

Verify with `.cursor/skills/verify-portfolio`. It builds and serves `dist/` at `http://127.0.0.1:3100/portfolio/`. Do not drive ports 3000 or 3001.
