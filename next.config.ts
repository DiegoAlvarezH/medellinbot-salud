import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Snapshots are read with fs at runtime; make sure serverless bundles ship them.
  outputFileTracingIncludes: {
    '/**': ['./data/snapshots/**'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=()' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
