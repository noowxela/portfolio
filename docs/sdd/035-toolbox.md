# SDD: Add Toolbox to the gallery

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-22
- **Related:** [architecture.md](../architecture.md), [034-glb-viewer.md](./034-glb-viewer.md), [toolbox](https://github.com/noowxela/toolbox)

## 1. Context / current architecture

The work gallery reads `data/demos.ts`. Newest items sit at the top of the `demos` array. Each item needs a `thumb` SVG in `public/thumbs/`; `shot` is the optional 1440×900 WebP from `scripts/shoot-thumbs.mjs`. `featured: true` is a separate curated set of three cards on the `/noelite` track: Phaser Examples, My Reborn Car, and Interactive Experiences.

[Toolbox](https://noowxela.github.io/toolbox/) is a static GitHub Pages site of small utilities. PDF to Markdown calls a Python API. QR codes, image compress and convert, JSON formatting, timestamps, and text diff run in the browser. Routes are hashes (`#/`). The live response has no `X-Frame-Options` or `Content-Security-Policy` `frame-ancestors`, so the page can be iframed (`embeddable` stays unset).

## 2. Problem and non-goals

**Problem:** Toolbox is shipped and missing from the gallery.

**Non-goals:**

- Changing gallery layout, embed behavior, or the three featured cards on `/noelite`
- Editing the toolbox repo, its API, or its GitHub Pages workflow

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Where does it sit, and is it featured? | Same rule as [034](./034-glb-viewer.md): first in `demos`, `isNew: true`, not featured. The user named the live site and the repo and did not ask to change `/noelite`. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Prepend one `Demo` object.

- name: Toolbox
- slug: `toolbox`
- `embedUrl` / live: `https://noowxela.github.io/toolbox/`
- `repoUrl`: `https://github.com/noowxela/toolbox`
- blurb: Small tools on one static site. PDF to Markdown uses an API; the rest stay in the browser.
- tags: `React`, `TypeScript`, `Python`
- note: QR codes, image compress and convert, JSON formatting, timestamps, and text diff run locally. PDF to Markdown sends the file to a Python API for that request. The tool list is `#/`.
- SVG fallback at `public/thumbs/toolbox.svg`, then `node scripts/shoot-thumbs.mjs toolbox` for the WebP. The home view is a tool list, so the default wait is enough.

**Pros:**

- Matches the existing catalog shape and the newest-first order
- The site can embed; no `embeddable: false` fallback
- Hash routing keeps the iframe on the tool list at `/toolbox/`

**Cons / risks:**

- PDF to Markdown depends on a free Render service that sleeps. The gallery iframe opens the tool list, which does not call the API. Opening that one tool can be slow on the first request.
- `isNew` will show on this card alongside the other recent items.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Append at the bottom | Newer work is listed first |
| Mark `featured: true` | That would add a card to the `/noelite` track |
| Deep-link `#/pdf-to-md` | The gallery should open the tool list. That tool needs the API; the others do not. |

## 5. Acceptance criteria and verification

- [x] Toolbox is the first item in `data/demos.ts`, with the live URL and GitHub repo above
- [x] `public/thumbs/toolbox.svg` and `public/thumbs/toolbox.webp` exist
- [x] `/work` shows the Toolbox card. The iframe loads `https://noowxela.github.io/toolbox/`. Live and GitHub links match. `/noelite` featured cards stay Phaser Examples, My Reborn Car, and Interactive Experiences.

Verified 2026-10-22 on `http://localhost:3001/portfolio/work?v=list`: Toolbox is the selected card, the iframe `src` is `https://noowxela.github.io/toolbox/`, and the details panel Live and GitHub links match. The shelf (`?v=shelf`) opens on album 1 of 14, Toolbox, with the 1440×900 WebP cover loaded; the overlay links are the same live site and repo. The screenshot is the tool list (PDF, QR, Images, JSON, Time, Diff), not a blank frame. `/noelite` featured names stay Phaser Examples, My Reborn Car, and Interactive Experiences.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-22 | draft | Waiting for approval |
| 2026-10-22 | approved | Add Toolbox at the top of the gallery |
| 2026-10-22 | implemented | Toolbox is first in the gallery; screenshot captured |
