import { test, expect } from '@playwright/test';

test.describe('Ana Sayfa rollout — adım adım', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByRole('region', { name: 'Günlük özet' })).toBeVisible({ timeout: 60_000 });
  });

  test('Adım 1 — Karşılama & operasyon şeridi', async ({ page }) => {
    await expect(page.getByRole('region', { name: 'Günlük özet' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Merhaba,/i })).toBeVisible();
    await expect(page.getByText(/Bugün giriş/i).first()).toBeVisible();
    await expect(page.getByText(/Bugün çıkış/i).first()).toBeVisible();
  });

  test('Adım 2 — KPI kartları', async ({ page }) => {
    const summary = page.getByRole('region', { name: 'Günlük özet' });
    await expect(summary).toBeVisible({ timeout: 15_000 });
    await expect(summary.getByText(/Konaklayan/i)).toBeVisible();
    await expect(summary.locator('.roomio-welcome-insight__value').first()).toBeVisible();
    const kpi = page.getByRole('region', { name: 'Günlük KPI' });
    if (await kpi.isVisible().catch(() => false)) {
      await expect(kpi.getByText('Doluluk')).toBeVisible();
    }
    const opsAlerts = page.getByText(/Operasyon özeti/i);
    if (await opsAlerts.isVisible().catch(() => false)) {
      await expect(page.getByText(/doluluk ·/i).first()).toBeVisible();
    }
    const portfolio = page.getByRole('region', { name: 'Çoklu şube özeti' });
    if (await portfolio.isVisible().catch(() => false)) {
      await expect(portfolio.getByText(/doluluk/i).first()).toBeVisible();
    }
  });

  test('Adım 3 — Oda rack önizleme', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Oda Rack', level: 2 })).toBeVisible();
  });

  test('Adım 4 — Bugünkü varış / ayrılış', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Bugünkü Varışlar', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bugünkü Ayrılışlar', level: 2 })).toBeVisible();
  });

  test('Adım 5 — Tam oda rack (F12)', async ({ page }) => {
    await page.goto('/rooms', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(page.getByRole('heading', { name: /Room Rack/i }).first()).toBeVisible({ timeout: 30_000 });
  });
});
