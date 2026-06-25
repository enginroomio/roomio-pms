import { test, expect } from '@playwright/test';

test.describe('Ön Kasa rollout — adım adım', () => {
  test('Adım 1 — Kasa defteri (F6)', async ({ page }) => {
    await page.goto('/reception');
    await expect(page.getByRole('heading', { name: /Resepsiyon & Ön Kasa/i })).toBeVisible();
    await expect(page.getByText('Kasa Defteri — bugün').first()).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Adım 2 — Kasa kapatma listesi', async ({ page }) => {
    await page.goto('/reception?tab=kasa-close');
    await expect(page.getByRole('heading', { name: /Kasa Kapatma Listesi/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Kasa kapat/i).first()).toBeVisible();
    await expect(page.getByText(/Kasa devir/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /PDF indir/i }).first()).toBeVisible();
    await expect(page.getByRole('table').first()).toBeVisible();
  });

  test('Adım 3 — Döviz bozdurma', async ({ page }) => {
    await page.goto('/reception/departures?tab=fx');
    await expect(page.getByRole('heading', { name: /Döviz Bozdurma Listesi/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Adım 4 — Depozit işlemleri', async ({ page }) => {
    await page.goto('/reception/vacant?tab=deposit');
    await expect(page.getByRole('heading', { name: /Depozit İşlemleri/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Depozit al/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });
});
