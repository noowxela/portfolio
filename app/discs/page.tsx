import type { Metadata } from 'next'
import { DiscShow } from '@/components/discs/DiscShow'

export const metadata: Metadata = {
  title: 'Discs',
  description: 'Temporary board of the disc versions made for the grid.',
}

export default function DiscsPage() {
  return <DiscShow />
}
