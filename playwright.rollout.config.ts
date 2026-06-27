import { defineConfig, devices } from '@playwright/test';

/** Mevcut sunucuya karşı rollout testleri — webServer başlatmaz. */
export default defineConfig({
  testDir: './e2e',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.ROOMIO_URL ?? 'http://127.0.0.1:3100',
    locale: 'tr-TR',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
