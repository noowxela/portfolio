# SDD: Work-experience journey ("grid.log")

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-18
- **Related:** [028-journey-home.md](./028-journey-home.md) (the 3D ride, now `/noelite2`), [029-portrait-home.md](./029-portrait-home.md) (home, particles, page transition), page walkthrough [journey-gridlog.md](../pages/journey-gridlog.md)

## 1. Context / current architecture

`/journey` is the home's 02 corner. Until now it was the scroll-driven 3D ride (SDD 028); that moved to `/noelite2` and `/journey` became a "coming soon" stub. The home (`components/landing/`) has a two-sheet particle portrait in one WebGL context, mouse-driven push, and a page transition (name glitch, particles into the corner, curtain below the navbar, staged entrance on the destination only when arriving from home, `components/transition/`). Alex's work history exists only on his resume PDF (`site.resume`).

## 2. Problem and non-goals

**Problem:** Present Alex's work experience as a journey, following the structure and interaction of the reference CV page (eddy-naboulet.dev/cv: a horizontal "git log" of career steps, one centred at a time, a branch graph underneath, a terminal line on top, a particle date behind the panel), in Alex's Tron neon look.

**Non-goals:**

- No retro OS / CRT look and none of the reference's code, fonts or assets. Reimplemented from scratch.
- No invented experience: resume content only, lightly condensed. No location or employment type (not on the resume). Tags only name technologies the resume names.
- No change to `components/discs/*` or the 30° disc tilt. `/noelite2` unchanged.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Which option? | Option A, "grid.log" (DOM panels + one small WebGL particle layer). Option B (3D road with gates) rejected: heavier, harder to read, overlaps `/noelite2`. |
| Content? | Resume as-is: Auronex (Software Engineer), Oasis Interactive (Frontend Developer), Trinergy Digital (Full-Stack Developer), titles per job. |
| Education? | Yes: Multimedia University on an `edu` branch that merges into `main` at the first job. |
| Last panel? | A HEAD "next commit" panel with the resume summary and contact links; no current job is claimed. |
| Side branch for web3? | No. It would split the Auronex entry in two; the web3 work stays a bullet. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

- `data/experience.ts`: typed steps (`branch`, `from` / `to`, particle `mark`, title, role, optional place / link, commit message, facts, tags, optional resume stats) plus `HEAD`. Commit hashes are a 6-hex FNV hash of the id; the duration stat is computed from the dates.
- `components/journey/GridLog.tsx`: full-height stage under the navbar. Top: a breadcrumb bar (`~/grid / journey.log · 5 commits · 2 branches`, hint, sound toggle, resume link). (A terminal line under it, `alex@grid:~$ git checkout <hash> …` with a scrambling hash, was removed on Alex's review, see section 6.) Middle: a horizontal row of panels; the current one is centred and lit, the others dim. Bottom: the branch rail. The current index is React state (classes, `aria-current`); the row offset is written straight to the DOM.
- `components/journey/track.ts`: the row controller. Wheel (either axis) moves the row freely and snaps to the nearest panel 140 ms after the last event (ease-out cubic, 0.45 s). Pointer drag (mouse and touch, dominant axis) with release velocity projects a target and snaps, at most one panel per gesture (a deliberate drag past 16 % of the spacing counts). Arrow keys / Home / End step; clicking a node or a dim panel jumps; focus inside a panel brings it to the centre. `#<hash>` deep links in, and the hash follows the current step (`replaceState`). Reduced motion: no tweens.
- `components/journey/Rail.tsx`: SVG drawn in pixels from a ResizeObserver: the `edu` lane, the merge, `main`, step nodes labelled `MMU` / `Auronex` / `Oasis` / `Trinergy`, then three dots trailing off that stand for HEAD (and are its button). A lit trail and a light-cycle head follow the row's fractional position, so dragging moves the cycle continuously.
- `components/journey/markField.ts`: one three.js renderer (orthographic, pixel space), instanced quads drawn as short cyan dashes. Each step's `mark` is rasterised with the page font into a cell grid; particles morph from where they are to the next mark with a per-particle stagger, jitter slightly, scatter with wheel / drag speed, and are pushed away from the cursor (speed-driven, so a resting cursor leaves no hole). DPR ≤ 2, stops drawing when settled or hidden, `forceContextLoss()` on unmount, context loss falls back.
- Fallbacks: reduced motion or no WebGL show the mark as static outlined neon text; the row still works.
- Entrance: `ENTRANCES['/journey']` stages the floor, the bar, the current panel's lines, then the rail, only when arriving from home.
- `components/journey/blip.ts`: a Web Audio blip when the row settles on a new step (see section 6).

**Pros:** readable, light on phones, close to the reference's interaction, reuses the home's particle language and the existing transition.

**Cons:** less spectacle than the 3D ride; five steps is a short log.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Option B: 3D road with job gates | ~2.5 h more, mobile cost, text over moving 3D, duplicates `/noelite2`. |
| gsap for the row tweens | A 30-line rAF tween is enough and keeps the page off the gsap chunk. |
| `gl.POINTS` for the dashes | Same reason as SDD 029: point size limits vary by GPU; instanced quads are already the house style. |
| Native horizontal scroll + scroll-snap | Wheel-to-horizontal mapping, velocity for the particles and the rail sync need a controller anyway. |

## 5. Acceptance criteria and verification

Run on the Mac in headless Chrome for Testing with Metal (`--use-angle=metal`) against the `GITHUB_PAGES=true` export served under `/portfolio`, 1440×900 (DPR 2) and 390×844 (DPR 3, touch). Shots and videos on the box under `/workspace/portfolio/shots/journey-cv/`.

- [x] `npx tsc --noEmit`, `npx eslint .` clean; `GITHUB_PAGES=true next build` exports `/journey`.
- [x] Content is the resume's: three jobs with their resume titles and dates, MMU on `edu`, HEAD claims no current job. No location or employment type; tags only name technologies in the bullets.
- [x] Desktop: wheel → Auronex (`#ef5e76`); mouse drag → Oasis; ArrowRight → Trinergy; Home / End; rail node → Oasis; dim panel click → Trinergy; `#7d3d11` deep link → Oasis; changing the hash → HEAD.
- [x] Mobile: each horizontal swipe moves exactly one panel (0 → 1 → 2 → 3, back to 2); a vertical swipe scrolls the Trinergy body (0 → 116 px) without changing step; node tap → HEAD.
- [x] Particles: one canvas, morph on every step, scatter with wheel / drag, pushed by a moving cursor.
- [x] Reduced motion: no canvas, static mark, ArrowRight lands within 40 ms. WebGL API removed and `--disable-webgl`: static mode, works, no console output.
- [x] Leaving to `/work`: 0 canvases, the page's `html` classes removed.
- [x] Home → Journey (desktop and mobile): curtain top = header bottom (56 px), 8 elements staged, flags cleaned up afterwards, field ready after. Direct visit: no entrance.
- [x] No console errors. The only messages are Chrome's "preloaded but not used" warnings for CSS chunks that `next/link` prefetches (same as SDD 029).
- [x] `verify-portfolio` `drive journey` passes (heading, row, rail node → `#ef5e76`).

Frame timing (rAF gaps, ms, median / p95): desktop idle 16.7 / 16.8; wheel 16.7 / 16.8; morph 16.7 / 16.8; mobile swipe 16.7 / 16.8. Home → Journey, three runs without screenshots: exit 16.7 / 16.8, hand-off max 33.4 / 16.7 / 16.7, entrance 16.7 / 16.7 (max 16.8). Building the field on mount used to cost one 80–150 ms frame during the entrance; it now waits for the entrance to end and an idle callback.

Found while verifying: a scrollable panel body resets `touch-action`, so on phones the browser cancelled horizontal swipes that started on the text (fixed with `touch-action: pan-y` on `.gl-body`).

## 6. Review changes (2026-10-18)

Alex's review of the first build:

| Feedback | Change |
| --- | --- |
| No link to `/noelite2` for now. | Left as is. |
| The background year should not be centred; put it low under the old command line, same size, neon only, no red. | The particle mark is top-anchored: the top of its ink sits 12 px under the bar (10 px on phones), so the years rise above the current panel instead of sitting behind its middle. Size unchanged. The 7 % orange "ember" dashes are gone; every mark is cyan `#5ce1ff` (pushed dashes still flash cyan-white `#e7fbff`). The static fallback text uses the same top line and was already cyan. The current panel's background went from 38 % to 58 % so the lower part of the years reads as background behind the text. |
| Remove the command bar. | `.gl-cmd` (prompt, hash scramble, its CSS and its entrance step) removed; the stage now starts right under the bar. The `alex@grid:~$` prompt inside the HEAD panel stays. |
| Rail labels `MMU`, `Auronex`, `Oasis`, `Trinergy`; three dots after the last node. | Labels sit under each node (new `short` field). The `edu` / `main` / `HEAD` lane labels and the dashed segment to the HEAD ring are gone; three cyan dots trail off after Trinergy instead (fading 85 / 60 / 35 %, pulsing when HEAD is current). They are one button (`Next commit — available`) that opens the HEAD panel, by click or Tab + Enter. The step nodes fill the rail minus a tail of 14 % (44–120 px) for the dots. |
| A sound when the cycle reaches a new node. | `blip.ts`: Web Audio, no files. Triangle "zap" gliding a fifth down into the note plus an octave sine chime, 6 ms attack, 190 ms decay, volume 0.18, 3.2 kHz low-pass; C5 / D5 / E5 / G5 per step, G5→C6 for HEAD. Plays on settle only (plus a 120 ms minimum gap), never on load or deep-link arrival. The `AudioContext` is created on the first click / tap / key while the page has user activation (a wheel is not one), and closed on unmount. Speaker toggle in the top bar, default on, saved in `localStorage['gridlog-sound']`. |

Not changed, though orange: the `edu` branch colour (the dashed `edu` lane and the `edu` chip in the MMU panel). It marks the branch, not the year; easy to switch to cyan if wanted.

Verification of these changes (same harness; shots, rail close-ups and a desktop video under `/workspace/portfolio/shots/journey-cv2/`): tsc, eslint and the `GITHUB_PAGES=true` build clean; desktop and mobile row tests, reduced motion, no WebGL, and Home → Journey all pass as in section 5; no console errors or warnings apart from the known prefetch preloads. Rail labels do not overlap at 390 px. Sound: no `AudioContext` before a gesture (wheel alone stays silent), none on load or on a fresh deep link; node click / tap and keys play the expected pitch; fast keys across two steps give one blip; toggle off silences it and survives a reload; leaving the page closes the context. Frame timing unchanged (Home → Journey, three runs: every phase median 16.7, max 16.8 ms).
