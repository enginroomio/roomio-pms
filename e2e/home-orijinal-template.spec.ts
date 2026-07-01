import { test, expect, type Page } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

async function clearHomeLayoutStorage(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('roomio:home-layout-v1');
    localStorage.removeItem('roomio:home-default-template-id');
    localStorage.removeItem('roomio:home-archive-v1');
    localStorage.removeItem('roomio:home-archive-version');
    localStorage.removeItem('roomio:home-layout-migration-v');
  });
}

async function openHomeFresh(page: Page) {
  await clearHomeLayoutStorage(page);
  await gotoWithDemo(page, '/', 'admin', { waitForSideNav: false, readyWhen: 'main' });
  await expect(page.getByRole('region', { name: 'Günlük özet' })).toBeVisible({ timeout: 60_000 });
}

function wizardDialog(page: Page) {
  return page.locator('.roomio-home-wizard[role="dialog"]');
}

function presetCard(page: Page, label: string) {
  return page.locator('.roomio-home-wizard__card').filter({ hasText: label });
}

function archiveCard(page: Page, label: string) {
  return page.locator('.roomio-home-wizard__archive-main').filter({ hasText: label });
}

async function openWizard(page: Page) {
  await gotoWithDemo(page, '/?design=1', 'admin', { waitForSideNav: false, readyWhen: 'main' });
  await expect(wizardDialog(page)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Arşiv — \d+ hazır ana ekran dizaynı/)).toBeVisible({ timeout: 30_000 });
}

async function closeWizard(page: Page) {
  const dialog = wizardDialog(page);
  await dialog.getByRole('button', { name: 'Kaydet & Kapat' }).click();
  await expect(dialog).toBeHidden({ timeout: 15_000 });
  await expect(page.getByRole('region', { name: 'Günlük özet' })).toBeVisible({ timeout: 60_000 });
}

async function applyPresetInWizard(page: Page, label: string, presetId: string) {
  await presetCard(page, label).click();
  await expect(dashboard(page)).toHaveAttribute('data-home-preset', presetId, { timeout: 15_000 });
}

function dashboard(page: Page) {
  return page.locator('[data-home-preset]');
}

test.describe('Orijinal ana sayfa şablonları', () => {
  test.describe.configure({ timeout: 120_000 });

  test('varsayılan düzen — orijinal operasyon teması', async ({ page }) => {
    await openHomeFresh(page);
    await expect(page.locator('.roomio-dashboard--theme-orijinal')).toBeVisible();
    await expect(page.locator('[data-home-preset="orijinal-operasyon"]')).toBeVisible();
    await page.waitForResponse((r) => r.url().includes('/api/weather') && r.ok(), { timeout: 20_000 }).catch(() => undefined);
    await expect(page.locator('.roomio-orijinal-weather')).toBeVisible({ timeout: 15_000 });
    await page
      .waitForResponse((r) => r.url().includes('/api/operations/summary') && r.ok(), { timeout: 30_000 })
      .catch(() => undefined);
    await expect(page.getByText('Operasyon özeti')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('region', { name: 'Hızlı işlemler' })).toBeVisible();
  });

  test('sihirbaz — Orijinal · Klasik uyarı panelini gizler', async ({ page }) => {
    await openHomeFresh(page);
    await openWizard(page);
    await applyPresetInWizard(page, 'Orijinal · Klasik', 'orijinal-klasik');
    await closeWizard(page);
    await expect(dashboard(page)).toHaveAttribute('data-home-preset', 'orijinal-klasik', { timeout: 30_000 });
    await expect(page.getByText('Operasyon özeti')).toHaveCount(0);
    await expect(page.locator('.roomio-orijinal-weather')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Oda Rack', level: 2 })).toBeVisible();
  });

  test('sihirbaz — arşivden Orijinal · Kompakt', async ({ page }) => {
    await openHomeFresh(page);
    await openWizard(page);
    const card = archiveCard(page, 'Orijinal · Kompakt');
    await expect(card).toBeVisible({ timeout: 30_000 });
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await closeWizard(page);
    await expect(dashboard(page)).toHaveAttribute('data-home-preset', 'orijinal-kompakt', { timeout: 30_000 });
    await expect(page.getByText('Operasyon özeti')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.roomio-orijinal-weather')).toHaveCount(0);
  });

  test('sıfırlama — varsayılan orijinal şablona döner', async ({ page }) => {
    await openHomeFresh(page);
    await openWizard(page);
    await applyPresetInWizard(page, 'Orijinal · Klasik', 'orijinal-klasik');
    await expect(dashboard(page)).toHaveAttribute('data-home-preset', 'orijinal-klasik', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Varsayılan şablona dön' }).click();
    await expect(dashboard(page)).toHaveAttribute('data-home-preset', 'orijinal-operasyon', { timeout: 30_000 });
  });

  test('legacy ana-ekran — orijinal operasyona migrasyon', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'roomio:home-layout-v1',
        JSON.stringify({
          presetId: 'ana-ekran',
          theme: 'modern',
          panelOrder: ['welcome', 'portfolio', 'alerts', 'quickActions', 'kpiStrip', 'rack'],
          hiddenPanels: [],
          rackExpanded: true,
          showKpiStrip: false,
        }),
      );
      localStorage.removeItem('roomio:home-layout-migration-v');
      localStorage.removeItem('roomio:home-default-template-id');
    });
    await gotoWithDemo(page, '/', 'admin', { waitForSideNav: false });
    await expect(page.locator('[data-home-preset="orijinal-operasyon"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.roomio-dashboard--theme-orijinal')).toBeVisible();
  });

  test('orijinal mockup HTML erişilebilir', async ({ request }) => {
    const res = await request.get('/mockups/otel-pms-orijinal-tarayici.html');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Orijinal');
  });

  test('/?design=1 sihirbazı açar', async ({ page }) => {
    await gotoWithDemo(page, '/?design=1', 'admin', { waitForSideNav: false, readyWhen: 'main' });
    await expect(wizardDialog(page)).toBeVisible({ timeout: 60_000 });
    await expect(presetCard(page, 'Orijinal · Operasyon')).toBeVisible();
  });
});
