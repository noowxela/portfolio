import { GridLog } from '@/components/journey/GridLog'
import '@/components/home/tron.css'
import '@/components/journey/journey.css'
import { PageMeta } from '@/src/PageMeta'

export default function JourneyPage() {
  return (
    <>
      <PageMeta path="journey" />
      <GridLog />
    </>
  )
}
