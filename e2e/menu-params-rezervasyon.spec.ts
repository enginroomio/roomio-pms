/**
 * Rezervasyon menüsü URL parametreleri — rollout ile hizalı.
 */
import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

const REZERVASYON_MENU_ROUTES: {
  path: string;
  heading?: RegExp | string;
  assert?: 'list';
  readyWhen?: 'heading' | 'list' | 'main';
}[] = [
  { path: '/reservations?hub=rezervasyon', heading: /Rezervasyon Merkezi/i, readyWhen: 'heading' },
  { path: '/reservations/calendar', heading: /^Grafikler$/i, readyWhen: 'heading' },
  { path: '/reservations/new', heading: /Yeni Rezervasyon/i, readyWhen: 'heading' },
  { path: '/reservations', assert: 'list', readyWhen: 'list' },
  { path: '/reservations?tab=import', heading: /Acenta Rezervasyon Aktarım/i, readyWhen: 'heading' },
  { path: '/reservations?status=OPTION', assert: 'list', readyWhen: 'list' },
  { path: '/reservations?tab=availability&prices=1', heading: /Oda Müsaitlik \(Fiyatlı\)/i, readyWhen: 'heading' },
  { path: '/reservations?tab=availability', heading: /Oda Planı/i, readyWhen: 'heading' },
  { path: '/reservations?track=1', assert: 'list', readyWhen: 'list' },
  { path: '/reception/inhouse', heading: /Konaklayanlar/i, readyWhen: 'heading' },
  { path: '/reception/vacant', heading: /Boş Oda/i, readyWhen: 'heading' },
  { path: '/rooms?tab=blocking', heading: /Hızlı Blokaj/i, readyWhen: 'heading' },
  { path: '/rooms?filter=closed', heading: /Kapalı Oda|KAPALI/i, readyWhen: 'heading' },
];

test.describe('Rezervasyon menü URL parametreleri', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const { path, heading, assert, readyWhen } of REZERVASYON_MENU_ROUTES) {
    test(`${path} açılır`, async ({ page }) => {
      await gotoWithDemo(page, path, 'admin', { waitForSideNav: false, readyWhen });
      if (assert === 'list') {
        await expect(page.getByRole('button', { name: 'Filtreler' })).toBeVisible({ timeout: 45_000 });
        await expect(page.getByRole('region', { name: /Rezervasyon listesi/i })).toBeVisible();
        return;
      }
      await expect(page.getByRole('heading', { name: heading! }).first()).toBeVisible({ timeout: 60_000 });
    });
  }
});
