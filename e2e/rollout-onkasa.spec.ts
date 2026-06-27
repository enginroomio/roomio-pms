import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type RolloutCase = {
  label: string;
  path: string;
  heading: RegExp | string;
  tableAssert?: boolean;
  readyWhen?: 'heading' | 'list' | 'main';
};

const ONKASA_ROLLOUT: RolloutCase[] = [
  { label: 'Ön Kasa Merkezi', path: '/reception?hub=onkasa', heading: /Ön Kasa Merkezi/i },
  { label: 'Kasa defteri (F6)', path: '/reception?tab=kasa', heading: /Kasa Defteri \(F6\)/i, tableAssert: true },
  { label: 'Kasa kapatma listesi', path: '/reception?tab=kasa-close', heading: /Kasa Kapatma Listesi/i, tableAssert: true },
  { label: 'Kasa avans ve devir', path: '/reception?tab=advance', heading: /Kasa Avans ve Devir Listesi/i },
  { label: 'Günlük oda tahsilat', path: '/reception/arrivals?tab=collections', heading: /Günlük Oda Tahsilat Listesi/i },
  { label: 'Döviz bozdurma', path: '/reception/departures?tab=fx', heading: /Döviz Bozdurma Listesi/i, tableAssert: true, readyWhen: 'main' },
  { label: 'Günlük kur girişi', path: '/reception/departures?tab=rates', heading: /Günlük Kur Girişi/i, readyWhen: 'main' },
  { label: 'Depozit işlemleri', path: '/reception/vacant?tab=deposit', heading: /Depozit İşlemleri/i, tableAssert: true, readyWhen: 'main' },
];

test.describe('Ön Kasa rollout — adım adım', () => {
  test.describe.configure({ timeout: 180_000 });

  for (const [index, step] of ONKASA_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path, 'admin', {
        waitForSideNav: false,
        readyWhen: step.readyWhen ?? 'heading',
      });
      await expect(page.getByRole('heading', { name: step.heading }).first()).toBeVisible({ timeout: 45_000 });

      if (step.path === '/reception?tab=kasa-close') {
        await expect(page.getByText(/Kasa kapat|Kasa devir/i).first()).toBeVisible();
        await expect(page.getByRole('button', { name: /PDF indir/i }).first()).toBeVisible();
      }
      if (step.path === '/reception/departures?tab=fx') {
        await expect(page.getByRole('main').getByText(/Bozdurma kuru|bozdurma kaydı/i).first()).toBeVisible({
          timeout: 30_000,
        });
      }
      if (step.path === '/reception/vacant?tab=deposit') {
        await expect(page.getByRole('button', { name: /Depozit al/i })).toBeVisible();
      }
      if (step.tableAssert) {
        await expect(page.getByRole('table').first()).toBeVisible({ timeout: 20_000 });
      }
    });
  }
});
