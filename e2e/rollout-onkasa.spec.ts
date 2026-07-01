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

const ONKASA_ROLLOUT: RolloutCase[] = [
  { label: 'Ön Kasa Merkezi', path: '/reception?hub=onkasa', heading: /Ön Kasa Merkezi/i, activeNav: /Ön Kasa Merkezi/i },
  { label: 'Kasa defteri (F6)', path: '/reception?tab=kasa', heading: /Kasa Defteri \(F6\)/i, activeNav: /Kasa Defterleri/i, tableAssert: true },
  { label: 'Kasa kapatma listesi', path: '/reception?tab=kasa-close', heading: /Kasa Kapatma Listesi/i, activeNav: /Kasa Kapatma Listesi/i, tableAssert: true },
  { label: 'Kasa avans ve devir', path: '/reception?tab=advance', heading: /Kasa Avans ve Devir Listesi/i, activeNav: /Kasa Avans ve Devir Listesi/i },
  { label: 'Günlük oda tahsilat', path: '/reception/arrivals?tab=collections', heading: /Günlük Oda Tahsilat Listesi/i, activeNav: /Günlük Oda Tahsilat Listesi/i },
  { label: 'Döviz bozdurma', path: '/reception/departures?tab=fx', heading: /Döviz Bozdurma Listesi/i, activeNav: /Döviz Bozdurma Listesi/i, tableAssert: true },
  { label: 'Günlük kur girişi', path: '/reception/departures?tab=rates', heading: /Günlük Kur Girişi/i, activeNav: /Günlük Kur Girişi/i },
  { label: 'Depozit işlemleri', path: '/reception/vacant?tab=deposit', heading: /Depozit İşlemleri/i, activeNav: /Depozit İşlemleri/i, tableAssert: true },
];

test.describe('Ön Kasa rollout — adım adım', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const [index, step] of ONKASA_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path, 'admin', {
        waitForSideNav: false,
        readyWhen: step.readyWhen ?? 'heading',
      });
      await expect(page.getByRole('heading', { name: step.heading }).first()).toBeVisible({ timeout: 45_000 });

      if (step.activeNav) {
        await expect(page.getByRole('navigation', { name: 'Ön Kasa' })).toBeVisible();
        await expect(page.getByRole('link', { name: step.activeNav }).first()).toHaveClass(/is-active/);
        await expect(page.locator('nav[aria-label="Resepsiyon alt menü"]')).toHaveCount(0);
      }

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
