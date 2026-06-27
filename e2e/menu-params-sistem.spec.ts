/**
 * Sistem menüsü URL parametreleri — rollout ile hizalı alt küme.
 * Tam kapsam: e2e/menu-params.spec.ts
 */
import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

const SISTEM_MENU_ROUTES: { path: string; heading: RegExp | string }[] = [
  { path: '/settings?hub=sistem', heading: /Sistem Merkezi/i },
  { path: '/tools/sistem', heading: /Sistem Merkezi/i },
  { path: '/tools/sistem?tab=sql', heading: /SQL/i },
  { path: '/reports', heading: /Raporlama Programı|Raporlar/i },
  { path: '/reports?tab=design', heading: /Rapor Tasarım/i },
  { path: '/reports?tab=user', heading: /Kullanıcı Tanımlı Raporlar/i },
  { path: '/reports?tab=forms', heading: /Form Tasarım/i },
  { path: '/reports?tab=special', heading: /Özel Raporlar/i },
  { path: '/reports?tab=daily', heading: /Günlük Raporlar/i },
  { path: '/reports?tab=management', heading: /Yönetim Raporu/i },
  { path: '/settings/integrations', heading: /Servis Programları/i },
  { path: '/settings/integrations/tesa', heading: /TESA/i },
  { path: '/settings/integrations/pbx', heading: /Grandstream/i },
  { path: '/settings/integrations/egm', heading: /EGM|Kimlik Bildirimi/i },
  { path: '/settings/integrations/channel-manager', heading: /Kanal Yöneticisi/i },
  { path: '/settings/integrations/booking-engine', heading: /Rezervasyon Motoru/i },
  { path: '/settings/compliance/5651', heading: /5651 Hotspot/i },
  { path: '/settings?section=language', heading: /Dil Tanımları/i },
  { path: '/settings?section=lang-forms', heading: /Form Metinleri/i },
  { path: '/settings?section=lang-menus', heading: /Menü Metinleri/i },
  { path: '/settings?section=lang-reports', heading: /Rapor Metinleri/i },
  { path: '/settings?section=nationalities', heading: /Uyruk Tanımları/i },
  { path: '/settings?section=sync', heading: /Entegrasyon Sync|Sync Durumu/i },
  { path: '/settings?section=users', heading: /Kullanıcı Tanımları/i },
  { path: '/settings?section=rate-plans', heading: /Fiyat Listeleri/i },
  { path: '/settings?tab=room-types', heading: /Oda Tanımları/i },
  { path: '/settings?section=inventory', heading: /Ürün Kartları/i },
];

test.describe('Sistem menü URL parametreleri', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const { path, heading } of SISTEM_MENU_ROUTES) {
    test(`${path} açılır`, async ({ page }) => {
      await gotoWithDemo(page, path, 'admin', { waitForSideNav: false, readyWhen: 'heading' });
      await expect(page.getByRole('heading', { name: heading, level: 1 }).first()).toBeVisible({
        timeout: 60_000,
      });
    });
  }
});
