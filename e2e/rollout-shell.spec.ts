import { test, expect } from '@playwright/test';

test.describe('Kabuk rollout — adım adım', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByRole('navigation', { name: 'Ana menü' })).toBeVisible({ timeout: 60_000 });
  });

  test('Adım 1 — İkon rayı (Ana, Önbüro, Kat HK…)', async ({ page }) => {
    const rail = page.locator('.roomio-icon-rail');
    await expect(rail).toBeVisible();
    await expect(rail.getByRole('link', { name: 'Ana', exact: true })).toBeVisible();
    await expect(rail.getByRole('link', { name: 'Önbüro' })).toBeVisible();
    await expect(rail.getByRole('link', { name: 'Kat HK' })).toBeVisible();
    await expect(rail.getByRole('link', { name: 'Misafir' })).toBeVisible();
    await expect(rail.getByRole('link', { name: 'Finans' })).toBeVisible();
    await expect(rail.getByRole('link', { name: 'Sistem' })).toBeVisible();
  });

  test('Adım 2 — Üst cascade menü (8 grup)', async ({ page }) => {
    const menu = page.getByRole('navigation', { name: 'Ana menü' });
    await expect(menu).toBeVisible();
    for (const label of ['Sistem', 'Rezervasyon', 'Resepsiyon', 'Ön Kasa', 'Kat HK', 'Misafir', 'Raporlar', 'Gün Sonu']) {
      await expect(menu.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('Adım 3 — Alt kısayol çubuğu F2–F12', async ({ page }) => {
    const footer = page.getByRole('contentinfo', { name: 'Durum çubuğu' });
    await expect(footer).toBeVisible();
    await expect(footer.getByRole('link', { name: /F2 Hızlı Giriş/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /F12 Hızlı Çıkış|Oda Rack/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /F6 Ön Kasa/i })).toBeVisible();
  });
});
