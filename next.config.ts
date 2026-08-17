import type { NextConfig } from 'next'
import path from 'path'

const isGithubPages = process.env.GITHUB_PAGES === 'true'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  ...(isGithubPages ? { basePath: '/portfolio' } : {}),
  reactStrictMode: false,
  transpilePackages: ['next-themes'],
  turbopack: {
    // Must be this app, not a parent folder. `__dirname` in compiled next.config.ts
    // can resolve to the workspace root and break `next-themes`.
    root: path.resolve(process.cwd()),
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'noowxela.github.io',
      },
    ],
  },
}

export default nextConfig
