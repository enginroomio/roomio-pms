import { defineConfig, devices } from '@playwright/test';

const e2ePort = process.env.PLAYWRIGHT_PORT ?? '3111';
const e2eBaseUrl = process.env.ROOMIO_URL ?? `http://127.0.0.1:${e2ePort}`;
const authRequired = process.env.ROOMIO_AUTH_REQUIRED ?? '0';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: e2eBaseUrl,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /warm-routes\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
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
