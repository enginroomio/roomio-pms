import { defineConfig, devices } from '@playwright/test';

/** Mevcut sunucuya karşı rollout testleri — webServer başlatmaz. */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.ROOMIO_URL ?? 'http://127.0.0.1:3100',
    locale: 'tr-TR',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
