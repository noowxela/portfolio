import { Landing } from '@/components/landing/Landing'
import '@/components/home/tron.css'
import '@/components/landing/landing.css'
import { PageMeta } from '@/src/PageMeta'

export default function HomePage() {
  return (
    <>
      <PageMeta path="" />
      <Landing />
    </>
  )
}
