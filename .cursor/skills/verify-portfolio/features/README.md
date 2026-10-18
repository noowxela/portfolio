# Portfolio verification map

Read this index, then follow one feature file. Drive only the verification server this run launched.

## Baseline preconditions

- Repo: `01_project/o000o_active/portfolio`.
- `node .cursor/skills/verify-portfolio/verify.mjs launch` is healthy at `http://127.0.0.1:3100`.
- `node .cursor/skills/verify-portfolio/verify.mjs doctor` exits 0.
- Do not set `GITHUB_PAGES`. Do not use port 3000.
- No seed data. Pages render from the repo.

## Driving conventions

- Start from the feature's own URL. Do not assume a previous drive left the browser open.
- Prefer role and accessible name. The helper already does.
- Treat command names as literal: `about`, `home`, `work`, `discs`.
- Keep proof files. Cleanup removes the server only.

## Proof and skip reporting

- Each drive writes `artifacts/<feature>/page.png`, `main.aria.txt`, and `meta.json`.
- Record which feature file and entry point you used.
- If a path cannot be reached, report the command and the unmet precondition. Do not mark a different path as a substitute.

## Features

- [Home](./home.md) — landing stage at `/`, name and corner entries.
- [Work](./work.md) — gallery layouts, including Grid.
- [About](./about.md) — name, focus, and toolkit.
- [Discs](./discs.md) — version board, including 02 v3 3D.
- [Journey](./journey.md) — temporary coming-soon stub at `/journey/`.
- [Noelite 2](./noelite2.md) — scroll-driven 3D ride at `/noelite2/` (was `/journey/`).
- [Noelite](./noelite.md) — previous scroll home at `/noelite/`.
