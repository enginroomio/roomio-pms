import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type RolloutCase = {
  label: string;
  path: string;
  heading: RegExp | string;
  activeNav?: RegExp | string;
};

const SISTEM_ROLLOUT: RolloutCase[] = [
  { label: 'Kuruluş — yan menü + alt ağaç', path: '/settings', heading: 'Kuruluş' },
  { label: 'Rapor Tasarım', path: '/reports?tab=design', heading: 'Rapor Tasarım', activeNav: 'Rapor Tasarım' },
  { label: 'Raporla', path: '/reports', heading: /Raporlama Programı/i, activeNav: 'Raporla' },
  { label: 'Servis Programları (TESA)', path: '/settings/integrations/tesa', heading: /TESA Hospitality/i },
  { label: 'Dil Tanımları', path: '/settings?section=language', heading: /Dil Tanımları/i },
  { label: 'Sistem Merkezi (hub)', path: '/settings?hub=sistem', heading: /Sistem Merkezi/i },
  { label: 'Sistem Merkezi (araçlar)', path: '/tools/sistem', heading: /Sistem Merkezi/i },
  { label: 'SQL Mesaj', path: '/tools/sistem?tab=sql', heading: /SQL Mesaj/i },
  { label: 'Kullanıcı Tanımlı Raporlar', path: '/reports?tab=user', heading: /Kullanıcı Tanımlı Raporlar/i },
  { label: 'Form Tasarım Listesi', path: '/reports?tab=forms', heading: /Form Tasarım/i },
  { label: 'Özel Raporlar', path: '/reports?tab=special', heading: /Özel Raporlar/i },
  { label: 'Günlük Raporlar', path: '/reports?tab=daily', heading: /Günlük Raporlar/i },
  { label: 'Yönetim Raporları', path: '/reports?tab=management', heading: /Yönetim Raporu/i },
  { label: 'Servis Programları (hub)', path: '/settings/integrations', heading: /Servis Programları/i },
  { label: '5651 Hotspot Loglama', path: '/settings/compliance/5651', heading: /5651 Hotspot/i },
  { label: 'Grandstream Santral', path: '/settings/integrations/pbx', heading: /Grandstream/i },
];

test.describe('Sistem rollout — adım adım', () => {
  test.describe.configure({ timeout: 90_000 });
  for (const [index, step] of SISTEM_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path);
      await expect(page.getByRole('heading', { name: step.heading, level: 1 }).first()).toBeVisible({
        timeout: 20_000,
      });
      if (step.activeNav) {
        await expect(page.getByRole('link', { name: step.activeNav }).first()).toHaveClass(/is-active/);
      }
      if (step.path === '/settings') {
        await expect(page.getByRole('navigation', { name: 'Kuruluş' })).toBeVisible();
        const otelLink = page.getByRole('link', { name: /Otel Bilgileri/i }).first();
        await otelLink.scrollIntoViewIfNeeded();
        await expect(otelLink).toBeVisible();
      }
      if (step.path === '/settings?section=language') {
        await expect(page.getByRole('button', { name: /Yeni dil/i }).first()).toBeVisible();
        await expect(page.getByRole('link', { name: /Dil Listesi/i }).first()).toHaveClass(/is-active/);
      }
      if (step.path === '/settings/integrations/tesa') {
        await expect(page.getByText(/PMS Service|Entegrasyon aktif/i).first()).toBeVisible();
      }
    });
  }

  test('Dil tanımları — sekme geçişi', async ({ page }) => {
    await gotoWithDemo(page, '/settings?section=lang-forms');
    await expect(page.getByRole('heading', { name: /Form Metinleri/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Form Metinleri/i }).first()).toHaveClass(/is-active/);
    await page.getByRole('link', { name: /Menü Metinleri/i }).click();
    await expect(page.getByRole('heading', { name: /Menü Metinleri/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Menü Metinleri/i }).first()).toHaveClass(/is-active/);
  });
});
