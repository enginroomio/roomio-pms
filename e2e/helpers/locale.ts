import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Set EN before the first navigation in a test. */
export async function setEnglishViaStorage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('roomio-locale', 'en');
  });
}

/** Switch an already-loaded page to English via the header select. */
export async function selectEnglish(page: Page) {
  const switcher = page.locator('select.roomio-locale-switch').first();
  await switcher.waitFor({ state: 'visible', timeout: 15_000 });
  await switcher.selectOption('en');
  await expect(switcher).toHaveValue('en');
  await expect(page.getByLabel('Language').first()).toHaveValue('en', { timeout: 10_000 });
}
