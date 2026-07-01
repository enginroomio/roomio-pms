/**
 * Raporlar modülü menü URL parametreleri — rollout ile hizalı.
 */
import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

const RAPORLAR_MENU_ROUTES: { path: string; heading: RegExp | string }[] = [
  { path: '/reports?hub=raporlar', heading: /Raporlar Merkezi/i },
  { path: '/reports', heading: /Raporlama Programı/i },
  { path: '/reports?tab=special', heading: /Özel Raporlar/i },
  { path: '/reports?tab=remote', heading: /Uzak Otelden Raporlama/i },
  { path: '/reports?category=forecast', heading: /FC-Forecast Raporları/i },
  { path: '/reports?category=rezervasyon', heading: /FO-Önbüro Raporları/i },
  { path: '/reports?category=gunluk', heading: /DL-Günlük Raporlar|Günlük Raporlar/i },
  { path: '/reports?category=kathizmetleri', heading: /HK-HouseKeeping Raporları|House Keeping Raporu/i },
  { path: '/reports?category=gelir', heading: /DR-Günlük Gelir|MG-Muhasebe Gelir/i },
  { path: '/reports?category=yonetim', heading: /BO-ArkaBüro Raporları|MR-Yönetim/i },
  { path: '/reports?category=egm', heading: /EGM Kimlik/i },
];

test.describe('Raporlar menü URL parametreleri', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const { path, heading } of RAPORLAR_MENU_ROUTES) {
    test(`${path} açılır`, async ({ page }) => {
      await gotoWithDemo(page, path, 'admin', { waitForSideNav: false, readyWhen: 'heading' });
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 60_000 });
      await expect(page.getByRole('navigation', { name: 'Raporlar' })).toBeVisible();
    });
  }
});
