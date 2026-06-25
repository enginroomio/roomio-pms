import { test, expect } from '@playwright/test';
import { selectEnglish, setEnglishViaStorage } from './helpers/locale';
import { useDemoRole, waitForDemoSession } from './helpers/demo-auth';

test.describe('i18n', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('roomio-locale'));
    await useDemoRole(page, 'admin');
  });

  test('locale API tr ve en döner', async ({ request }) => {
    const tr = await request.get('/api/locale?locale=tr');
    const en = await request.get('/api/locale?locale=en');
    expect(tr.ok()).toBeTruthy();
    expect(en.ok()).toBeTruthy();
    const trJ = (await tr.json()) as { messages: Record<string, string> };
    const enJ = (await en.json()) as { messages: Record<string, string> };
    expect(trJ.messages['nav.home']).toBe('Ana Sayfa');
    expect(enJ.messages['nav.home']).toBe('Home');
  });

  test('dil değişince menü İngilizce olur', async ({ page }) => {
    await page.goto('/');
    await selectEnglish(page);
    await expect(page.getByRole('button', { name: 'Reservations' }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();
  });

  test('muhasebe sayfası İngilizce', async ({ page }) => {
    await page.goto('/accounting');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: 'Accounting' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Invoices' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Invoice list/i }).first()).toBeVisible();
  });

  test('resepsiyon sayfası İngilizce', async ({ page }) => {
    await page.goto('/reception');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: 'Front Office & Cashier' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Summary' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: "Today's arrivals" }).first()).toBeVisible();
  });

  test('raporlar sayfası İngilizce', async ({ page }) => {
    await page.goto('/reports?tab=consolidated');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('link', { name: 'Consolidated' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Consolidated property report' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download PDF' }).first()).toBeVisible();
  });

  test('rezervasyon sayfası İngilizce', async ({ page }) => {
    await page.goto('/reservations');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: 'Reservation list' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'New reservation (F2)' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: '+ New reservation (F2)' }).first()).toBeVisible();
  });

  test('HK mobil İngilizce', async ({ page }) => {
    await setEnglishViaStorage(page);
    await page.goto('/housekeeping/mobile');
    await waitForDemoSession(page);
    await expect(page.getByRole('heading', { name: 'Room rack' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'List' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Faults' }).first()).toBeVisible();
  });

  test('kuruluş otel bilgileri İngilizce', async ({ page }) => {
    await page.goto('/settings?section=otel-bilgileri');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: /Hotel information/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Hotel name', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' }).first()).toBeVisible();
  });

  test('F&B hızlı POS İngilizce', async ({ page }) => {
    await page.goto('/fnb?mode=quick');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: 'Quick POS' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Post to folio' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Banquet' }).first()).toBeVisible();
  });

  test('kuruluş şubeler İngilizce', async ({ page }) => {
    await page.goto('/settings?section=branches');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: /Branch definitions/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('columnheader', { name: 'Branch' }).first()).toBeVisible();
  });

  test('rollout aracı İngilizce', async ({ page }) => {
    await page.goto('/tools/rollout');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: 'Roomio screen rollout' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Progress', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Complete phase' }).first()).toBeVisible();
  });

  test('profesyonel PMS hub İngilizce', async ({ page }) => {
    await page.goto('/tools/pro');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: 'Professional PMS hub' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Total modules', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Search modules…')).toBeVisible();
  });

  test('kuruluş oda tipleri İngilizce', async ({ page }) => {
    await page.goto('/settings?tab=room-types');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: /Room type definitions/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('columnheader', { name: 'Base rate' }).first()).toBeVisible();
  });

  test('kuruluş dil tanımları İngilizce', async ({ page }) => {
    await page.goto('/settings?section=language');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: /Language definitions/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('columnheader', { name: 'Native name' }).first()).toBeVisible();
  });

  test('kuruluş kullanıcı grupları İngilizce', async ({ page }) => {
    await page.goto('/settings?section=user-groups');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: /User group definitions/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('columnheader', { name: 'Group name' }).first()).toBeVisible();
  });

  test('kuruluş yan menü İngilizce', async ({ page }) => {
    await page.goto('/settings?section=users');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('link', { name: 'User definitions' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: 'Branch definitions' }).first()).toBeVisible();
    await expect(page.getByText(/Active screen: User definitions/)).toBeVisible();
  });

  test('kuruluş şirket listesi İngilizce', async ({ page }) => {
    await page.goto('/settings?section=company-list');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: /Company list/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Save company' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Credit limit' }).first()).toBeVisible();
  });

  test('kuruluş acenta kontratları İngilizce', async ({ page }) => {
    await page.goto('/settings?section=agencies');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: /Agency contracts/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Save contract' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Commission' }).first()).toBeVisible();
  });

  test('kuruluş market kodları İngilizce', async ({ page }) => {
    await page.goto('/settings?section=markets');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: /Market codes/i }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('columnheader', { name: 'Description' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'New code' }).first()).toBeVisible();
  });

  test('kuruluş vergi oranları İngilizce', async ({ page }) => {
    await page.goto('/settings?section=tax-rules');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: 'Tax rates' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Save' }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Rate %' }).first()).toBeVisible();
  });

  test('kuruluş döviz ayarı İngilizce', async ({ page }) => {
    await page.goto('/settings?section=currencies');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: 'Exchange discount setting' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Exchange discount (%)', { exact: true })).toBeVisible();
  });

  test('sidebar modülleri İngilizce', async ({ page }) => {
    await page.goto('/');
    await selectEnglish(page);
    await expect(page.getByRole('link', { name: 'System' }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: 'System' }).first().click();
    await expect(page.getByRole('link', { name: 'Setup' }).first()).toBeVisible({ timeout: 15_000 });
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'New res.' }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('sidebar arama İngilizce', async ({ page }) => {
    await page.goto('/');
    await selectEnglish(page);
    await page.getByRole('button', { name: 'Hızlı arama' }).click();
    await page.getByPlaceholder('Menü veya ekran ara…').fill('rezervasyon');
    await expect(page.getByRole('link', { name: /Yeni Rezervasyon|New reservation/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('ana sayfa hareketler paneli İngilizce', async ({ page }) => {
    await page.goto('/');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await expect(page.getByRole('heading', { name: "Today's arrivals" }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: "Today's departures" }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alerts' }).first()).toBeVisible();
  });

  test('sağ tık ana menü İngilizce', async ({ page }) => {
    await page.goto('/');
    await waitForDemoSession(page);
    await selectEnglish(page);
    await page.locator('.roomio-app-screen').click({ button: 'right', position: { x: 200, y: 200 } });
    const ctxMenu = page.getByRole('menu', { name: 'Elektra main menu' });
    await expect(ctxMenu).toBeVisible({ timeout: 15_000 });
    await expect(ctxMenu.getByRole('button', { name: 'Reservations' }).first()).toBeVisible();
    await expect(ctxMenu.getByRole('button', { name: 'Front office' }).first()).toBeVisible();
  });
});

test.describe('PWA offline', () => {
  test('offline sayfası yüklenir', async ({ page }) => {
    await page.goto('/offline');
    await expect(page.getByRole('heading', { name: /Bağlantı yok|No connection/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Kat HK|Housekeeping/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Muhasebe|Accounting/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Raporlar|Reports/i })).toBeVisible();
  });

  test('service worker kayıtlı', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration('/');
      return Boolean(reg);
    }, { timeout: 15_000 });
  });
});
