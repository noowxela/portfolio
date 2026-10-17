import type { Metadata } from 'next'
import { Oxanium, Share_Tech_Mono } from 'next/font/google'
import { Journey } from '@/components/journey/Journey'
import '@/components/home/tron.css'
import '@/components/journey/journey.css'

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
  title: 'Journey',
  description: 'Preview: a scroll-driven ride from the desk, through the Grid, and home again.',
}

export default function JourneyPage() {
  return <Journey className={`${display.variable} ${hud.variable}`} />
}
