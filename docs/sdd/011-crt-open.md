# SDD: CRT open on first home load

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `discarded`
- **Date:** 2026-10-10
- **Related:** [architecture.md](../architecture.md), [tron-home.md](../pages/tron-home.md)

## 1. Context / current architecture

`/` is the Legacy-to-Ares scroll story (`TronHome` in `components/home/TronHome.tsx`). The fixed header (`NavPill`, `z-50`) lives in `app/layout.tsx`, outside the home page, so it is on screen as soon as the document paints. Home already has a static scan overlay (`.tron-scan`). There is no intro. The page is a static export, so there is no server request to remember a visitor. `NEXT_PUBLIC_BASE_PATH` is empty locally and `/portfolio` on GitHub Pages. Home is served with a trailing slash.

## 2. Problem and non-goals

**Problem:** The first time someone opens the home page, it should turn on like a CRT. The picture starts as a line and opens to the full screen.

**Non-goals:**

- Playing it again on later visits, refreshes, or returns from About and Work
- Running it on About or Work
- Changing the scroll story, the mosaic, or the existing scan overlay
- A powered-off TV frame, bezel, or power-off animation

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| When should the TV turn on? | Only the first time on this browser. Later visits skip it. |
| What does the TV open onto? | The whole screen, header included, so the nav appears with the picture. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

Remember the open in `localStorage` under `portfolio-crt-open`. After the animation finishes, set it to `1`. If that key is already `1`, do nothing.

On a full load of home (`/` or `{basePath}/`, trailing slash allowed), a small blocking script at the start of `body` runs before first paint. If the key is absent and `prefers-reduced-motion` is not set, it adds `crt-opening` on `html`. While the open runs, that script keeps the class on `html` if hydration rewrites `className`, so the animation does not restart. CSS then plays the open immediately, so the full page never flashes first. The lock comes off when the open ends.

The open lasts about 0.9s:

1. The page is black. A 2px cyan-white line sits at the vertical center.
2. The picture opens vertically from that line to the full viewport, header included.
3. A short brightness bloom settles, then the clip and the line are removed.

The clip is on `body`, with `html` painted black behind it, so the header is inside the picture. A fixed layer blocks pointer events until the animation ends, so a click or scroll during the open does not land on a half-open page. `animationend` removes `crt-opening` and writes the key. The class is also removed if the animation never ends, after 1.5s, and the key is still written.

If someone reaches home by client navigation and the key is still absent, `TronHome` starts the same open once on mount. That path cannot run before paint. The direct load is the one that starts black.

`prefers-reduced-motion: reduce` skips the class, the clip, and the line. The page is there immediately, and the key is not written, so a later visit with motion still gets the open once.

**Pros:**

- A direct first load starts as the line, not as the finished page
- The header opens with the picture, because the clip is on `body`
- Refresh and later visits skip it
- The scroll timelines are left alone

**Cons / risks:**

- The first visit waits about 0.9s before the page is fully there
- A client-side arrival can show one frame of home before the open starts
- If `localStorage` throws, the open can play again next time
- `clip-path` on `body` must be removed completely when the open ends, or the fixed header stays clipped

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Play on every visit | Later visits should skip it |
| Cover only the hero | The header should appear with the picture |
| Drive it with GSAP after hydration | The page would flash fully before the TV turned on |
| A WebGL CRT shader | Heavier than a clip, and it would fight the mosaic |

## 5. Acceptance criteria and verification

- [x] A first load of `/` starts black, shows a center line, then opens over the whole screen, header included
- [x] The open is about 0.9s, then the page scrolls and the nav works as before
- [x] Refresh and a later visit do not play it
- [x] About and Work never play it
- [x] Reduced motion shows the page immediately and does not store the flag
- [x] Clearing `portfolio-crt-open` makes the next home load play it again
- [x] Verify in the browser on `http://localhost:3000/`

Verified on `http://localhost:3000/`.

- Paused at 0ms: the screen is black, `clip-path` is `inset(49.85%)`, and a 2px line (`#f4feff`, cyan glow) sits at the center. The header is outside the slit. At 450ms the picture is open, header included, with `brightness(1.46)`.
- A full load with the key absent finishes with `portfolio-crt-open` = `1`, `crt-opening` removed, clip `none`, and the `className` lock released. At 1100×700 the scroll story still starts: `is-smooth` and 3 pins. Scroll moves.
- A second load leaves `__crtOpen` unset and does not add the class. The key stays `1`.
- Full loads of `/about/` and `/work/` leave the key unset and do not add the class.
- Client navigation from `/work/` to `/` with the key absent runs the open once and then stores `1`.
- With `prefers-reduced-motion: reduce`, a home load shows the page, leaves the key unset, and does not add the class.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-10 | draft | Once per browser, whole screen including the header |
| 2026-10-10 | approved | Build the CRT open |
| 2026-10-10 | implemented | Once per browser, whole screen, pause only for reduced motion |
| 2026-10-10 | discarded | Effect removed. Home loads straight into the scroll story |
