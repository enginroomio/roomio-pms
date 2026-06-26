import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

test.describe('Sistem rollout — adım adım', () => {
  test('Adım 1 — Kuruluş — yan menü + alt ağaç', async ({ page }) => {
    await gotoWithDemo(page, '/settings');
    await expect(page.getByRole('heading', { name: 'Kuruluş', level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('navigation', { name: 'Kuruluş' })).toBeVisible();
    const otelLink = page.getByRole('link', { name: /Otel Bilgileri/i }).first();
    await otelLink.scrollIntoViewIfNeeded();
    await expect(otelLink).toBeVisible();
  });

  test('Adım 2 — Rapor Tasarım', async ({ page }) => {
    await gotoWithDemo(page, '/reports?tab=design');
    await expect(page.getByRole('heading', { name: 'Rapor Tasarım', level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Rapor Tasarım' }).first()).toHaveClass(/is-active/);
  });

  test('Adım 3 — Raporla', async ({ page }) => {
    await gotoWithDemo(page, '/reports');
    await expect(page.getByRole('heading', { name: /Raporlama Programı/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Raporla' }).first()).toHaveClass(/is-active/);
  });

  test('Adım 4 — Servis Programları (TESA)', async ({ page }) => {
    await gotoWithDemo(page, '/settings/integrations/tesa');
    await expect(page.getByRole('heading', { name: /TESA Hospitality/i })).toBeVisible();
    await expect(page.getByText(/PMS Service|Entegrasyon aktif/i).first()).toBeVisible();
  });

  test('Adım 5 — Dil Tanımları', async ({ page }) => {
    await gotoWithDemo(page, '/settings?section=language');
    await expect(page.getByRole('heading', { name: /Dil Tanımları/i, level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Yeni dil/i }).first()).toBeVisible();
  });
});
