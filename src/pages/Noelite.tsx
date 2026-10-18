import { TronHome } from '@/components/home/TronHome'
import { demos } from '@/data/demos'
import '@/components/home/tron.css'
import { PageMeta } from '@/src/PageMeta'

export default function NoelitePage() {
  const featured = demos.filter((demo) => demo.featured)
  return (
    <>
      <PageMeta path="noelite" />
      <TronHome demos={featured} />
    </>
  )
}
