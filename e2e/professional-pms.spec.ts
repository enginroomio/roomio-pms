import { test, expect } from '@playwright/test';
import { ADMIN_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Profesyonel PMS — Opera/Fidelio parity', () => {
  test('queue rooms — enqueue, ready, assign', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);

    const list = await request.get('/api/reception/queue-rooms', { headers: authHeaders(token) });
    expect(list.ok()).toBeTruthy();

    const enqueue = await request.post('/api/reception/queue-rooms', {
      headers: authHeaders(token),
      data: {
        guestName: 'E2E Kuyruk Misafir',
        roomType: 'DBL',
        adults: 2,
        priority: 'vip',
        notes: 'Opera queue test',
      },
    });
    expect(enqueue.ok()).toBeTruthy();
    const enqBody = (await enqueue.json()) as { ok: boolean; entry?: { id: string } };
    expect(enqBody.ok).toBe(true);
    expect(enqBody.entry?.id).toBeTruthy();

    const ready = await request.post('/api/reception/queue-rooms', {
      headers: authHeaders(token),
      data: { action: 'ready', id: enqBody.entry!.id },
    });
    expect(ready.ok()).toBeTruthy();

    const assign = await request.post('/api/reception/queue-rooms', {
      headers: authHeaders(token),
      data: { action: 'assign', id: enqBody.entry!.id, roomNo: '418' },
    });
    expect(assign.ok()).toBeTruthy();
    const assignBody = (await assign.json()) as { entry?: { status: string; assignedRoomNo?: string } };
    expect(assignBody.entry?.status).toBe('assigned');
    expect(assignBody.entry?.assignedRoomNo).toBe('418');
  });

  test('guest profile 360 — search and profile', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);

    const search = await request.get('/api/guests/profile?mode=search&q=ahmet', {
      headers: authHeaders(token),
    });
    expect(search.ok()).toBeTruthy();
    const searchBody = (await search.json()) as { ok: boolean; results: unknown[] };
    expect(searchBody.ok).toBe(true);
    expect(Array.isArray(searchBody.results)).toBe(true);

    if (searchBody.results.length > 0) {
      const hit = searchBody.results[0] as { guestName: string };
      const profile = await request.get(
        `/api/guests/profile?q=${encodeURIComponent(hit.guestName)}`,
        { headers: authHeaders(token) },
      );
      expect(profile.ok()).toBeTruthy();
      const profBody = (await profile.json()) as {
        ok: boolean;
        profile?: { guestName: string; stays: unknown[] };
      };
      expect(profBody.ok).toBe(true);
      expect(profBody.profile?.guestName).toBeTruthy();
      expect(Array.isArray(profBody.profile?.stays)).toBe(true);
    }
  });

  test('reception UI — queue and guest profile pages', async ({ page }) => {
    await page.goto('/reception/queue');
    await expect(page.getByRole('heading', { name: 'Oda Bekleme Kuyruğu' })).toBeVisible();
    await expect(page.getByText('Kuyruğa Ekle')).toBeVisible();

    await page.goto('/reception/guest-profile');
    await expect(page.getByRole('heading', { name: /Misafir Profil/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Ad, e-posta/i)).toBeVisible();
  });
});
