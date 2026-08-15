export type Demo = {
  name: string
  slug: string
  thumb: string
  embedUrl: string
  liveUrl?: string
  repoUrl?: string
  blurb: string
  tags: string[]
  isNew?: boolean
  embeddable?: boolean
  note?: string
}

export function demoLiveUrl(demo: Demo) {
  return demo.liveUrl ?? demo.embedUrl
}

export const demos: Demo[] = [
  {
    name: 'Phaser Examples',
    slug: 'phaser-examples',
    thumb: '/thumbs/phaser-examples.svg',
    embedUrl: 'https://noowxela.github.io/phaser-examples/games/index.html',
    liveUrl: 'https://noowxela.github.io/phaser-examples/',
    repoUrl: 'https://github.com/noowxela/phaser-examples',
    blurb: 'A collection of Phaser 2 and Phaser 3 games you can play in the browser.',
    tags: ['Phaser', 'Canvas', 'Games'],
    isNew: true,
    note: 'A growing set of browser games built with Phaser 2 and Phaser 3. The gallery is the easiest way to jump between titles without leaving the page. Start here if you want to see how I think about playable, self-contained experiments.',
  },
  {
    name: 'My Reborn Car',
    slug: 'my-reborn-car',
    thumb: '/thumbs/my-reborn-car.svg',
    embedUrl: 'https://noowxela.github.io/car/',
    repoUrl: 'https://github.com/noowxela/car',
    blurb: 'A Three.js car you can orbit, inspect, and drive around in the browser.',
    tags: ['Three.js', 'WebGL'],
    note: 'A small Three.js scene built around a car model — camera controls, lighting, and a sense of material rather than a full racing sim. It is a study in putting 3D on the web without a heavy engine.',
  },
  {
    name: 'HackerNews Next',
    slug: 'hackernews-next',
    thumb: '/thumbs/hackernews-next.svg',
    embedUrl: 'https://hackernews-next-kappa.vercel.app/',
    repoUrl: 'https://github.com/noowxela/hackernews-next',
    blurb: 'A Hacker News reader rebuilt with Next.js and the public HN API.',
    tags: ['Next.js', 'React'],
    note: 'A Hacker News client as a Next.js exercise: listing stories, threading comments, and keeping the UI fast. Useful as a compact example of data fetching and familiar information architecture.',
  },
  {
    name: 'Notion Blog',
    slug: 'notion-blog',
    thumb: '/thumbs/notion-blog.svg',
    embedUrl: 'https://notion-blog-mu-peach.vercel.app/',
    repoUrl: 'https://github.com/noowxela/notion-blog',
    blurb: 'A Next.js blog backed by the Notion public API.',
    tags: ['Next.js', 'Notion'],
    note: 'Posts live in Notion; the site is a Next.js frontend over the public API. The point was a writing workflow that does not need a custom CMS, while still shipping as a normal website.',
  },
  {
    name: 'Movies App',
    slug: 'movies-app',
    thumb: '/thumbs/movies-app.svg',
    embedUrl: 'https://movies-one-pi.vercel.app/?category=Popular&page=1',
    liveUrl: 'https://movies-one-pi.vercel.app/',
    repoUrl: 'https://github.com/noowxela/movies',
    blurb: 'Browse popular titles with TMDB — posters, categories, and pagination.',
    tags: ['React', 'TMDB'],
    note: 'A learning app on the TMDB API: category filters, pagination, and poster-forward browsing. It is a straightforward client for a public movie catalog.',
  },
  {
    name: 'Interactive Experiences',
    slug: 'interactive-experiences',
    thumb: '/thumbs/interactive-experiences.svg',
    embedUrl: 'https://noowxela.github.io/interactiveExperiences/',
    repoUrl: 'https://github.com/noowxela/interactiveExperiences',
    blurb: 'A handful of mini-games and interactive sketches in one place.',
    tags: ['Games', 'JavaScript'],
    note: 'Short interactive sketches and mini-games collected on one page. Built to try ideas quickly — input, timing, and small loops — without turning each sketch into a full product.',
  },
  {
    name: 'UI Component Library',
    slug: 'ui-component-library',
    thumb: '/thumbs/ui-component-library.svg',
    embedUrl: 'https://noowxela.github.io/ui-component-library/?path=/docs/configure-your-project--docs',
    liveUrl: 'https://noowxela.github.io/ui-component-library/',
    repoUrl: 'https://github.com/noowxela/ui-component-library',
    blurb: 'A Rollup-built React component library documented in Storybook.',
    tags: ['React', 'Storybook', 'Rollup'],
    note: 'A boilerplate React component library bundled with Rollup and documented in Storybook. The embed is the Storybook docs; open the live site if you want the full sidebar and controls.',
  },
  {
    name: 'Teppan Catch',
    slug: 'teppan-catch',
    thumb: '/thumbs/teppan-catch.svg',
    embedUrl: 'https://noowxela.github.io/Teppan-Catch/',
    repoUrl: 'https://github.com/noowxela/Teppan-Catch',
    blurb: 'A Phaser 3 catching game — keep the teppan from going hungry.',
    tags: ['Phaser 3', 'Game'],
    note: 'A Phaser 3 mini-game about catching falling food on a teppan. Small scope, readable loop, and a complete playable build on GitHub Pages.',
  },
]
