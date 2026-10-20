export type Demo = {
  name: string
  slug: string
  /** Illustrated SVG fallback. */
  thumb: string
  /** Real 1440x900 screenshot from scripts/shoot-thumbs.mjs. */
  shot?: string
  /** Page to capture for `shot` when it differs from embedUrl (scripts/shoot-thumbs.mjs). */
  shotUrl?: string
  embedUrl: string
  liveUrl?: string
  repoUrl?: string
  blurb: string
  tags: string[]
  isNew?: boolean
  embeddable?: boolean
  note?: string
  featured?: boolean
}

export function demoLiveUrl(demo: Demo) {
  return demo.liveUrl ?? demo.embedUrl
}

/** Best preview image: the real screenshot when there is one, else the SVG. Pass through withBasePath. */
export function demoThumb(demo: Demo) {
  return demo.shot ?? demo.thumb
}

export const demos: Demo[] = [
  {
    name: 'Bukit Jalil Sports City',
    slug: 'bukitjalil-pavilion-infographic',
    thumb: '/thumbs/bukitjalil-pavilion-infographic.svg',
    shot: '/thumbs/bukitjalil-pavilion-infographic.webp',
    embedUrl: 'https://noowxela.github.io/bukitjalil-pavilion-infographic/#00',
    repoUrl: 'https://github.com/noowxela/bukitjalil-pavilion-infographic',
    blurb: 'A 3D scrollytelling infographic of Bukit Jalil Sports City: Pavilion, the National Sports Complex and Bukit Jalil City.',
    tags: ['Three.js', 'TypeScript', 'Infographic'],
    isNew: true,
    note: 'Ten chapters walk from the overview orbit through landmarks, LRT Line 4, roads, massing, walking routes and weather, in English, Chinese and Malay. The map comes from OpenStreetMap.',
  },
  {
    name: 'GLB Viewer',
    slug: 'glb-viewer',
    thumb: '/thumbs/glb-viewer.svg',
    shot: '/thumbs/glb-viewer.webp',
    embedUrl: 'https://noowxela.github.io/glb-viewer/',
    repoUrl: 'https://github.com/noowxela/glb-viewer',
    blurb: 'A local browser viewer for .glb and .gltf models, built with Three.js and React.',
    tags: ['Three.js', 'React', 'TypeScript'],
    isNew: true,
    note: 'Drop in a model and orbit it in the browser. The default is a transformed Porsche 911 Carrera 4S by Karol Miklas (CC BY-SA 4.0).',
  },
  {
    name: 'Mount Replay',
    slug: 'mount-replay',
    thumb: '/thumbs/mount-replay.svg',
    shot: '/thumbs/mount-replay.webp',
    embedUrl: 'https://noowxela.github.io/mount-replay/',
    repoUrl: 'https://github.com/noowxela/mount-replay',
    blurb: 'Replay the two-day Mount Kinabalu climb over 3D dot terrain, and drop your own photos onto the trail.',
    tags: ['Three.js', 'TypeScript', '3D'],
    isNew: true,
    note: 'Copernicus elevation drawn as a dot cloud with contour lines, checkpoints from Timpohon Gate to Low’s Peak, and an elevation timeline. Your photos and videos (including HEIC) are placed on the trail from their GPS and capture time, entirely in the browser.',
  },
  {
    name: 'KL Eco City – Mid Valley',
    slug: 'klec-midvalley-infographic',
    thumb: '/thumbs/klec-midvalley-infographic.svg',
    shot: '/thumbs/klec-midvalley-infographic.webp',
    embedUrl: 'https://noowxela.github.io/klec-midvalley-infographic/',
    repoUrl: 'https://github.com/noowxela/klec-midvalley-infographic',
    blurb: 'A 3D scrollytelling infographic of KL Eco City, The Gardens and Mid Valley around Abdullah Hukum station.',
    tags: ['Three.js', 'TypeScript', 'Infographic'],
    isNew: true,
    note: 'Nine chapters walk through the rail-and-mall cluster on the Klang River on a fixed 1920×1080 stage, in English, Chinese and Malay. The map comes from a shared OpenStreetMap pipeline.',
  },
  {
    name: 'Hanabi Taikai',
    slug: 'hanabi-taikai',
    thumb: '/thumbs/hanabi-taikai.svg',
    shot: '/thumbs/hanabi-taikai.webp',
    embedUrl: 'https://noowxela.github.io/hanabi-taikai/',
    repoUrl: 'https://github.com/noowxela/hanabi-taikai',
    blurb: 'A pixel-art 3D browser game: walk a Japanese campfire-festival town and sit by the fire.',
    tags: ['Three.js', 'TypeScript', 'Game'],
    isNew: true,
    note: 'Geometry is built in code, rendered at low resolution, scaled up with nearest-neighbour sampling and snapped to a fixed palette. Four locations to visit, with saves in localStorage.',
  },
  {
    name: 'Food Picker Catmeme',
    slug: 'food-picker-catmeme',
    thumb: '/thumbs/food-picker-catmeme.svg',
    shot: '/thumbs/food-picker-catmeme.webp',
    embedUrl: 'https://noowxela.github.io/food-picker-catmeme/',
    repoUrl: 'https://github.com/noowxela/food-picker-catmeme',
    blurb: 'A lunch picker with cat cards: hover a cat to reveal a restaurant, then choose lunch.',
    tags: ['jQuery', 'Express', 'MongoDB'],
    note: 'Built from an interview brief: a jQuery and Bootstrap front end over an Express and MongoDB Atlas API, with photos from The Cat API. The API runs on a free tier, so the first request after a nap can be slow.',
  },
  {
    name: 'Japan Trip',
    slug: 'japan-trip',
    thumb: '/thumbs/japan-trip.svg',
    shot: '/thumbs/japan-trip.webp',
    embedUrl: 'https://japan-trip-pi-indol.vercel.app/schedule',
    liveUrl: 'https://japan-trip-pi-indol.vercel.app/',
    shotUrl: 'https://japan-trip-pi-indol.vercel.app/schedule?day=3cbb5fd4-cdf7-8174-863b-e28a86c1c109',
    repoUrl: 'https://github.com/noowxela/japan-trip',
    blurb: 'A mobile-first trip itinerary app with Notion as the source of truth.',
    tags: ['Next.js', 'Notion'],
    note: 'The itinerary, maps and spending live in Notion databases. Anyone can view it, and editors unlock with a PIN.',
  },
  {
    name: 'Phaser Examples',
    slug: 'phaser-examples',
    thumb: '/thumbs/phaser-examples.svg',
    shot: '/thumbs/phaser-examples.webp',
    embedUrl: 'https://noowxela.github.io/phaser-examples/games/index.html',
    liveUrl: 'https://noowxela.github.io/phaser-examples/',
    repoUrl: 'https://github.com/noowxela/phaser-examples',
    blurb: 'A collection of Phaser 2 and Phaser 3 games you can play in the browser.',
    tags: ['Phaser', 'Canvas', 'Games'],
    isNew: true,
    featured: true,
    note: 'A growing set of browser games built with Phaser 2 and Phaser 3. The gallery is the easiest way to jump between titles without leaving the page. Start here if you want to see how I think about playable, self-contained experiments.',
  },
  {
    name: 'My Reborn Car',
    slug: 'my-reborn-car',
    thumb: '/thumbs/my-reborn-car.svg',
    shot: '/thumbs/my-reborn-car.webp',
    embedUrl: 'https://noowxela.github.io/car/',
    repoUrl: 'https://github.com/noowxela/car',
    blurb: 'A Three.js car you can orbit, inspect, and drive around in the browser.',
    tags: ['Three.js', 'WebGL'],
    featured: true,
    note: 'A small Three.js scene built around a car model — camera controls, lighting, and a sense of material rather than a full racing sim. It is a study in putting 3D on the web without a heavy engine.',
  },
  {
    name: 'HackerNews Next',
    slug: 'hackernews-next',
    thumb: '/thumbs/hackernews-next.svg',
    shot: '/thumbs/hackernews-next.webp',
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
    shot: '/thumbs/notion-blog.webp',
    embedUrl: 'https://notion-blog-mu-peach.vercel.app/',
    repoUrl: 'https://github.com/noowxela/notion-blog',
    blurb: 'A Next.js blog backed by the Notion public API.',
    tags: ['Next.js', 'Notion'],
    note: 'Posts live in Notion; the site is a Next.js frontend over the public API. The point was a writing workflow that does not need a custom CMS, while still shipping as a normal website.',
  },
  {
    name: 'Interactive Experiences',
    slug: 'interactive-experiences',
    thumb: '/thumbs/interactive-experiences.svg',
    shot: '/thumbs/interactive-experiences.webp',
    embedUrl: 'https://noowxela.github.io/interactiveExperiences/',
    repoUrl: 'https://github.com/noowxela/interactiveExperiences',
    blurb: 'A handful of mini-games and interactive sketches in one place.',
    tags: ['Games', 'JavaScript'],
    featured: true,
    note: 'Short interactive sketches and mini-games collected on one page. Built to try ideas quickly — input, timing, and small loops — without turning each sketch into a full product.',
  },
  {
    name: 'UI Component Library',
    slug: 'ui-component-library',
    thumb: '/thumbs/ui-component-library.svg',
    shot: '/thumbs/ui-component-library.webp',
    embedUrl: 'https://noowxela.github.io/ui-component-library/?path=/docs/configure-your-project--docs',
    liveUrl: 'https://noowxela.github.io/ui-component-library/',
    repoUrl: 'https://github.com/noowxela/ui-component-library',
    blurb: 'A Rollup-built React component library documented in Storybook.',
    tags: ['React', 'Storybook', 'Rollup'],
    note: 'A boilerplate React component library bundled with Rollup and documented in Storybook. The embed is the Storybook docs; open the live site if you want the full sidebar and controls.',
  },
]
