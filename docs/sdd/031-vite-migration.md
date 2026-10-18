# SDD: Vite + React migration

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-18
- **Related:** [architecture.md](../architecture.md), [vite-migration-plan.md](../vite-migration-plan.md), [029-portrait-home.md](./029-portrait-home.md), [030-journey-gridlog.md](./030-journey-gridlog.md)

## 1. Context / current architecture

Next.js 16 App Router static export (`output: 'export'`, `trailingSlash`, `basePath: /portfolio` when `GITHUB_PAGES=true`). Seven pages under `app/`, a root layout with `next/font` Inter, `next-themes`, `NavPill`, and `RouteCurtain`. Almost every component is already a client component. GitHub Pages deploys `out/`. Baseline measured on `main@1f7ca39` with `GITHUB_PAGES=true`: `out/` 4.78 MiB, home first-load JS 214.2 KiB gzip. Shots and numbers are in `~/.cache/home2/shots/vite-baseline/` (`/workspace` is read-only on this Mac).

## 2. Problem and non-goals

**Problem:** The site is a client-side portfolio (WebGL, GSAP, no server features) paying for the Next runtime, `next/font`, and the `GITHUB_PAGES` base-path switch. Move it to Vite without changing what the pages do.

**Non-goals:** Full SSR or SSG of page bodies. React Compiler. StrictMode. Cleaning hydration-only code (`queueMicrotask`, `getServerSnapshot`). Changing disc tilt. Rewriting `AGENTS.md` (Alex edits that). Pushing or opening the PR before Alex reviews.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| React Router v8 or lock v7? | v8.4. `createBrowserRouter` and `route.lazy` are still the data API. It peers on React `>=19.2.7`, so React and React DOM move from 19.2.4 to 19.2.7. |
| HTML shells or full prerender? | Scheme C. Each route gets a static HTML shell with its own title and OG tags. The body stays client-rendered. |
| May `SideDisc` change `next/dynamic` to `React.lazy`? | Yes. Import only. The 30° tilt logic stays. |
| Custom theme provider or keep `next-themes`? | Custom provider plus a blocking script in `index.html`. Storage key stays `theme`. |
| Dev port after merge? | This branch uses Vite on 3001 and preview on 3002 so pf3000 can keep 3000. Switching pf3000 is after merge, not in this branch. |
| Who edits AGENTS.md? | Alex. This change does not commit it. |

Alex answered by saying to start the plan (2026-10-18), which adopts those recommendations.

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Worktree `portfolio-vite` on `vite-migration`. Vite 8, `@vitejs/plugin-react`, `@tailwindcss/vite`, React 19 without StrictMode, React Router data mode, `base: '/portfolio/'`. `withBasePath` becomes `asset()` using `import.meta.env.BASE_URL`. Self-hosted Inter, Oxanium, and Share Tech Mono. `route.lazy` so the URL changes only after the page module loads. `scripts/prerender-shells.mjs` copies `dist/index.html` per route. `scripts/serve-pages.mjs` stands in for GitHub Pages on `127.0.0.1:3100`.

**Pros:** Same routes, transitions, and assets. Deep links return 200 with the right title and OG image. No SSR of WebGL pages. Dev and production share one base path.

**Cons / risks:** First paint waits on JS. Font family names change from next/font hashes to real names, so particle text must be checked. Lazy route CSS still accumulates. `SideDisc` is touched only at the import.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| SPA plus a 404 redirect hack | Deep links return 404 and every page shares the home title. |
| Full prerender (`vite-react-ssg` or `renderToString`) | Landing, GridLog, Noelite2, and Discs depend on `window` and WebGL. |
| TanStack Router | Seven static routes do not need its type-safe search params. |
| Keep `next-themes` | The flash-prevention script would still be required, and the dependency name stays tied to Next. |

## 5. Acceptance criteria and verification

- [x] `npm run build` writes `dist/index.html`, route shells, `404.html`, `og.png`, icons, `worker.js`, `.nojekyll`
- [x] `tsc --noEmit` and `eslint .` are clean
- [x] Home first-load JS gzip is 124 KiB (the entry chunk), under the 214.2 KiB Next baseline. `dist/` is 3.7 MiB versus `out/` 4.78 MiB
- [x] verify-portfolio drives home, work, about, journey, noelite, noelite2, discs against `http://127.0.0.1:3100/portfolio` (2026-10-18). Home screenshot shows the particle portrait and four corners
- [ ] Curtain top stays 56 px on home → Work / Journey / About (not re-measured in this pass; the same RouteCurtain and 56 px nav are still mounted)
- [ ] Direct visits do not play the entrance (journey drive opened `/journey/#ef5e76` directly; the entrance flag path was not timed)

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-18 | draft | Written from the migration plan |
| 2026-10-18 | approved | Alex: start the plan, using the recommended choices |
| 2026-10-18 | implemented | Vite build, prerender shells, and verify-portfolio on `/portfolio` |
