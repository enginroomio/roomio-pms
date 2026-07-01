import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

test.describe('HK sağ tık menüsü', () => {
  test('housekeeping pano — oda hücresinde HK durum menüsü', async ({ page }) => {
    await gotoWithDemo(page, '/housekeeping', 'admin', { waitForSideNav: false });
    await expect(page.getByRole('button', { name: '101' })).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: '101' }).click({ button: 'right' });

    const menu = page.getByRole('menu', { name: /Oda 101 durum menüsü/i });
    await expect(menu).toBeVisible({ timeout: 10_000 });
    await expect(menu.getByRole('menuitem', { name: /Temiz/i })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: /Kirli/i })).toBeVisible();
    await expect(page.getByRole('menu', { name: /Elektra|Ana menü|sidebar/i })).toHaveCount(0);
  });

  test('housekeeping mobile — rack hücresinde HK durum menüsü', async ({ page }) => {
    await gotoWithDemo(page, '/housekeeping/mobile', 'hk', { waitForSideNav: false });
    const cell = page.locator('.roomio-nr-cell--hk-interactive').first();
    await expect(cell).toBeVisible({ timeout: 45_000 });
    await cell.scrollIntoViewIfNeeded();

    await cell.click({ button: 'right' });

    const menu = page.locator('.roomio-hk-room-menu');
    await expect(menu).toBeVisible({ timeout: 10_000 });
    await expect(menu.getByRole('menuitem', { name: /Kontrol/i })).toBeVisible();
  });

  test('rooms rack — oda hücresinde PMS işlem menüsü', async ({ page }) => {
    await gotoWithDemo(page, '/rooms', 'admin', { waitForSideNav: false });
    await expect(page.getByRole('heading', { name: /Room Rack/i }).first()).toBeVisible({ timeout: 30_000 });

    const cell = page.locator('.roomio-nr-cell').filter({ hasText: '101' }).first();
    await expect(cell).toBeVisible({ timeout: 20_000 });
    await cell.scrollIntoViewIfNeeded();
    await cell.dispatchEvent('contextmenu');

    const menu = page.getByRole('menu', { name: /Oda 101 işlemleri/i });
    await expect(menu).toBeVisible({ timeout: 10_000 });
    await expect(menu.getByRole('menuitem', { name: /Check In Yap/i })).toBeVisible();
  });
});
