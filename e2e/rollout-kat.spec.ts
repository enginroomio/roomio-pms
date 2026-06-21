import { test, expect } from '@playwright/test';

test.describe('Kat HK rollout — adım adım', () => {
  test('Adım 1 — Kat HK özeti', async ({ page }) => {
    await page.goto('/housekeeping');
    await expect(page.getByRole('heading', { name: /Housekeeping Pano/i })).toBeVisible();
    await expect(page.getByRole('button', { name: '101' })).toBeVisible();
  });

  test('Adım 2 — Oda listesi (F8)', async ({ page }) => {
    await page.goto('/housekeeping/rooms');
    await expect(page.getByRole('heading', { name: /Oda Listesi/i })).toBeVisible();
  });

  test('Adım 3 — Görevler', async ({ page }) => {
    await page.goto('/housekeeping/tasks');
    await expect(page.getByRole('heading', { name: /Temizlik Görevleri/i })).toBeVisible();
  });

  test('Adım 4 — Room Rack', async ({ page }) => {
    await page.goto('/rooms');
    await expect(page.getByRole('heading', { name: /Room Rack|Oda Rack/i })).toBeVisible({ timeout: 15_000 });
  });
});
