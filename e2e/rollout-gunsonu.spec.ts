import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type RolloutCase = {
  label: string;
  path: string;
  heading: RegExp | string;
  activeNav?: RegExp | string;
  legacyPreview?: boolean;
  backupTab?: boolean;
};

const GUNSONU_ROLLOUT: RolloutCase[] = [
  { label: 'Gün Sonu Merkezi', path: '/reports?hub=gunsonu', heading: /Gün Sonu Merkezi/i, activeNav: /Gün Sonu Merkezi/i },
  { label: 'Gün sonu raporlarını al', path: '/reports?tab=eod&action=fetch', heading: /Gün Sonu Raporları/i, activeNav: /Gün Sonu Raporlarını Al/i },
  { label: 'Günü kapat', path: '/reports?tab=eod&action=close', heading: /Günü Kapat/i, activeNav: /Günü Kapat/i },
  {
    label: 'Eski gün sonu raporları',
    path: '/reports?tab=eod&action=archive',
    heading: /Eski Gün Sonu Raporları/i,
    activeNav: /Eski Gün Sonu Raporları/i,
    legacyPreview: true,
  },
  { label: 'Oda fiyatlarını işle', path: '/reports?tab=eod&action=room-prices', heading: /Oda Fiyatlarını İşle/i, activeNav: /Oda Fiyatlarını İşle/i },
  { label: 'Yedek al', path: '/reports?tab=eod&action=backup', heading: /Yedek Al/i, activeNav: /Yedek/i, backupTab: true },
];

test.describe('Gün Sonu rollout — adım adım', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const [index, step] of GUNSONU_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path, 'admin', {
        waitForSideNav: false,
        readyWhen: step.legacyPreview || step.backupTab ? 'main' : 'heading',
      });
      if (step.legacyPreview || step.backupTab) {
        await expect(page.getByRole('heading', { name: step.heading, level: 2 })).toBeVisible({ timeout: 45_000 });
      } else {
        await expect(page.getByRole('heading', { name: step.heading, level: 1 }).first()).toBeVisible({ timeout: 45_000 });
      }
      await expect(page.getByRole('navigation', { name: 'Gün Sonu' })).toBeVisible();
      if (step.activeNav) {
        await expect(page.getByRole('link', { name: step.activeNav }).first()).toHaveClass(/is-active/);
      }
      if (step.legacyPreview) {
        await expect(page.getByTestId('eod-legacy-workspace')).toBeVisible();
        const preview = page.getByTestId('eod-legacy-workspace').locator('pre');
        await expect(preview.getByText(/ABDULLA ALAMERI/)).toBeVisible();
      }
      if (step.backupTab) {
        await expect(page.getByRole('button', { name: 'Yedek al' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Bulut yedek ayarları' })).toBeVisible();
      }
    });
  }
});
