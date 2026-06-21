import { test, expect } from '@playwright/test';

test.describe('Resepsiyon rollout — adım adım', () => {
  test('Adım 1 — Resepsiyon özeti', async ({ page }) => {
    await page.goto('/reception');
    await expect(page.getByRole('heading', { name: /Resepsiyon & Ön Kasa/i })).toBeVisible();
    await expect(page.getByText('Konaklayan')).toBeVisible();
    await expect(page.getByText('Kasa Defteri — bugün')).toBeVisible();
  });

  test('Adım 2 — Bugün giriş', async ({ page }) => {
    await page.goto('/reception/arrivals');
    await expect(page.getByRole('heading', { name: /Bugün Giriş Yapacaklar/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Adım 3 — Bugün çıkış', async ({ page }) => {
    await page.goto('/reception/departures');
    await expect(page.getByRole('heading', { name: /Bugün Çıkış Yapacaklar/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Adım 4 — Info Rack', async ({ page }) => {
    await page.goto('/guest-relations/info-rack');
    await expect(page.getByRole('heading', { name: /Info Rack/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Adım 5 — Arıza & şikayet', async ({ page }) => {
    await page.goto('/guest-relations/complaints');
    await expect(page.getByRole('heading', { name: /Arıza ve Şikayet Listesi/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });
});
