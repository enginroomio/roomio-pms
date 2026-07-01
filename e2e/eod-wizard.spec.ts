import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

test.describe('Gün sonu — rapor sihirbazı entegrasyonu', () => {
  test('Arşiv GR310 — tablo önizlemesi', async ({ page }) => {
    await gotoWithDemo(page, '/reports?tab=eod&action=archive&rpr=GR310&date=2026-06-27', 'admin', {
      waitForSideNav: false,
      readyWhen: 'main',
    });
    await expect(page.getByTestId('eod-legacy-workspace')).toBeVisible({ timeout: 45_000 });
    const preview = page.getByTestId('eod-legacy-workspace').locator('pre');
    await expect(preview.getByText(/Günlük Departman İşlem Listesi/)).toBeVisible();
    await expect(preview.getByText(/Grup : 01 \(ROOM\)/)).toBeVisible();
  });

  test('F8 Kurulum — design URL bağlantısı', async ({ page }) => {
    await gotoWithDemo(page, '/reports?tab=eod&action=archive&rpr=GR222&date=2026-06-27', 'admin', {
      waitForSideNav: false,
      readyWhen: 'main',
    });
    await expect(page.getByTestId('eod-legacy-workspace')).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('eod-f8-setup')).toHaveAttribute('href', /tab=design&rpr=GR222/);
  });

  test('design?rpr=GR222 — sihirbaz şablonu yüklenir', async ({ page }) => {
    await gotoWithDemo(page, '/reports?tab=design&rpr=GR222', 'admin', {
      waitForSideNav: false,
      readyWhen: 'main',
    });
    await expect(page.locator('.roomio-report-designer')).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('.roomio-report-designer__meta input.roomio-input')).toHaveValue('Günlük Polis Listesi', {
      timeout: 15_000,
    });
    await expect(
      page.locator('.roomio-report-designer .roomio-report-dept-card.is-active').getByText('Gün Sonu'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /GR222/ })).toBeVisible();
  });

  test('GR300 — zengin folyo extre önizlemesi', async ({ page }) => {
    await gotoWithDemo(page, '/reports?tab=eod&action=archive&rpr=GR300&date=2026-06-27', 'admin', {
      waitForSideNav: false,
      readyWhen: 'main',
    });
    await expect(page.getByTestId('eod-legacy-workspace')).toBeVisible({ timeout: 45_000 });
    const preview = page.getByTestId('eod-legacy-workspace').locator('pre');
    await expect(preview.getByText(/Folyo Extre Listesi/)).toBeVisible();
    await expect(preview.getByText(/F-20801/)).toBeVisible();
    await expect(preview.getByText(/ROOM CHARGE/)).toBeVisible();
    await expect(preview.getByText(/Bu rapor Elektra/)).toHaveCount(0);
  });

  test('şablon kaydı — arşivde sütun override uygulanır', async ({ page }) => {
    test.setTimeout(120_000);
    const liveDate = '2099-03-15';

    await gotoWithDemo(page, '/reports?tab=design&rpr=GR300', 'admin', {
      waitForSideNav: false,
      readyWhen: 'main',
    });
    await expect(page.locator('.roomio-report-designer')).toBeVisible({ timeout: 45_000 });

    const saveOk = await page.evaluate(async () => {
      const role = localStorage.getItem('roomio-demo-role') ?? 'admin';
      const r = await fetch('/api/reports/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-roomio-demo-role': role,
        },
        credentials: 'include',
        body: JSON.stringify({
          id: 'eod-gr300',
          name: 'Folyo Extre Listesi',
          module: 'Gün Sonu',
          columns: ['roomNo', 'guestName', 'amount'],
        }),
      });
      return r.ok;
    });
    expect(saveOk).toBeTruthy();

    const templatesLoaded = page.waitForResponse(
      (res) => res.url().includes('/api/reports/templates') && res.request().method() === 'GET' && res.ok(),
      { timeout: 45_000 },
    );

    await gotoWithDemo(page, `/reports?tab=eod&action=archive&rpr=GR300&date=${liveDate}`, 'admin', {
      waitForSideNav: false,
      readyWhen: 'main',
    });
    await templatesLoaded;

    const workspace = page.locator('main').getByTestId('eod-legacy-workspace').first();
    await expect(workspace).toBeVisible({ timeout: 45_000 });

    const preview = workspace.locator('pre');
    await expect(preview.getByText(/^Oda/m)).toBeVisible({ timeout: 30_000 });
    await expect(preview.getByText(/1\.Misafir/)).toBeVisible();
    await expect(preview.getByText(/Folyo no|İşlem tipi/)).toHaveCount(0);
  });

  test('GR400 — günlük yönetim önizlemesi', async ({ page }) => {
    await gotoWithDemo(page, '/reports?tab=eod&action=archive&rpr=GR400&date=2026-06-27', 'admin', {
      waitForSideNav: false,
      readyWhen: 'main',
    });
    const workspace = page.locator('main').getByTestId('eod-legacy-workspace').first();
    await expect(workspace).toBeVisible({ timeout: 45_000 });
    const preview = workspace.locator('pre');
    await expect(preview.getByText(/Günlük Yönetim Raporu/)).toBeVisible();
    await expect(preview.getByText(/RevPAR/)).toBeVisible();
    await expect(preview.getByText(/Konaklayan/)).toBeVisible();
  });
});
