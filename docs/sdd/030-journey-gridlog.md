# SDD: Work-experience journey ("grid.log")

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `in progress`
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
- `components/journey/GridLog.tsx`: full-height stage under the navbar. Top: a breadcrumb bar (`~/grid / journey.log · 5 commits · 2 branches`, hint, resume link) and a terminal line (`alex@grid:~$ git checkout <hash> --detach && git show <hash>`). Middle: a horizontal row of panels; the current one is centred and lit, the others dim. Bottom: the branch rail. The current index is React state (classes, `aria-current`); the row offset is written straight to the DOM.
- `components/journey/track.ts`: the row controller. Wheel (either axis) moves the row freely and snaps to the nearest panel 140 ms after the last event (ease-out cubic, 0.45 s). Pointer drag (mouse and touch, dominant axis) with release velocity projects a target and snaps. Arrow keys / Home / End step; clicking a node or a dim panel jumps; focus inside a panel brings it to the centre. `#<hash>` deep links in, and the hash follows the current step (`replaceState`). Reduced motion: no tweens.
- `components/journey/Rail.tsx`: SVG drawn in pixels from a ResizeObserver: the `edu` lane, the merge, `main`, a dashed segment to HEAD. A lit trail and a light-cycle head follow the row's fractional position, so dragging moves the cycle continuously.
- `components/journey/markField.ts`: one three.js renderer (orthographic, pixel space), instanced quads drawn as short cyan dashes. Each step's `mark` is rasterised with the page font into a cell grid; particles morph from where they are to the next mark with a per-particle stagger, jitter slightly, scatter with wheel / drag speed, and are pushed away from the cursor (speed-driven, so a resting cursor leaves no hole). DPR ≤ 2, stops drawing when settled or hidden, `forceContextLoss()` on unmount, context loss falls back.
- Fallbacks: reduced motion or no WebGL show the mark as static outlined neon text; the row still works.
- Entrance: `ENTRANCES['/journey']` stages the floor, bar + terminal, the current panel's lines, then the rail, only when arriving from home.

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

To be filled in when the page is verified.
