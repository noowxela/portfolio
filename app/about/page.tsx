import type { Metadata } from 'next'
import { Oxanium } from 'next/font/google'
import Link from 'next/link'
import { AboutHexGlow } from '@/components/about/AboutHexGlow'
import { HeroName } from '@/components/archive/home/HeroName'
import { HeroRole } from '@/components/archive/home/HeroRole'
import { site } from '@/data/site'
import '@/components/home/tron.css'

const display = Oxanium({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'About',
  description: `${site.fullName} — ${site.role} in ${site.location}. ${site.tagline}`,
}

const columns = [
  {
    title: 'Contact',
    links: [
      { href: `mailto:${site.email}`, label: site.email, external: false },
    ],
  },
  {
    title: 'Social',
    links: [
      { href: site.github, label: 'GitHub', external: true },
      { href: site.linkedin, label: 'LinkedIn', external: true },
    ],
  },
  {
    title: 'Others',
    links: [
      { href: site.resume, label: 'Resume', external: true },
      { href: '/work', label: 'Gallery', external: false },
    ],
  },
] as const

export default function AboutPage() {
  return (
    <main className="about-page relative flex min-h-dvh flex-col bg-[#eeeeee] px-6 pt-28 sm:px-10 dark:bg-[#0d0d0d]">
      <div className="about-hex-field" aria-hidden>
        <div className="about-hex-grid" />
        <AboutHexGlow />
      </div>
      <article className={`${display.variable} about-intro relative z-10 mx-auto w-full max-w-2xl flex-1`}>
        <HeroName />
        <HeroRole />
        <p className="mt-8 text-base leading-7 text-[#444] dark:text-[#ccc]">
          I build games, 3D sketches, and web apps — then put them in a live gallery so you can
          try them instead of only reading about them. Most of the work here is Phaser, Three.js,
          React, and Next.js.
        </p>
        <p className="mt-5 text-base leading-7 text-[#444] dark:text-[#ccc]">
          {site.education}.
        </p>

        <h2 className="mt-16 text-[0.7rem] font-semibold tracking-[0.2em] text-[#888] uppercase">
          Focus
        </h2>
        <ul className="mt-5 space-y-3 text-base text-[#333] dark:text-[#ddd]">
          {site.highlights.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-[#888]" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </article>

      <footer className="relative z-10 mx-auto mt-24 w-full max-w-2xl border-t border-black/10 py-12 dark:border-white/10">
        <div className="grid grid-cols-3 gap-8">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-[0.7rem] font-semibold tracking-[0.2em] text-[#888] uppercase">
                {column.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link
                        href={link.href}
                        className="text-[0.85rem] break-all text-[#333] underline decoration-black/15 underline-offset-2 hover:text-[#111] dark:text-[#ddd] dark:decoration-white/20 dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="text-[0.85rem] break-all text-[#333] underline decoration-black/15 underline-offset-2 hover:text-[#111] dark:text-[#ddd] dark:decoration-white/20 dark:hover:text-white"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </main>
  )
}
