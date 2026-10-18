# About

About introduces Alex and lists focus areas, a toolkit, and contact links.

## Sub-features

- `about-open` shows the name and the focus section.
- `about-toolkit` shows the Toolkit label under the "What I work in" heading. The label is not a heading.

## How to get to it (user POV)

- Open `/about/`.
- From any page, choose `About` in the site navigation.

## Driving it with verify.mjs

Preconditions:

- Doctor passes against `http://127.0.0.1:3100`.

- **Open About.** Go to `/about/`. Run `node .cursor/skills/verify-portfolio/verify.mjs drive about`. The main heading reads `Alex Woon Jun Rong`. Headings `Focus` and `What I work in` are present.
- **Proof.** `artifacts/about/page.png` shows the name. `artifacts/about/main.aria.txt` contains those three headings. `artifacts/about/meta.json` records the `/about/` URL.

## Gotchas

- The header clock text changes every minute. Do not assert it.
- `/about` redirects to `/about/`. Assert the trailing-slash URL.
- The Discs link is hidden until the clock is triple-clicked. About does not depend on it.
