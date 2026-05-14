import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable the X-Powered-By header
  poweredByHeader: false,

  // Standalone output for Docker deployment
  output: 'standalone',
};

export default nextConfig;
