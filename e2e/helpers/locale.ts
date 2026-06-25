import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/** Top bar may render duplicate locale switchers in compact layouts — always target the first. */
export async function selectEnglish(page: Page) {
  const switcher = page.getByLabel(/Dil|Language/i).first();
  await switcher.selectOption('en');
  await expect(switcher).toHaveValue('en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en', { timeout: 10_000 });
}
