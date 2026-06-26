/**
 * Ön Kasa menüsü URL parametreleri — rollout ile hizalı.
 */
import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

const ONKASA_MENU_ROUTES: { path: string; heading: RegExp | string }[] = [
  { path: '/reception?hub=onkasa', heading: /Ön Kasa Merkezi/i },
  { path: '/reception?tab=kasa', heading: /Kasa Defteri \(F6\)/i },
  { path: '/reception?tab=kasa-close', heading: /Kasa Kapatma Listesi/i },
  { path: '/reception?tab=advance', heading: /Kasa Avans ve Devir Listesi/i },
  { path: '/reception/arrivals?tab=collections', heading: /Günlük Oda Tahsilat Listesi/i },
  { path: '/reception/departures?tab=fx', heading: /Döviz Bozdurma Listesi/i },
  { path: '/reception/departures?tab=rates', heading: /Günlük Kur Girişi/i },
  { path: '/reception/vacant?tab=deposit', heading: /Depozit İşlemleri/i },
  { path: '/reception/vacant?tab=deposit-collect', heading: /Depozit Tahsilat/i },
  { path: '/reception/vacant?tab=deposit-refund', heading: /Depozit İade/i },
  { path: '/reception/arrivals?tab=prepay', heading: /Ön Ödeme/i },
  { path: '/reception/arrivals?tab=cash-sale', heading: /Peşin Satış İşlemi/i },
  { path: '/reception/inhouse?tab=bulk', heading: /Toplu İşlem Girişi/i },
];

test.describe('Ön Kasa menü URL parametreleri', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const { path, heading } of ONKASA_MENU_ROUTES) {
    test(`${path} açılır`, async ({ page }) => {
      await gotoWithDemo(page, path, 'admin', { waitForSideNav: false, readyWhen: 'heading' });
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 60_000 });
    });
  }
});
