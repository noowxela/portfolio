<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Keep `turbopack.root` as `path.resolve(process.cwd())` so Next does not treat `/Users/alexwoon/Documents/github` as the app. A parent lockfile or a wrong `__dirname` in compiled `next.config.ts` makes `next-themes` resolve from the wrong `node_modules`.

GitHub Pages uses `output: 'export'` and `images.unoptimized`. CI sets `GITHUB_PAGES=true` (adds `basePath: /portfolio`) and publishes `out/` via `.github/workflows/deploy-pages.yml`. Do not add `headers()` — static hosts ignore Next.js `headers()`.
