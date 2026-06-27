import { test, expect } from '@playwright/test';
import { DEMO_EMAIL, DEMO_PASSWORD, VIEWER_EMAIL, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Misafir İlişkileri — şikayet CRUD', () => {
  test('oluştur, düzenle, çöz, sil', async ({ request }) => {
    const token = await loginApiTokenWith(request, DEMO_EMAIL, DEMO_PASSWORD);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };

    const create = await request.post('/api/guest-complaints', {
      headers,
      data: {
        roomNo: '412',
        guest: 'GR E2E Misafir',
        category: 'Oda',
        description: 'İlk kayıt',
        priority: 'Normal',
      },
    });
    expect(create.ok()).toBeTruthy();
    const { complaint } = (await create.json()) as { complaint: { id: string } };

    const update = await request.post('/api/guest-complaints', {
      headers,
      data: {
        id: complaint.id,
        roomNo: '412',
        guest: 'GR E2E Misafir',
        category: 'Oda',
        description: 'Güncellenmiş açıklama',
        priority: 'Acil',
      },
    });
    expect(update.ok()).toBeTruthy();

    const resolved = await request.post('/api/guest-complaints', {
      headers,
      data: { action: 'resolve', id: complaint.id },
    });
    expect(resolved.ok()).toBeTruthy();

    const del = await request.delete(`/api/guest-complaints?id=${encodeURIComponent(complaint.id)}`, { headers });
    expect(del.ok()).toBeTruthy();
  });

  test('viewer şikayet yazamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/guest-complaints', {
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      data: { roomNo: '1', guest: 'X', category: 'Y', description: 'Z' },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('Misafir İlişkileri — VIP CRUD', () => {
  test('oluştur ve sil', async ({ request }) => {
    const token = await loginApiTokenWith(request, DEMO_EMAIL, DEMO_PASSWORD);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };

    const create = await request.post('/api/vip-guests', {
      headers,
      data: {
        level: 'Silver',
        guestName: 'VIP E2E Misafir',
        country: 'DE',
        room: '501',
        arrival: '2026-06-24',
        nights: 3,
      },
    });
    expect(create.ok()).toBeTruthy();
    const { guest } = (await create.json()) as { guest: { id: string; guestName: string } };
    expect(guest.guestName).toBe('VIP E2E Misafir');

    const list = await request.get('/api/vip-guests?level=Silver', { headers });
    const data = (await list.json()) as { guests: Array<{ id: string }> };
    expect(data.guests.some((g) => g.id === guest.id)).toBeTruthy();

    const del = await request.delete(`/api/vip-guests?id=${encodeURIComponent(guest.id)}`, { headers });
    expect(del.ok()).toBeTruthy();
  });
});
