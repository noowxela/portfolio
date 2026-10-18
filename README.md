# Alex Woon — Portfolio

Personal site of Alex Woon, a full stack developer in Malaysia. Home is a particle portrait. Work is a live gallery of games, 3D, and web apps. Journey tells the resume as a git log.

See **[docs/file-structure.md](./docs/file-structure.md)** for a walkthrough of the codebase.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3001/portfolio/](http://localhost:3001/portfolio/). Port 3000 stays free for the Next checkout of this repo. Edit [`data/demos.ts`](./data/demos.ts) to add or change gallery items.

## GitHub Pages

The production site is a static Vite build at [https://noowxela.github.io/portfolio/](https://noowxela.github.io/portfolio/).

Push to `main` and the Deploy GitHub Pages workflow builds `dist/` and publishes it. One-time repo setting: **Settings → Pages → Source → GitHub Actions**.

```bash
npm run build                 # Vite build plus HTML shells in dist/
node scripts/serve-pages.mjs # http://127.0.0.1:3100/portfolio/
```

Dev and production both use base path `/portfolio/`.

## Scripts

```bash
npm run dev      # Vite on port 3001
npm run build    # dist/
npm run preview  # port 3002
npm run lint
```
