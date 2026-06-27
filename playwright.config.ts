import { defineConfig, devices } from '@playwright/test';

const e2ePort = process.env.PLAYWRIGHT_PORT ?? '3111';
const e2eBaseUrl = process.env.ROOMIO_URL ?? `http://127.0.0.1:${e2ePort}`;
const authRequired = process.env.ROOMIO_AUTH_REQUIRED ?? '0';
const skipWarm = process.env.PLAYWRIGHT_SKIP_WARM === '1';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  testIgnore: authRequired === '1' ? undefined : ['**/auth-required.spec.ts'],
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: e2eBaseUrl,
    trace: 'on-first-retry',
    locale: 'tr-TR',
  },
  projects: [
    ...(skipWarm
      ? []
      : [{ name: 'setup', testMatch: /warm-routes\.setup\.ts/ }]),
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], locale: 'tr-TR' },
      ...(skipWarm ? {} : { dependencies: ['setup'] }),
    },
  ],
  webServer: {
    command: `ROOMIO_AUTH_REQUIRED=${authRequired} WATCHPACK_POLLING=true npx next dev -p ${e2ePort} -H 127.0.0.1`,
    url: `${e2eBaseUrl}/api/health`,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === '1',
    timeout: 120_000,
    // ROOMIO_DISABLE_RATE_LIMIT: testler aynı hesap/IP ile çok kısa sürede
    // onlarca login isteği gönderir (her test ayrı token alır) — bu, gerçek
    // bir saldırı paterni değil, test koşum deseni. Production'da bu
    // değişken set edilmemeli.
    env: { ROOMIO_AUTH_REQUIRED: authRequired, WATCHPACK_POLLING: 'true', ROOMIO_DISABLE_RATE_LIMIT: '1' },
  },
});
