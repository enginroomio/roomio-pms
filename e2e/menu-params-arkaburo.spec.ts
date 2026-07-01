/**
 * Arka Büro modülü menü URL parametreleri — rollout ile hizalı.
 */
import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

const ARKABURO_MENU_ROUTES: { path: string; heading: RegExp | string }[] = [
  { path: '/accounting?hub=arkaburo', heading: /Arka Büro/i },
  { path: '/accounting?tab=invoices', heading: /Fatura|Muhasebe/i },
  { path: '/accounting?tab=proforma', heading: /Proforma Fatura/i },
  { path: '/accounting?tab=cari', heading: /Cari Kartlar/i },
  { path: '/accounting?tab=cari-payments', heading: /Cari Ödemeler/i },
  { path: '/accounting?tab=bank-cards', heading: /Kasa|Banka Kartları/i },
  { path: '/accounting?tab=stock', heading: /Stok|Ürün/i },
  { path: '/accounting?tab=budget', heading: /Bütçe/i },
  { path: '/reports?tab=prepare', heading: /Yönetim Raporu/i },
  { path: '/reports?report=gunluk-balans', heading: /Günlük Balans/i },
  { path: '/reports?report=kredi-kontrol', heading: /Kredi Kontrol/i },
];

test.describe('Arka Büro menü URL parametreleri', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const { path, heading } of ARKABURO_MENU_ROUTES) {
    test(`${path} açılır`, async ({ page }) => {
      await gotoWithDemo(page, path, 'admin', { waitForSideNav: false, readyWhen: 'heading' });
      await expect(page.getByRole('heading', { name: heading, level: 1 }).first()).toBeVisible({
        timeout: 60_000,
      });
      await expect(page.getByRole('navigation', { name: 'Arka Büro' })).toBeVisible();
    });
  }
});
