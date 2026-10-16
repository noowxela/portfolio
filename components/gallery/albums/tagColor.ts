/** Stable label colour for a disc, from the project's first tag (or its name). */
export function tagColor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return `hsl(${h % 360} 62% 56%)`
}
