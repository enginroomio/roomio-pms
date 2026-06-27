/**
 * Misafir İlişkileri & Banket menüsü URL parametreleri — rollout ile hizalı.
 */
import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

const MISAFIR_MENU_ROUTES: { path: string; heading: RegExp | string }[] = [
  { path: '/guest-relations?hub=misafir', heading: /Misafir İlişkileri Merkezi/i },
  { path: '/guest-relations', heading: /Misafir İlişkileri Özeti/i },
  { path: '/guest-relations/traces', heading: /Takip Listesi/i },
  { path: '/guest-relations/traces?tab=agenda', heading: /Ajanda/i },
  { path: '/guest-relations/traces?type=wakeup', heading: /Uyandırma Listesi/i },
  { path: '/guest-relations/vip', heading: /VIP Misafir Listesi/i },
  { path: '/guest-relations/reviews', heading: /Misafir Yorum Listesi/i },
  { path: '/guest-relations/reviews/new', heading: /Misafir Yorum Girişi/i },
  { path: '/guest-relations/lost-found', heading: /Kayıp ve Bulunan/i },
  { path: '/guest-relations/reclamations', heading: /Reklamasyon/i },
  { path: '/guest-relations/restaurant', heading: /Restoran Rezervasyon/i },
  { path: '/guest-relations/tennis', heading: /Tenis Kort Rezervasyon/i },
  { path: '/guest-relations?tab=messages', heading: /CRM Mesaj/i },
  { path: '/fnb?hub=banket', heading: /Banket Merkezi/i },
  { path: '/fnb', heading: /Banket Rezervasyon/i },
  { path: '/fnb?tab=calendar', heading: /Banket Ajanda/i },
  { path: '/fnb?tab=definitions', heading: /Banket İlk Tanımlar/i },
];

test.describe('Misafir İlişkileri menü URL parametreleri', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const { path, heading } of MISAFIR_MENU_ROUTES) {
    test(`${path} açılır`, async ({ page }) => {
      await gotoWithDemo(page, path, 'admin', { waitForSideNav: false, readyWhen: 'heading' });
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 60_000 });
    });
  }
});
