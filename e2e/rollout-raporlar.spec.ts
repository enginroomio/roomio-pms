import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type RolloutCase = {
  label: string;
  path: string;
  heading: RegExp | string;
  readyWhen?: 'heading' | 'list' | 'main';
};

const RAPORLAR_ROLLOUT: RolloutCase[] = [
  { label: 'Raporlar Merkezi', path: '/reports?hub=raporlar', heading: /Raporlar Merkezi/i },
  { label: 'Raporlama programı', path: '/reports', heading: /Raporlama Programı/i },
  { label: 'FO — Önbüro raporları', path: '/reports?category=rezervasyon', heading: /FO-Önbüro Raporları/i },
  { label: 'HK raporları', path: '/reports?category=kathizmetleri', heading: /House Keeping Raporu/i },
  { label: 'Yönetim raporları', path: '/reports?category=yonetim', heading: /BO-ArkaBüro Raporları/i },
  { label: 'Kullanıcı tanımlı raporlar', path: '/reports?tab=user', heading: /Kullanıcı Tanımlı Raporlar/i },
  { label: 'Rapor tasarım', path: '/reports?tab=design', heading: /Rapor Tasarım/i },
  { label: 'Özel raporlar', path: '/reports?tab=special', heading: /Özel Raporlar/i },
];

test.describe('Raporlar rollout — adım adım', () => {
  test.describe.configure({ timeout: 180_000 });

  for (const [index, step] of RAPORLAR_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path, 'admin', {
        waitForSideNav: false,
        readyWhen: step.readyWhen ?? 'heading',
      });
      await expect(page.getByRole('heading', { name: step.heading }).first()).toBeVisible({ timeout: 45_000 });
      if (step.path === '/reports') {
        await expect(page.getByRole('link', { name: /Raporla|Rapor Tasarım/i }).first()).toBeVisible();
      }
      if (step.path.includes('category=')) {
        await expect(page.getByRole('table').first()).toBeVisible({ timeout: 20_000 });
      }
    });
  }
});
