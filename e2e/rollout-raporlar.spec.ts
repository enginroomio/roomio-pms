import { test, expect } from '@playwright/test';

test.describe('Raporlar rollout — adım adım', () => {
  test('Adım 1 — Raporlama programı', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: /Raporlama Programı/i })).toBeVisible();
  });

  test('Adım 2 — FO Önbüro raporları', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: /Raporlama Programı/i }).first()).toBeVisible({ timeout: 15_000 });
    const link = page.getByRole('link', { name: /FO-Önbüro Raporları/i }).first();
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
  });

  test('Adım 3 — HK raporları', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: /Raporlama Programı/i }).first()).toBeVisible({ timeout: 15_000 });
    const link = page.getByRole('link', { name: /HK-HouseKeeping Raporları/i }).first();
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
  });

  test('Adım 4 — Yönetim raporları', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: /Raporlama Programı/i }).first()).toBeVisible({ timeout: 15_000 });
    const link = page.getByRole('link', { name: /BO-ArkaBüro Raporları/i }).first();
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
  });
});
