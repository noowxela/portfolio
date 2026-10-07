import { Oxanium, Share_Tech_Mono } from 'next/font/google'
import { TronHome } from '@/components/home/TronHome'
import { demos } from '@/data/demos'
import '@/components/home/tron.css'

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

export default function Page() {
  const featured = demos.filter((demo) => demo.featured)
  return <TronHome demos={featured} className={`${display.variable} ${hud.variable}`} />
}
