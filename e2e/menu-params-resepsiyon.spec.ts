/**
 * Resepsiyon menüsü URL parametreleri — rollout ile hizalı.
 */
import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

const RESEPSIYON_MENU_ROUTES: {
  path: string;
  heading: RegExp | string;
  readyWhen?: 'heading' | 'list' | 'main';
}[] = [
  { path: '/reception?hub=resepsiyon', heading: /Resepsiyon Merkezi/i },
  { path: '/reception', heading: /Resepsiyon & Ön Kasa/i },
  { path: '/reception/inhouse', heading: /Konaklayanlar/i },
  { path: '/reception/arrivals', heading: /Bugün Giriş Yapacaklar/i },
  { path: '/reception/departures', heading: /Bugün Çıkış Yapacaklar/i },
  { path: '/reception/vacant', heading: /Boş Oda/i },
  { path: '/guest-relations/info-rack', heading: /Info Rack/i },
  { path: '/guest-relations/traces', heading: /Takip Listesi/i },
  { path: '/guest-relations/traces?tab=agenda', heading: /Ajanda/i },
  { path: '/guest-relations/complaints', heading: /Arıza ve Şikayet Listesi/i },
  { path: '/guest-relations/lost-found', heading: /Kayıp ve Bulunan/i },
  { path: '/reception/inhouse?action=share', heading: /Share Oda/i },
  { path: '/reception/inhouse?tab=daily-card', heading: /Günlük Kart/i },
];

test.describe('Resepsiyon menü URL parametreleri', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const { path, heading, readyWhen } of RESEPSIYON_MENU_ROUTES) {
    test(`${path} açılır`, async ({ page }) => {
      await gotoWithDemo(page, path, 'admin', { waitForSideNav: false, readyWhen: readyWhen ?? 'heading' });
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 60_000 });
    });
  }
});
