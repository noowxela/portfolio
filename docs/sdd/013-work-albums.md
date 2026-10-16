# SDD: Work as a record collection

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented`
- **Date:** 2026-10-16
- **Related:** [012-work-coverflow.md](./012-work-coverflow.md)

## 1. Context / current architecture

`/work` was the Swiper coverflow (`CoverflowStage`, SDD 012), with a Coverflow / List toggle at the bottom right. Demos live in `data/demos.ts`, and covers come from `demoThumb()` through `withBasePath`. `DemoStage` and `useScaledFrame` render a live demo scaled to its box.

## 2. Problem and non-goals

**Problem:** The coverflow does not land. Work should feel like an album or record collection: sleeves with discs that move together as you scroll.

**Non-goals:**

- Picking one layout. The visitor chooses.
- New demos or data fields.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Which idea? | Shelf and Grid. Crate was built, then removed. |
| How to switch? | A permanent row under the header: Coverflow, Shelf, Grid, List. It keeps the PREVIEW tag and monospace style. |
| Default? | Shelf. The choice lives in `?v=` and localStorage. |

## 4. Approach

Shared, in `components/gallery/albums/`:

- `Disc.tsx`: an SVG record (grooves, sheen, label in `tagColor(first tag)` with the name on an arc).
- `AlbumCover.tsx`: a square sleeve with the screenshot.
- `AlbumOverlay.tsx`: a modal with `DemoStage` (live iframe, or a screenshot plus link when `embeddable: false`), New/Featured chips, blurb, tags, and Open live / Repo (`PillButton`). Esc, the close button, or a backdrop click closes it. Focus moves to Close and is restored afterwards.
- `useIndexScroller.ts`: a gsap `Observer` (wheel + touch) mapped to a smoothed album index that snaps when input settles. A gsap ticker paints the transforms with no React re-renders.
- `useAlbumMotion.ts`: `< 640px` and `prefers-reduced-motion` flags.

Variants:

- **Shelf** (`ShelfView`): a horizontal row of 16:10 sleeves, the same size as the Coverflow card: 82vw on phones, `min(64vw, 880px)` on desktop. The size is capped by viewport height so the raised disc and the caption always fit. There is a floor reflection. Wheel in either axis, or a horizontal swipe, moves the row. The nearest sleeve lifts, and side sleeves shrink and turn. Its disc (80% of the sleeve height) slides up out of the **top** of the sleeve by 35% of its diameter. It turns with scroll progress, so it spins faster as you scroll faster. The stage reserves that rise as top margin, so the disc clears the header and switcher. ← → move one album. Click or Enter on the centre album opens it; clicking a side album centres it.
- **Grid** (`GridView`): a native vertical scroll inside the page box. Every sleeve has a disc peeking out of the top, and the disc rises on hover or focus. Discs idle-spin slowly, speed up with scroll velocity, and ease back. Each row lags by a different depth (velocity parallax). Arrow keys move in 2D (up/down by one row).

Phones (`< 640px`): touch swipe through `Observer`, less rotation, depth and disc travel, and a slower grid spin and parallax. Reduced motion: no disc spin, no flip tilt, no smoothing (instant steps), no grid parallax.

### View switcher (permanent)

The switcher is a production feature. It started as a temporary dev preview, and the `NEXT_PUBLIC_UI_PREVIEW` flag and `lib/uiPreview.ts` are gone.

- `components/gallery/WorkView.tsx` renders `ViewSwitcher`: a fixed `top-14`, `h-8` monospace row with the `PREVIEW` tag and dashed coral border. Alex likes that look, so it stays.
- Options: Coverflow, Shelf, Grid, List. Shelf is the default.
- The view is read from URL `?v=` first, then `localStorage['work-view']`, then the old `localStorage['work-preview-version']`, then Shelf. Choosing a view writes `?v=<id>` and `work-view`, and drops the old key.
- Old values still map: `0` → coverflow, `1` → shelf, `2` → grid, `3` (Crate, removed) → shelf, `list` → list. Unknown values fall back to Shelf.
- The wrapper sets `--work-top: 5.5rem` (header plus row), and every Work layout pads by it.

**Rejected alternatives:** Using ScrollTrigger with window scroll for Shelf. The page is one screen tall, so `Observer` on the stage is simpler and keeps page scroll at zero.

## 5. Acceptance criteria and verification

- [x] `npm run lint`, `GITHUB_PAGES=true npm run build`
- [x] Every switcher option renders its layout, updates `?v=` and localStorage, and has no page overflow. Old `?v=0..3` and the old storage key map correctly.
- [x] No console errors and no page overflow (scrollWidth / scrollHeight equal the viewport) at 1440x900 and 390x844, light and dark
- [x] Wheel input changes transforms mid-animation. With reduced motion it steps without easing.
- [x] Shelf sleeve is 880x550 at 1440x900 (Coverflow card 880x550) and 323x202 at 390x844 (Coverflow 320x200, the extra is the lift). With the disc out, its top is at 154px, below the 88px switcher bottom.
- [x] ArrowRight moves focus to the next album. Enter opens the overlay with one iframe. Esc closes it.

Verified with headless Chrome against `next dev` on port 3000.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-16 | approved | Build V1–V3 with a preview row |
| 2026-10-16 | implemented | Preview row on by default, V1 default |
| 2026-10-16 | implemented | Crate removed. The switcher is permanent (PREVIEW style kept, user-facing labels). Shelf sleeves match the Coverflow size, and the disc slides out of the top |
