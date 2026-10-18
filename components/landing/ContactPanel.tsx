import { useCallback, useEffect, useRef } from 'react'
import { playClose } from '@/lib/sound'
import { CONTACT_LINKS } from './entries'

/**
 * Small Tron window for the 04 corner. ESC, the close button and a click on
 * the backdrop close it; focus moves into the window and back to the opener.
 */
export function ContactPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const firstRef = useRef<HTMLAnchorElement>(null)
  // Every way out (×, Esc, backdrop) plays the falling close blip once.
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })
  const close = useCallback(() => {
    playClose()
    closeRef.current()
  }, [])

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    firstRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus?.({ preventScroll: true })
    }
  }, [open, close])

  return (
    <div className="landing-contact" data-open={open} aria-hidden={!open} inert={!open}>
      <button type="button" className="landing-contact-backdrop" tabIndex={-1} aria-label="Close contact" onClick={close} />
      <section className="landing-contact-window" role="dialog" aria-modal="true" aria-labelledby="landing-contact-title">
        <header className="landing-contact-bar">
          <span id="landing-contact-title">contact.app</span>
          <button type="button" className="landing-contact-close" onClick={close} aria-label="Close contact">
            ×
          </button>
        </header>
        <p className="landing-contact-lead">Open channel. Pick a line.</p>
        <ul className="landing-contact-links">
          {CONTACT_LINKS.map((link, i) => (
            <li key={link.label}>
              <a
                ref={i === 0 ? firstRef : undefined}
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <span className="landing-contact-key">{link.label}</span>
                <span className="landing-contact-value">{link.value}</span>
                <span className="landing-contact-arrow" aria-hidden>
                  ▸
                </span>
              </a>
            </li>
          ))}
        </ul>
        <footer className="landing-contact-foot">esc to close</footer>
      </section>
    </div>
  )
}
