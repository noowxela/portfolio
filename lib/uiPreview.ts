/**
 * Temporary Work-page preview switcher (SDD 013).
 * On unless NEXT_PUBLIC_UI_PREVIEW=false. To remove the switcher, see docs/sdd/013-work-albums.md.
 */
export const UI_PREVIEW = process.env.NEXT_PUBLIC_UI_PREVIEW !== 'false'
