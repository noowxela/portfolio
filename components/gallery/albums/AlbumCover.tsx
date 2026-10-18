import { Demo, demoThumb } from '@/data/demos'
import { asset } from '@/lib/asset'

/** Square sleeve with the screenshot as cover art. */
export function AlbumCover({ demo, priority, className }: { demo: Demo; priority?: boolean; className?: string }) {
  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-md bg-white shadow-[0_14px_34px_rgb(0_0_0/0.22)] ring-1 ring-black/5 dark:bg-[#1a1a1a] dark:shadow-[0_14px_34px_rgb(0_0_0/0.55)] dark:ring-white/10 ${className ?? ''}`}
    >
      <img
        src={asset(demoThumb(demo))}
        alt=""
        draggable={false}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-left-top select-none"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/10" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-8 text-left">
        <p className="truncate text-[0.72rem] font-semibold text-white">{demo.name}</p>
        <p className="truncate text-[0.6rem] text-white/75">{demo.tags.slice(0, 2).join(' · ')}</p>
      </div>
      {demo.isNew ? (
        <span className="absolute top-1.5 left-1.5 rounded-full bg-[#e8756a] px-[7px] py-0.5 text-[0.55rem] leading-[1.5] font-bold tracking-[0.06em] text-white uppercase">
          New
        </span>
      ) : null}
    </div>
  )
}
