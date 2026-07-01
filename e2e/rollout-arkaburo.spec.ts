import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type RolloutCase = {
  label: string;
  path: string;
  heading: RegExp | string;
  activeNav?: RegExp | string;
};

const ARKABURO_ROLLOUT: RolloutCase[] = [
  { label: 'Arka Büro Merkezi', path: '/accounting?hub=arkaburo', heading: /Arka Büro/i, activeNav: /Arka Büro Merkezi/i },
  { label: 'Fatura listesi', path: '/accounting?tab=invoices', heading: /Fatura|Muhasebe/i, activeNav: /Fatura Listesi/i },
  { label: 'Cari kartlar', path: '/accounting?tab=cari', heading: /Cari Kartlar/i, activeNav: /Cari Kartlar/i },
  { label: 'Yönetim raporu hazırlama', path: '/reports?tab=prepare', heading: /Yönetim Raporu Hazırlama|Yönetim Raporu/i, activeNav: /Yönetim Raporu Hazırlama/i },
  { label: 'Günlük balanslar', path: '/reports?report=gunluk-balans', heading: /Günlük Balans/i, activeNav: /Günlük Balanslar/i },
];

test.describe('Arka Büro rollout — adım adım', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const [index, step] of ARKABURO_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path, 'admin', { waitForSideNav: false, readyWhen: 'heading' });
      await expect(page.getByRole('heading', { name: step.heading, level: 1 }).first()).toBeVisible({
        timeout: 45_000,
      });
      await expect(page.getByRole('navigation', { name: 'Arka Büro' })).toBeVisible();
      if (step.activeNav) {
        await expect(page.getByRole('link', { name: step.activeNav }).first()).toHaveClass(/is-active/);
      }
    });
  }
});
