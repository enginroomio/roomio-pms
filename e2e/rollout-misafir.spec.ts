import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type RolloutCase = {
  label: string;
  path: string;
  heading: RegExp | string;
  tableAssert?: boolean;
  readyWhen?: 'heading' | 'list' | 'main';
};

const MISAFIR_ROLLOUT: RolloutCase[] = [
  { label: 'Misafir İlişkileri Merkezi', path: '/guest-relations?hub=misafir', heading: /Misafir İlişkileri Merkezi/i },
  { label: 'Misafir ilişkileri özeti', path: '/guest-relations', heading: /Misafir İlişkileri Özeti/i },
  { label: 'Takip listesi (Traces)', path: '/guest-relations/traces', heading: /Takip Listesi/i, tableAssert: true },
  { label: 'VIP misafir listesi', path: '/guest-relations/vip', heading: /VIP Misafir Listesi/i },
  { label: 'Misafir yorumları', path: '/guest-relations/reviews', heading: /Misafir Yorum Listesi/i },
  { label: 'Banket Merkezi', path: '/fnb?hub=banket', heading: /Banket Merkezi/i },
  { label: 'Banket rezervasyon', path: '/fnb', heading: /Banket Rezervasyon/i },
];

test.describe('Misafir rollout — adım adım', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const [index, step] of MISAFIR_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path, 'admin', {
        waitForSideNav: false,
        readyWhen: step.readyWhen ?? 'heading',
      });
      await expect(page.getByRole('heading', { name: step.heading }).first()).toBeVisible({ timeout: 45_000 });
      if (step.tableAssert) {
        await expect(page.getByRole('table').first()).toBeVisible({ timeout: 20_000 });
      }
      if (step.path === '/guest-relations') {
        await expect(page.getByRole('link', { name: /Takip Listesi/i }).first()).toBeVisible();
      }
      if (step.path === '/fnb') {
        await expect(page.getByRole('link', { name: /Ajanda|Banket/i }).first()).toBeVisible();
      }
    });
  }
});
