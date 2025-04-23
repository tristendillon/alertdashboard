import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@workspace/ui'],
  experimental: {
    serverActions: {
      allowedOrigins: [
        `${process.env.NEXT_PUBLIC_URL?.replace(/^https?:\/\//, '').replace(
          /\/$/,
          ''
        )}`,
        `${process.env.NEXT_PUBLIC_DASHBOARDS_URL?.replace(
          /^https?:\/\//,
          ''
        ).replace(/\/$/, '')}`,
      ],
    },
  },
}

export default nextConfig
