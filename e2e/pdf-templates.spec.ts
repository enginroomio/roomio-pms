import { test, expect } from '@playwright/test';
import { ACCOUNTING_EMAIL, DEMO_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('PDF şablonları', () => {
  test('konsolide rapor PDF', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reports/consolidated?format=pdf', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('application/pdf');
    const buf = await res.body();
    expect(buf.length).toBeGreaterThan(500);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });

  test('fatura PDF', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const headers = authHeaders(token);

    const create = await request.post('/api/accounting/invoices', {
      headers,
      data: { guest: 'PDF E2E Misafir', amount: 1500, vat: 300, type: 'konaklama' },
    });
    expect(create.ok()).toBeTruthy();
    const { invoice } = (await create.json()) as { invoice: { id: string; no: string } };

    const res = await request.get(
      `/api/accounting/invoices?id=${encodeURIComponent(invoice.id)}&format=pdf`,
      { headers },
    );
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('application/pdf');
    const buf = await res.body();
    expect(buf.length).toBeGreaterThan(400);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');

    await request.delete(`/api/accounting/invoices?id=${encodeURIComponent(invoice.id)}`, { headers });
  });

  test('gece denetim paketi PDF', async ({ request }) => {
    const token = await loginApiTokenWith(request, DEMO_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/eod/night-audit-package?format=pdf', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('application/pdf');
    const buf = await res.body();
    expect(buf.length).toBeGreaterThan(400);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
