import type { Page } from '@playwright/test';

/** Top bar may render duplicate locale switchers in compact layouts — always target the first. */
export async function selectEnglish(page: Page) {
  await page.getByLabel(/Dil|Language/i).first().selectOption('en');
}
