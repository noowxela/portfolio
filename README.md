# Alex Woon — Demo Gallery

A [Next.js](https://nextjs.org) gallery of live, iframe-embedded demos: games, 3D, and web apps. Inspired by the interaction of [pmnd.rs](https://pmnd.rs/), with personal projects and identity.

See **[docs/file-structure.md](./docs/file-structure.md)** for a walkthrough of the codebase.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edit [`data/demos.ts`](./data/demos.ts) to add or change gallery items.

## GitHub Pages

The production site is a static export at [https://noowxela.github.io/portfolio/](https://noowxela.github.io/portfolio/).

Push to `main` and the Deploy GitHub Pages workflow builds `out/` and publishes it. One-time repo setting: **Settings → Pages → Source → GitHub Actions**.

```bash
npm run build          # writes static files to out/
npx serve out          # preview the export locally
```

Local `npm run dev` stays at `/`. The GitHub Action sets `GITHUB_PAGES=true` so the export uses `basePath: /portfolio`.

## Scripts

```bash
npm run dev    # local server
npm run build  # static export into out/
npm run lint   # ESLint
```
