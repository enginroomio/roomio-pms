import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  productionBrowserSourceMaps: false,
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ['@sentry/node', '@sentry/node-core', 'pdfkit', 'fontkit'],
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
  experimental: {
    webpackMemoryOptimizations: true,
    optimizePackageImports: ['lucide-react'],
  },
  allowedDevOrigins: ['*.trycloudflare.com', '*.loca.lt'],
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/node': false,
        '@sentry/node-core': false,
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        module: false,
      };
    }
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
