export function LegacyDisc() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden>
      <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="100" cy="100" r="72" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.7" />
      <circle cx="100" cy="100" r="48" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="100" cy="100" r="8" fill="currentColor" />
      <path d="M100 10 V28 M100 172 V190 M10 100 H28 M172 100 H190" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

export function DiscV2() {
  return <LegacyDisc />
}

export function AresMark() {
  return (
    <svg viewBox="0 0 200 200" aria-hidden>
      <polygon
        points="100,14 186,100 100,186 14,100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <polygon
        points="100,40 160,100 100,160 40,100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M100 58 L138 100 L100 142 L62 100 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M78 100 H122 M100 78 V122" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
