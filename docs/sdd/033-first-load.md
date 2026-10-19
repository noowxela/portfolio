# SDD: First-visit loading screen

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-18
- **Related:** [architecture.md](../architecture.md), [029-portrait-home.md](./029-portrait-home.md), [031-vite-migration.md](./031-vite-migration.md)

## 1. Context / current architecture

Home (`/`) is a lazy route in `src/routes.tsx`. `src/pages/Home.tsx` pulls in `landing.css` and `tron.css` only after that chunk arrives. `index.html` paints an empty `#root` on a white or dark body. Once React mounts, `Landing` draws the centred name immediately (`components/landing/Landing.tsx`, `site.name` lowercased). The WebGL canvas stays at `opacity: 0` until `portraitScene` calls `onReady` and sets `data-ready` (`landing.css`). Oxanium is loaded from JS (`src/fonts.css`, `font-display: swap`), so the name can paint in the system font before the display face and the portrait are in.

There is no boot screen. [011-crt-open.md](./011-crt-open.md) was a discarded CRT intro for the old scroll home.

## 2. Problem and non-goals

**Problem:** The first time someone opens the site, the only thing on screen is the name as plain text, while the font, the route CSS, and the particle portrait are still loading.

**Non-goals:**

- Showing the name on the loading screen
- Playing the screen again on later visits, refreshes, or returns from other pages
- A progress percentage, a spinner library, or a CRT power-on
- Changing the home once it is revealed (name, corners, portrait, exit transition)
- Preloading Work, Journey, About, or the other routes during the wait

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| When should the loading screen show? | First visit only, and long enough that the assets for that load have finished, so content does not appear half-loaded. |
| What should it look like? | The Tron void (option A), without the name. It only says that it is loading. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

Remember a finished boot in `localStorage` under `portfolio-booted`. A tiny script at the top of `body` in `index.html` runs before first paint. If the key is missing, it adds `booting` on `html` and the document shows a static screen: the same void (`#050507`), a hairline cyan rule, and the word `loading` in a system monospace face. Inline CSS only, so it does not wait on the Vite bundle. `#root` stays hidden while `booting` is set, which is what stops the plain name from flashing.

After React mounts, the same screen stays up until this visit's assets are ready:

- `document.fonts.load` for Oxanium 600, the face on the home name (a short timeout counts as ready if the font never settles)
- On `/`, `Landing`'s existing `onReady`, or the fallback portrait image's `load` / `error` when WebGL is unavailable
- On any other first URL, the lazy route module for that URL having rendered

Then the screen fades out (about 0.4s), `booting` comes off, and the key is set to `1`. `prefers-reduced-motion` skips the fade and reveals immediately once ready. If nothing reports ready within 8 seconds, the screen still clears and the key is set, so a failed portrait cannot trap the page.

**Pros:** The plain name never paints on a cold first visit. Later visits are unchanged. The screen matches the home void and does not add a dependency.

**Cons / risks:** Clearing site data plays it again. The inline screen duplicates the void colour. A deep link on the first visit waits only for that route plus the font, not for the home portrait. The 8s cap can reveal a page whose portrait is still late.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Hide the name in React only | The unstyled name can paint before `landing.css` and the font arrive. |
| Put the name on the loading screen | Alex asked for loading only, no name. |
| Replay on every visit | Alex asked for the first visit only. |
| Revive the CRT open from SDD 011 | That was a picture-opening animation, not a hold until assets finish. |
| Wait for every route and image | The first screen only needs the font and the page that was opened. |

## 5. Acceptance criteria and verification

- [x] With `portfolio-booted` absent, the first paint is the void and the word `loading`. The name `alex woon` is not visible.
- [x] The screen stays until Oxanium is ready and, on `/`, the portrait canvas is visible or the fallback photo has settled. Then it fades and the home is interactive.
- [x] After that, a reload and a visit to `/work` do not show the screen.
- [x] `prefers-reduced-motion: reduce` reveals without the fade once ready.
- [x] If the portrait never becomes ready, the screen is gone within 8 seconds and the site is usable.
- [x] Verify in the browser: clear `localStorage['portfolio-booted']`, load `/portfolio/`, confirm the loader then the portrait, reload and confirm it is gone.

Evidence, 2026-10-19, against `http://127.0.0.1:3100/portfolio/`:

- With the bundle blocked, the only visible text is `loading` on the void, and `#root` is `visibility: hidden`.
- A fresh browser then reaches `data-ready="true"`, sets `portfolio-booted` to `1`, and shows the portrait. Reload and `/work/` do not add `booting`.
- With `prefers-reduced-motion: reduce`, the screen is up at parse and `boot-out` is never added.
- With `portraitScene` blocked, the screen clears and the key is set at about 8.4s, and the name is usable.
- `verify.mjs drive home` passed. The Work corner still opens the gallery.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-18 | draft | First visit, Tron loading screen, no name, held until that load's assets are ready |
| 2026-10-19 | approved | Alex: do it |
| 2026-10-19 | implemented | Boot screen on first visit. Also fixed the shell builder, which was leaving a second `Alex Woon` in the body |
