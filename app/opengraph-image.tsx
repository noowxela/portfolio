import { ImageResponse } from 'next/og'
import { site } from '@/data/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0d0d0d',
          color: '#f5f5f5',
          padding: 72,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: 'uppercase', color: '#888' }}>
          Demo gallery
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 80, fontWeight: 700, letterSpacing: -2 }}>{site.name}</div>
          <div style={{ fontSize: 32, color: '#b0b0b0' }}>{site.tagline}</div>
        </div>
      </div>
    ),
    size,
  )
}
