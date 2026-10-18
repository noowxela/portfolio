import type { Metadata } from 'next'
import { Oxanium, Share_Tech_Mono } from 'next/font/google'
import { JourneySoon } from '@/components/journey/JourneySoon'
import '@/components/home/tron.css'
import '@/components/journey/journey-soon.css'

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
  description: 'Work experience journey, coming soon. The 3D ride lives at /noelite2 for now.',
}

export default function JourneyPage() {
  return <JourneySoon className={`${display.variable} ${hud.variable}`} />
}
