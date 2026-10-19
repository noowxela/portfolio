# SDD: Serve the portfolio at the user-site root

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `draft`
- **Date:** 2026-10-18
- **Related:** [architecture.md](../architecture.md), [031-vite-migration.md](./031-vite-migration.md)

## 1. Context / current architecture

The Vite app is on `main` (`0cd42eb`). GitHub Pages publishes `dist/` from `.github/workflows/deploy-pages.yml` as a **project site**: [https://noowxela.github.io/portfolio/](https://noowxela.github.io/portfolio/).

`vite.config.ts` sets `base: '/portfolio/'` for dev and production. `scripts/prerender-shells.mjs` defaults `VITE_SITE_URL` to `https://noowxela.github.io/portfolio`. The same origin is hardcoded on the `data-shell` tags in `index.html` and in the workflow env. `scripts/serve-pages.mjs` and `.cursor/skills/verify-portfolio/verify.mjs` mount the build at `/portfolio`. In-app links stay unprefixed (`/work`); `asset()` and the router basename both read `import.meta.env.BASE_URL`.

GitHub only serves `https://noowxela.github.io/` from a repository named exactly `noowxela.github.io`. That name is not a live repo. `https://github.com/noowxela/noowxela.github.io` returns 301 to [noowxela/Resume](https://github.com/noowxela/Resume) (repo id `233419433`, created 2020-01-12, now named `Resume`). `https://noowxela.github.io/` itself is 404. Resume's Pages site stays at `https://noowxela.github.io/Resume/`. Other project sites, including `klec-midvalley-infographic`, are separate repos and are served from their own `/<repo>/` paths.

## 2. Problem and non-goals

**Problem:** The site should live at `https://noowxela.github.io/` instead of `/portfolio/`.

**Non-goals:**

- A second repository that only redirects `/portfolio/` to `/`.
- Keeping `https://noowxela.github.io/portfolio/...` working after the move.
- Renaming the local folder `portfolio/`.
- Moving dev from port 3001 to 3000 (still listed in `docs/todo.md`).
- Changing disc tilt, routes, or page content.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Rename this repo, or add a redirect repo? | Rename `portfolio` to `noowxela.github.io` and set the Vite base to `/`. Stated in the request (2026-10-18). |
| Preserve old `/portfolio/` URLs? | No. Those links 404. Other project pages stay where they are. |
| Is the name free? | No live repo uses it. It is a rename redirect to `Resume`. Reclaiming the name removes that redirect. `Resume` itself and `https://noowxela.github.io/Resume/` stay. Root is currently 404. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** One change, shipped as a short cutover so the live site is not left on the wrong base.

1. On a branch, set the public base to `/` and the site origin to `https://noowxela.github.io` (no trailing path):
   - `vite.config.ts` `base`
   - default `VITE_SITE_URL` in `scripts/prerender-shells.mjs`, `src/routes.meta.ts`, and `.github/workflows/deploy-pages.yml`
   - the `data-shell` canonical / Open Graph / Twitter URLs in `index.html` (the prerender script rewrites them, but the source defaults should match)
   - `scripts/serve-pages.mjs` mount (`/` instead of `/portfolio`)
   - verify skill (`verify.mjs`, `SKILL.md`, `features/README.md`) so it fetches `http://127.0.0.1:3100/`
   - `AGENTS.md`, `README.md`, `docs/architecture.md`, `docs/setup.md`
2. `asset()` and `createBrowserRouter` basename already follow `BASE_URL`. With `base: '/'`, basename becomes `''`. In-app `to="/work"` links stay as they are.
3. Do not push that commit while the repo is still `portfolio`. A project site whose HTML points at `/assets/...` 404s, and a user site whose HTML still points at `/portfolio/assets/...` 404s.
4. After approval: `gh repo rename noowxela.github.io` on `noowxela/portfolio`, then push the base change to `main` immediately so the Pages workflow publishes `dist/` at the root. Point the local `origin` URL at `https://github.com/noowxela/noowxela.github.io.git`.
5. Confirm `https://noowxela.github.io/` returns the home shell, `https://noowxela.github.io/work/` returns the work shell, and `https://noowxela.github.io/Resume/` still returns the resume. `https://noowxela.github.io/portfolio/` should 404.

**Pros:**

- One base path. Dev, verify, and production all use `/`.
- Canonical and Open Graph URLs match the real origin.
- Other project sites are untouched.

**Cons / risks:**

- Reclaiming `noowxela.github.io` deletes the GitHub redirect from that old name to `Resume`. Bookmarks to `github.com/noowxela/noowxela.github.io` will open this repo instead of Resume. `github.com/noowxela/Resume` is unchanged.
- `https://noowxela.github.io/portfolio/` and every deeper old URL 404. GitHub does not redirect a project-site path when the repo becomes the user site.
- The live site is wrong from the rename until the new `main` deploy finishes. Keep that gap to the rename plus one push.
- `github.com/noowxela/portfolio` will redirect to the new repo name. Local clones keep working until that redirect is dropped, but `origin` should be updated in this checkout.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| New `noowxela.github.io` repo with a redirect to `/portfolio/` | Leaves `/portfolio` in the public URL. The request asked for the root. |
| Change `base` to `/` and deploy before the rename | The current project site would request assets from the domain root and break before the user site exists. |
| Keep a `/portfolio/` redirect inside this site | The old project URL is not a path we control after the rename. A copy of the site under `dist/portfolio/` would also fight the new root. |

## 5. Acceptance criteria and verification

- [ ] `https://github.com/noowxela/noowxela.github.io` is this repo. `Resume` still exists at `https://github.com/noowxela/Resume`.
- [ ] `npm run build` emits asset URLs under `/assets/` (not `/portfolio/assets/`) and shell canonicals under `https://noowxela.github.io/`.
- [ ] `node scripts/serve-pages.mjs` serves the home at `http://127.0.0.1:3100/` and a deep link at `http://127.0.0.1:3100/work/`.
- [ ] verify-portfolio launch passes the existing seven drives against `http://127.0.0.1:3100/`.
- [ ] After the Pages deploy: `curl -sI https://noowxela.github.io/` is 200, `curl -sI https://noowxela.github.io/work/` is 200 (or 301 to the trailing slash, then 200), `curl -sI https://noowxela.github.io/Resume/` is unchanged, `curl -sI https://noowxela.github.io/klec-midvalley-infographic/` is unchanged, `curl -sI https://noowxela.github.io/portfolio/` is 404.
- [ ] `npm run dev` opens `http://localhost:3001/`.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-18 | draft | Name is a redirect to Resume, not a live repo. Root domain is 404. Waiting for approval before rename or code changes. |
