import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { ImageResponse } from 'next/og'
import { site } from '@/data/site'

export const dynamic = 'force-static'
export const alt = 'Alex Woon — Full Stack Developer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const ink = '#e4c48a'
const line = 'rgba(228, 196, 138, 0.45)'

export default async function OpenGraphImage() {
  const portrait = `data:image/png;base64,${(await readFile(path.join(process.cwd(), 'app/og-portrait.png'))).toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#14110e',
          color: ink,
          padding: '52px 60px',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingRight: 48,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, letterSpacing: 6 }}>PORTFOLIO</div>
            <div style={{ width: '100%', height: 1, marginTop: 18, background: line }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -1, lineHeight: 1 }}>{site.name}</div>
            <div style={{ fontSize: 32 }}>{site.role}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '100%', height: 1, marginBottom: 22, background: line }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26 }}>
              <div>{site.name}</div>
              <div>noowxela.github.io</div>
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            width: 460,
            height: 526,
            borderRadius: 16,
            border: `1px solid ${ink}`,
            overflow: 'hidden',
            background: '#1c1814',
          }}
        >
          <img
            src={portrait}
            width={460}
            height={526}
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>
    ),
    size,
  )
}
