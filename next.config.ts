import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  productionBrowserSourceMaps: false,
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ['@sentry/node', '@sentry/node-core', 'pdfkit', 'fontkit'],
  async headers() {
    // CSP — Report-Only modunda bir süre çalıştırılıp (hiçbir kaynağı
    // engellemeden) tarayıcı konsolunda ihlal olup olmadığı izlendi.
    // Kapsamlı bir kod taraması da yapıldı: client-side harici fetch/XHR,
    // WebSocket/EventSource, next/font (harici font), service worker'da
    // harici istek YOK; PWA manifest ikonları same-origin. Bu nedenle artık
    // ENFORCE modunda (`Content-Security-Policy`).
    //
    // ⚠️ Bu değişiklik gerçek bir tarayıcıda (npm run dev/build sonrası)
    // doğrulanmadı — yalnızca statik kod taraması yapıldı. Production'a
    // almadan önce bir staging ortamında test edin. Beklenmedik bir sorun
    // çıkarsa (örn. bir sayfa beyaz/boş kalırsa), tek satırlık geri dönüş:
    // header adını `Content-Security-Policy` yerine tekrar
    // `Content-Security-Policy-Report-Only` yapın — bu, hiçbir kaynağı
    // engellemeden eski (gözlem) davranışa döner.
    //
    // Nonce kullanılmıyor: Next.js hydration/RSC inline script'leri
    // nedeniyle nonce için tüm sayfaların dinamik render'a geçmesi gerekir
    // (bkz. Next.js CSP rehberi) — bu kapsamlı bir mimari değişiklik,
    // ayrı bir adımda ele alınmalı. `'unsafe-inline'` bu yüzden bilerek
    // var; bu politika XSS'i tam ENGELLEMEZ, ama şu sınıfları engeller:
    // (a) clickjacking/frame-ancestors, (b) harici script/obje yüklemesi,
    // (c) mixed-content, (d) form hijacking (form-action).
    const cspHeaderName = 'Content-Security-Policy';
    const isDev = process.env.NODE_ENV === 'development';
    const cspHeader = [
      "default-src 'self'",
      isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; ');

    return [
      {
        // Tüm sayfalar/API'ler için temel güvenlik header'ları.
        source: '/:path*',
        headers: [
          // Clickjacking koruması: sayfa başka bir sitenin <iframe>'ine
          // gömülemez. WiFi captive portal / kiosk ekranları kendi
          // sekmesinde/penceresinde açılır, iframe gerektirmez.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Tarayıcının yanıtın Content-Type'ını "tahmin ederek" farklı
          // yorumlamasını (MIME sniffing) engeller.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Üçüncü taraf sitelere giden linklerde referrer bilgisini sınırlar.
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: cspHeaderName, value: cspHeader },
        ],
      },
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
  allowedDevOrigins: [
    '127.0.0.1',
    '127.0.0.1:3100',
    'localhost',
    'localhost:3100',
    '*.trycloudflare.com',
    '*.loca.lt',
  ],
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
