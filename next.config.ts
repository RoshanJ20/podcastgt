import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment
  output: 'standalone',

  // Required for react-pdf (pdfjs-dist uses .mjs worker)
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.ts',
    },
  },

  webpack: (config) => {
    // Prevent canvas from being bundled (not needed for PDF rendering)
    config.resolve.alias.canvas = false
    return config
  },

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
