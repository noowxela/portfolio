---
name: verify-portfolio
description: "Drive the portfolio Next.js site in a browser and prove a page works. Use when changing portfolio UI, routing, or the discs board, or when asked to verify the portfolio app."
---

# Verify portfolio

Portfolio is a static Next.js site. A user moves through the header (`alexW`, Work, About) and, on Work, a layout toolbar. The discs board is a direct URL, not a header link until the clock is triple-clicked. There is no login, database, or env file. Do not set `GITHUB_PAGES`.

Never drive the user's dev server on port 3000. This skill builds the static export and serves `out/` on `127.0.0.1:3100` (`VERIFY_PORT` to move it). Next.js refuses a second `next dev` in this repo, so verification does not use `next dev`. One verification server at a time. If port 3100 is already taken by something this run did not start, stop and pick another port. Do not kill that process.

Commands run from `01_project/o000o_active/portfolio`:

```bash
node .cursor/skills/verify-portfolio/verify.mjs launch
node .cursor/skills/verify-portfolio/verify.mjs doctor
node .cursor/skills/verify-portfolio/verify.mjs drive about
node .cursor/skills/verify-portfolio/verify.mjs drive home
node .cursor/skills/verify-portfolio/verify.mjs drive work
node .cursor/skills/verify-portfolio/verify.mjs drive discs
node .cursor/skills/verify-portfolio/verify.mjs drive journey
node .cursor/skills/verify-portfolio/verify.mjs drive noelite
node .cursor/skills/verify-portfolio/verify.mjs cleanup
```

Routes use a trailing slash (`/about/`, `/work/`, `/discs/`). Playwright is the harness. Chromium must be installed (`npx playwright install chromium` once, from this repo). If `PLAYWRIGHT_BROWSERS_PATH` points into a Cursor sandbox browser cache, `drive` drops it before loading Playwright and uses the normal browser cache.

## Launch

`launch` runs `npx next build` with `GITHUB_PAGES` empty, then `npx serve out -l tcp://127.0.0.1:3100`. Ready means `GET /` returns 200 from that server. The pid and port are stored in `.verify/run.json`. The build and server log is `.verify/server.log`.

`launch` refuses to start when a verification pid is still alive, or when the port is already open.

## Doctor

`doctor` is read-only. It passes only when `.verify/run.json` exists, that pid is alive, and the port matches `VERIFY_PORT`. Run it before driving if a page looks blank or the server might have died. It does not fetch the site; `launch` already required HTTP 200, and a dead pid is the usual failure.

## Drive

`drive <feature>` opens headless Chromium against the verification server only. Features and their entry points are in `features/README.md`. Drive the feature file's path, not a stand-in.

## Evidence

Each successful drive writes three files under `.cursor/skills/verify-portfolio/artifacts/<feature>/`:

- `page.png` — the viewport after the action
- `main.aria.txt` — the accessibility snapshot of the region that changed
- `meta.json` — feature id, final URL, timestamp

Proof is the action plus the resulting state. A screenshot alone is not enough. Do not hit test-only routes; these pages are the real ones. The site has no external side effects to mock.

## Cleanup

`cleanup` sends `SIGTERM` to the process group recorded in `.verify/run.json`, then deletes `.verify/`. It does not delete `artifacts/`. After cleanup, the png and aria files must still be there.

## Helpers

`verify.mjs` is the only helper. Invoke it as shown above. It is not a library.
