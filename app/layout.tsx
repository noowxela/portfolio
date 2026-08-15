import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NavPill } from '@/components/gallery/NavPill'
import { ThemeProviders } from './theme-providers'
import { site } from '@/data/site'
import './globals.css'

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — Demo Gallery`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  authors: [{ name: site.fullName, url: site.github }],
  openGraph: {
    title: `${site.name} — Demo Gallery`,
    description: site.description,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — Demo Gallery`,
    description: site.description,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`} suppressHydrationWarning>
      <body className="bg-white pl-[calc(100vw-100%)] text-black antialiased dark:bg-[rgb(13,13,13)] dark:text-white">
        <ThemeProviders>
          <NavPill />
          {children}
        </ThemeProviders>
      </body>
    </html>
  )
}
