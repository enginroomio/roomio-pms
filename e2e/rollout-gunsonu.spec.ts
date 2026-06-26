import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type RolloutCase = {
  label: string;
  path: string;
  heading: RegExp | string;
  sectionHeading?: RegExp | string;
  hub?: boolean;
};

const GUNSONU_ROLLOUT: RolloutCase[] = [
  { label: 'Gün Sonu Merkezi', path: '/reports?hub=gunsonu', heading: /Gün Sonu Merkezi/i, hub: true },
  { label: 'Gün sonu raporlarını al', path: '/reports?tab=eod&action=fetch', heading: /Gün Sonu İşlemleri/i, sectionHeading: 'Gün Sonu Raporları' },
  { label: 'Günü kapat', path: '/reports?tab=eod&action=close', heading: /Gün Sonu İşlemleri/i, sectionHeading: 'Günü Kapat' },
  { label: 'Eski gün sonu raporları', path: '/reports?tab=eod&action=archive', heading: /Gün Sonu İşlemleri/i, sectionHeading: 'Eski Gün Sonu Raporları' },
  { label: 'Oda fiyatlarını işle', path: '/reports?tab=eod&action=room-prices', heading: /Gün Sonu İşlemleri/i, sectionHeading: 'Oda Fiyatlarını İşle' },
  { label: 'Yedek al', path: '/reports?tab=eod&action=backup', heading: /Gün Sonu İşlemleri/i, sectionHeading: 'Yedek Al' },
];

test.describe('Gün Sonu rollout — adım adım', () => {
  test.describe.configure({ timeout: 180_000 });

  for (const [index, step] of GUNSONU_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path, 'admin', { waitForSideNav: false, readyWhen: 'main' });
      await expect(page.getByRole('heading', { name: step.heading }).first()).toBeVisible({ timeout: 45_000 });

      if (step.hub) {
        await expect(page.getByRole('link', { name: /Rapor Paketi|Günü Kapat/i }).first()).toBeVisible();
        return;
      }

      await expect(page.getByRole('heading', { name: step.sectionHeading!, level: 2 })).toBeVisible({
        timeout: 20_000,
      });

      if (step.path.includes('action=fetch')) {
        await expect(page.getByRole('link', { name: 'Raporları al' })).toHaveClass(/is-active/);
        await expect(page.getByRole('button', { name: 'Tüm raporları al' })).toBeVisible();
      }
      if (step.path.includes('action=close')) {
        await expect(page.getByRole('link', { name: 'Günü kapat' })).toHaveClass(/is-active/);
        await expect(
          page.getByRole('heading', { name: /Gece denetim ön kontrol/i, level: 3 }),
        ).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Kategori' })).toBeVisible({
          timeout: 30_000,
        });
        await expect(page.getByRole('link', { name: 'Önce raporları al' })).toBeVisible();
      }
      if (step.path.includes('action=archive')) {
        await expect(page.getByRole('columnheader', { name: 'İş günü' })).toBeVisible();
      }
      if (step.path.includes('action=room-prices')) {
        await expect(page.getByRole('button', { name: 'Fiyatları işle' })).toBeVisible();
      }
      if (step.path.includes('action=backup')) {
        await expect(page.getByRole('button', { name: 'Yedek al' })).toBeVisible();
      }
    });
  }
});
