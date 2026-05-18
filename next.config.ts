import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable the X-Powered-By header
  poweredByHeader: false,

  // Fix for DigitalOcean CDN caching RSC payloads instead of HTML
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
