import type { Metadata } from 'next'
import { WorkView } from '@/components/gallery/WorkView'
import { demos } from '@/data/demos'
import { site } from '@/data/site'

export const metadata: Metadata = {
  title: 'Work',
  description: site.description,
}

export default function WorkPage() {
  return <WorkView demos={demos} />
}
