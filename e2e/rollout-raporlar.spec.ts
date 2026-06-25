import { test, expect } from '@playwright/test';

test.describe('Raporlar rollout — adım adım', () => {
  test('Adım 1 — Raporlama programı', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: /Raporlama Programı/i })).toBeVisible();
  });

  test('Adım 2 — FO Önbüro raporları', async ({ page }) => {
    await page.goto('/reports?category=rezervasyon');
    await expect(page.getByText(/FO-Önbüro Raporları/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Adım 3 — HK raporları', async ({ page }) => {
    await page.goto('/reports?category=kathizmetleri');
    await expect(page.getByText(/HK-HouseKeeping Raporları/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('Adım 4 — Yönetim raporları', async ({ page }) => {
    await page.goto('/reports?category=yonetim');
    await expect(page.getByText(/BO-ArkaBüro Raporları/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
