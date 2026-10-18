import { Link } from 'react-router'
import '@/components/home/tron.css'
import { PageMeta } from '@/src/PageMeta'

export default function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#050507] px-6 pt-14 text-[#e7fbff]">
      <PageMeta path="404" />
      <div className="text-center">
        <p className="font-[family-name:var(--font-hud)] text-xs tracking-[0.28em] text-[#5ce1ff]">404</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl">This page is not on the grid.</h1>
        <Link to="/" className="mt-8 inline-block font-[family-name:var(--font-hud)] text-sm text-[#5ce1ff] underline">
          Back home
        </Link>
      </div>
    </main>
  )
}
