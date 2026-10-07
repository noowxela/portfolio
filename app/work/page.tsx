import type { Metadata } from 'next'
import { GalleryShell } from '@/components/gallery/GalleryShell'
import { demos } from '@/data/demos'
import { site } from '@/data/site'

export const metadata: Metadata = {
  title: 'Work',
  description: site.description,
}

export default function WorkPage() {
  return <GalleryShell demos={demos} />
}
