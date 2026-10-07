# Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Page |
| --- | --- |
| `/` | Legacy-to-Ares scroll story |
| `/work` | Demo gallery |
| `/about` | Bio and contact |

`gsap` (ScrollTrigger and ScrollSmoother) is a dependency of the home page only. No env vars are required for local dev.

```bash
npm run build   # static export into out/
npm run lint
```

GitHub Pages sets `GITHUB_PAGES=true`, which adds `basePath: /portfolio` and publishes `out/`.
