import { defineConfig, devices } from '@playwright/test';

const e2ePort = process.env.PLAYWRIGHT_PORT ?? '3111';
const e2eBaseUrl = process.env.ROOMIO_URL ?? `http://127.0.0.1:${e2ePort}`;
const authRequired = process.env.ROOMIO_AUTH_REQUIRED ?? '0';
const skipWarm = process.env.PLAYWRIGHT_SKIP_WARM === '1';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  testIgnore: [
    ...(authRequired === '1' ? [] : ['**/auth-required.spec.ts']),
    '**/menu-params.spec.ts',
    ...(process.env.CI ? ['**/rollout-*.spec.ts', '**/menu-params-*.spec.ts'] : []),
  ],
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
    env: { ROOMIO_AUTH_REQUIRED: authRequired, WATCHPACK_POLLING: 'true' },
  },
});
