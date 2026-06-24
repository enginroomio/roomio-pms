import { test, expect } from '@playwright/test';

test.describe('Rezervasyon rollout — adım adım', () => {
  test('Adım 1 — Grafikler (F1) · Elektra Forecast mockup', async ({ page }) => {
    await page.goto('/reservations/calendar');
    await expect(page.getByRole('heading', { name: /^Grafikler$/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Elektra Forecast F1/i })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Forecast')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Raporu Hazırla' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Grafik' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('link', { name: /Grafikler \(F1\)/i })).toHaveClass(/is-active/);
  });

  test('Adım 2 — Yeni Rezervasyon (F2)', async ({ page }) => {
    await page.goto('/reservations/new');
    await expect(page.getByRole('heading', { name: /Yeni Rezervasyon/i })).toBeVisible();
    await expect(page.getByText(/Misafir|Konaklama|Fiyat/i).first()).toBeVisible();
    await page.getByRole('button', { name: /Konaklama/i }).click();
    await expect(page.getByText(/müsait|Müsaitlik/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Adım 3 — Rezervasyon Listesi', async ({ page }) => {
    await page.goto('/reservations');
    await expect(page.getByRole('heading', { name: /Rezervasyon Listesi/i })).toBeVisible();
    await expect(page.getByText('Filtreler')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Kayıt Sayısı/i)).toBeVisible();
  });

  test('Adım 4 — Konaklayanlar', async ({ page }) => {
    await page.goto('/reception/inhouse');
    await expect(page.getByRole('heading', { name: /Konaklayanlar/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Adım 5 — Boş Oda Listesi', async ({ page }) => {
    await page.goto('/reception/vacant');
    await expect(page.getByRole('heading', { name: /Boş Oda/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Adım 6 — Hızlı Blokaj', async ({ page }) => {
    await page.goto('/rooms?tab=blocking');
    await expect(page.getByRole('heading', { name: /Hızlı Blokaj/i })).toBeVisible();
  });
});
