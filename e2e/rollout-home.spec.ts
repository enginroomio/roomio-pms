import { test, expect } from '@playwright/test';

test.describe('Ana Sayfa rollout — adım adım', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Adım 1 — Karşılama & operasyon şeridi', async ({ page }) => {
    await expect(page.getByRole('region', { name: 'Günlük özet' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Merhaba,/i })).toBeVisible();
    await expect(page.getByText(/Bugün giriş/i).first()).toBeVisible();
    await expect(page.getByText(/Bugün çıkış/i).first()).toBeVisible();
  });

  test('Adım 2 — KPI kartları', async ({ page }) => {
    const portfolio = page.getByRole('region', { name: 'Çoklu şube özeti' });
    await expect(portfolio).toBeVisible({ timeout: 15_000 });
    await expect(portfolio.getByText(/doluluk/i).first()).toBeVisible();
    await expect(page.getByRole('region', { name: 'Günlük özet' }).getByText('Konaklayan')).toBeVisible();
  });

  test('Adım 3 — Oda rack önizleme', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Oda Rack', level: 2 })).toBeVisible();
  });

  test('Adım 4 — Bugünkü varış / ayrılış', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Bugünkü Varışlar', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bugünkü Ayrılışlar', level: 2 })).toBeVisible();
  });

  test('Adım 5 — Tam oda rack (F12)', async ({ page }) => {
    await page.goto('/rooms');
    await expect(page.getByRole('heading', { name: /Room Rack \(F12\)/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
