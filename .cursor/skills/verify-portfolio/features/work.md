# Work

Work is the live gallery. A toolbar under the header switches Coverflow, Shelf, Grid, and List. The URL `?v=` selects the layout.

## Sub-features

- `work-grid` shows the project grid and marks the Grid button pressed.
- `work-project` exposes Mount Replay as a project button.

## How to get to it (user POV)

- Open `/work/`.
- Choose `Work` in the site navigation.
- Choose `Grid` in the toolbar labeled `Work layout`.
- Open `/work/?v=grid` directly.

## Driving it with verify.mjs

Preconditions:

- Doctor passes against `http://127.0.0.1:3100`.
- The drive uses its own browser profile, so the user's saved layout does not apply. `?v=grid` still wins.

- **Open the grid.** Go to `/work/?v=grid`. Run `node .cursor/skills/verify-portfolio/verify.mjs drive work`. The `Grid` button is pressed. A list named `Projects` is present. A button named `Mount Replay, open details` is present. The URL contains `v=grid`.
- **Proof.** `artifacts/work/page.png` shows the toolbar. `artifacts/work/main.aria.txt` is the toolbar snapshot. `artifacts/work/meta.json` records a URL containing `v=grid`.

## Gotchas

- Shelf is the default when `?v=` is absent. A proof of Grid that never sets `v=grid` is incomplete.
- Opening a project replaces the gallery with a detail view. This recipe stops on the grid.
- Coverflow, Shelf, and List are separate entry points. Passing Grid does not verify them.
