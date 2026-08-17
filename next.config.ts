import type { NextConfig } from 'next'
import path from 'path'

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src * blob: data:;
  media-src 'self' blob: data:;
  font-src 'self';
  connect-src *;
  frame-src 'self' https://noowxela.github.io https://*.vercel.app;
`

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ''),
  },
]

const nextConfig: NextConfig = {
  reactStrictMode: false,
  transpilePackages: ['next-themes'],
  turbopack: {
    // Must be this app, not a parent folder. `__dirname` in compiled next.config.ts
    // can resolve to the workspace root and break `next-themes`.
    root: path.resolve(process.cwd()),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'noowxela.github.io',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
