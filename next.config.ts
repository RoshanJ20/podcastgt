import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        // Supabase storage — update with your actual project ref
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Allow cross-origin requests from Supabase storage in dev
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL ?? '*' },
        ],
      },
    ]
  },
}

export default nextConfig
