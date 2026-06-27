/**
 * Kat Hizmetleri menüsü URL parametreleri — rollout ile hizalı.
 */
import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

const KAT_MENU_ROUTES: { path: string; heading: RegExp | string }[] = [
  { path: '/housekeeping?hub=kat', heading: /Kat Hizmetleri Merkezi/i },
  { path: '/housekeeping', heading: /Housekeeping Pano/i },
  { path: '/housekeeping/rooms', heading: /Oda Listesi/i },
  { path: '/housekeeping/rooms?tab=control', heading: /House Keeping Oda Kontrolü/i },
  { path: '/housekeeping/tasks', heading: /^Görevler$/i },
  { path: '/housekeeping/tasks?tab=checklist', heading: /Housekeeper Kontrol Listesi/i },
  { path: '/housekeeping/tasks?tab=archive', heading: /Oda Kontrol Arşiv Listesi/i },
  { path: '/housekeeping/operations', heading: /Housekeeping & Operations Hub/i },
  { path: '/rooms', heading: /Room Rack/i },
  { path: '/rooms?view=new-rack', heading: /Klasik Room Rack|Klasik Rack/i },
  { path: '/rooms?filter=closed', heading: /Kapalı Oda/i },
  { path: '/rooms?tab=blocking', heading: /Hızlı Blokaj/i },
  { path: '/reception/vacant', heading: /Boş Oda/i },
];

test.describe('Kat Hizmetleri menü URL parametreleri', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const { path, heading } of KAT_MENU_ROUTES) {
    test(`${path} açılır`, async ({ page }) => {
      await gotoWithDemo(page, path, 'admin', { waitForSideNav: false, readyWhen: 'heading' });
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 60_000 });
    });
  }
});
