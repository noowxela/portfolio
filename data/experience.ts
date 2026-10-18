/**
 * Work experience for /journey ("grid.log"). Source: Alex's resume
 * (site.resume, FlowCV export of 2026-08-19), lightly condensed, nothing added.
 * Locations and employment types are not on the resume, so they are left out.
 * Tags only name technologies the resume bullets name.
 */

export type Branch = 'edu' | 'main'

export type Step = {
  id: string
  branch: Branch
  /** Resume dates, `MM/YYYY`. `to: null` would mean "present"; none today. */
  from: string
  to: string | null
  /** Short label drawn as particles behind the panel. */
  mark: string
  title: string
  /** Short name on the branch rail. */
  short: string
  role: string
  /** Only when the resume gives one. */
  place?: string
  href?: string
  /** Commit message line above the title. */
  message: string
  facts: string[]
  tags: string[]
}

export type HeadStep = {
  id: 'head'
  branch: 'main'
  mark: string
  title: string
  role: string
  message: string
  /** Resume summary, verbatim. */
  summary: string
}

export const STEPS: readonly Step[] = [
  {
    id: 'mmu',
    branch: 'edu',
    from: '06/2016',
    to: '11/2020',
    mark: '2016–20',
    title: 'Multimedia University',
    short: 'MMU',
    role: 'Bachelor of Computer Science (Data Science)',
    place: 'Cyberjaya',
    message: 'edu: B.Sc. Computer Science (Data Science)',
    facts: [],
    tags: ['computer science', 'data science'],
  },
  {
    id: 'auronex',
    branch: 'main',
    from: '05/2021',
    to: '07/2023',
    mark: '2021–23',
    title: 'Auronex Sdn Bhd',
    short: 'Auronex',
    role: 'Software Engineer',
    href: 'https://auronex.com/',
    message: "merge 'edu' → feat: software engineer, Auronex",
    facts: [
      'API, dashboard and payment gateway integrations for a doctor-patient appointment booking app, with e-commerce shop item configuration and CMS blog content.',
      'A Stage Screen UI and API for controlling a digital MIDI light console, and an Electron Windows app for mobile users to interact in chat and game rooms.',
      'Smart contracts, a web3 listener and an API for an NFT staking game on the BNB Chain: ERC-1155 contracts in Solidity, listener for on-chain data.',
      'A Python Selenium scraping bot, API and dashboard for task automation and result monitoring, deployed on Windows.',
    ],
    tags: ['electron', 'solidity', 'erc-1155', 'bnb chain', 'python', 'selenium'],
  },
  {
    id: 'oasis',
    branch: 'main',
    from: '11/2023',
    to: '02/2025',
    mark: '2023–25',
    title: 'Oasis Interactive Malaysia Sdn Bhd',
    short: 'Oasis',
    role: 'Frontend Developer',
    message: 'feat(frontend): frontend developer, Oasis Interactive',
    facts: [
      'A multi-tenant broadcasting platform with blogging, video streaming and chat.',
      'A multi-tenant SEO marketing site using Handlebars.js for dynamic content rendering.',
    ],
    tags: ['handlebars.js'],
  },
  {
    id: 'trinergy',
    branch: 'main',
    from: '02/2025',
    to: '08/2026',
    mark: '2025–26',
    title: 'Trinergy Digital Sdn Bhd',
    short: 'Trinergy',
    role: 'Full-Stack Developer',
    href: 'https://www.linkedin.com/company/trinergy-digital/',
    message: 'feat(full-stack): full-stack developer, Trinergy Digital',
    facts: [
      'Full-stack business applications: Laravel APIs, Vue.js frontend, database setup, testing and deployment to on-premises Windows IIS servers.',
      'Cross-platform mobile apps with Expo and React Native: app flows, reusable UI components, API integration, state management and backend connectivity.',
      'Led a team of 3 developers (Agile and hybrid): task planning, technical implementation, troubleshooting and delivery.',
      'Worked with Account, Design, Finance and IT teams to clarify requirements, review Figma designs and resolve technical issues.',
      "Integrated payment gateway transactions with the client's internal Oracle database, processed into invoice and cost order receipt records.",
      'AI-assisted development and Spec-Driven Development (SDD), backed by a Markdown knowledge center of workflows, business logic and architecture.',
    ],
    tags: ['laravel', 'vue.js', 'expo', 'react native', 'oracle', 'windows iis'],
  },
]

export const HEAD: HeadStep = {
  id: 'head',
  branch: 'main',
  mark: 'NEXT',
  title: 'Next commit',
  role: 'Full-Stack Developer · available',
  message: 'HEAD → main: next commit pending',
  summary:
    'Full-Stack Developer with 5+ years of experience delivering web and mobile applications across the full development lifecycle. Experienced in end-to-end development, database integration, on-premises deployment, team leadership, and cross-functional collaboration.',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parse(d: string) {
  const [m, y] = d.split('/').map(Number)
  return { m, y }
}

/** `05/2021` → `May 2021`. */
export function formatMonth(d: string) {
  const { m, y } = parse(d)
  return `${MONTHS[m - 1]} ${y}`
}

/** Short stable hex id per step, shown as the commit hash. */
export function commitHash(id: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 6)
}
