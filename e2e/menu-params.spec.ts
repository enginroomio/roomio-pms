import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type MenuRoute = {
  path: string;
  heading?: RegExp | string;
  assert?: 'list';
  readyWhen?: 'heading' | 'list' | 'main';
};

const MENU_ROUTES: MenuRoute[] = [
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
  { path: '/reservations?status=OPTION', assert: 'list', readyWhen: 'list' },
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
  { path: '/settings?section=lang-menus', heading: /Menü Metin/i },
  { path: '/settings?section=lang-reports', heading: /Rapor Metin/i },
  { path: '/settings?section=nationalities', heading: /Uyruk/i },
  { path: '/tools/sistem?tab=sql', heading: /SQL/i },
  { path: '/rooms?filter=closed', heading: /Kapalı Oda|KAPALI/i },
  // Sistem — raporlar ve entegrasyonlar
  { path: '/reports', heading: /Raporlama Programı|Raporlar/i },
  { path: '/reports?tab=design', heading: /Rapor Tasarım/i },
  { path: '/reports?tab=user', heading: /Kullanıcı Tanımlı Raporlar/i },
  { path: '/settings/integrations', heading: /Servis Programları/i },
  { path: '/settings/integrations/tesa', heading: /TESA/i },
  { path: '/settings/integrations/pbx', heading: /Grandstream/i },
  { path: '/settings/integrations/channel-manager', heading: /Kanal Yöneticisi/i },
  { path: '/settings/integrations/booking-engine', heading: /Rezervasyon Motoru/i },
  { path: '/settings?section=users', heading: /Kullanıcı Tanımları/i },
  { path: '/settings?section=rate-plans', heading: /Fiyat/i },
  { path: '/settings?tab=room-types', heading: /Oda Tip/i },
  { path: '/settings?section=inventory', heading: /Ürün/i },
  // Sistem — ek rollout rotaları
  { path: '/settings?section=language', heading: /Dil Tanımları/i },
  { path: '/tools/sistem', heading: /Sistem Merkezi/i },
  { path: '/reports?tab=forms', heading: /Form Tasarım/i },
  { path: '/reports?tab=special', heading: /Özel Raporlar/i },
  { path: '/reports?tab=daily', heading: /Günlük Raporlar/i },
  { path: '/reports?tab=management', heading: /Yönetim Raporu/i },
  { path: '/settings/compliance/5651', heading: /5651 Hotspot/i },
];

test.describe('Menü URL parametreleri', () => {
  test.describe.configure({ timeout: 120_000 });
  for (const { path, heading, assert, readyWhen } of MENU_ROUTES) {
    test(`${path} açılır`, async ({ page }) => {
      await gotoWithDemo(page, path, 'admin', { waitForSideNav: false, readyWhen });
      if (assert === 'list') {
        await expect(page.getByRole('button', { name: 'Filtreler' })).toBeVisible({ timeout: 45_000 });
        await expect(page.getByRole('region', { name: /Rezervasyon listesi/i })).toBeVisible();
        return;
      }
      await expect(page.getByRole('heading', { name: heading! }).first()).toBeVisible({ timeout: 45_000 });
    });
  }
});
