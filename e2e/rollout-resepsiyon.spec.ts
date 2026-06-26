import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type RolloutCase = {
  label: string;
  path: string;
  heading: RegExp | string;
  activeNav?: RegExp | string;
  tableAssert?: boolean;
  readyWhen?: 'heading' | 'list' | 'main';
};

const RESEPSIYON_ROLLOUT: RolloutCase[] = [
  { label: 'Resepsiyon özeti', path: '/reception', heading: /Resepsiyon & Ön Kasa/i },
  { label: 'Konaklayanlar', path: '/reception/inhouse', heading: /Konaklayanlar/i },
  { label: 'Bugün giriş', path: '/reception/arrivals', heading: /Bugün Giriş Yapacaklar/i, tableAssert: true },
  { label: 'Bugün çıkış', path: '/reception/departures', heading: /Bugün Çıkış Yapacaklar/i, tableAssert: true },
  { label: 'Boş odalar', path: '/reception/vacant', heading: /Boş Oda/i },
  { label: 'Info Rack', path: '/guest-relations/info-rack', heading: /Info Rack/i, tableAssert: true },
  { label: 'Takip listesi', path: '/guest-relations/traces', heading: /Takip Listesi/i },
  { label: 'Arıza & şikayet', path: '/guest-relations/complaints', heading: /Arıza ve Şikayet Listesi/i, tableAssert: true },
  { label: 'Kayıp & bulunan', path: '/guest-relations/lost-found', heading: /Kayıp ve Bulunan/i },
];

test.describe('Resepsiyon rollout — adım adım', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const [index, step] of RESEPSIYON_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path, 'admin', {
        waitForSideNav: false,
        readyWhen: step.readyWhen ?? 'heading',
      });
      await expect(page.getByRole('heading', { name: step.heading }).first()).toBeVisible({ timeout: 45_000 });
      if (step.activeNav) {
        await expect(page.getByRole('link', { name: step.activeNav }).first()).toHaveClass(/is-active/);
      }
      if (step.path === '/reception') {
        await expect(page.getByText('Konaklayan').first()).toBeVisible();
        await expect(page.getByText('Kasa Defteri — bugün')).toBeVisible();
      }
      if (step.tableAssert) {
        await expect(page.getByRole('table').first()).toBeVisible({ timeout: 20_000 });
      }
      if (step.path === '/reception/vacant') {
        await expect(page.getByText(/Temiz|Check-in hazır/i).first()).toBeVisible();
      }
    });
  }
});
