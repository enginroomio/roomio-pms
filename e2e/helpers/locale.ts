import type { Page } from '@playwright/test';

/** Set EN before the first navigation in a test. */
export async function setEnglishViaStorage(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('roomio-locale', 'en');
    } catch {
      // ignore in test harness
    }
  });
}

/** Switch an already-loaded page to English via storage + reload (deterministic). */
export async function selectEnglish(page: Page) {
  await setEnglishViaStorage(page);
  await page.evaluate(() => {
    try {
      localStorage.setItem('roomio-locale', 'en');
    } catch {
      // ignore in test harness
    }
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
}
