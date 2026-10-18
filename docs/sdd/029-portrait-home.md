# SDD: Full-screen home with a particle portrait

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-18
- **Related:** [001-tron-home.md](./001-tron-home.md) (the scroll story, now `/noelite`), [028-journey-home.md](./028-journey-home.md), page walkthrough [portrait-home.md](../pages/portrait-home.md)

## 1. Context / current architecture

Until now `/` was the Legacy-to-Ares scroll story (`components/home/`, `TronHome`, ScrollSmoother, the mosaic name in its own three.js renderer). `tron.css`, `DiscV2` and `html.tron-home` from `components/home/` are also used by `/about` and `/journey`. `NavPill` dresses `/` and `/journey` in a dark Tron bar.

## 2. Problem and non-goals

**Problem:** A home that reads in one screen: the name in the middle, four ways in pinned to the corners, and a 3D particle portrait of Alex behind the name that reacts to the cursor, morphs per entry and can be turned by hand. Structure and feel follow the reference (eddy-naboulet.dev); the look stays Alex's Tron neon.

**Non-goals:**

- Keep the old home, unchanged, at `/noelite`. Do not delete `components/home/`.
- No retro OS / CRT look, and none of the reference's code, fonts or assets.
- Do not touch `components/discs/*` or the 30° disc tilt.
- No easter-egg photos yet (two are staged outside the repo, unconfirmed).

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Where does the old home go? | `/noelite`, same component, Tron nav bar kept, not in the header links. Logo still links to `/`. |
| Style? | Tron neon: Oxanium + Share Tech Mono, `--tron` cyan, `--ember` red accents, void ground, grid floor. |
| Name? | DOM text with a neon glow (one WebGL context on the page). |
| Entries? | 01 Work → `/work`, 02 Journey → `/journey`, 03 About → `/about`, 04 Contact → a small Tron contact window (Email, GitHub, LinkedIn, Resume from `data/site.ts`). |
| Photos? | `alex-square` (default "hello") and `alex-half`, cut out, resized, EXIF stripped, in `public/portrait/`. Poses are a config map so more photos can be added. |
| Mobile? | Name top, portrait middle, 2×2 entries at the bottom; tap selects, second tap opens; no push / reveal on touch. |

## 4. Approach, pros / cons, rejected alternatives

**Approach:**

- `app/page.tsx` loads the fonts and `landing.css`, renders `Landing` (client). `Landing` owns the DOM (stage, name, corners, contact window, static fallback), the selection state (hover / keyboard focus / tap), and lazy-loads `portraitScene.ts`. `html` gets `tron-home landing-page` while mounted (void ground, no page scroll).
- **Photos:** cut out offline (background removed into the alpha channel), 720×720 and 600×800 WebP, ~30 KB each, no EXIF. `sampler.ts` also masks by contrast against the wall colour read from the crop border, for any future photo without alpha.
- **Sampling** (`sampler.ts`): draw the pose crop at 300 px tall, local-contrast tone map (each pixel against an alpha-weighted 10 px neighbourhood mean / std, blended 55/45 with a global stretch) so glasses, eyes and mouth survive; weight = alpha × (0.08 + 0.92·tone^1.25), thinned over the bottom 16%; stratified sampling along the scanline CDF (even coverage). Depth = pose depth × (0.62·row bulge + 0.38·(tone − 0.5)). Seeded, so a pose always samples the same.
- **Particles** (`portraitScene.ts`): one `InstancedBufferGeometry` quad, 22k instances (9k on phones), additive. Each instance has `aFrom/aTo` positions and colours plus 4 randoms. The vertex shader projects the particle, works in screen pixels for the push and the dust, and draws a short line segment (≈4 px × 1.2 px, length per pose) that streaks along its displacement. Colour: tone mapped from `--tron` dark to near-white, 12% photo hue, ember mix for the accent pose and for dust. DPR ≤ 2, antialias off.
- **Cursor push (speed, not position):** mouse speed (px/s) is smoothed per frame; strength = 0.8·(1 − e^(−speed/700)), approached at 18/s when rising and 5/s when falling. Particles within 120 px move away from the cursor by smoothstep falloff × strength × a per-particle 8–22 px × 2.2. A still cursor has zero speed, so nothing moves.
- **Trail texture:** a quarter-resolution half-float ping-pong target. Each moving frame stamps a capsule from the last to the current mouse position: `xy` = stroke direction, `z` = dust (smoothstep 500–2400 px/s, so only fast sweeps), `w` = reveal (smoothstep 30–900 px/s). Dust decays at e^(−1.8 t), reveal at e^(−1.5 t); below 0.02 the pass stops and the target is cleared. Dust throws particles 10–52 px in a random direction plus along the stroke and tints them ember, then they settle back as it decays.
- **Photo reveal:** a plane with the current pose's photo and crop sits in the portrait group. Its fragment reads the trail's `w` at `gl_FragCoord`, shows the photo there with a thin cyan rim, soft crop edges, and dims the particles over it by up to 75%. It is gated off while a morph is in flight and while the portrait is turned (yaw / tilt / puff), where a flat photo would not line up.
- **Pose morph:** `poses.ts` maps `hello | work | journey | about | contact` to photo, crop, height, offset, tilt, spin, line width, depth, accent. On a change the current in-flight positions are frozen into `aFrom` on the CPU (same easing / stagger as the shader), the target goes into `aTo`, and gsap tweens `uMorph` 0→1 over 1.25 s (linear; each particle starts up to 40% late and eases power2.inOut in the shader, with a small z lift mid-flight). Tilt, spin, scale, offset, line width and accent tween with gsap `power2.inOut` over 1.1 s. Leaving an entry waits 160 ms before going back to "hello". All poses are sampled in idle time after the first, so hovers start at once.
- **Rotation:** pointer drag on the stage turns yaw (0.0065 rad/px) and tilt (±0.45 rad); release keeps the throw (decay e^(−2.4 t)), a pause before release kills it, tilt eases back with gsap over 0.9 s. Once the spin slows below 0.35 rad/s the yaw eases back to the nearest full turn, so the portrait ends facing front. Wheel on the stage adds spin. Spin above 2.5 rad/s puffs particles outward (full at 9 rad/s). Idle sway: ±0.07 rad yaw, ±0.025 rad tilt sine.
- **Render on demand:** the loop runs while anything moves (fade-in, push, trail, morph, drag / inertia / settle, puff). With only the idle sway left it draws every other frame (~30 fps); with reduced motion it stops. It pauses on `visibilitychange`.
- **Touch / reduced motion / fallback:** push and reveal only with `(hover: hover) and (pointer: fine)` and no reduced motion. Touch drag rotates; first tap on an entry selects, second opens; a tap (not a drag) on the stage clears. Keyboard focus selects (`:focus-visible` only, so a tap's focus does not count as the first tap). Reduced motion: no sway / inertia / puff, tweens jump to the end. No WebGL, a failed renderer, a failed photo load, or `webglcontextlost` → the canvas goes and a cyan-duotoned photo with scanlines shows instead (CSS only); the corner nav is unchanged.

**Pros:** one WebGL context and two draw calls a frame (plus the trail pass while it is live); photos are ~64 KB total; old home preserved byte-for-byte at `/noelite`; poses are data.

**Cons / risks:**

- The portrait is a 2.5D extrusion of a flat photo: at large turns (Work / Journey poses, drags) the face flattens; the reveal is hidden while turned for that reason.
- The cut-out is a segmentation mask, so hair edges are soft and slightly blobby.
- Like `/noelite` and `/journey`, the page stays on the night scene in light mode; only the nav follows the theme.
- Idle sway keeps a ~30 fps loop running while the tab is visible (by choice: the sway is part of the feel). Reduced motion removes it.
- The ENTER tag is decorative (`aria-hidden`); the links themselves carry the names.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Render the name in the WebGL scene | DOM text is sharper, selectable for a11y tools, and costs nothing; the scene keeps one context anyway. |
| Points (`gl.POINTS`) instead of instanced quads | No oriented streaks; point size limits vary by GPU. |
| A full fluid sim for the reveal | A decaying stroke texture gives the same "trail shows the photo" read at a fraction of the cost. |
| Position-driven push | A resting cursor would leave a permanent hole; speed-driven matches the reference and feels alive. |
| Runtime background removal only | The wall is close to the cream shirt in colour; an offline cut-out is far cleaner. The contrast mask stays as a fallback for new photos. |

## 5. Acceptance criteria and verification

Run on the Mac in headless Chrome for Testing with Metal (`--use-angle=metal`), dev server, dark and light, 1440×900 (DPR 2) and 390×844 (DPR 3, touch). Shots, report and video on the box under `/workspace/portfolio/shots/home2/`.

- [x] `npx tsc --noEmit`, `npx eslint .` clean; `GITHUB_PAGES=true next build` exports `/`, `/noelite`, `/work`, `/about`, `/journey`, `/discs`.
- [x] `/noelite` matches the old home captured before the move (1440×900, dark and light, top + two scroll positions): only the header clock differs (4 other pixels off by 1/255).
- [x] Exactly one WebGL context and one canvas on `/` in every run; zero with WebGL removed (fallback).
- [x] No console errors or warnings in any run.
- [x] Fast sweep pushes and breaks into dust that settles; a resting cursor renders only the idle sway; slow movement reveals the photo, which fades back within ~2 s.
- [x] Each corner hover / keyboard focus morphs to its pose and shows `ENTER ▸`; leaving returns to "hello".
- [x] Drag throws with inertia and settles facing front; wheel spins.
- [x] Contact window opens with focus on Email, ESC closes and returns focus; links match `data/site.ts`.
- [x] Mobile: first tap selects (URL unchanged), second tap opens (`/about/`); contact opens on the second tap; stage tap clears; touch drag rotates.
- [x] Reduced motion: 0 draw calls at rest, hover jumps straight to the pose. Context loss and no-WebGL show the static fallback.

Frame timing (rAF gaps, ms): desktop idle median 16.7 / p95 16.7; during the fast sweep median 16.6 / p95 16.7 (one 267 ms gap is the screenshot taken mid-sweep); mobile idle 16.7 / 16.7. Draw calls: ~69/s idle on desktop (two draws at ~30 fps + trail clear), ~60/s with a resting cursor, ~167/s during a sweep, 30/s idle on mobile, 0 with reduced motion.
