import type { Metadata } from 'next'
import Link from 'next/link'
import { site } from '@/data/site'

export const metadata: Metadata = {
  title: 'About',
  description: `${site.fullName} — ${site.role} in ${site.location}. ${site.tagline}`,
}

const links = [
  { href: `mailto:${site.email}`, label: 'Email', external: false },
  { href: site.github, label: 'GitHub', external: true },
  { href: site.linkedin, label: 'LinkedIn', external: true },
  { href: site.resume, label: 'Resume', external: true },
]

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-[#eeeeee] px-5 pt-20 pb-16 dark:bg-[#0d0d0d]">
      <article className="mx-auto max-w-xl">
        <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-[#888] uppercase">
          {site.role} · {site.location}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#111] dark:text-white">
          {site.fullName}
        </h1>
        <p className="mt-4 text-[0.95rem] leading-relaxed text-[#444] dark:text-[#ccc]">
          I build games, 3D sketches, and web apps — then put them in a live gallery so you can
          try them instead of only reading about them. Most of the work here is Phaser, Three.js,
          React, and Next.js.
        </p>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[#444] dark:text-[#ccc]">
          {site.education}. Badminton on the side. Code on GitHub as{' '}
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-black/20 underline-offset-2 hover:decoration-black/50 dark:decoration-white/30"
          >
            {site.githubUser}
          </a>
          .
        </p>

        <h2 className="mt-10 text-[0.7rem] font-semibold tracking-[0.2em] text-[#888] uppercase">
          Focus
        </h2>
        <ul className="mt-3 space-y-2 text-[0.95rem] text-[#333] dark:text-[#ddd]">
          {site.highlights.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-[#888]" aria-hidden />
              {item}
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-[0.7rem] font-semibold tracking-[0.2em] text-[#888] uppercase">
          Contact
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="inline-block rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-[0.8rem] font-medium text-[#333] transition hover:bg-black/5 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-[#ddd] dark:hover:bg-white/8"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-12">
          <Link
            href="/"
            className="text-[0.8rem] font-medium text-[#555] underline decoration-black/15 underline-offset-2 hover:text-[#111] dark:text-[#aaa] dark:hover:text-white"
          >
            Back to gallery
          </Link>
        </p>
      </article>
    </main>
  )
}
