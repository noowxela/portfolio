# Home: the particle portrait stage

The page at `/` is one full-screen stage (100dvh, no page scroll). The old scroll story is at `/noelite` ([tron-home.md](./tron-home.md)). Design and decisions: [SDD 029](../sdd/029-portrait-home.md).

Code lives in `components/landing/`. `app/page.tsx` only loads the fonts (Oxanium, Share Tech Mono) plus `tron.css` and `landing.css`, and renders `Landing`.

```mermaid
flowchart LR
  page[app/page.tsx] --> landing[Landing.tsx]
  landing --> dom["DOM: name, corners 01-04, contact window, fallback"]
  landing -->|dynamic import| scene[portraitScene.ts]
  scene --> sampler[sampler.ts]
  scene --> poses[poses.ts]
  poses --> photos["public/portrait/*.webp"]
  landing -->|beginRouteExit| curtain["components/transition (RouteCurtain in app/layout.tsx)"]
```

## What is on the stage

| Layer (back to front) | What it is |
| --- | --- |
| Void + haze | `--void` ground, a faint cyan radial glow, a perspective grid floor that slowly runs toward the viewer (same 72 px grid as `/noelite` and `/journey`). |
| Portrait (`.landing-stage`) | The single WebGL canvas: Alex as short cyan line segments in two sheets, front and back, 15k each (5k each on phones), plus one photo plane per side for the reveal. Like a coin, both faces show the same portrait, and the back reads the right way round. The sheet facing away is almost invisible. Fades in over 0.7 s. |
| Scanlines + frame | `.tron-scan` and `.scene-frame` from `tron.css`. |
| Name | "alex woon" in Oxanium, neon cyan glow. Plain DOM, `pointer-events: none`. (The "FULL STACK DEVELOPER · MALAYSIA" line above it was removed on 2026-10-18.) |
| Corner entries | 01 Work (top left), 02 Journey (top right), 03 About (bottom left), 04 Contact (bottom right). Red number, mono file label (`gallery.grid`, `journey.run`, `profile.sys`, `contact.app`), title, and an `ENTER ▸` tag when selected. |
| Contact window | `contact.app`: Email, GitHub, LinkedIn, Resume (same links as the `/noelite` exit scene and the nav's "available" menu, from `data/site.ts`). ESC, ×, or a click outside closes it; focus moves in and back. |

## How to play with it

| Input | What happens |
| --- | --- |
| Move the mouse fast over the portrait | Particles within ~120 px are pushed aside; a fast sweep breaks them into ember-tinted dust that settles back. A resting cursor does nothing. |
| Move the mouse over the face | The cursor's trail shows the real photo through the particles for a moment, then it fades back. Works on whichever face is towards you (hidden while the portrait is turned). |
| Hover or keyboard-focus a corner | The particles morph (staggered) into that entry's pose: different photo, crop, turn, tilt, line length and tint. `ENTER ▸` appears under the title. |
| Drag the stage | Turns the portrait (yaw free, tilt clamped to ±0.45 rad). Side-on you see the two particle sheets close together with a thin dark seam; round the back you see the same portrait again. Throw it and it keeps spinning, puffs outward if fast, then settles square-on to whichever face is nearer. Tilt eases back over 0.9 s. On phones a swipe across the screen turns about 180°. |
| Mouse wheel on the stage | Spins it the same way. |
| Phone | Name on top, portrait in the middle, entries in a 2×2 grid at the bottom. First tap on an entry selects it (morph + `ENTER ▸`), second tap opens it. A tap on the portrait clears the selection; a drag turns it. No push or reveal on touch. |

## Leaving for a page (Work, Journey, About)

A click, keyboard Enter or the second tap on a phone does not navigate straight away. The home plays a short exit, then hands off to the page:

| Time | What happens |
| --- | --- |
| 0 ms | The name glitches (cyan / red split, sliced, then collapses to a bright line like a CRT switching off, 0.62 s). The other corners fade; the chosen one flashes and follows. Floor, haze and frame fade. |
| 0–720 ms | The particles burst slightly, then stream on curved paths into the clicked corner, brightening to hot cyan with a few embers, and thin out as they arrive (`scene.exit()`, staggered per particle). |
| 560–720 ms | A dark `#050507` curtain with a cyan scan line covers the page below the header (`top: var(--site-nav-h)`, 3.5 rem). The header stays visible and clickable throughout; when the route switches its look (Tron on `/` and `/journey`, plain on `/work` and `/about`) it crossfades in 0.26 s with the curtain lift instead of snapping (0.12 s with reduced motion). |
| 720 ms | `router.push(href)` (the route was prefetched on hover, focus or the first tap). |
| ~780 ms | The page is there under the curtain; the curtain lifts (0.26 s, the line sweeps up). |
| ~0.8–1.6 s | The page's blocks come in one after another: fade from bright, a 14 px rise and a top-down wipe, 0.52 s each, staggered (see below). |

Contact still opens its window. Cmd / Ctrl / Shift / middle clicks open the page in a new tab as usual.

The page entrance only plays when the page finds a fresh flag (`sessionStorage['route-enter']`, < 6 s old, for its own path) written by the home. Direct visits, reloads, back / forward and new tabs show the page as before. The curtain is also dropped if a navigation never lands (5 s). Code: `components/transition/` (`routeTransition.ts` has the flag, `beginRouteExit` and the per-page entrance list; `RouteCurtain.tsx` is mounted once in `app/layout.tsx`).

| Page | Entrance order |
| --- | --- |
| `/work` | View switcher row, then each block of the current view (album stage, caption / sidebar). Single albums are not faded on their own (their discs would show before the sleeves). |
| `/journey` | The grid floor, then the bar, then the current panel's lines (up to 12), then the branch rail ([journey-gridlog.md](./journey-gridlog.md)). |
| `/noelite2` | The stage (poster / canvas), then the HUD, meter and skip button (not linked from the home; kept for when the 3D journey is opened via a home hand-off). |
| `/about` | Hex field, then the intro line by line (name, role, bio, focus, toolkit rows), the hobbies marquee, the footer columns. |

Reduced motion: no exit animation; the home fades out in 0.12 s, the curtain drops at once, the route changes after 130 ms and the page just appears as the curtain fades. No WebGL: the static duotone portrait shrinks into the clicked corner and burns out (CSS), with the same name glitch and curtain.

## Poses

`poses.ts` maps each pose id (`hello` plus the four entry ids) to a photo, a crop and a few numbers. Today only Alex's two photos are used: `alex-square.webp` (default "hello", the tight "About" face crop) and `alex-half.webp` (Work, Journey, Contact). To add one, drop a cut-out WebP in `public/portrait/`, add it to `PHOTOS`, and add or change a pose; the sampler masks photos without alpha by their contrast against the wall colour at the crop border.

## Fallbacks

- `prefers-reduced-motion`: no sway, no inertia, no puffs, no push / reveal, pose changes jump to the end. The canvas renders only on change.
- No `WebGLRenderingContext`, a renderer that fails to start, a photo that fails to load, or a lost context: the canvas goes away and a static, cyan-duotoned photo with scanlines takes its place. The corner nav and contact window are the same.
