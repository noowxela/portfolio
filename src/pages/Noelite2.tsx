import { Journey } from '@/components/noelite2/Journey'
import '@/components/home/tron.css'
import '@/components/noelite2/journey.css'
import { PageMeta } from '@/src/PageMeta'

export default function Noelite2Page() {
  return (
    <>
      <PageMeta path="noelite2" />
      <Journey />
    </>
  )
}
