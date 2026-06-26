import { test, expect } from '@playwright/test';
import { useDemoRole, waitForDemoSession } from './helpers/demo-auth';

const MENU_ROUTES: { path: string; heading: RegExp | string }[] = [
  // Hub merkezleri
  { path: '/reservations?hub=rezervasyon', heading: /Rezervasyon Merkezi/i },
  { path: '/reception?hub=resepsiyon', heading: /Resepsiyon Merkezi/i },
  { path: '/reception?hub=onkasa', heading: /Ön Kasa Merkezi/i },
  { path: '/housekeeping?hub=kat', heading: /Kat Hizmetleri Merkezi/i },
  { path: '/guest-relations?hub=misafir', heading: /Misafir İlişkileri Merkezi/i },
  { path: '/settings?hub=sistem', heading: /Sistem Merkezi/i },
  { path: '/accounting?hub=arkaburo', heading: /Arka Büro/i },
  { path: '/fnb?hub=banket', heading: /Banket Merkezi/i },
  { path: '/reports?hub=raporlar', heading: /Raporlar Merkezi/i },
  { path: '/reports?hub=gunsonu', heading: /Gün Sonu Merkezi/i },
  // URL parametreli alt menüler
  { path: '/reservations?tab=import', heading: /Acenta Rezervasyon Aktarım/i },
  { path: '/reservations?status=OPTION', heading: /Rezervasyon|Bekleme/i },
  { path: '/reservations?tab=availability&prices=1', heading: /Müsaitlik|Fiyat/i },
  { path: '/settings/integrations/egm', heading: /EGM|Kimlik Bildirimi/i },
  { path: '/fnb?tab=definitions', heading: /Banket|Tanım/i },
  { path: '/reception/arrivals?tab=collections', heading: /Tahsilat/i },
  { path: '/reception/inhouse?action=share', heading: /Share Oda/i },
  { path: '/reception/inhouse?tab=daily-card', heading: /Günlük Kart/i },
  { path: '/reception/vacant?tab=deposit-refund', heading: /Depozit/i },
  { path: '/reception?tab=kimlik-new', heading: /Kimlik/i },
  { path: '/reports?tab=eod&action=backup', heading: /Yedek/i },
  { path: '/accounting?tab=proforma', heading: /Proforma/i },
  { path: '/accounting?tab=cari-payments', heading: /Cari Ödemeler/i },
  { path: '/guest-relations?tab=messages', heading: /CRM Mesaj/i },
  { path: '/guest-relations/traces?tab=agenda', heading: /Ajanda/i },
  { path: '/housekeeping/rooms?tab=control', heading: /Oda Kontrol/i },
  { path: '/housekeeping/tasks?tab=checklist', heading: /Kontrol Listesi/i },
  { path: '/settings?section=sync', heading: /Sync|Senkron/i },
  { path: '/settings?section=lang-forms', heading: /Form Metin/i },
  { path: '/tools/sistem?tab=sql', heading: /SQL/i },
  { path: '/rooms?filter=closed', heading: /Kapalı Oda|KAPALI/i },
];

test.describe('Menü URL parametreleri', () => {
  test.beforeEach(async ({ page }) => {
    await useDemoRole(page, 'admin');
    await waitForDemoSession(page);
  });

  for (const { path, heading } of MENU_ROUTES) {
    test(`${path} açılır`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 45_000 });
    });
  }
});
