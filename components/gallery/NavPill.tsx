'use client'

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PillButton } from '@/components/gallery/PillButton'
import ThemeSwitch from '@/components/ThemeSwitch'
import headerNavLinks from '@/data/headerNavLinks'
import { site } from '@/data/site'

const NAV_LINKS = headerNavLinks

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.395-.135-.345-.72-1.395-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path
        d="M3.5 6.75A1.75 1.75 0 0 1 5.25 5h13.5A1.75 1.75 0 0 1 20.5 6.75v10.5A1.75 1.75 0 0 1 18.75 19H5.25A1.75 1.75 0 0 1 3.5 17.25V6.75Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M4 7l8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const iconLinks = [
  { href: site.github, Icon: GithubIcon, label: 'GitHub', fill: true },
  { href: site.linkedin, Icon: LinkedInIcon, label: 'LinkedIn', fill: true },
  { href: `mailto:${site.email}`, Icon: MailIcon, label: 'Email', fill: false },
] as const

export function NavPill() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed top-3 left-[calc(100vw-0.75rem)] z-50 flex -translate-x-full items-center gap-px rounded-full bg-white p-1.5 shadow-[0_1px_6px_rgb(0_0_0/0.08)] ring-1 ring-black/5 sm:left-[calc(100vw-1.75rem)] dark:bg-[#1a1a1a] dark:shadow-[0_1px_6px_rgb(0_0_0/0.3)] dark:ring-white/10"
      aria-label="Site navigation"
    >
      {NAV_LINKS.map(({ href, title }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`grid h-[1.8rem] place-items-center rounded-full px-3 text-[0.75rem] font-medium transition-colors duration-150 ${
              active
                ? 'bg-black/8 text-[#111] dark:bg-white/12 dark:text-white'
                : 'text-[#555] hover:bg-black/6 hover:text-[#111] dark:text-[#aaa] dark:hover:bg-white/8 dark:hover:text-white'
            }`}
          >
            {title}
          </Link>
        )
      })}

      <span className="mx-0.5 hidden h-4 w-px bg-black/10 sm:block dark:bg-white/10" aria-hidden />

      <div className="hidden items-center gap-px sm:flex">
        <PillButton
          tooltip="Theme"
          className="grid h-[1.8rem] w-[1.8rem] place-items-center"
        >
          <ThemeSwitch />
        </PillButton>

        {iconLinks.map(({ href, Icon, label, fill }) => (
          <PillButton
            key={label}
            tooltip={label}
            href={href}
            target={href.startsWith('mailto:') ? undefined : '_blank'}
            rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            aria-label={label}
            className="grid h-[1.8rem] w-[1.8rem] place-items-center"
          >
            <Icon className={`h-[0.95rem] w-[0.95rem] ${fill ? 'fill-current' : ''}`} />
          </PillButton>
        ))}
      </div>

      <MobileMoreMenu />
    </nav>
  )
}

function MobileMoreMenu() {
  return (
    <Menu as="div" className="relative sm:hidden">
      <MenuButton
        aria-label="More actions"
        className="grid h-[1.8rem] w-[1.8rem] place-items-center rounded-full text-[#555] transition-colors duration-150 hover:bg-black/6 hover:text-[#111] dark:text-[#aaa] dark:hover:bg-white/8 dark:hover:text-white"
      >
        <svg viewBox="0 0 16 16" aria-hidden className="h-[0.95rem] w-[0.95rem] fill-current">
          <circle cx="3" cy="8" r="1.25" />
          <circle cx="8" cy="8" r="1.25" />
          <circle cx="13" cy="8" r="1.25" />
        </svg>
      </MenuButton>

      <MenuItems className="absolute top-full right-0 z-[60] mt-2 min-w-[12rem] rounded-2xl bg-white p-2 shadow-[0_10px_30px_rgb(0_0_0/0.12)] ring-1 ring-black/5 focus:outline-none dark:bg-[#1a1a1a] dark:ring-white/10">
        <div className="flex flex-col gap-1">
          <MobileThemeRow />

          <div className="my-1 h-px bg-black/10 dark:bg-white/10" />

          {iconLinks.map(({ href, Icon, label, fill }) => (
            <MenuItem key={label}>
              <a
                href={href}
                target={href.startsWith('mailto:') ? undefined : '_blank'}
                rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                className="flex h-10 items-center rounded-xl px-3 text-[#555] transition-colors hover:bg-black/6 hover:text-[#111] dark:text-[#aaa] dark:hover:bg-white/8 dark:hover:text-white"
              >
                <span className="text-[0.8rem] font-medium">{label}</span>
                <Icon className={`ml-auto h-[0.95rem] w-[0.95rem] ${fill ? 'fill-current' : ''}`} />
              </a>
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  )
}

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Auto' },
] as const

function MobileThemeRow() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="flex h-10 items-center rounded-xl px-3 text-[#555] dark:text-[#aaa]">
      <span className="text-[0.8rem] font-medium">Theme</span>
      <div className="ml-auto flex gap-1">
        {themeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`rounded-lg px-2 py-1 text-[0.7rem] font-medium transition-colors ${
              theme === opt.value
                ? 'bg-black/8 text-[#111] dark:bg-white/12 dark:text-white'
                : 'text-[#999] hover:text-[#555] dark:text-[#666] dark:hover:text-[#aaa]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
