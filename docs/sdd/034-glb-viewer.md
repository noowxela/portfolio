# SDD: Add GLB Viewer and Bukit Jalil to the gallery

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-20
- **Related:** [architecture.md](../architecture.md), [file-structure.md](../file-structure.md), [glb-viewer](https://github.com/noowxela/glb-viewer), [bukitjalil-pavilion-infographic](https://github.com/noowxela/bukitjalil-pavilion-infographic)

## 1. Context / current architecture

The work gallery reads `data/demos.ts`. Newest items sit at the top of the `demos` array. Each item needs a `thumb` SVG in `public/thumbs/`; `shot` is the optional 1440×900 WebP from `scripts/shoot-thumbs.mjs`. `featured: true` is a separate curated set of three cards on the `/noelite` track. Neither GitHub Pages site sends `X-Frame-Options` or `frame-ancestors`, so both live URLs can be iframed (`embeddable` stays unset).

The closest existing item is KL Eco City – Mid Valley: a Three.js scrollytelling infographic with tags `Three.js`, `TypeScript`, `Infographic`.

## 2. Problem and non-goals

**Problem:** Two shipped sites are missing from the gallery: [GLB Viewer](https://noowxela.github.io/glb-viewer/) and [Bukit Jalil Sports City](https://noowxela.github.io/bukitjalil-pavilion-infographic/#00).

**Non-goals:**

- Changing gallery layout, embed behavior, or the three featured cards on `/noelite`
- Editing either source repo

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Where do they sit, and are they featured? | Both at the top, `isNew: true`, not featured. Bukit Jalil first (later deploy), then GLB Viewer. The `/noelite` track stays Phaser Examples, My Reborn Car, and Interactive Experiences. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Prepend two `Demo` objects.

Bukit Jalil Sports City:

- slug `bukitjalil-pavilion-infographic`
- `embedUrl` `https://noowxela.github.io/bukitjalil-pavilion-infographic/#00` (chapter 00, the overview the user named)
- `repoUrl` `https://github.com/noowxela/bukitjalil-pavilion-infographic`
- blurb: a 3D scrollytelling infographic of Bukit Jalil Sports City — Pavilion, the National Sports Complex and Bukit Jalil City
- tags: `Three.js`, `TypeScript`, `Infographic`
- note: ten chapters from the overview orbit through landmarks, LRT Line 4, roads, massing, walking routes and weather, in English, Chinese and Malay. The map comes from OpenStreetMap.

GLB Viewer:

- slug `glb-viewer`
- `embedUrl` `https://noowxela.github.io/glb-viewer/`
- `repoUrl` `https://github.com/noowxela/glb-viewer`
- blurb: a local browser viewer for `.glb` / `.gltf` models (Three.js + React)
- tags: `Three.js`, `React`, `TypeScript`
- note: default model is a transformed Porsche 911 Carrera 4S (CC BY-SA 4.0); orbit and inspect in the browser

SVG fallbacks at `public/thumbs/<slug>.svg`, then `SHOT_WAIT=8000 node scripts/shoot-thumbs.mjs bukitjalil-pavilion-infographic glb-viewer` for the WebP shots. Bukit Jalil paints a loading screen before the first 3D frame, so the default 2.5s wait is too short.

**Pros:**

- Matches the existing catalog shape and the newest-first order
- Both sites can embed; no `embeddable: false` fallback
- `#00` opens the gallery on the overview chapter

**Cons / risks:**

- A short wait can capture Bukit Jalil’s loader or a blank GLB canvas. Re-shoot with a longer `SHOT_WAIT` if the first frame is empty.
- `isNew` will show on both cards alongside the other recent items.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Append at the bottom | Newer work is listed first |
| Mark `featured: true` | That would add cards to the `/noelite` track |
| Drop the `#00` hash | The user named that chapter URL as the live page |

## 5. Acceptance criteria and verification

- [x] Bukit Jalil Sports City is the first item in `data/demos.ts`, then GLB Viewer, each with its live URL and GitHub repo
- [x] `public/thumbs/bukitjalil-pavilion-infographic.svg`, `public/thumbs/bukitjalil-pavilion-infographic.webp`, `public/thumbs/glb-viewer.svg` and `public/thumbs/glb-viewer.webp` exist
- [x] `/work` shows both cards. Bukit Jalil’s iframe loads `#00`. GLB Viewer’s iframe loads the model viewer. Each repo link opens the matching GitHub repo.

Verified 2026-10-20 on `http://localhost:3001/portfolio/work?v=list`: Bukit Jalil iframe `https://noowxela.github.io/bukitjalil-pavilion-infographic/#00`, Live and GitHub links match. GLB Viewer iframe `https://noowxela.github.io/glb-viewer/`, Live and GitHub links match. Shelf covers for both are 1440×900 WebP and loaded. `/noelite` featured cards stay Phaser Examples, My Reborn Car, and Interactive Experiences. Thumbnail frames show the stadium overview and the Porsche, not a loader or a blank canvas.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-20 | draft | GLB Viewer only |
| 2026-10-20 | draft | Also Bukit Jalil Sports City, listed first |
| 2026-10-20 | approved | |
| 2026-10-20 | implemented | Both demos in the gallery; screenshots captured |
