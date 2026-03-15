import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable static page generation for API-only app
  output: undefined,
};

export default nextConfig;
