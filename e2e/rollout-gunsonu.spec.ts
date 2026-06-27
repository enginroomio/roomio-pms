import { test, expect } from '@playwright/test';

test.describe('Gün Sonu rollout — adım adım', () => {
  test('Adım 1 — Gün sonu raporlarını al', async ({ page }) => {
    await page.goto('/reports?tab=eod&action=fetch');
    await expect(page.getByRole('heading', { name: 'Gün Sonu Raporları', level: 2 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Raporları al' })).toHaveClass(/is-active/);
    await expect(page.getByRole('button', { name: 'Tüm raporları al' })).toBeVisible();
  });

  test('Adım 2 — Günü kapat', async ({ page }) => {
    await page.goto('/reports?tab=eod&action=close');
    await expect(page.getByRole('heading', { name: 'Günü Kapat', level: 2 })).toBeVisible();
    await expect(page.getByText(/Kontrol ediliyor/i)).toBeHidden({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /Günü kapat ve arşivle/i })).toBeVisible({ timeout: 15_000 });
  });

  test('Adım 3 — Eski gün sonu raporları', async ({ page }) => {
    await page.goto('/reports?tab=eod&action=archive');
    await expect(page.getByRole('heading', { name: 'Eski Gün Sonu Raporları', level: 2 })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'İş günü' })).toBeVisible();
  });

  test('Adım 4 — Oda fiyatlarını işle', async ({ page }) => {
    await page.goto('/reports?tab=eod&action=room-prices');
    await expect(page.getByRole('heading', { name: 'Oda Fiyatlarını İşle', level: 2 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fiyatları işle' })).toBeVisible();
  });
});
