# File Structure

This project is a [Next.js](https://nextjs.org) App Router app. Home is a scroll story. `/work` is the demo gallery (sidebar, live iframe). About is a short bio. See [architecture.md](./architecture.md) for the scroll setup.

## Directory overview

```
portfolio/
├── app/                      # Next.js routes, layout, and global styles
├── components/               # React UI components
│   └── gallery/              # Gallery-specific components
├── data/                     # Static content (demos, nav links, site identity)
├── docs/                     # Project documentation
├── public/                   # Static assets served at /
├── next.config.ts            # Next.js config (images, CSP, headers)
├── package.json              # Dependencies and scripts
├── postcss.config.mjs        # PostCSS / Tailwind pipeline
└── tsconfig.json             # TypeScript paths and compiler options
```

Generated folders like `.next/` and `node_modules/` are build artifacts — you can ignore them.

---

## How the page is assembled

```mermaid
flowchart TD
  A[app/page.tsx] -->|featured demos| B[TronHome]
  W[app/work/page.tsx] -->|demos array| Gallery[GalleryShell]
  C[app/layout.tsx] -->|wraps all pages| D[NavPill + ThemeProviders]
  Gallery --> E[DemoSidebar]
  Gallery --> F[DemoStage]
  Gallery --> Chip[IdentityChip]
  I[data/demos.ts] --> A
  I --> W
  J[data/headerNavLinks.ts] --> D
  K[data/site.ts] --> D
  L[app/about/page.tsx] --> D
```

1. **`app/layout.tsx`** wraps every page with fonts, theme support, metadata, and the top header.
2. **`app/page.tsx`** renders the Legacy-to-Ares scroll story.
3. **`app/work/page.tsx`** renders `GalleryShell` (selected demo, sidebar, project details).
4. **`app/about/page.tsx`** is a short bio and contact page — not a second homepage.

---

## `app/`

| File | Role |
|------|------|
| `page.tsx` | Home route (`/`). Scroll story. |
| `work/page.tsx` | Gallery route (`/work`). Passes `demos` to `GalleryShell`. |
| `about/page.tsx` | About route (`/about`). Bio, focus, and contact links. |
| `layout.tsx` | Root HTML shell: Inter font, metadata, `ThemeProviders`, and `NavPill`. |
| `theme-providers.tsx` | Client wrapper around `next-themes` for light / dark / system mode. |
| `globals.css` | Tailwind import, dark-mode variant, custom cursor, and `.no-scrollbar` utility. |
| `icon.svg` | Favicon (initials-style mark). |
| `opengraph-image.tsx` | Generated Open Graph image for link previews. |

**Entry point:** start at `page.tsx` if you want to change what renders on `/`.

---

## `components/`

Shared UI that is not tied to a specific route.

| File | Role |
|------|------|
| `ThemeSwitch.tsx` | Sun/moon toggle button used inside the header. |

### `components/home/`

The `/` scroll story. `TronHome` lays out five scenes. `useHomeScroll` starts ScrollSmoother, the pins, and the `--tron` handoff. `tron.css` holds the grid, ribbon, and scene colors.

### `components/gallery/`

These files implement the gallery layout.

| File | Role |
|------|------|
| `GalleryShell.tsx` | **Orchestrator.** Manages selected demo, sidebar collapse (defaults collapsed on small screens), and the project-details overlay. |
| `DemoSidebar.tsx` | Left column: thumbnail list with titles, selection outline, collapse animation, ⌘+[ shortcut. Title row toggles the details card. |
| `DemoStage.tsx` | Center: iframe (or fallback card if embedding is blocked), scaled to fit, with an optional name/blurb/Live/GitHub overlay. |
| `NavPill.tsx` | Fixed top header: alexW, Work, About, social icons, an Available status, and the local date and time. On `/` the bar is dark glass and its edge follows `--tron`. |
| `IdentityChip.tsx` | Bottom-left chip with name and role; links to About. Collapses on small screens. |
| `PillButton.tsx` | Reusable rounded button/link used by the sidebar toggle, header icons, and identity chip. |

**Client vs server:** files marked `'use client'` run in the browser (state, events, theme). `page.tsx` stays a server component and only passes data down.

---

## `data/`

Static content — no API calls. Edit these files to change what the gallery shows.

| File | Role |
|------|------|
| `demos.ts` | **Main content file.** Exports the `Demo` type, `demoLiveUrl()`, and the `demos` array. |
| `site.ts` | Name, role, tagline, contact URLs, highlights, the About toolkit, and hobbies. |
| `headerNavLinks.ts` | Nav items for the header (Home, Work, About). |

### `Demo` shape

```ts
type Demo = {
  name: string
  slug: string
  thumb: string
  embedUrl: string
  liveUrl?: string      // defaults to embedUrl
  repoUrl?: string
  blurb: string
  tags: string[]
  isNew?: boolean
  embeddable?: boolean  // set false if the host refuses iframes
  note?: string         // opens the Details slide-over
}
```

To add a demo, append an object to `demos` and drop a thumbnail in `public/thumbs/`. If a host sends `X-Frame-Options` or `frame-ancestors` that blocks embedding, set `embeddable: false` so the stage shows an “Open live site” fallback.

---

## `public/`

Files here are served from the site root. Thumbnails live in `public/thumbs/`.

---

## Root config files

| File | Role |
|------|------|
| `next.config.ts` | Allows iframes from `noowxela.github.io` and `*.vercel.app` via CSP `frame-src`. |
| `tsconfig.json` | TypeScript config; `@/*` alias maps to the project root. |
| `postcss.config.mjs` | Enables Tailwind CSS v4 via `@tailwindcss/postcss`. |
| `eslint.config.mjs` | Lint rules for the project. |
| `package.json` | Scripts: `dev`, `build`, `start`, `lint`. Key deps: `next`, `react`, `gsap`, `@headlessui/react`, `next-themes`. |

---

## Common customization paths

| Goal | Where to look |
|------|----------------|
| Add or remove gallery items | `data/demos.ts` |
| Change name, email, socials | `data/site.ts` |
| Change nav links | `data/headerNavLinks.ts` |
| Change page title / SEO | `app/layout.tsx` → `metadata` |
| Tweak sidebar or iframe behavior | `components/gallery/DemoSidebar.tsx`, `DemoStage.tsx` |
| Change colors, cursor, scrollbar | `app/globals.css` |
| Allow iframes from a new host | `next.config.ts` → CSP `frame-src` |

---

## Scripts

```bash
npm run dev    # local dev server at http://localhost:3000
npm run build  # production build
npm run start  # serve production build
npm run lint   # ESLint
```
