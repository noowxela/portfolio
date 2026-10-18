import { DiscShow } from '@/components/discs/DiscShow'
import { PageMeta } from '@/src/PageMeta'

export default function DiscsPage() {
  return (
    <>
      <PageMeta path="discs" />
      <DiscShow />
    </>
  )
}
