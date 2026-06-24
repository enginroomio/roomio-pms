import { test, expect } from '@playwright/test';

test.describe('i18n', () => {
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
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('button', { name: 'Reservations' }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();
  });

  test('muhasebe sayfası İngilizce', async ({ page }) => {
    await page.goto('/accounting');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: 'Accounting' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: 'Invoices' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Invoice list' })).toBeVisible();
  });

  test('resepsiyon sayfası İngilizce', async ({ page }) => {
    await page.goto('/reception');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: 'Front Office & Cashier' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: 'Summary' })).toBeVisible();
    await expect(page.getByRole('link', { name: "Today's arrivals" })).toBeVisible();
  });

  test('raporlar sayfası İngilizce', async ({ page }) => {
    await page.goto('/reports?tab=consolidated');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('link', { name: 'Consolidated' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('heading', { name: 'Consolidated property report' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download PDF' })).toBeVisible();
  });

  test('rezervasyon sayfası İngilizce', async ({ page }) => {
    await page.goto('/reservations');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: 'Reservation list' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: 'New reservation (F2)' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ New reservation (F2)' })).toBeVisible();
  });

  test('HK mobil İngilizce', async ({ page }) => {
    await page.goto('/housekeeping/mobile');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: 'Room rack' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: 'List' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Faults' })).toBeVisible();
  });

  test('kuruluş otel bilgileri İngilizce', async ({ page }) => {
    await page.goto('/settings?section=otel-bilgileri');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: /Hotel information/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Hotel name', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  test('F&B hızlı POS İngilizce', async ({ page }) => {
    await page.goto('/fnb?mode=quick');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: 'Quick POS' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Post to folio' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Banquet' })).toBeVisible();
  });

  test('kuruluş şubeler İngilizce', async ({ page }) => {
    await page.goto('/settings?section=branches');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: /Branch definitions/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('columnheader', { name: 'Branch' })).toBeVisible();
  });

  test('rollout aracı İngilizce', async ({ page }) => {
    await page.goto('/tools/rollout');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: 'Roomio screen rollout' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Progress', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Complete phase' }).first()).toBeVisible();
  });

  test('profesyonel PMS hub İngilizce', async ({ page }) => {
    await page.goto('/tools/pro');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: 'Professional PMS hub' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Total modules', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Search modules…')).toBeVisible();
  });

  test('kuruluş oda tipleri İngilizce', async ({ page }) => {
    await page.goto('/settings?tab=room-types');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: /Room type definitions/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('columnheader', { name: 'Base rate' })).toBeVisible();
  });

  test('kuruluş dil tanımları İngilizce', async ({ page }) => {
    await page.goto('/settings?section=language');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: /Language definitions/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('columnheader', { name: 'Native name' })).toBeVisible();
  });

  test('kuruluş kullanıcı grupları İngilizce', async ({ page }) => {
    await page.goto('/settings?section=user-groups');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: /User group definitions/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('columnheader', { name: 'Group name' })).toBeVisible();
  });

  test('kuruluş yan menü İngilizce', async ({ page }) => {
    await page.goto('/settings?section=users');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('link', { name: 'User definitions' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('link', { name: 'Branch definitions' })).toBeVisible();
    await expect(page.getByText(/Active screen: User definitions/)).toBeVisible();
  });

  test('kuruluş şirket listesi İngilizce', async ({ page }) => {
    await page.goto('/settings?section=company-list');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: /Company list/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Save company' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Credit limit' })).toBeVisible();
  });

  test('kuruluş acenta kontratları İngilizce', async ({ page }) => {
    await page.goto('/settings?section=agencies');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: /Agency contracts/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Save contract' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Commission' })).toBeVisible();
  });

  test('kuruluş market kodları İngilizce', async ({ page }) => {
    await page.goto('/settings?section=markets');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: /Market codes/i })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('columnheader', { name: 'Description' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New code' })).toBeVisible();
  });

  test('kuruluş vergi oranları İngilizce', async ({ page }) => {
    await page.goto('/settings?section=tax-rules');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: 'Tax rates' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Rate %' })).toBeVisible();
  });

  test('kuruluş döviz ayarı İngilizce', async ({ page }) => {
    await page.goto('/settings?section=currencies');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: 'Exchange discount setting' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Exchange discount (%)', { exact: true })).toBeVisible();
  });

  test('sidebar modülleri İngilizce', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('tab', { name: 'System' })).toBeVisible({ timeout: 8000 });
    await page.getByRole('tab', { name: 'System' }).click();
    await expect(page.getByRole('link', { name: 'Setup' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'New res.' })).toBeVisible();
  });

  test('sidebar arama İngilizce', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await page.getByPlaceholder('Search menu…').fill('reservation');
    await expect(page.getByRole('link', { name: /RESERVATIONS › New reservation/i })).toBeVisible({ timeout: 8000 });
  });

  test('ana sayfa hareketler paneli İngilizce', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await expect(page.getByRole('heading', { name: "Today's arrivals" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('heading', { name: "Today's departures" })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alerts' })).toBeVisible();
  });

  test('sağ tık ana menü İngilizce', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/Dil|Language/i).selectOption('en');
    await page.locator('.roomio-home-screen').click({ button: 'right', position: { x: 200, y: 200 } });
    await expect(page.getByRole('menu', { name: 'Elektra main menu' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: 'Reservations' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Front office' })).toBeVisible();
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
    const registered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration('/');
      return Boolean(reg);
    });
    expect(registered).toBeTruthy();
  });
});
