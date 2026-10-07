'use client'

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import headerNavLinks from '@/data/headerNavLinks'
import { site } from '@/data/site'

const PAGE_LINKS = headerNavLinks.filter((link) => link.href !== '/')

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

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname || '/'
}

const iconLinks = [
  { href: site.github, Icon: GithubIcon, label: 'GitHub', fill: true },
  { href: site.linkedin, Icon: LinkedInIcon, label: 'LinkedIn', fill: true },
  { href: `mailto:${site.email}`, Icon: MailIcon, label: 'Email', fill: false },
] as const

export function NavPill() {
  const pathname = usePathname()
  const onHome = normalizePath(pathname) === '/'

  return (
    <nav
      className={
        onHome
          ? 'site-nav fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--tron,#5ce1ff)_55%,transparent)] bg-[#07080c]/88 pr-4 text-[#d7f6ff] backdrop-blur-md sm:pr-6'
          : 'site-nav fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-3 border-b border-black/8 bg-white/92 pr-4 backdrop-blur-md sm:pr-6 dark:border-white/10 dark:bg-[#111]/92'
      }
      data-surface={onHome ? 'tron' : undefined}
      aria-label="Site navigation"
    >
      <div className="flex h-full min-w-0 items-center self-stretch">
        <Link
          href="/"
          className={`grid h-full shrink-0 place-items-center px-4 text-[0.78rem] font-medium tracking-tight transition-colors duration-150 sm:px-6 ${
            onHome
              ? 'text-white hover:bg-[color-mix(in_srgb,var(--tron,#5ce1ff)_72%,transparent)] hover:text-[#041016] hover:shadow-[inset_0_0_14px_var(--tron,#5ce1ff),0_0_16px_color-mix(in_srgb,var(--tron,#5ce1ff)_75%,transparent)]'
              : 'text-[#111] hover:bg-[color-mix(in_srgb,#5ce1ff_72%,transparent)] hover:text-[#041016] hover:shadow-[inset_0_0_14px_#5ce1ff,0_0_16px_color-mix(in_srgb,#5ce1ff_75%,transparent)] dark:text-white dark:hover:text-[#041016]'
          }`}
        >
          alexW
        </Link>
        <HeaderRule onHome={onHome} />
        {PAGE_LINKS.map(({ href, title }) => {
          const active = normalizePath(pathname) === normalizePath(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`group grid h-full place-items-center px-2.5 text-[0.75rem] font-medium transition-colors duration-150 sm:px-3 ${
                active
                  ? onHome
                    ? 'text-[var(--tron,#5ce1ff)] [text-shadow:0_0_12px_color-mix(in_srgb,var(--tron,#5ce1ff)_85%,transparent)]'
                    : 'text-[#5ce1ff] [text-shadow:0_0_12px_color-mix(in_srgb,#5ce1ff_85%,transparent)]'
                  : onHome
                    ? 'text-[#b7e7f2] hover:text-white'
                    : 'text-[#555] hover:text-[#111] dark:text-[#aaa] dark:hover:text-white'
              }`}
            >
              <span className="inline-flex items-center">
                <span
                  aria-hidden
                  className={`inline-block overflow-hidden transition-all duration-200 ease-out ${
                    active
                      ? 'max-w-4 pr-1.5 opacity-100'
                      : 'max-w-0 opacity-0 group-hover:max-w-4 group-hover:pr-1.5 group-hover:opacity-100 group-focus-visible:max-w-4 group-focus-visible:pr-1.5 group-focus-visible:opacity-100'
                  }`}
                >
                  [
                </span>
                {title}
                <span
                  aria-hidden
                  className={`inline-block overflow-hidden transition-all duration-200 ease-out ${
                    active
                      ? 'max-w-4 pl-1.5 opacity-100'
                      : 'max-w-0 opacity-0 group-hover:max-w-4 group-hover:pl-1.5 group-hover:opacity-100 group-focus-visible:max-w-4 group-focus-visible:pl-1.5 group-focus-visible:opacity-100'
                  }`}
                >
                  ]
                </span>
              </span>
            </Link>
          )
        })}
      </div>

      <div className="flex h-full items-center self-stretch">
        <HeaderRule onHome={onHome} />
        <AvailableMenu onHome={onHome} />
        <HeaderRule onHome={onHome} />
        <HeaderClock onHome={onHome} />
      </div>
    </nav>
  )
}

function HeaderRule({ onHome }: { onHome: boolean }) {
  return (
    <span
      className={`w-px self-stretch ${onHome ? 'bg-white/25' : 'bg-black/15 dark:bg-white/20'}`}
      aria-hidden
    />
  )
}

function AvailableMenu({ onHome }: { onHome: boolean }) {
  return (
    <Menu as="div" className="relative flex h-full">
      <MenuButton
        className={`inline-flex h-full cursor-pointer items-center gap-2 px-4 text-[0.72rem] font-medium transition-colors duration-150 ${
          onHome
            ? 'text-[#b7e7f2] hover:bg-white/8 hover:text-white data-[open]:bg-white/8 data-[open]:text-white'
            : 'text-[#555] hover:bg-black/5 hover:text-[#111] data-[open]:bg-black/5 data-[open]:text-[#111] dark:text-[#aaa] dark:hover:bg-white/8 dark:hover:text-white dark:data-[open]:bg-white/8 dark:data-[open]:text-white'
        }`}
      >
        <span className="available-dot h-1.5 w-1.5 rounded-full bg-[#5ce1ff]" aria-hidden />
        available
      </MenuButton>
      <MenuItems
        transition
        className={`absolute top-full left-0 z-[60] w-44 origin-top p-1.5 transition duration-200 ease-out focus:outline-none data-[closed]:scale-y-0 data-[closed]:opacity-0 motion-reduce:transition-none motion-reduce:data-[closed]:scale-y-100 motion-reduce:data-[closed]:opacity-100 ${
          onHome
            ? 'bg-[#0c1014] text-[#d7f6ff] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--tron,#5ce1ff)_45%,transparent)]'
            : 'bg-white shadow-[0_10px_30px_rgb(0_0_0/0.12)] ring-1 ring-black/5 dark:bg-[#1a1a1a] dark:ring-white/10'
        }`}
      >
        {iconLinks.map(({ href, Icon, label, fill }) => (
          <MenuItem key={label}>
            <a
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              className={`flex h-10 items-center rounded-lg px-3 transition-colors data-[focus]:outline-none ${
                onHome
                  ? 'text-[#b7e7f2] data-[focus]:bg-white/10 data-[focus]:text-white'
                  : 'text-[#555] data-[focus]:bg-black/6 data-[focus]:text-[#111] dark:text-[#aaa] dark:data-[focus]:bg-white/8 dark:data-[focus]:text-white'
              }`}
            >
              <Icon className={`h-[0.95rem] w-[0.95rem] ${fill ? 'fill-current' : ''}`} />
              <span className="ml-2.5 text-[0.8rem] font-medium">{label}</span>
            </a>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}

function HeaderClock({ onHome }: { onHome: boolean }) {
  const [detailed, setDetailed] = useState(false)
  const [stamp, setStamp] = useState<{ short: string; full: string; iso: string } | null>(null)
  const clicks = useRef(0)
  const clickTimer = useRef<number | null>(null)

  useEffect(() => {
    const format = (date: Date) => {
      const weekdayRaw = date.toLocaleDateString('en-GB', { weekday: 'short' }).replace('.', '')
      const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1).toLowerCase()
      const day = String(date.getDate()).padStart(2, '0')
      const month = date.toLocaleDateString('en-GB', { month: 'short' })
      const hh = String(date.getHours()).padStart(2, '0')
      const mm = String(date.getMinutes()).padStart(2, '0')
      const ss = String(date.getSeconds()).padStart(2, '0')
      return {
        short: `${day} ${month} · ${hh}:${mm}`,
        full: `${weekday} ${day} ${month} · ${hh}:${mm}:${ss}`,
        iso: date.toISOString(),
      }
    }
    const tick = () => setStamp(format(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    return () => {
      if (clickTimer.current) window.clearTimeout(clickTimer.current)
    }
  }, [])

  const onClick = () => {
    clicks.current += 1
    if (clickTimer.current) window.clearTimeout(clickTimer.current)
    if (clicks.current >= 3) {
      clicks.current = 0
      setDetailed((value) => !value)
      return
    }
    clickTimer.current = window.setTimeout(() => {
      clicks.current = 0
    }, 600)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer border-0 bg-transparent p-0 pl-4 text-left text-[0.72rem] tabular-nums ${
        onHome ? 'text-[#b7e7f2]' : 'text-[#555] dark:text-[#aaa]'
      }`}
    >
      <time dateTime={stamp?.iso}>{stamp ? (detailed ? stamp.full : stamp.short) : '–– ––– · ––:––'}</time>
    </button>
  )
}
