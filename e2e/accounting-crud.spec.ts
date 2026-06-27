import { test, expect } from '@playwright/test';
import {
  ACCOUNTING_EMAIL,
  DEMO_PASSWORD,
  VIEWER_EMAIL,
  authHeaders,
  loginApiTokenWith,
} from './helpers/api-auth';

test.describe('Muhasebe — fatura CRUD', () => {
  test('oluştur, kes, tahsil, sil', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const headers = authHeaders(token);

    const create = await request.post('/api/accounting/invoices', {
      headers,
      data: { guest: 'CRUD E2E Misafir', amount: 2500, vat: 500, type: 'konaklama', status: 'draft' },
    });
    expect(create.ok()).toBeTruthy();
    const { invoice } = (await create.json()) as { invoice: { id: string; status: string } };
    expect(invoice.status).toBe('draft');

    const issued = await request.patch('/api/accounting/invoices', {
      headers,
      data: { id: invoice.id, status: 'issued' },
    });
    expect(issued.ok()).toBeTruthy();

    const paid = await request.patch('/api/accounting/invoices', {
      headers,
      data: { id: invoice.id, status: 'paid' },
    });
    expect(paid.ok()).toBeTruthy();

    const del = await request.delete(`/api/accounting/invoices?id=${encodeURIComponent(invoice.id)}`, { headers });
    expect(del.ok()).toBeTruthy();
  });

  test('viewer fatura yazamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/accounting/invoices', {
      headers: authHeaders(token),
      data: { guest: 'X', amount: 1, type: 'ekstra' },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('Muhasebe — cari defter CRUD', () => {
  test('oluştur, güncelle, sil', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const headers = authHeaders(token);

    const create = await request.post('/api/accounting/ledger', {
      headers,
      data: { account: '120.01', description: 'CRUD E2E cari', debit: 100, credit: 0, ref: 'E2E' },
    });
    expect(create.ok()).toBeTruthy();
    const { entry } = (await create.json()) as { entry: { id: string } };

    const patch = await request.patch('/api/accounting/ledger', {
      headers,
      data: { id: entry.id, credit: 50, description: 'CRUD E2E güncellendi' },
    });
    expect(patch.ok()).toBeTruthy();
    const patched = (await patch.json()) as { entry: { credit: number; description: string } };
    expect(patched.entry.credit).toBe(50);

    const del = await request.delete(`/api/accounting/ledger?id=${encodeURIComponent(entry.id)}`, { headers });
    expect(del.ok()).toBeTruthy();
  });
});

test.describe('Muhasebe — cari master', () => {
  test('şirket listesi okunur', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/companies', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { companies: Array<{ code: string; name: string }> };
    expect(j.companies.length).toBeGreaterThan(0);
  });
});
