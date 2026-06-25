import type { Page } from '@playwright/test';

export type DemoRole = 'admin' | 'fo_manager' | 'reception' | 'hk' | 'accounting' | 'viewer';

/** Demo mode picks role from localStorage when no JWT is stored. */
export async function useDemoRole(page: Page, role: DemoRole = 'admin') {
  await page.addInitScript((r: string) => {
    localStorage.setItem('roomio-demo-role', r);
    localStorage.removeItem('roomio-token');
  }, role);
}

export async function waitForDemoSession(page: Page) {
  await page.waitForResponse(
    (res) => res.url().includes('/api/auth/session') && res.ok(),
    { timeout: 15_000 },
  );
}
