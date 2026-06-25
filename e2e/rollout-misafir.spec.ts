import { test, expect } from '@playwright/test';

test.describe('Misafir rollout — adım adım', () => {
  test('Adım 1 — Misafir ilişkileri özeti', async ({ page }) => {
    await page.goto('/guest-relations');
    await expect(page.getByRole('heading', { name: /Misafir İlişkileri Özeti/i })).toBeVisible();
  });

  test('Adım 2 — Takip listesi (Traces)', async ({ page }) => {
    await page.goto('/guest-relations/traces');
    await expect(page.getByRole('heading', { name: /Takip Listesi \(Traces\)/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Adım 3 — VIP misafir listesi', async ({ page }) => {
    await page.goto('/guest-relations/vip');
    await expect(page.getByRole('heading', { name: /VIP Misafir Listesi/i })).toBeVisible();
  });

  test('Adım 4 — Misafir yorumları', async ({ page }) => {
    await page.goto('/guest-relations/reviews');
    await expect(page.getByRole('heading', { name: /Misafir Yorum Listesi/i })).toBeVisible();
  });

  test('Adım 5 — Banket rezervasyon', async ({ page }) => {
    await page.goto('/fnb');
    await expect(page.getByRole('heading', { name: /Banket Rezervasyon/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
