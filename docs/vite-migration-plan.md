# Portfolio：Next.js 16 → Vite + React 迁移计划（仅计划，未改代码）

日期：2026-10-18（UTC+8）· 范围：`/Users/alexwoon/Documents/github/01_project/o000o_active/portfolio`

> 当前仓库状态（审计时实测，与任务描述不同）：本地在 **`main`**，HEAD = `1f7ca39` = `origin/main`，工作区干净。`5fcd267`（sound）已经通过 PR #15 合入 main；`package-lock.json` 的未暂存改动已不存在。新分支应从 `main@1f7ca39` 切出。

---

## 1. 审计结果（只读）

### 1.1 路由（`app/`，共 13 个文件）

| 路由 | 文件 | Next 特性 |
| --- | --- | --- |
| `/` | `app/page.tsx` → `Landing` | `next/font`（Oxanium + Share_Tech_Mono）、`metadata`（`title.absolute`）、页面级 CSS（`tron.css`、`landing.css`） |
| `/noelite` | `app/noelite/page.tsx` → `TronHome` | `next/font` ×2、`metadata`、`tron.css`，在服务端 `demos.filter(featured)` |
| `/noelite2` | `app/noelite2/page.tsx` → `Journey`（3D） | `next/font` ×2、`metadata`、`tron.css` + `noelite2/journey.css` |
| `/journey` | `app/journey/page.tsx` → `GridLog` | `next/font` ×2、`metadata`、`tron.css` + `journey/journey.css` |
| `/work` | `app/work/page.tsx` → `WorkView` | `metadata` |
| `/about` | `app/about/page.tsx`（服务端组件，本身含大量 JSX） | `next/font`（Oxanium）、`next/link`、`metadata`、`tron.css` |
| `/discs` | `app/discs/page.tsx` → `DiscShow` | `metadata` |
| 404 | 无自定义 `not-found.tsx`，用 Next 默认 `_not-found` | 导出为 `out/404.html` |
| 根布局 | `app/layout.tsx` | `next/font`（Inter → `--font-inter`）、根 `metadata`（`metadataBase`、title template `%s · Alex Woon`、OpenGraph、Twitter card）、`<html suppressHydrationWarning>`、`ThemeProviders` + `NavPill` + `RouteCurtain`、`globals.css` |
| 主题 | `app/theme-providers.tsx` | `next-themes`（`attribute="class"`，system 默认） |
| 图标 | `app/icon.svg`、`app/favicon.ico` | Next 文件约定自动生成 `<link rel="icon">` |
| OG 图 | `app/opengraph-image.tsx` + `app/og-portrait.png` | `next/og` `ImageResponse`、`force-static`，构建时生成 1200×630 PNG（`out/opengraph-image`） |
| 全局 CSS | `app/globals.css`（249 行） | Tailwind v4：`@import 'tailwindcss'`、`@custom-variant dark`、`@theme { --font-sans: var(--font-inter) … }`；PostCSS 插件 `@tailwindcss/postcss` |

没有 `generateMetadata`、`generateStaticParams`、route handlers、middleware、server actions、`next/script`、`next/head`、`useSearchParams`、动态路由段。除 `app/*` 外所有组件都是客户端组件，`about` 页之外没有真正依赖服务端的逻辑。

### 1.2 Next 专属用法统计（`app components lib data scripts .cursor/skills`）

| 类别 | 文件数 | 文件 |
| --- | --- | --- |
| `next/link` | 7 | `app/about/page.tsx`、`gallery/NavPill.tsx`、`journey/GridLog.tsx`、`landing/Landing.tsx`、`gallery/IdentityChip.tsx`、`home/WorkScene.tsx`、`home/ExitScene.tsx` |
| `next/navigation` | 3 | `NavPill`（`usePathname`、`useRouter`、`router.prefetch`）、`Landing`（`router.prefetch`、`router.push`）、`transition/RouteCurtain`（`usePathname`） |
| `next/image`（全部是 `fill` + `unoptimized`） | 5 | `home/WorkScene`、`gallery/DemoStage`、`gallery/CoverflowStage`、`gallery/DemoSidebar`、`gallery/albums/AlbumCover` |
| `next/font/google` | 6 | `app/layout`、`app/page`、`noelite`、`noelite2`、`journey`、`about` |
| `next/dynamic`（`ssr:false`，都是 `Disc3D`） | 2 | `discs/SideDisc`、`gallery/albums/GridView` |
| `next/og` | 1 | `app/opengraph-image.tsx` |
| `Metadata` / `export const metadata` | 8 | `app/layout` + 7 个 page |
| `next-themes` | 2 | `app/theme-providers`、`components/ThemeSwitch`（`useTheme`） |
| `'use client'` 指令 | 31 | components 下 30 个 + `app/theme-providers` |
| `withBasePath`（依赖 `process.env.NEXT_PUBLIC_BASE_PATH`） | 13 | `lib/withBasePath.ts` + 12 个调用方（`data/demos.ts`、`noelite2/Journey*`、`discs/DiscShow`、`home/WorkScene`、`gallery/*` ×4、`landing/poses.ts`、`landing/portraitScene.ts`、`landing/Landing.tsx`） |
| `process.env` 构建期变量 | 2 | `lib/withBasePath.ts`、`app/layout.tsx`（`NEXT_PUBLIC_SITE_URL`、`VERCEL_*`） |
| 页面级 CSS import | 7 | 5 个 `app/*` page + `app/layout` + `transition/RouteCurtain`（`route-transition.css`） |
| 只为 hydration 存在的写法（`typeof window`、`getServerSnapshot`、`queueMicrotask(() => setX)`、`suppressHydrationWarning`） | 10 | 纯 CSR 下无害，可以先保留 |
| `document.fonts.load` + canvas 字体（依赖 CSS 变量里的字体名） | 3 组 | `journey/GridLog`+`markField`、`noelite2/Journey`+`scene/name`、`home/HeroMosaic`+`mosaicScene` |
| `three` | 15 | 不受框架影响 |
| `gsap` | 3 | 不受影响 |
| `swiper` | 1 | `CoverflowStage`，不受影响 |
| `sessionStorage` / `localStorage` | 5 个源码文件 | `routeTransition.ts`（`route-enter` 标记）、`lib/sound.ts`、`NavPill`、`WorkView`、`data/demos.ts`，不受影响 |

源码 `.ts/.tsx` 总数：87（`app components lib data`）。

### 1.3 配置、CI、测试、文档

| 类别 | 文件数 | 说明 |
| --- | --- | --- |
| 构建配置 | 7 | `package.json`（`next dev/build`、`start: serve out`）、`next.config.ts`（`output:'export'`、`trailingSlash:true`、`GITHUB_PAGES` 时 `basePath:'/portfolio'`、`NEXT_PUBLIC_BASE_PATH`、`reactStrictMode:false`、`transpilePackages:['next-themes']`、`images.unoptimized`）、`tsconfig.json`（`plugins:[next]`、`.next/types` include、`paths '@/*' → './*'`）、`eslint.config.mjs`（`eslint-config-next` core-web-vitals + typescript）、`postcss.config.mjs`、`next-env.d.ts`、`.github/workflows/deploy-pages.yml` |
| GH Pages 工作流 | 1 | `Deploy GitHub Pages`：push main / `workflow_dispatch`，`GITHUB_PAGES=true`、`NEXT_PUBLIC_SITE_URL=https://noowxela.github.io/portfolio`，Node 22，`npm ci && npm run build`，上传 `out/` |
| verify-portfolio 测试工具 | 4 | `verify.mjs`（`launch` 跑 `npx next build`（`GITHUB_PAGES=''`）后 `npx serve out` 在 `127.0.0.1:3100`，站点在根路径，没有 `/portfolio`）、`SKILL.md`、`features/README.md`、`features/about.md` |
| 其他脚本 | 1 | `scripts/shoot-thumbs.mjs`（只用 `PW_CHANNEL`/`SHOT_WAIT`，不用改） |
| 提到 Next / basePath / GITHUB_PAGES 的文档 | 19 + 3 | `docs/architecture.md`、`file-structure.md`、`setup.md`、`pages/tron-home(.zh).md`、`pages/tron-about(.zh).md`、SDD 001/005/011/012/013/027/028/029/030，再加 `README.md`、`AGENTS.md`、`CLAUDE.md`。**AGENTS.md 永远不提交**：要请 Alex 自己改 |
| `public/` | 28 个文件，1.8 MB | `thumbs/*`（webp+svg）、`portrait/*.webp`、`models/grid-disc.glb`、`worker.js`（清除旧 Next service worker 的 kill-switch，要保留）、`.nojekyll`、`.DS_Store`（不该带上） |

### 1.4 现有构建产物参考（本地 `out/`，可能是旧构建，第 0 步会重新测）

`out/` 共 5.5 MB；JS 合计约 2.2 MB（31 个 chunk，未压缩，所有路由合计），CSS 约 124 KB。基线要用 `GITHUB_PAGES=true next build` 重新量，按路由记录首屏 JS（gzip）。

### 1.5 每类改动的文件数（预计）

| 类别 | 文件数 |
| --- | --- |
| 路由/页面迁移（`app/*` → `src/pages/*` + 入口） | 13 删 / 约 11 新增（`index.html`、`src/main.tsx`、`src/router.tsx`、`src/RootLayout.tsx`、7 个 page、`NotFound`） |
| Link / navigation / image / dynamic 替换 | 7 + 3 + 5 + 2（去重后约 15 个组件文件） |
| `withBasePath` → `asset()` | 13 |
| 删除 `'use client'` | 31（机械操作） |
| 字体 | 6 个 page/layout 的用法 → 1 个 `src/fonts.css` |
| 主题 | 2 |
| 配置 + CI | 7 |
| 测试工具 | 4（+ 新增 `scripts/serve-pages.mjs`、`scripts/prerender-shells.mjs`） |
| 文档 | 约 20（+ 新 SDD 031） |
| **合计** | **约 90 个文件被改/增/删**，其中逻辑性改动约 30 个，其余是机械替换和文档 |

---

## 2. 目标技术栈和选择

| 项 | 选择 |
| --- | --- |
| 构建 | **Vite 8**（当前 `8.3.4`）+ `@vitejs/plugin-react` 6；不开 React Compiler |
| UI | React 19.2（保持 `19.2.4`），**不包 `<StrictMode>`**（现在 `reactStrictMode:false`；StrictMode 的双 effect 会让 WebGL 场景重复创建/销毁一次，等迁移稳定后再单独评估） |
| 样式 | Tailwind v4 改用 **`@tailwindcss/vite`**（`4.3.x`），删掉 PostCSS 配置；`globals.css` 内容不变 |
| 3D / 动画 | `three` 0.186、`gsap` 3.15、`swiper` 14 原样保留 |
| 路由 | **React Router（data 模式：`createBrowserRouter` + `route.lazy`）**，见 2.1 |
| 部署 | GitHub Pages，`base: '/portfolio/'`，产物目录 `dist/` |
| 静态 HTML | **SPA + 每个路由一份 HTML 壳（构建后脚本注入该路由的 `<title>`/`<meta>`/OG）**，见 2.2 |

### 2.1 路由：React Router vs TanStack Router

| | React Router（data/library 模式） | TanStack Router |
| --- | --- | --- |
| 版本 | npm 最新是 **v8.4**（Alex 提到 v7；v7 的 data 模式 API `createBrowserRouter`/`lazy`/`useNavigate`/`useLocation`/`ScrollRestoration` 应该在 v8 延续，**落地前查一次 v8 升级说明**，有问题就锁 v7） | `1.170` |
| `basename: '/portfolio'` | 内置 | 内置（`basepath`） |
| 懒加载路由并在**加载完成后**才切换 location | `route.lazy`：导航先加载模块，再提交新 location（`useNavigation().state === 'loading'`） | `lazyRouteComponent` / 文件路由代码分割，也支持 |
| 预加载 | data 模式没有 `<Link prefetch>`（那是 framework 模式的）；自己调 `lazy` 的 import 即可 | 内置 `preload="intent"` |
| 滚动恢复 | `<ScrollRestoration />` | 内置 |
| 类型安全路由 | 一般 | 很强（7 个静态路由，用处不大） |
| 学习/迁移成本 | 低，API 和 Next 的 `usePathname`/`router.push` 一一对应 | 中（代码生成或配置树、devtools） |
| 包体积 | 较小 | 较大 |

**推荐 React Router data 模式。** 只有 7 个静态路由，用不上 TanStack 的类型安全和 search-param 状态。关键在于 `route.lazy` 会在模块加载完以后才更新 location，这样 `RouteCurtain` 根据 pathname 打标签（`tagEntrance`）时目标页的 DOM 已经在了，行为和现在 Next 一致。如果改成 `<Suspense>` 里的 `React.lazy` 元素，location 会先变，DOM 还没出来，入场动画就会选不到元素。不用 framework 模式，否则又回到一个框架。

### 2.2 GH Pages 深链 + SEO/OG

| 方案 | 深链刷新 | 社交卡片（爬虫不跑 JS） | Google | 复杂度/风险 |
| --- | --- | --- | --- | --- |
| A. SPA + `404.html` 重定向 hack（spa-github-pages） | 先返回 404 再跳回，URL 闪动，HTTP 状态 404 | 所有路由只有首页的 meta | 依赖 JS 渲染，404 状态不好 | 低，但体验和 SEO 最差 |
| B. 完整预渲染（`vite-react-ssg` 0.9 / 自写 `renderToString` + hydrate） | 200 | 每页正确 | 最好 | **高**：Landing、GridLog、Noelite2、Discs 全是 WebGL/`window` 依赖，要处理 SSR 安全、hydration mismatch，等于把 Next 的约束再实现一遍 |
| **C. SPA + 每路由 HTML 壳（推荐）**：`vite build` 后由 `scripts/prerender-shells.mjs` 把 `dist/index.html` 复制成 `dist/{work,journey,about,noelite,noelite2,discs}/index.html`，并替换每页的 `<title>`、`description`、`og:*`、`twitter:*`、`canonical`；`dist/404.html` = 壳 + `noindex`，客户端渲染 NotFound | **200**（GH Pages 直接命中 `/portfolio/work/index.html`；`/portfolio/work` 由 Pages 301 到 `/work/`，和现在 `trailingSlash:true` 一样） | **每页正确**（meta 在静态 HTML 里） | body 要 JS 渲染（Googlebot 会渲染），作品集可以接受 | 低：约 60 行 Node 脚本，没有 SSR，没有 hydration |

**推荐 C。** 它保住了现在静态导出的两个实际好处，深链返回 200、每页有自己的 OG/标题，而且不引入 SSR。页面元信息集中写在一个 `src/routes.meta.ts` 里，壳脚本和运行时都读这一份。代价是首屏 HTML 没有正文，比 Next 的静态 HTML 晚一点出现内容（但现在这些页面本来就靠客户端 WebGL 和动画，正文在 JS 之前也基本不可见）。

### 2.3 预加载（替代 `router.prefetch`）

- `src/routes.tsx` 为每个路由导出 `load = () => import('./pages/Work')`，`route.lazy` 也用它。
- `preloadRoute(path)`：按路径找到 `load` 并调用（模块缓存，重复调用无成本）。Vite 会给动态 chunk 自动注入 `modulepreload`（依赖也会一起预取）。
- `NavPill` 的 `onMouseEnter`/`onFocus` 和 `Landing` 的 `prefetch(entry)` 都改调 `preloadRoute(href)`；点击开始退场时（720 ms）再调一次，保证 `navigate(href)` 时 chunk 已就绪，切换不会卡在加载上。
- 可选：空闲时（`requestIdleCallback`）预取首页四个角落的路由。

### 2.4 字体

- 用自托管 `@fontsource-variable/inter`、`@fontsource/oxanium`（400/500/600，latin）、`@fontsource/share-tech-mono`（400），在 `src/fonts.css` 里 import，只要 latin 子集。
- 现在 `next/font` 用 className 注入 `--font-inter/--font-display/--font-hud` 变量。改成在 `:root` 全局定义 `--font-display: 'Oxanium'`、`--font-hud: 'Share Tech Mono'`、`--font-inter: 'Inter Variable'`，同时删掉 page 上的 `${display.variable}` 类。
- `index.html` 里 `<link rel="preload" as="font" type="font/woff2" crossorigin>` 预加载 Inter 和 Oxanium 600 的 latin woff2（路径由 Vite 处理，可以用一个小插件或 `?url` 引用注入）。
- 注意：canvas 文字（`GridLog`/`markField`、`noelite2/name`、`mosaicScene`）用 `getComputedStyle` 拿字体名，然后 `document.fonts.load`。现在字体名是 next/font 的哈希名，以后是真实名，逻辑不变，但要验证粒子年份和名字的形状、尺寸没变。
- `font-display: swap` 保持（fontsource 默认就是 swap）。

### 2.5 Metadata

- 运行时：React 19 支持在组件里直接渲染 `<title>`、`<meta>`、`<link>`，会自动提升到 `<head>`。写一个 `<PageMeta title description />`，套用模板 `%s · Alex Woon`（首页用 absolute `Alex Woon`），每个 page 顶部渲染它。客户端切换路由时标题会更新。
- 静态：同一份 `routes.meta.ts` 交给 `prerender-shells.mjs`，写进每个 HTML 壳（爬虫和分享卡片看的是这里）。
- 根级固定 meta（`og:type`、`og:locale`、`og:site_name`、`twitter:card=summary_large_image`、author、`theme-color`）直接写在 `index.html`。
- `metadataBase` → 环境变量 `VITE_SITE_URL`（默认 `https://noowxela.github.io/portfolio`），用来生成绝对 `og:url`/`og:image`/`canonical`。

### 2.6 OG 图

- 第 0 步在 Next 版本上执行 `GITHUB_PAGES=true next build`，把 `out/opengraph-image`（1200×630 PNG）存成 **`public/og.png`** 并提交。之后删掉 `app/opengraph-image.tsx`（`og-portrait.png` 只是生成 OG 图的素材，同时删除或移到 `docs/assets/`）。
- 所有页面 `og:image` = `${VITE_SITE_URL}/og.png`，并写 `og:image:width/height/alt`。
- 以后想改 OG 图，就编辑 PNG（或者以后另写一个本地脚本用 satori 生成，不在本次范围）。

### 2.7 环境变量 / base path

- `vite.config.ts`：`base: '/portfolio/'`，开发和构建一律带 base。好处是本地和线上路径完全一致，`GITHUB_PAGES` 开关不再需要。
- `lib/withBasePath.ts` 改名为 `lib/asset.ts`：`asset('/thumbs/x.webp')` → `` `${import.meta.env.BASE_URL}thumbs/x.webp` ``（注意 BASE_URL 以 `/` 结尾，去掉重复斜杠）。13 个文件机械替换（`data/demos.ts`、`landing/poses.ts` 等在模块顶层调用也没问题）。
- `createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/$/, '') })`。
- 站内链接继续写 `/work` 这类无 base 路径（React Router 会自动加 basename）。`normalizePath` 照常用。`useLocation().pathname` 返回值已去掉 basename，和现在 `usePathname()` 一致。
- `NEXT_PUBLIC_SITE_URL` → `VITE_SITE_URL`；`vite-env.d.ts` 声明类型。`VERCEL_*` 兜底逻辑删掉（已不部署到 Vercel）。

### 2.8 开发端口

- 规则：不要用 5173 / 5180（Vite 默认 5173，**必须显式配置**），pf3000 留在 `:3000`。
- 迁移期间（`vite-migration` 分支）：`vite` dev 用 **`3001`**、`strictPort: true`，`vite preview` 用 **`3002`**。pf3000（Next dev）在 main 的工作目录里继续跑 `:3000`，互不影响（推荐用 `git worktree` 在另一个目录检出迁移分支，这样 pf3000 的工作目录不会被切走）。
- 合并以后：`npm run dev` 改成 `vite --port 3000 --strictPort`，Alex 把 pf3000 换成 Vite（地址 `http://localhost:3000/portfolio/`）。
- 验证服务器：仍用 `127.0.0.1:3100`，改成用 `scripts/serve-pages.mjs` 托管 `dist/`，模拟 GH Pages（挂在 `/portfolio/`、目录请求自动加斜杠 301、未知路径返回 `404.html` 并带 404 状态）。

### 2.9 主题（`next-themes`）

- `next-themes` 本身不依赖 Next，但它防闪烁的内联 `<script>` 在纯客户端渲染下执行得太晚，会闪一下。
- 推荐：换成自写的约 40 行 `ThemeProvider`/`useTheme`（`class` 属性、`system` 默认、`localStorage['theme']`，键名沿用 next-themes 的 `theme`，用户已存的偏好会保留），再在 `index.html` 的 `<head>` 里放一段同步内联脚本，在首帧前设置 `html.dark`。`ThemeSwitch` 只改 import。`disableTransitionOnChange` 的行为由 `setThemeWithTransition` 继续负责。
- 备选：保留 `next-themes`，只加 `index.html` 内联脚本（依赖名字里还有 next，不推荐）。

### 2.10 分支策略

- 从 `main@1f7ca39` 切 **`vite-migration`**，用 `git worktree add ../portfolio-vite vite-migration` 在独立目录做，main 上的 Next 版本和 pf3000 照常可用。
- 迁移中 Next 和 Vite 不在同一个提交里共存（`app/` 和 `src/` 双入口会让 TS 和 ESLint 很乱）：分支前几步就把入口改成 Vite，Next 版本靠 main 保底。
- 每个有意义的步骤在本地提交一次，**不 push**，直到 Alex 验收；最后开**一个 PR** 合入 main（合并后 Actions 自动部署）。
- 回滚：Pages 出问题就 revert 合并提交，push main 后 Actions 会重新部署 Next 版本。
- 规矩照旧：先 `git status`；不动 `components/discs/*` 和 30° 倾斜的逻辑（只允许 import 层面的机械替换，比如 `next/dynamic` → `lazy` 在 `SideDisc`/`GridView`，**这条要 Alex 先点头**，因为 `SideDisc` 在 discs 目录里）；AGENTS.md 永远不提交。

---

## 3. 风险与对策

| 风险 | 说明 | 对策 |
| --- | --- | --- |
| 路由过渡时序 | `Landing` 在 720 ms 退场后 `router.push`；`RouteCurtain` 靠 pathname 变化的 effect + `sessionStorage['route-enter']` 给目标页 DOM 打标签。location 如果比 DOM 先变，入场动画就选不到元素 | 用 `route.lazy`（先加载后提交）+ 点击时 `preloadRoute`；`navigate()` 替换 `router.push`；`RouteCurtain` 换 `useLocation()`。验证：帘幕顶 = 56 px、入场有分组错开、直接访问没有入场（与 SDD 029 的测量对比） |
| WebGL 上下文清理 | 路由切换时页面要卸载，`forceContextLoss` 要执行；StrictMode 双挂载 | 不开 StrictMode；验证每页只有一个 canvas，离开后 0 个，`/journey` ↔ `/` 来回 5 次没有 context 泄漏警告 |
| 滚动恢复 | Next 切页自动回到顶部；React Router 需要 `<ScrollRestoration />`；`noelite2` 自己 `window.scrollTo`，`/journey` 锁滚动（`html.gridlog-page`） | 根布局加 `<ScrollRestoration getKey={(l) => l.pathname} />`；验证 `/noelite` 滚到中间 → `/work` → 后退能回到原位置，`/noelite2` 的 scrub 不被打断 |
| 只为 hydration 写的代码 | `queueMicrotask(() => setX)`、`getServerSnapshot`、`suppressHydrationWarning`（10 个文件） | CSR 下无害，**先不动**，避免把行为改动混进来；之后可以单独清理 |
| `'use client'` 指令 | Rolldown/Vite 会对模块级指令报警告 | 第 4 步用脚本统一删除（31 个文件） |
| Tailwind v4 | 换成 `@tailwindcss/vite`，自动扫描源码；需确认支持 Vite 8 | 检查 peer deps；对比迁移前后 `dist` CSS 体积和关键页面截图（class 不能漏扫，尤其 `data/*.ts` 里的 class 字符串） |
| 页面级 CSS | Next 按路由加载 `tron.css`/`landing.css`/`journey.css`，切页后不卸载；Vite 的 lazy chunk CSS 也是只加不删 | 行为一致。注意 CSS 加载顺序：保证 `tron.css` 在页面 CSS 之前（在 page 模块里同样的 import 顺序） |
| 字体名变化 | canvas 采样依赖字体真实名和加载完成 | 第 5 步截图对比粒子年份和名字的尺寸（GridLog 年份高度、noelite2 名字） |
| `next/image` → `<img>` | 现在都是 `fill` + unoptimized，换成绝对定位 `img`，`object-cover`，`loading="lazy"`、`decoding="async"` | 截图对比 Work 的三种布局和 noelite 的 WorkScene |
| 旧 service worker | `public/worker.js` 用来清旧 Next 缓存 | 原样保留在 `public/` |
| GH Pages 只能在 main 部署 | `github-pages` environment 默认只允许 main | 本地用 `serve-pages.mjs` 完整模拟；合并后立刻做线上冒烟（深链刷新、OG 调试器），准备好 revert |
| 包体积 | Vite + React Router 应该比 Next runtime 小，但 three 和 gsap 占大头 | 记录每个路由首屏 JS gzip，与第 0 步基线对比；首页首屏 JS 不应变大 |
| React Router 主版本 | npm 最新是 v8，任务说 v7 | 第 1 步先读 v8 changelog；API 有破坏性变化就锁 `react-router@7` |

---

## 4. 步骤（含预估）

| # | 步骤 | 预估 |
| --- | --- | --- |
| 0 | **基线**：在 main 上 `GITHUB_PAGES=true next build`，记录各路由首屏 JS/CSS（gzip）和 `out/` 总量；导出 `out/opengraph-image` → 暂存为 `og.png`；跑现有 verify 和 sound、nav、journey 脚本，存基线截图（7 页 × 桌面/手机）和帧时间到 `/workspace/portfolio/shots/vite-baseline/` | 0.75 h |
| 1 | **脚手架**：建 worktree 和 `vite-migration` 分支；装 `vite @vitejs/plugin-react @tailwindcss/vite react-router @fontsource/*`，删 `next eslint-config-next @tailwindcss/postcss next-themes`；`vite.config.ts`（`base`、`@` 别名 → 仓库根、`server.port 3001 strictPort`、`preview.port 3002`）；`index.html`；`tsconfig`（去掉 next plugin，加 `vite/client`）；ESLint 改 `typescript-eslint` + `eslint-plugin-react-hooks@7`（保留 set-state-in-effect 等现有规则）+ `react-refresh` + `jsx-a11y`；删 `postcss.config.mjs`、`next-env.d.ts`、`next.config.ts` | 1 h |
| 2 | **路由骨架**：`src/main.tsx`（`createRoot`，不用 StrictMode）、`src/routes.tsx`（7 个路由 + `*` NotFound，`lazy`，`load` 表）、`src/RootLayout.tsx`（`ThemeProvider` + `NavPill` + `<Outlet/>` + `RouteCurtain` + `ScrollRestoration`）、`globals.css` 入口 | 1 h |
| 3 | **页面迁移**：`app/*/page.tsx` → `src/pages/*.tsx`（about 的 JSX 原样搬；noelite 的 `featured` 过滤搬到组件里）；`<PageMeta>`；`routes.meta.ts`；简单的 NotFound 页（沿用 Tron 风格） | 1 h |
| 4 | **机械替换**：`next/link` → `react-router` `Link`（7）；`usePathname`/`useRouter` → `useLocation`/`useNavigate`（3）；`next/image` → `<img>`（5）；`next/dynamic` → `React.lazy` + `Suspense`（2，`SideDisc` 要 Alex 同意）；`withBasePath` → `asset`（13）；删 `'use client'`（31） | 1.5 h |
| 5 | **字体 + 主题**：`src/fonts.css`、全局字体变量、woff2 preload；自写 `ThemeProvider` + `index.html` 防闪烁脚本；`ThemeSwitch` | 0.75 h |
| 6 | **过渡 + 预加载**：`preloadRoute`；`NavPill`/`Landing` 接入；`navigate` 时序；`RouteCurtain` 用 `useLocation`；验证帘幕、入场、`requestHomeExit`、重复点击、新标签页、reduced motion、无 WebGL | 1.5 h |
| 7 | **静态资源 + HTML 壳**：`public/og.png`、`icon.svg`、`favicon.ico` 移到 `public/`；`scripts/prerender-shells.mjs`（每路由 `index.html` + `404.html` + 可选 `sitemap.xml`/`robots.txt`）；`npm run build` = `tsc -b && vite build && node scripts/prerender-shells.mjs` | 1 h |
| 8 | **测试工具**：`scripts/serve-pages.mjs`（模拟 Pages）；`verify.mjs` 的 `launch` 改 `npm run build` + `serve-pages dist`，BASE 变成 `http://127.0.0.1:3100/portfolio`；`SKILL.md`、`features/*.md` 路径更新；现有临时验证脚本（sound/nav/gl）的 BASE 不变（已经是 `/portfolio`） | 1 h |
| 9 | **CI**：`deploy-pages.yml` 去掉 `GITHUB_PAGES`，`NEXT_PUBLIC_SITE_URL` → `VITE_SITE_URL`，`path: dist`；`package.json` scripts（`dev`/`build`/`preview`/`lint`/`typecheck`） | 0.5 h |
| 10 | **完整验证**（见第 5 节）+ 修 bug | 2.5 h |
| 11 | **文档**：新 SDD 031（vite-migration）+ INDEX；`architecture.md`、`file-structure.md`、`setup.md`、`README.md`；在 SDD 029/030 等提到 Next 的地方加注；列出 AGENTS.md / CLAUDE.md 需要 Alex 自己改的段落（不提交 AGENTS.md） | 1 h |
| 12 | **收尾**：删 `app/` 剩余文件、确认没有 `next` 字样残留（`rg "next/|NEXT_PUBLIC|GITHUB_PAGES"`）、最终构建、本地提交、准备 PR 描述（不 push，等 Alex） | 0.5 h |
| | **合计** | **约 14 h**（agent 实际工作时间；含 Alex 审阅和来回修改，预计 2 个工作日） |

合并后线上冒烟：约 0.5 h（深链刷新、OG 卡片调试器、过渡、声音）。

---

## 5. 验证清单

构建与静态检查
- [ ] `tsc -b`（noEmit）、`eslint .` 干净；`npm run build` 成功，`dist/` 内有 `index.html`、`{work,journey,about,noelite,noelite2,discs}/index.html`、`404.html`、`og.png`、`icon.svg`、`favicon.ico`、`worker.js`、`.nojekyll`、`thumbs/`、`portrait/`、`models/`
- [ ] 每个 HTML 壳的 `<title>`、`description`、`og:title/description/url/image`、`twitter:*`、`canonical` 正确，并且是绝对 URL
- [ ] `rg "next/|NEXT_PUBLIC|GITHUB_PAGES|'use client'"` 在源码中为 0
- [ ] 构建没有警告（模块级指令、chunk 过大另行记录）

页面（桌面 1440×900 DPR2、手机 390×844 DPR3 触屏，暗色和亮色），每页都和第 0 步基线截图对比
- [ ] `/`：粒子肖像、四角悬停/聚焦变形、手机首次点击只选中再点打开、联系窗（×、Esc、背景点击）、拖拽惯性、无 WebGL 回退、reduced motion
- [ ] `/work`：三种布局、缩略图（`asset` 路径）、coverflow（swiper）、albums 的 GridView 里 `Disc3D` 懒加载
- [ ] `/journey`：滚轮、拖拽、手机滑动、键盘、节点点击、hash 深链、粒子年份（尺寸、位置和基线一致）、鼠标推开、HEAD 三点、到达音效、reduced motion、无 WebGL
- [ ] `/noelite2`：3D scrub、名字粒子、回退、离开后 0 个 canvas
- [ ] `/noelite`：滚动故事、HeroMosaic、WorkScene 图片、ExitScene 链接
- [ ] `/about`：hex glow、marquee、footer 的 Gallery 站内链接
- [ ] `/discs`：三个版本，不改 30° 倾斜，`Disc3D` 懒加载
- [ ] 404：未知路径显示 NotFound，HTTP 404，`noindex`

过渡与导航
- [ ] 首页 → Work / Journey / About（角落和头部导航）：退场、帘幕顶 = 56 px、入场错开；直接访问、刷新、前进后退都没有入场；重复点击被吞掉；Cmd/中键点击新开标签页且没有过渡
- [ ] 悬停或聚焦后路由 chunk 已预取（Network 里点击前就有请求）；退场结束到新页首帧之间没有空白
- [ ] 帧时间：退场期间 rAF 中位数和最大值与 SDD 029 基线（16.7/16.8 ms）一致
- [ ] 滚动恢复：`/noelite` 中间 → `/work` → 后退回到原位置；切到新页时在顶部
- [ ] 每页只有一个 WebGL context；`/` ↔ `/journey` ↔ `/noelite2` 来回 5 次，没有 "Too many active WebGL contexts" 警告
- [ ] 头部当前项高亮、Tron/亮色/暗色样式；1440、390、360 宽都放得下

声音（沿用 `/tmp/snd-verify.mjs` 的 AudioContext 插桩，只改 BASE）
- [ ] 结果和 2026-10-18 的 `results.json` 完全一致：头部 5 个目标、角落 01–04、联系窗关闭 3 种方式、journey 到达和 HEAD、退场时重复点击只响一次、Cmd 点击无声、手机 tick → blip、开关关闭后跨路由和刷新都保持静音；AudioContext 跨路由只有 1 个；首次交互前没有声音；没有 autoplay 警告

主题与字体
- [ ] 首次加载没有主题闪烁（暗色系统 + 冷启动录屏）；切换主题动画；`localStorage['theme']` 旧值仍然生效
- [ ] 字体：Inter、Oxanium、Share Tech Mono 加载（`document.fonts.check`），没有 FOUT 跳动

GH Pages 模拟（`serve-pages.mjs`），合并后再在线上复测
- [ ] 每个路由直接打开、带斜杠和不带斜杠、刷新都是 200 且页面正确；`/journey/#<hash>` 深链刷新正确
- [ ] OG：用分享卡片调试工具（如 opengraph.xyz）检查首页和 `/journey/`，图片和标题正确
- [ ] 线上 console 没有错误

包体积对比（与第 0 步基线）
- [ ] 每个路由首屏 JS（gzip）和 CSS；`dist` 总量和 `out` 总量；首页首屏 JS 不应变大；表格写进 SDD 031

媒体保存到 `/workspace/portfolio/shots/vite-migration/`（截图、`results.json`、体积对比表）。

---

## 6. 待 Alex 拍板

1. React Router 用最新 v8，还是锁 v7（推荐：先看 v8 changelog，没有阻碍就用 v8）。
2. 方案 C（每路由 HTML 壳）而不是完整预渲染：确认接受首屏 HTML 没有正文。
3. `components/discs/SideDisc.tsx` 里 `next/dynamic` → `React.lazy` 的机械改动是否允许（只改 import，不碰倾斜逻辑）。
4. 主题换成自写 provider（推荐），还是保留 `next-themes`。
5. 合并后把 pf3000 换成 `vite --port 3000`（地址变成 `http://localhost:3000/portfolio/`）。
6. AGENTS.md / CLAUDE.md 里关于 Next 的段落要 Alex 自己改（AGENTS.md 不由 agent 提交）。
