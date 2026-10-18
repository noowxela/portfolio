import { WorkView } from '@/components/gallery/WorkView'
import { demos } from '@/data/demos'
import { PageMeta } from '@/src/PageMeta'

export default function WorkPage() {
  return (
    <>
      <PageMeta path="work" />
      <WorkView demos={demos} />
    </>
  )
}
