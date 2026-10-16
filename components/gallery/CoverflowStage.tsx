'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { A11y, EffectCoverflow, Keyboard, Mousewheel, Navigation, Pagination } from 'swiper/modules'
import type { Swiper as SwiperInstance } from 'swiper/types'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'
import { Demo, demoLiveUrl, demoThumb } from '@/data/demos'
import { withBasePath } from '@/lib/withBasePath'
import { PillButton } from './PillButton'
import { useMediaQuery } from './useMediaQuery'
import { scaledFrameStyle, useScaledFrame } from './useScaledFrame'

const navButtonClass =
  'grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-white text-[#555] shadow-[0_1px_6px_rgb(0_0_0/0.08)] ring-1 ring-black/5 transition-colors duration-150 hover:text-[#111] disabled:cursor-default disabled:opacity-35 dark:bg-[#1a1a1a] dark:text-[#aaa] dark:shadow-[0_1px_6px_rgb(0_0_0/0.3)] dark:ring-white/10 dark:hover:text-white'

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="none">
      <path
        d={dir === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Same size as the screenshots, so the live frame lines up with the 16:10 card on every screen.
const SHOT_SIZE = { width: 1440, height: 900 }

/** Live demo on the centre card: a 1440x900 iframe scaled into the card. */
function LiveFrame({ demo, interactive }: { demo: Demo; interactive: boolean }) {
  const { containerRef, frame } = useScaledFrame(SHOT_SIZE)
  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <iframe
        src={demo.embedUrl}
        title={demo.name}
        tabIndex={interactive ? 0 : -1}
        className="absolute origin-center border-none bg-white"
        style={{ ...scaledFrameStyle(frame), pointerEvents: interactive ? 'auto' : 'none' }}
      />
    </div>
  )
}

function Thumb({ demo, priority }: { demo: Demo; priority?: boolean }) {
  return (
    <Image
      src={withBasePath(demoThumb(demo))}
      alt=""
      fill
      sizes="(min-width: 640px) 880px, 82vw"
      priority={priority}
      draggable={false}
      className="pointer-events-none object-cover object-top select-none"
    />
  )
}

export function CoverflowStage({ demos }: { demos: Demo[] }) {
  const isMobile = useMediaQuery('(max-width: 639px)')
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [active, setActive] = useState(0)
  const [interact, setInteract] = useState(false)
  const swiperRef = useRef<SwiperInstance | null>(null)
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null)
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null)
  const [paginationEl, setPaginationEl] = useState<HTMLDivElement | null>(null)

  const demo = demos[active]
  const liveUrl = demoLiveUrl(demo)
  const canEmbed = demo.embeddable !== false

  const coverflowEffect = reduceMotion
    ? { rotate: 0, depth: 0, stretch: 0, modifier: 1, slideShadows: false, scale: 0.9 }
    : isMobile
      ? { rotate: 12, depth: 60, stretch: 0, modifier: 1, slideShadows: false, scale: 0.92 }
      : { rotate: 38, depth: 160, stretch: 0, modifier: 1, slideShadows: false, scale: 1 }

  const setInteractive = (on: boolean) => {
    setInteract(on)
    const swiper = swiperRef.current
    if (!swiper) return
    // While a visitor plays a demo, arrows, wheel and drag belong to the iframe.
    swiper.allowTouchMove = !on
    if (on) {
      swiper.keyboard.disable()
      swiper.mousewheel.disable()
    } else {
      swiper.keyboard.enable()
      swiper.mousewheel.enable()
    }
  }

  const onSlideChange = (s: SwiperInstance) => {
    setActive(s.activeIndex)
    if (interact) setInteractive(false)
  }

  const ready = Boolean(prevEl && nextEl && paginationEl)

  return (
    <div className="box-border flex h-dvh flex-col overflow-hidden bg-[#eeeeee] pt-14 font-sans dark:bg-[#0d0d0d]">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {`Project ${active + 1} of ${demos.length}: ${demo.name}`}
      </p>

      <section
        aria-roledescription="carousel"
        aria-label="Projects"
        className="relative flex min-h-0 flex-1 items-center"
      >
        {ready ? (
          <Swiper
            // Remount when the effect changes: Swiper reads coverflow params once.
            key={`${isMobile}-${reduceMotion}`}
            modules={[EffectCoverflow, Navigation, Pagination, Keyboard, A11y, Mousewheel]}
            effect="coverflow"
            coverflowEffect={coverflowEffect}
            centeredSlides
            slidesPerView="auto"
            spaceBetween={isMobile ? 12 : 0}
            initialSlide={active}
            slideToClickedSlide
            grabCursor
            speed={reduceMotion ? 0 : 450}
            keyboard={{ enabled: true, onlyInViewport: true }}
            mousewheel={{ forceToAxis: true, thresholdDelta: 20 }}
            navigation={{ prevEl, nextEl }}
            pagination={{ el: paginationEl, clickable: true }}
            a11y={{
              enabled: true,
              slideRole: 'group',
              itemRoleDescriptionMessage: 'project',
              slideLabelMessage: '{{index}} of {{slidesLength}}',
              prevSlideMessage: 'Previous project',
              nextSlideMessage: 'Next project',
              paginationBulletMessage: 'Go to project {{index}}',
            }}
            onSwiper={(s) => {
              swiperRef.current = s
            }}
            onSlideChange={onSlideChange}
            className="h-full w-full !py-6 sm:!py-10"
          >
            {demos.map((d, i) => {
              const isActive = i === active
              const offscreen = Math.abs(i - active) > 1
              return (
                <SwiperSlide
                  key={d.slug}
                  aria-hidden={isActive ? undefined : true}
                  inert={offscreen || undefined}
                  className="!flex !h-full !w-[82vw] items-center sm:!w-[min(64vw,880px)]"
                >
                  <div
                    className={`relative aspect-[16/10] max-h-full w-full overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgb(0_0_0/0.16)] ring-1 ring-black/5 transition-opacity duration-300 dark:bg-[#1a1a1a] dark:shadow-[0_24px_60px_rgb(0_0_0/0.5)] dark:ring-white/10 ${
                      isActive ? '' : 'opacity-70'
                    }`}
                  >
                    <Thumb demo={d} priority={i === 0} />
                    {isActive && d.embeddable !== false ? (
                      <LiveFrame key={d.embedUrl} demo={d} interactive={interact} />
                    ) : null}
                    {isActive && d.embeddable === false ? (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10 text-[0.75rem] text-white">
                        This demo cannot be previewed here. Open it in a new tab.
                      </div>
                    ) : null}
                    {isActive && canEmbed ? (
                      <div className="absolute top-3 right-3 z-10">
                        <PillButton
                          standalone
                          onClick={() => setInteractive(!interact)}
                          aria-label={interact ? `Stop interacting with ${d.name}` : `Interact with ${d.name}`}
                          className={`flex h-7 items-center px-3 text-[0.7rem] font-medium ${
                            interact ? '!bg-[#111] !text-white dark:!bg-white dark:!text-[#111]' : ''
                          }`}
                        >
                          {interact ? 'Done' : 'Interact'}
                        </PillButton>
                      </div>
                    ) : null}
                  </div>
                </SwiperSlide>
              )
            })}
          </Swiper>
        ) : null}
      </section>

      <div className="mx-auto flex w-full max-w-3xl shrink-0 flex-col gap-3 px-4 pb-16 sm:px-6 sm:pb-6">
        <div className="flex items-center justify-center gap-3">
          <button ref={setPrevEl} type="button" className={navButtonClass} aria-label="Previous project">
            <Chevron dir="left" />
          </button>
          <div
            ref={setPaginationEl}
            className="coverflow-pagination !static flex !w-auto items-center gap-1 [--swiper-pagination-bullet-horizontal-gap:3px] [--swiper-pagination-bullet-inactive-color:#888] [--swiper-pagination-bullet-size:6px] [--swiper-pagination-color:#111] dark:[--swiper-pagination-color:#fff]"
          />
          <button ref={setNextEl} type="button" className={navButtonClass} aria-label="Next project">
            <Chevron dir="right" />
          </button>
        </div>

        <div className="rounded-2xl bg-white p-3 shadow-[0_2px_16px_rgb(0_0_0/0.06)] ring-1 ring-black/5 sm:p-4 dark:bg-[#1a1a1a] dark:ring-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-sm font-semibold text-[#111] dark:text-white">{demo.name}</h1>
            {demo.isNew ? (
              <span className="rounded-full bg-[#e8756a] px-[7px] py-0.5 text-[0.55rem] leading-[1.5] font-bold tracking-[0.06em] text-white uppercase">
                New
              </span>
            ) : null}
            {demo.featured ? (
              <span className="rounded-full bg-[#111] px-[7px] py-0.5 text-[0.55rem] leading-[1.5] font-bold tracking-[0.06em] text-white uppercase dark:bg-white dark:text-[#111]">
                Featured
              </span>
            ) : null}
            <div className="ml-auto flex items-center gap-1">
              {liveUrl ? (
                <PillButton
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-7 items-center px-3 text-[0.7rem] font-medium"
                >
                  Open live
                </PillButton>
              ) : null}
              {demo.repoUrl ? (
                <PillButton
                  href={demo.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-7 items-center px-3 text-[0.7rem] font-medium"
                >
                  Repo
                </PillButton>
              ) : null}
            </div>
          </div>
          <p className="mt-1 text-[0.75rem] leading-snug text-[#666] dark:text-[#aaa]">{demo.blurb}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {demo.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-black/5 px-2 py-0.5 text-[0.6rem] font-medium text-[#555] dark:bg-white/8 dark:text-[#ccc]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
