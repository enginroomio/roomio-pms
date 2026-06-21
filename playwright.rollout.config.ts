import { defineConfig, devices } from '@playwright/test';

/** Mevcut sunucuya karşı rollout testleri — webServer başlatmaz. */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: process.env.ROOMIO_URL ?? 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
