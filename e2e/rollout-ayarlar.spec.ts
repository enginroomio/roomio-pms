import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type RolloutCase = {
  label: string;
  path: string;
  heading: RegExp | string;
  activeNav?: RegExp | string;
};

const AYARLAR_ROLLOUT: RolloutCase[] = [
  { label: 'Ayarlar merkezi', path: '/settings?hub=ayarlar', heading: /Ayarlar ve Kısayollar/i, activeNav: /Sisteme Giriş/i },
  { label: 'Şifre değiştir', path: '/settings?tab=password', heading: /Şifre Değiştir/i, activeNav: /Şifre Değiştir/i },
  { label: 'Tema seç', path: '/settings?tab=theme', heading: /Tema Seç/i, activeNav: /Tema Seç/i },
  { label: 'KVKK ve gizlilik', path: '/settings/privacy', heading: /Gizlilik/i, activeNav: /KVKK & Gizlilik/i },
  { label: 'Lisanslama', path: '/settings/licensing', heading: /Lisans Yönetimi/i, activeNav: /Lisanslama/i },
];

test.describe('Ayarlar rollout — adım adım', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const [index, step] of AYARLAR_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path, 'admin', { waitForSideNav: false, readyWhen: 'heading' });
      await expect(page.getByRole('heading', { name: step.heading, level: 1 }).first()).toBeVisible({
        timeout: 45_000,
      });
      await expect(page.getByRole('navigation', { name: 'Ayarlar' })).toBeVisible();
      if (step.activeNav) {
        await expect(page.getByRole('link', { name: step.activeNav }).first()).toHaveClass(/is-active/);
      }
    });
  }
});
