import { useMediaQuery } from '../useMediaQuery'

/** Shared motion flags for the album variants. */
export function useAlbumMotion() {
  const isMobile = useMediaQuery('(max-width: 639px)')
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  return { isMobile, reduceMotion }
}
