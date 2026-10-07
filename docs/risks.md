# Risks

- Pin plus the mobile browser chrome can jump if a scene height is tied to `100vh`. Scenes use `100dvh`. `normalizeScroll` is not on until a real jump shows up.
- The home scene ignores the light theme. The header on `/` uses its own dark glass and a `--tron` edge. Gallery and About still follow the theme toggle.
- `data-speed` on the pinned project cards shifts them vertically as well as with the horizontal track. Speeds stay close to `1` so the offset stays small.
- ScrollSmoother and pins are skipped under 768px and when `prefers-reduced-motion: reduce` is set. Those visits get a stacked page and a static cyan-to-red band.
