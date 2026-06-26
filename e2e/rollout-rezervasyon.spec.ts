import { test, expect } from '@playwright/test';

test.describe('Rezervasyon rollout — adım adım', () => {
  test('Adım 1 — Grafikler (F1) · canlı doluluk', async ({ page }) => {
    await page.goto('/reservations/calendar');
    await expect(page.getByRole('heading', { name: /^Grafikler$/i })).toBeVisible();
    await expect(page.getByText(/Elektra v5 Forecast|Elektra v5 F1|doluluk trendi/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /Grafikler \(F1\)/i }).first()).toHaveClass(/is-active/);
  });

  test('Adım 2 — Yeni Rezervasyon (F2)', async ({ page }) => {
    await page.goto('/reservations/new');
    await expect(page.getByRole('heading', { name: /Yeni Rezervasyon/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: /Rezervasyon adımları/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Konaklama/i }).click();
    await expect(page.getByText(/müsait|Müsaitlik/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test('Adım 3 — Rezervasyon Listesi', async ({ page }) => {
    const reservationsReady = page.waitForResponse(
      (res) => res.url().includes('/api/reservations') && res.ok(),
      { timeout: 45_000 },
    );
    await page.goto('/reservations');
    await reservationsReady;
    await expect(page.getByText('Filtreler')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Kayıt Sayısı/i)).toBeVisible();
    await expect(page.getByRole('region', { name: /Rezervasyon listesi/i })).toBeVisible();
  });

  test('Adım 4 — Konaklayanlar', async ({ page }) => {
    await page.goto('/reception/inhouse');
    await expect(page.getByRole('heading', { name: /Konaklayanlar/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('Adım 5 — Boş Oda Listesi', async ({ page }) => {
    await page.goto('/reception/vacant');
    await expect(page.getByRole('heading', { name: /Boş Oda/i })).toBeVisible();
    await expect(page.getByText(/Temiz — Check-in hazır/i).first()).toBeVisible();
  });

  test('Adım 6 — Hızlı Blokaj', async ({ page }) => {
    await page.goto('/rooms?tab=blocking');
    await expect(page.getByRole('heading', { name: /Hızlı Blokaj/i })).toBeVisible();
  });
});
