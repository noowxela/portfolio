import { site } from '@/data/site'

export type EntryId = 'work' | 'journey' | 'about' | 'contact'
export type Corner = 'tl' | 'tr' | 'bl' | 'br'

export type Entry = {
  id: EntryId
  no: string
  /** Small mono "file" label above the title. */
  label: string
  title: string
  corner: Corner
  /** Route for next/link. Entries without one open a panel instead. */
  href?: string
}

export const ENTRIES: readonly Entry[] = [
  { id: 'work', no: '01', label: 'gallery.grid', title: 'Work', corner: 'tl', href: '/work' },
  { id: 'journey', no: '02', label: 'journey.run', title: 'Journey', corner: 'tr', href: '/journey' },
  { id: 'about', no: '03', label: 'profile.sys', title: 'About', corner: 'bl', href: '/about' },
  { id: 'contact', no: '04', label: 'contact.app', title: 'Contact', corner: 'br' },
]

/** Same links as the /noelite exit scene and the nav's "available" menu. */
export const CONTACT_LINKS = [
  { href: `mailto:${site.email}`, label: 'Email', value: site.email, external: false },
  { href: site.github, label: 'GitHub', value: `github.com/${site.githubUser}`, external: true },
  { href: site.linkedin, label: 'LinkedIn', value: 'in/alex-woon-jun-rong', external: true },
  { href: site.resume, label: 'Resume', value: 'Alex_Woon_Jun_Rong_Resume.pdf', external: true },
] as const
