/**
 * Gün Sonu menüsü URL parametreleri — rollout ile hizalı.
 */
import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

const GUNSONU_MENU_ROUTES: {
  path: string;
  heading: RegExp | string;
  sectionHeading?: RegExp | string;
}[] = [
  { path: '/reports?hub=gunsonu', heading: /Gün Sonu Merkezi/i },
  { path: '/reports?tab=eod&action=fetch', heading: /Gün Sonu İşlemleri/i, sectionHeading: 'Gün Sonu Raporları' },
  { path: '/reports?tab=eod&action=close', heading: /Gün Sonu İşlemleri/i, sectionHeading: 'Günü Kapat' },
  { path: '/reports?tab=eod&action=archive', heading: /Gün Sonu İşlemleri/i, sectionHeading: 'Eski Gün Sonu Raporları' },
  { path: '/reports?tab=eod&action=backup', heading: /Gün Sonu İşlemleri/i, sectionHeading: 'Yedek Al' },
  { path: '/reports?tab=eod&action=room-prices', heading: /Gün Sonu İşlemleri/i, sectionHeading: 'Oda Fiyatlarını İşle' },
  { path: '/reports?tab=eod&action=extra-prices', heading: /Gün Sonu İşlemleri/i, sectionHeading: 'Ek Fiyatları Bas' },
  { path: '/reports?tab=eod&action=profile-check', heading: /Gün Sonu İşlemleri/i, sectionHeading: 'Misafir Profil Kontrol' },
  { path: '/reports?tab=eod&action=audit', heading: /Gün Sonu İşlemleri/i, sectionHeading: /Gece Denetim İzi|Denetim/i },
];

test.describe('Gün Sonu menü URL parametreleri', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const { path, heading, sectionHeading } of GUNSONU_MENU_ROUTES) {
    test(`${path} açılır`, async ({ page }) => {
      await gotoWithDemo(page, path, 'admin', { waitForSideNav: false, readyWhen: 'heading' });
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 60_000 });
      if (sectionHeading) {
        await expect(page.getByRole('heading', { name: sectionHeading, level: 2 })).toBeVisible({
          timeout: 30_000,
        });
      }
    });
  }
});
