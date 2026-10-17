# SDD: Scroll-driven 3D journey home (preview)

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented` (preview at `/journey`; `/` unchanged)
- **Date:** 2026-10-17
- **Related:** [001-tron-home.md](./001-tron-home.md), [002-mosaic-float.md](./002-mosaic-float.md), [023-disc-versions.md](./023-disc-versions.md), [026-disc-tilt-70.md](./026-disc-tilt-70.md), [027-grid-discs-3d.md](./027-grid-discs-3d.md)

## 1. Context / current architecture

`/` is the Legacy-to-Ares scroll story (`components/home/`). Its first scene, **1. Hero — Legacy** (`HeroScene.tsx`), is a void ground, a perspective grid floor at 80° in the bottom 69%, the pixel mosaic name ("alex woon", its own three.js renderer, `mosaicScene.ts`), and a scroll meter with the Legacy disc at the bottom centre, all in Legacy cyan (`#5ce1ff` / `#b8f4ff`), Oxanium + Share Tech Mono. The home stays on its void ground in both themes. The 02 v3 disc lives in `components/discs/` (`Disc3D`, `discNeon`, `discTextures`; 30° resting tilt).

## 2. Problem and non-goals

**Problem:** Preview a home that is one continuous ride: start in the Legacy hero at a desk, push through the monitor into the Grid, ride a light-cycle road through a neon city, fly through a disc portal and land back at the desk (a closed loop), then go to Work.

**Non-goals:**

- Do not change `/`. The journey is a separate route until Alex picks it.
- No projects in the city. Projects stay on Work.
- No heavy models or post-processing passes.
- Do not change `Disc3D`, `discNeon`, `discTextures` or the 30° tilt.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Where does it live? | New preview route `/journey`; home unchanged. |
| How long? | About 30 s of scrolling (an 1100vh track). |
| Free roam? | No. Scroll maps to a fixed camera path. |
| What is in the city? | Atmosphere only: towers, road, light cycles, gates. |
| Which disc is the portal? | The hollow 02 v3 neon disc, reused from Alex's disc modules. |
| Where does it end? | The same view it opened on, with an "Enter the Work" CTA. |
| Mobile / a11y? | Lighter scene, DPR cap, Skip intro, 2D fallback for reduced motion or no WebGL, pause when hidden, one WebGL context. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

- `app/journey/page.tsx` loads the home fonts and `tron.css` and renders `Journey`. `Journey.tsx` puts a fixed stage over a 1100vh scroll track. A gsap `ScrollTrigger` (scrub 0.8) tweens a proxy `p` 0..1 over the track; every frame the scene reads `p`, and the HUD (act label, meter, Legacy disc, flash, CTA, Skip) is written straight to the DOM from the same `p`. `html` gets the home's `tron-home` class (void ground, `scroll-behavior: auto`) and `NavPill` uses its Tron bar on `/journey` too.
- `path.ts` holds the beats and the camera path: position and look-at keyframes at given `p`, joined by C1 Hermite splines (Catmull-Rom tangents over non-uniform times; zero tangents at the ends so `p = 0` and `p = 1` frame exactly). The ride section samples the road centre line so the camera follows its S bends.
- `journeyScene.ts` owns the one `WebGLRenderer` (antialias off and DPR ≤ 1.5 on small/coarse screens, DPR ≤ 2 otherwise), fog shared through uniforms, and a rAF loop that stops on `visibilitychange`. Parts:
  - `environment.ts`: an infinite grid floor shader (anti-aliased lines, glow, a pulse running out from the camera, haze toward the horizon) and a sky shader with the horizon band and the hero dome.
  - **Act 1** (`p` 0–0.26), `desk.ts` + `name.ts`: the hero framing (void, grid floor, mosaic name over the horizon) with a desk, monitor, keyboard and mug in the foreground. The mosaic name is rebuilt inside the journey scene (same 112-column stroke grid, additive cyan) so the page keeps one context. The monitor shows the hero grid; the camera pushes in, the screen burns white at the centre, a cyan-white flash covers the crossing (`p` ≈ 0.207), and beyond it the floor turns into the bright, pulsing Tron grid with thicker fog.
  - **Act 2** (`p` 0.26–0.76), `city.ts`: towers in one instanced draw (edges, window bands and halos in the shader; they grow out of the grid as the ride reaches them, and their fog thins with height so the far skyline reads), a road strip with neon edges, lane lines and racing light pulses, instanced light cycles with light-wall trails, and instanced gates over the road. Mostly cyan, a few Clu-orange towers and bikes.
  - **Act 3** (`p` 0.76–1), `portal.ts`: the city sinks back into the grid and the 02 v3 disc opens at the end of the road. It is assembled from `createNeon`/`neonLook` (`discNeon`) and `bodyTexture`/`palette` (`discTextures`), with the same ring proportions (hollow r44 of r96); it starts at the 30° resting tilt and turns square as it opens, rings counter-spinning, a rippling veil in the hollow. The camera flies through the hollow (second, softer flash). The desk set has moved to `END_Z` (−262): its edge wireframe starts as segments lying on floor grid lines (`aFrom`), gathers up into the desk, then the solid desk fades in and the wireframe drops back to the faint edge glow of the opening. The final pose equals the start pose + `END_Z`, so the last frame matches the first. "Enter the Work" (`withBasePath('/work/')`) appears at `p` ≥ 0.965.
- **Skip intro** (bottom right) jumps to `p = 1` and focuses the CTA. **Fallbacks:** `prefers-reduced-motion`, no `WebGLRenderingContext`, a failed renderer, or a lost context show `JourneyFallback` (the static Legacy hero: grid floor, glow, role, name, Work CTA). The same component is the poster under the canvas while three.js loads.

**Pros:**

- One context, a handful of draw calls, no textures beyond the disc body; holds 60 fps in headless Chrome on the Mac at 1440×900 and 390×844.
- Reuses the hero tokens, fonts, Legacy disc SVG and Alex's disc modules unchanged.
- The loop really closes: same camera pose and set at both ends.

**Cons / risks:**

- The hero mosaic is a static rebuild here: no hover bulge or drag spin.
- The scene stays on the void ground in light mode, like the home page; only the nav follows the theme.
- With WebGL blocked, three logs one "Error creating WebGL context" console error before the fallback (same as 027).
- Fast flick-scrolling leans on the 0.8 s scrub; on a touch fling the camera catches up a beat later.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Mount `HeroMosaic` and `Disc3D` as they are | Each owns a renderer; that is three contexts on one page. |
| Bloom via `EffectComposer` | Extra full-screen passes; glow is faked in the shaders instead. |
| Loaded city / desk models | Weight and load time; procedural boxes carry the look. |
| Free-roam camera | Approved plan is a fixed path. |

### Polish pass (2026-10-17)

- **Flashes:** both are short, asymmetric pulses (quick rise, slightly longer fade). Screen crossing peaks at 0.72 (was 0.95, σ 0.018 → 0.0045 before / 0.009 after); the portal pass peaks at 0.38 (was 0.55). The monitor's close-up burn is cyan and partial instead of white, so the frame at `p` 0.2 shows the glass, not a white-out (mean luminance 204 → 100, near-white pixels 10.4% → 0%).
- **Portrait framing:** on narrow screens the opening and closing poses dolly back along the view (`back = 1.12 / tan(hfov/2) − 2.88`, ≈1 unit at 390×844, 0 on landscape) and blend into the path by `p` 0.14 / from 0.9, so the whole desk fits and the two frames still match.
- **Light cycles:** they now ride in a window 14–110 units ahead of the camera, fading in and out at its ends and before the road ends, in lanes ±1.0 / ±1.3; none come near the camera path.
- **Gathering wireframe:** the desk edges are camera-facing ribbons (2.5 px, 6 px with a glow while gathering) instead of 1 px lines, white-hot on the floor and cooling to cyan as they land; gather starts at 0.855. At rest they drop back to the faint edge glow, the same at both ends.

## 5. Acceptance criteria and verification

- [x] `/journey` renders the three acts on scroll; `/`, `/work`, `/about`, `/discs` still load.
- [x] Exactly one WebGL context and one canvas on `/journey` (dark and light, 1440×900 and 390×844).
- [x] Frame interval while sweeping the whole track: median 16.7 ms, p95 16.8 ms (desktop and mobile viewport, headless Chrome, Metal).
- [x] Reduced motion, no `WebGLRenderingContext`, and a null WebGL context all show the 2D hero with the Work CTA and 0 contexts.
- [x] Skip intro lands on `p = 1` with the CTA focused; CTA href is `/work/` (`/portfolio/work/` in the Pages build).
- [x] Typecheck, lint and `GITHUB_PAGES=true` build pass; `/journey` is in the export.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-17 | implemented | Preview at `/journey`, built act by act. |
| 2026-10-17 | implemented | Polish: softer flashes, portrait framing, light cycles kept clear of the camera, readable gathering wireframe. |
