# SDD: Work as a record collection

- **Repo:** `01_project/o000o_active/portfolio`
- **Status:** `implemented` (preview)
- **Date:** 2026-10-16
- **Related:** [012-work-coverflow.md](./012-work-coverflow.md)

## 1. Context / current architecture

`/work` was the Swiper coverflow (`CoverflowStage`, SDD 012), with a Coverflow / List toggle at the bottom right. Demos live in `data/demos.ts`, and covers come from `demoThumb()` through `withBasePath`. `DemoStage` and `useScaledFrame` render a live demo scaled to its box.

## 2. Problem and non-goals

**Problem:** The coverflow does not land. Work should feel like an album or record collection: sleeves with discs that move together as you scroll.

**Non-goals:**

- Choosing the final variant here. Three are built for preview.
- New demos or data fields.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Which idea? | Build all three: Shelf, Grid, Crate. |
| How to compare? | A temporary version row under the header: V0 Coverflow, V1 Shelf, V2 Grid, V3 Crate, List. |
| Default? | V1. The choice lives in `?v=` and localStorage. |

## 4. Approach

Shared, in `components/gallery/albums/`:

- `Disc.tsx`: an SVG record (grooves, sheen, label in `tagColor(first tag)` with the name on an arc).
- `AlbumCover.tsx`: a square sleeve with the screenshot.
- `AlbumOverlay.tsx`: a modal with `DemoStage` (live iframe, or a screenshot plus link when `embeddable: false`), New/Featured chips, blurb, tags, and Open live / Repo (`PillButton`). Esc, the close button, or a backdrop click closes it. Focus moves to Close and is restored afterwards.
- `useIndexScroller.ts`: a gsap `Observer` (wheel + touch) mapped to a smoothed album index that snaps when input settles. A gsap ticker paints the transforms with no React re-renders.
- `useAlbumMotion.ts`: `< 640px` and `prefers-reduced-motion` flags.

Variants:

- **V1 Shelf** (`ShelfView`): a horizontal row of sleeves with a floor reflection. Wheel in either axis, or a horizontal swipe, moves it. The nearest sleeve lifts forward (translateZ). Its disc slides out to the right and turns with scroll progress, so it spins faster as you scroll faster. ← → move one album. Click or Enter on the centre album opens it; clicking a side album centres it.
- **V2 Grid** (`GridView`): a native vertical scroll inside the page box. Every sleeve has a disc peeking out of the top, and the disc rises on hover or focus. Discs idle-spin slowly, speed up with scroll velocity, and ease back. Each row lags by a different depth (velocity parallax). Arrow keys move in 2D (up/down by one row).
- **V3 Crate** (`CrateView`): records stand in a crate in perspective, with a front panel and an `01 / 08` counter. Wheel or vertical swipe flips records one by one: the front record tilts forward and drops away. The current disc slides up out of its sleeve and turns with progress. Arrow keys flip one at a time.

Phones (`< 640px`): touch swipe through `Observer`, less rotation, depth and disc travel, and a slower grid spin and parallax. Reduced motion: no disc spin, no flip tilt, no smoothing (instant steps), no grid parallax.

### Version switcher

- `lib/uiPreview.ts` exports `UI_PREVIEW`. It is on unless `NEXT_PUBLIC_UI_PREVIEW=false`.
- `components/gallery/WorkView.tsx` reads the version (URL `?v=` first, then `localStorage['work-preview-version']`, then `1`) and renders `PreviewRow`. This is a fixed `top-14`, `h-8` monospace bar with a `PREVIEW` tag and a dashed coral border. It sets `--work-top` (5.5rem with the row, 3.5rem without), and every Work layout pads by that.
- The old bottom-right Coverflow / List toggle is gone.

**How to remove the switcher later:**

1. Pick the winning variant and render it directly in `app/work/page.tsx` (or make `WorkView` return only that variant).
2. Delete `PreviewRow`, `VERSIONS`, `readVersion` / `setVersion` / `subscribe` from `WorkView.tsx`, and delete `lib/uiPreview.ts`.
3. Drop the `--work-top` wrapper. The layouts fall back to `3.5rem` through `pt-[var(--work-top,3.5rem)]`.
4. Optionally delete the losing variants, plus `CoverflowStage.tsx` and `swiper` if V0 loses.

Until then, you can hide it without code changes by building with `NEXT_PUBLIC_UI_PREVIEW=false`. The page then always shows V1.

**Rejected alternatives:** Using ScrollTrigger with window scroll for Shelf and Crate. The page is one screen tall, so `Observer` on the stage is simpler and keeps page scroll at zero.

## 5. Acceptance criteria and verification

- [x] `npm run lint`, `GITHUB_PAGES=true npm run build`
- [x] All five versions render from `?v=`. No `?v` gives V1. A click updates the URL and localStorage, and a reload keeps the choice.
- [x] No console errors and no page overflow (scrollWidth / scrollHeight equal the viewport) at 1440x900 and 390x844, light and dark
- [x] Wheel input changes transforms mid-animation. With reduced motion it steps without easing.
- [x] ArrowRight moves focus to the next album. Enter opens the overlay with one iframe. Esc closes it.

Verified with headless Chrome against `next dev` on port 3000.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-16 | approved | Build V1–V3 with a preview row |
| 2026-10-16 | implemented | Preview row on by default, V1 default |
