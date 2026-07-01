/**
 * Ayarlar modülü menü URL parametreleri — rollout ile hizalı.
 */
import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

const AYARLAR_MENU_ROUTES: { path: string; heading: RegExp | string }[] = [
  { path: '/settings?hub=ayarlar', heading: /Ayarlar ve Kısayollar/i },
  { path: '/settings?tab=password', heading: /Şifre/i },
  { path: '/settings?tab=theme', heading: /Tema/i },
  { path: '/settings?tool=calculator', heading: /Hesap Makinesi/i },
  { path: '/settings/privacy', heading: /Gizlilik/i },
  { path: '/settings/privacy?tab=sql', heading: /Kayıt İzleme/i },
  { path: '/settings/licensing', heading: /Lisans Yönetimi/i },
];

test.describe('Ayarlar menü URL parametreleri', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const { path, heading } of AYARLAR_MENU_ROUTES) {
    test(`${path} açılır`, async ({ page }) => {
      await gotoWithDemo(page, path, 'admin', { waitForSideNav: false, readyWhen: 'heading' });
      await expect(page.getByRole('heading', { name: heading, level: 1 }).first()).toBeVisible({
        timeout: 60_000,
      });
      await expect(page.getByRole('navigation', { name: 'Ayarlar' })).toBeVisible();
    });
  }
});
