import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

type RolloutCase = {
  label: string;
  path: string;
  heading?: RegExp | string;
  activeNav?: RegExp | string;
  listAssert?: boolean;
  trackBanner?: boolean;
  readyWhen?: 'heading' | 'list' | 'main';
};

const REZERVASYON_ROLLOUT: RolloutCase[] = [
  { label: 'Rezervasyon Merkezi', path: '/reservations?hub=rezervasyon', heading: /Rezervasyon Merkezi/i, readyWhen: 'heading' },
  { label: 'Grafikler (F1)', path: '/reservations/calendar', heading: /^Grafikler$/i, activeNav: /Grafikler \(F1\)/i, readyWhen: 'heading' },
  { label: 'Yeni Rezervasyon (F2)', path: '/reservations/new', heading: /Yeni Rezervasyon/i, readyWhen: 'heading' },
  { label: 'Acenta Aktarım', path: '/reservations?tab=import', heading: /Acenta Rezervasyon Aktarım/i, readyWhen: 'heading' },
  { label: 'Müsaitlik', path: '/reservations?tab=availability', heading: /Oda Planı/i, readyWhen: 'heading' },
  { label: 'Fiyatlı Müsaitlik', path: '/reservations?tab=availability&prices=1', heading: /Oda Müsaitlik \(Fiyatlı\)/i, readyWhen: 'heading' },
  { label: 'Durum Takip', path: '/reservations?track=1', listAssert: true, trackBanner: true, readyWhen: 'list' },
  { label: 'Konaklayanlar', path: '/reception/inhouse', heading: /Konaklayanlar/i, readyWhen: 'heading' },
  { label: 'Boş Oda Listesi', path: '/reception/vacant', heading: /Boş Oda/i, readyWhen: 'heading' },
  { label: 'Hızlı Blokaj', path: '/rooms?tab=blocking', heading: /Hızlı Blokaj/i, readyWhen: 'heading' },
];

test.describe('Rezervasyon rollout — adım adım', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const [index, step] of REZERVASYON_ROLLOUT.entries()) {
    test(`Adım ${index + 1} — ${step.label}`, async ({ page }) => {
      await gotoWithDemo(page, step.path, 'admin', {
        waitForSideNav: false,
        readyWhen: step.readyWhen ?? 'heading',
      });
      if (step.listAssert) {
        await expect(page.getByRole('button', { name: 'Filtreler' })).toBeVisible({ timeout: 20_000 });
        await expect(page.getByRole('region', { name: /Rezervasyon listesi/i })).toBeVisible();
        if (step.trackBanner) {
          await expect(page.getByText(/durum takip listesi/i)).toBeVisible();
        }
        if (step.path === '/reservations?track=1') {
          await expect(page.getByRole('navigation', { name: 'Rezervasyon' })).toBeVisible();
          await expect(page.getByRole('link', { name: /Durum Takip/i }).first()).toHaveClass(/is-active/);
          await expect(page.locator('.roomio-rez-tabs')).toHaveCount(0);
        }
        return;
      }
      await expect(page.getByRole('heading', { name: step.heading! }).first()).toBeVisible({
        timeout: 45_000,
      });
      if (step.activeNav) {
        await expect(page.getByRole('link', { name: step.activeNav }).first()).toHaveClass(/is-active/);
      }
      if (step.path === '/reservations?hub=rezervasyon') {
        await expect(page.getByRole('navigation', { name: 'Rezervasyon' })).toBeVisible();
        await expect(page.getByText(/Rezervasyon merkezi/i).first()).toBeVisible();
      }
      if (step.path === '/reservations/calendar') {
        await expect(page.getByRole('navigation', { name: 'Rezervasyon' })).toBeVisible();
        await expect(page.getByRole('link', { name: step.activeNav! }).first()).toHaveClass(/is-active/);
        await expect(page.getByText(/Elektra v5 Forecast|Elektra v5 F1|doluluk trendi/i).first()).toBeVisible({
          timeout: 15_000,
        });
      }
      if (step.path === '/reservations/new') {
        await expect(page.getByRole('navigation', { name: 'Rezervasyon' })).toBeVisible();
        await expect(page.getByRole('link', { name: /Yeni Rezervasyon/i }).first()).toHaveClass(/is-active/);
      }
      if (step.path === '/reception/vacant') {
        await expect(page.getByText(/Temiz — Check-in hazır/i).first()).toBeVisible();
      }
    });
  }

  test('Adım 11 — Rezervasyon Listesi', async ({ page }) => {
    await gotoWithDemo(page, '/reservations', 'admin', { waitForSideNav: false, readyWhen: 'list' });
    await expect(page.getByRole('navigation', { name: 'Rezervasyon' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Rezervasyon Listesi/i }).first()).toHaveClass(/is-active/);
    await expect(page.locator('.roomio-rez-tabs')).toHaveCount(0);
    await expect(page.getByText(/Kayıt Sayısı/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('region', { name: /Rezervasyon listesi/i })).toBeVisible();
  });
});
