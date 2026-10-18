import type { Metadata } from 'next'
import { Oxanium, Share_Tech_Mono } from 'next/font/google'
import { Landing } from '@/components/landing/Landing'
import { site } from '@/data/site'
import '@/components/home/tron.css'
import '@/components/landing/landing.css'

const display = Oxanium({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
})

const hud = Share_Tech_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-hud',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { absolute: site.name },
  description: site.description,
}

export default function Page() {
  return <Landing className={`${display.variable} ${hud.variable}`} />
}
