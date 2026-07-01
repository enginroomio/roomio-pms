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

const KAT_ROLLOUT: RolloutCase[] = [
  { label: 'Kat Hizmetleri Merkezi', path: '/housekeeping?hub=kat', heading: /Kat Hizmetleri Merkezi/i, activeNav: /Kat Hizmetleri Merkezi/i },
  { label: 'Housekeeping pano', path: '/housekeeping', heading: /Housekeeping Pano/i, activeNav: /Housekeeping Pano/i },
  { label: 'Oda listesi (F8)', path: '/housekeeping/rooms', heading: /Oda Listesi/i, activeNav: /Oda Listesi/i, tableAssert: true },
  { label: 'Oda kontrolü', path: '/housekeeping/rooms?tab=control', heading: /House Keeping Oda Kontrolü/i, activeNav: /House Keeping Oda Kontrolü/i },
  { label: 'Görevler', path: '/housekeeping/tasks', heading: /^Görevler$/i },
  { label: 'Kontrol listesi', path: '/housekeeping/tasks?tab=checklist', heading: /Housekeeper Kontrol Listesi/i, activeNav: /Housekeeper Kontrol Listesi/i },
  { label: 'Operasyon merkezi', path: '/housekeeping/operations', heading: /Housekeeping & Operations Hub/i, activeNav: /House Keeping Oda İşlemleri/i },
  { label: 'Room Rack (F12)', path: '/rooms', heading: /Room Rack/i },
];

test.describe('Kat HK rollout — adım adım', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const [index, step] of KAT_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path, 'admin', {
        waitForSideNav: false,
        readyWhen: step.readyWhen ?? 'heading',
      });
      await expect(page.getByRole('heading', { name: step.heading }).first()).toBeVisible({ timeout: 45_000 });

      if (step.activeNav) {
        await expect(page.getByRole('navigation', { name: 'Kat Hizmetleri' })).toBeVisible();
        await expect(page.getByRole('link', { name: step.activeNav }).first()).toHaveClass(/is-active/);
        await expect(page.locator('nav[aria-label="Kat hizmetleri alt menü"]')).toHaveCount(0);
      }
      if (step.path === '/housekeeping/tasks') {
        await expect(page.getByRole('navigation', { name: 'Kat Hizmetleri' })).toBeVisible();
        await expect(page.locator('nav[aria-label="Kat hizmetleri alt menü"]')).toHaveCount(0);
      }

      if (step.path === '/housekeeping') {
        await expect(page.getByRole('button', { name: '101' })).toBeVisible({ timeout: 20_000 });
      }
      if (step.tableAssert) {
        await expect(page.getByRole('table').first()).toBeVisible({ timeout: 20_000 });
      }
      if (step.path === '/rooms') {
        await expect(page.getByText(/Elektra rack|Prisma canlı veri/i).first()).toBeVisible({ timeout: 20_000 });
      }
    });
  }
});
