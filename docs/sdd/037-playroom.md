# SDD: Add Playroom to the gallery

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-22
- **Related:** [architecture.md](../architecture.md), [036-shichen.md](./036-shichen.md), [playroom Pages](../../../zzz_not_active/playroom/docs/sdd/002-github-pages.md)

## 1. Context / current architecture

The work gallery reads `data/demos.ts`. Newest items sit at the top of the `demos` array. Each item needs a `thumb` SVG in `public/thumbs/`; `shot` is the optional 1440×900 WebP from `scripts/shoot-thumbs.mjs`. `featured: true` is a separate curated set of three cards on the `/noelite` track: Phaser Examples, My Reborn Car, and Interactive Experiences.

[Playroom](https://noowxela.github.io/playroom/) is already a public GitHub Pages site. It is one page: a 3D hardware still, then Snake, Breakout, or Blocks. The live response has no `X-Frame-Options`, so the page can be iframed (`embeddable` stays unset).

## 2. Problem and non-goals

**Problem:** Playroom is live and missing from [the work gallery](https://noowxela.github.io/portfolio/work).

**Non-goals:**

- Changing the playroom app, its Vite `base`, or its Pages workflow
- Changing gallery layout, embed behavior, or the three featured cards on `/noelite`

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Where does it sit, and is it featured? | First in `demos`, `isNew: true`, not featured. The user asked to add it to the work gallery and did not ask to change `/noelite`. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Prepend one `Demo` object.

- name: Playroom
- slug: `playroom`
- `embedUrl`: `https://noowxela.github.io/playroom/`
- `repoUrl`: `https://github.com/noowxela/playroom`
- blurb: A late-80s hardware arcade. Power on to play Snake, Breakout, or Blocks.
- tags: `Three.js`, `React`, `TypeScript`
- note: The CRT, deck, pad, and carts are Blender models. Best scores stay in this browser.
- SVG fallback at `public/thumbs/playroom.svg`, then `SHOT_WAIT=8000 node scripts/shoot-thumbs.mjs playroom`

**Pros:**

- Matches the existing catalog shape and the newest-first order
- The site can embed; no `embeddable: false` fallback

**Cons / risks:**

- The first paint says “Loading hardware…” until the GLBs arrive. The screenshot wait has to cover that, or the cover is an empty desk.
- WebGL inside the gallery iframe can fail on a machine without GPU acceleration. The SVG thumb still covers the shelf.
- `isNew` will show on this card alongside the other recent items.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Append at the bottom | Newer work is listed first |
| Mark `featured: true` | That would add a card to the `/noelite` track |
| Deep-link into a game | The gallery should open the hardware still. Power On is the start of the piece. |

## 5. Acceptance criteria and verification

- [x] Playroom is the first item in `data/demos.ts`, with the live URL and GitHub repo above
- [x] `public/thumbs/playroom.svg` and `public/thumbs/playroom.webp` exist. The WebP shows the hardware, not a loading line.
- [x] `/work` shows the Playroom card. The iframe loads `https://noowxela.github.io/playroom/`. Live and GitHub links match. `/noelite` featured cards stay Phaser Examples, My Reborn Car, and Interactive Experiences.
- [x] `https://noowxela.github.io/portfolio/work` shows the same card after the portfolio Pages deploy.

Verified 2026-10-22 on `http://localhost:3001/portfolio/work?v=list`: Playroom is the selected card, the iframe `src` is `https://noowxela.github.io/playroom/`, and the details panel Live and GitHub links match. The shelf (`?v=shelf`) opens on album 1 of 16, Playroom, with the 1440×900 WebP. The screenshot shows the CRT and deck, not a loading line. `/noelite` selected work stays Phaser Examples, My Reborn Car, and Interactive Experiences. After the Pages deploy, `https://noowxela.github.io/portfolio/work/?v=list` shows the same card, iframe, and links.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-22 | approved | User asked to add Playroom to the work gallery |
| 2026-10-22 | implemented | Playroom is first in the local gallery and on the live work page |
