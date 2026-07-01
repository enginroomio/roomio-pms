import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type RolloutCase = {
  label: string;
  path: string;
  heading: RegExp | string;
  activeNav?: RegExp | string;
  sideTitle?: string;
};

const RAPORLAR_ROLLOUT: RolloutCase[] = [
  { label: 'Raporlar Merkezi', path: '/reports?hub=raporlar', heading: /Raporlar Merkezi/i, activeNav: /Raporlar Merkezi/i, sideTitle: 'Raporlar' },
  { label: 'Raporlama programı', path: '/reports', heading: /Raporlama Programı/i, activeNav: /Raporlama Programı/i, sideTitle: 'Raporlar' },
  { label: 'FO Önbüro raporları', path: '/reports?category=rezervasyon', heading: /FO-Önbüro Raporları/i, activeNav: /FO-Önbüro Raporları/i, sideTitle: 'Raporlar' },
  { label: 'HK raporları', path: '/reports?category=kathizmetleri', heading: /House Keeping Raporu|HK-HouseKeeping Raporları/i, activeNav: /HK-HouseKeeping Raporları/i, sideTitle: 'Raporlar' },
  { label: 'Özel raporlar', path: '/reports?tab=special', heading: /Özel Raporlar/i, activeNav: /Özel Raporlar/i, sideTitle: 'Raporlar' },
];

test.describe('Raporlar rollout — adım adım', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const [index, step] of RAPORLAR_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path, 'admin', { waitForSideNav: false, readyWhen: 'heading' });
      await expect(page.getByRole('heading', { name: step.heading }).first()).toBeVisible({ timeout: 45_000 });

      if (step.sideTitle) {
        await expect(page.getByRole('navigation', { name: step.sideTitle })).toBeVisible();
      }
      if (step.activeNav) {
        await expect(page.getByRole('link', { name: step.activeNav }).first()).toHaveClass(/is-active/);
      }
      await expect(page.getByRole('navigation', { name: 'Rapor modülleri' })).toHaveCount(0);
    });
  }
});
