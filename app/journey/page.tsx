import type { Metadata } from 'next'
import { Oxanium, Share_Tech_Mono } from 'next/font/google'
import { GridLog } from '@/components/journey/GridLog'
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
  description:
    'Work experience as a git log: Multimedia University, Auronex, Oasis Interactive and Trinergy Digital, from the resume.',
}

export default function JourneyPage() {
  return <GridLog className={`${display.variable} ${hud.variable}`} />
}
