import { test, expect } from '@playwright/test';
import { DEMO_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Misafir İlişkileri — kayıp/buluntu', () => {
  test('oluştur, düzenle, teslim, sil', async ({ request }) => {
    const token = await loginApiTokenWith(request, DEMO_EMAIL, DEMO_PASSWORD);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };

    const create = await request.post('/api/lost-found', {
      headers,
      data: {
        type: 'Buluntu',
        item: 'E2E Cüzdan',
        location: 'Lobi',
        guest: 'LF E2E Misafir',
        roomNo: '318',
      },
    });
    expect(create.ok()).toBeTruthy();
    const { item } = (await create.json()) as { item: { id: string } };

    const update = await request.post('/api/lost-found', {
      headers,
      data: {
        id: item.id,
        type: 'Buluntu',
        item: 'E2E Cüzdan — güncellendi',
        location: 'Resepsiyon',
        guest: 'LF E2E Misafir',
        roomNo: '318',
        status: 'Açık',
      },
    });
    expect(update.ok()).toBeTruthy();

    const delivered = await request.post('/api/lost-found', {
      headers,
      data: { action: 'deliver', id: item.id },
    });
    expect(delivered.ok()).toBeTruthy();

    const del = await request.delete(`/api/lost-found?id=${encodeURIComponent(item.id)}`, { headers });
    expect(del.ok()).toBeTruthy();
  });
});

test.describe('Misafir İlişkileri — reklamasyon', () => {
  test('oluştur, düzenle, onayla, sil', async ({ request }) => {
    const token = await loginApiTokenWith(request, DEMO_EMAIL, DEMO_PASSWORD);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };

    const create = await request.post('/api/reclamations', {
      headers,
      data: {
        guest: 'RKL E2E Misafir',
        roomNo: '412',
        subject: 'Oda gürültüsü',
        compensation: '1 gece indirim',
      },
    });
    expect(create.ok()).toBeTruthy();
    const { case: rec } = (await create.json()) as { case: { id: string } };

    const update = await request.post('/api/reclamations', {
      headers,
      data: {
        id: rec.id,
        guest: 'RKL E2E Misafir',
        roomNo: '412',
        subject: 'Oda gürültüsü — güncellendi',
        compensation: '2 gece indirim',
        status: 'İncelemede',
      },
    });
    expect(update.ok()).toBeTruthy();

    const approved = await request.post('/api/reclamations', {
      headers,
      data: { action: 'status', id: rec.id, status: 'Onaylandı' },
    });
    expect(approved.ok()).toBeTruthy();

    const del = await request.delete(`/api/reclamations?id=${encodeURIComponent(rec.id)}`, { headers });
    expect(del.ok()).toBeTruthy();
  });
});
