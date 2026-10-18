import type { Metadata } from 'next'
import { Oxanium, Share_Tech_Mono } from 'next/font/google'
import { Journey } from '@/components/noelite2/Journey'
import '@/components/home/tron.css'
import '@/components/noelite2/journey.css'

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
  title: 'Noelite 2',
  description: 'The scroll-driven 3D journey preview: from the desk, through the Grid, and home again.',
}

export default function Noelite2Page() {
  return <Journey className={`${display.variable} ${hud.variable}`} />
}
