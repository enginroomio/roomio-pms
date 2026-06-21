import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  productionBrowserSourceMaps: false,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    webpackMemoryOptimizations: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: process.env.WATCHPACK_POLLING ? Number(process.env.WATCHPACK_POLLING_INTERVAL ?? 1000) : undefined,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.roomio-data/**'],
      };
    }
    return config;
  },
};

export default nextConfig;
