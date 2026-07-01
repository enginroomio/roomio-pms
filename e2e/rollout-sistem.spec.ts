import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type RolloutCase = {
  label: string;
  path: string;
  heading: RegExp | string;
  activeNav?: RegExp | string;
};

const SISTEM_ROLLOUT: RolloutCase[] = [
  { label: 'Kuruluş — yan menü + alt ağaç', path: '/settings', heading: /Otel Bilgileri/i },
  { label: 'Rapor Tasarım', path: '/reports?tab=design', heading: 'Rapor Tasarım', activeNav: 'Rapor Tasarım' },
  { label: 'Servis Programları (hub)', path: '/settings/integrations', heading: /Servis Programları/i, activeNav: 'Servis Programları' },
  { label: 'Dil Tanımları', path: '/settings?section=language', heading: /Dil Tanımları/i, activeNav: 'Dil Tanımları' },
  { label: 'Sistem Merkezi', path: '/tools/sistem', heading: /Sistem Merkezi/i, activeNav: 'Sistem Merkezi' },
  { label: 'SQL Mesaj', path: '/tools/sistem?tab=sql', heading: /SQL Mesaj/i, activeNav: 'SQL Mesaj' },
  { label: 'Kullanıcı Tanımlı Raporlar', path: '/reports?tab=user', heading: /Kullanıcı Tanımlı Raporlar/i },
  { label: 'Form Tasarım Listesi', path: '/reports?tab=forms', heading: /Form Tasarım/i },
  { label: 'Servis Programları (TESA)', path: '/settings/integrations/tesa', heading: /TESA Hospitality/i },
  { label: '5651 Hotspot Loglama', path: '/settings/compliance/5651', heading: /5651 Hotspot/i, activeNav: '5651 Hotspot Loglama' },
  { label: 'Grandstream Santral', path: '/settings/integrations/pbx', heading: /Grandstream/i, activeNav: 'Grandstream Santral' },
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
        const sideNav = page.getByRole('navigation', { name: 'Sistem' });
        await expect(sideNav.getByRole('link', { name: step.activeNav }).first()).toHaveClass(/is-active/);
      }
      if (step.path === '/settings') {
        await expect(page.getByRole('navigation', { name: 'Kuruluş' })).toBeVisible();
        const otelLink = page.getByRole('link', { name: /Otel Bilgileri/i }).first();
        await otelLink.scrollIntoViewIfNeeded();
        await expect(otelLink).toBeVisible();
        await expect(otelLink).toHaveClass(/is-active/);
      }
      if (step.path === '/settings?section=language') {
        await expect(page.getByRole('navigation', { name: 'Sistem' })).toBeVisible();
        await expect(page.getByRole('button', { name: /Yeni dil/i }).first()).toBeVisible();
        await expect(page.getByRole('link', { name: /Dil Listesi/i }).first()).toHaveClass(/is-active/);
        await expect(page.getByRole('link', { name: 'Dil Tanımları' }).first()).toHaveClass(/is-active/);
      }
      if (step.path === '/reports?tab=design') {
        await expect(page.getByText(/Raporlar merkezi/i)).toHaveCount(0);
        await expect(page.getByRole('link', { name: 'Rapor Tasarım' }).first()).toHaveClass(/is-active/);
        await expect(page.getByRole('navigation', { name: 'Sistem' })).toBeVisible();
      }
      if (step.path === '/settings/integrations') {
        await expect(page.getByRole('navigation', { name: 'Sistem' }).getByRole('link', { name: 'Servis Programları' }).first()).toHaveClass(/is-active/);
      }
      if (step.path === '/tools/sistem') {
        await expect(page.getByRole('link', { name: 'Sistem Merkezi' }).first()).toHaveClass(/is-active/);
      }
      if (step.path === '/tools/sistem?tab=sql') {
        await expect(page.getByRole('link', { name: 'SQL Mesaj' }).first()).toHaveClass(/is-active/);
        await expect(page.getByRole('link', { name: 'Sistem Merkezi' }).first()).not.toHaveClass(/is-active/);
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
