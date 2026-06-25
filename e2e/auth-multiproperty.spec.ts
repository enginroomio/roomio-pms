import { test, expect } from '@playwright/test';
import { authedGet, loginApiToken, authHeaders } from './helpers/api-auth';

test.describe('JWT oturum', () => {
  test('login API token döner', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'arda@hotelsapphire.com', password: 'roomio123' },
    });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { token?: string; user?: { name: string } };
    expect(j.token).toBeTruthy();
    expect(j.user?.name).toContain('Arda');
  });

  test('login sayfası ve giriş akışı', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Roomio PMS/i })).toBeVisible();
    await page.getByLabel('E-posta').fill('arda@hotelsapphire.com');
    await page.getByLabel('Şifre').fill('roomio123');
    await page.getByRole('button', { name: /Giriş Yap/i }).click();
    await page.waitForURL(/\/(?!login)/, { timeout: 15_000 });
    await expect(page.getByText(/Arda/i).first()).toBeVisible();
  });
});

test.describe('Çoklu şube', () => {
  test('properties API iki tesis döner', async ({ request }) => {
    const res = await authedGet(request, '/api/properties');
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { properties: Array<{ city: string }> };
    expect(j.properties.length).toBeGreaterThanOrEqual(2);
    expect(j.properties.some((p) => p.city === 'İstanbul')).toBeTruthy();
    expect(j.properties.some((p) => p.city === 'Antalya')).toBeTruthy();
  });

  test('şube değişince dashboard verisi güncellenir', async ({ page, request }) => {
    const propsRes = await authedGet(request, '/api/properties');
    const props = ((await propsRes.json()) as { properties: Array<{ id: string; city: string }> }).properties;
    const ant = props.find((p) => p.city === 'Antalya');
    expect(ant).toBeTruthy();

    await page.goto('/');
    const select = page.getByLabel('Otel seçimi');
    await select.selectOption(ant!.id);
    await page.waitForTimeout(800);
    await expect(page.locator('[data-property]')).toHaveAttribute('data-property', /ANT|SAPPHIRE/);
  });

  test('konsolide rapor sekmesi', async ({ page }) => {
    await page.goto('/reports?tab=consolidated');
    await expect(page.getByRole('heading', { name: /Konsolide Tesis Raporu/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Konsolide/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /CSV indir/i })).toBeVisible();
  });

  test('konsolide PDF export', async ({ request }) => {
    const token = await loginApiToken(request);
    const res = await request.get('/api/reports/consolidated?format=pdf', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('pdf');
  });
});

test.describe('Muhasebe CRUD', () => {
  test('fatura oluştur ve listele', async ({ request }) => {
    const login = await request.post('/api/auth/login', {
      data: { email: 'muhasebe@hotelsapphire.com', password: 'roomio123' },
    });
    expect(login.ok()).toBeTruthy();
    const { token } = (await login.json()) as { token: string };
    const headers = { Authorization: `Bearer ${token}` };

    const create = await request.post('/api/accounting/invoices', {
      headers,
      data: { guest: 'E2E Test Misafir', amount: 1500, vat: 270, type: 'ekstra' },
    });
    expect(create.ok()).toBeTruthy();

    const list = await request.get('/api/accounting/invoices', { headers });
    expect(list.ok()).toBeTruthy();
    const j = (await list.json()) as { invoices: Array<{ guest: string }> };
    expect(j.invoices.some((i) => i.guest === 'E2E Test Misafir')).toBeTruthy();
  });
});
