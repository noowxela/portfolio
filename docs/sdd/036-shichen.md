# SDD: Add Shichen to the gallery

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-22
- **Related:** [architecture.md](../architecture.md), [035-toolbox.md](./035-toolbox.md), [shichen Pages](../../../zzz_not_active/shichen/docs/sdd/002-github-pages.md)

## 1. Context / current architecture

The work gallery reads `data/demos.ts`. Newest items sit at the top of the `demos` array. Each item needs a `thumb` SVG in `public/thumbs/`; `shot` is the optional 1440×900 WebP from `scripts/shoot-thumbs.mjs`. `featured: true` is a separate curated set of three cards on the `/noelite` track: Phaser Examples, My Reborn Car, and Interactive Experiences.

Shichen’s own Pages deploy is a separate spec in the shichen repo. This spec starts only after `https://noowxela.github.io/shichen/` is live.

## 2. Problem and non-goals

**Problem:** The live clock is missing from [the work gallery](https://noowxela.github.io/portfolio/work).

**Non-goals:**

- Changing the shichen app, its Vite `base`, or its Pages workflow
- Changing gallery layout, embed behavior, or the three featured cards on `/noelite`

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| When does this start? | After the shichen Pages deploy is up. |
| Where does it sit, and is it featured? | First in `demos`, `isNew: true`, not featured. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Prepend one `Demo` object.

- name: Shichen
- slug: `shichen`
- `embedUrl`: `https://noowxela.github.io/shichen/`
- `repoUrl`: `https://github.com/noowxela/shichen`
- blurb: A 3D clock for the twelve Chinese double-hours, with notes beside the wheel.
- tags: `Three.js`, `React`, `TypeScript`
- note: The wheel follows local time. Drag or tap a wedge to open that 时辰. 子 straddles midnight.
- SVG fallback at `public/thumbs/shichen.svg`, then `SHOT_WAIT=8000 node scripts/shoot-thumbs.mjs shichen`

**Pros:**

- Matches the existing catalog shape and the newest-first order
- The iframe points at a site that already exists

**Cons / risks:**

- WebGL inside the gallery iframe can fail on a machine without GPU acceleration. The SVG thumb still covers the shelf.
- `isNew` will show on this card alongside the other recent items.
- A screenshot taken before the canvas draws is a blank frame.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Append at the bottom | Newer work is listed first |
| Mark `featured: true` | That would add a card to the `/noelite` track |
| Publish Pages from this spec | That deploy belongs in the shichen repo and happens first |

## 5. Acceptance criteria and verification

- [x] Shichen is the first item in `data/demos.ts`, with the live URL and GitHub repo above
- [x] `public/thumbs/shichen.svg` and `public/thumbs/shichen.webp` exist. The WebP shows the clock, not a blank frame.
- [x] `/work` shows the Shichen card. The iframe loads `https://noowxela.github.io/shichen/`. Live and GitHub links match. `/noelite` featured cards stay Phaser Examples, My Reborn Car, and Interactive Experiences.
- [ ] `https://noowxela.github.io/portfolio/work` shows the same card after the portfolio Pages deploy.

Verified 2026-10-22 on `http://localhost:3001/portfolio/work?v=list`: Shichen is the selected card, the iframe `src` is `https://noowxela.github.io/shichen/`, and the details panel Live and GitHub links match. The shelf (`?v=shelf`) opens on album 1 of 15, Shichen, with `public/thumbs/shichen.webp` (1440×900) loaded. The screenshot shows the clock at 未时, not a blank frame. `/noelite` selected work stays Phaser Examples, My Reborn Car, and Interactive Experiences. The live gallery check waits on the portfolio Pages deploy.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-22 | draft | Split from the Pages deploy. Starts after that URL is live. |
| 2026-10-22 | approved | Pages is live. Add the card at the top of the gallery. |
| 2026-10-22 | implemented | Shichen is first in the local gallery; live gallery follows the Pages deploy |
