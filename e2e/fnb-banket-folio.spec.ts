import { test, expect } from '@playwright/test';
import { DEMO_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Banket → folyo', () => {
  test('etkinlik gelirini konaklayan folyosuna yazar', async ({ request }) => {
    const token = await loginApiTokenWith(request, DEMO_EMAIL, DEMO_PASSWORD);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };

    const reservations = await request.get('/api/reservations', { headers });
    expect(reservations.ok()).toBeTruthy();
    const resList = (await reservations.json()) as { reservations: Array<{ id: string; status: string; roomNo?: string }> };
    const checkedIn = resList.reservations.find((r) => r.status === 'CHECKED_IN' && r.roomNo);
    expect(checkedIn).toBeTruthy();

    const folioBefore = await request.get(`/api/folio?reservationId=${checkedIn!.id}`, { headers });
    const beforeJ = (await folioBefore.json()) as { balance: number };

    const create = await request.post('/api/fnb/banket', {
      headers,
      data: {
        eventName: 'E2E Banket Gala',
        hall: 'Kristal Salon',
        contact: 'E2E Organizasyon',
        revenue: 2500,
        status: 'confirmed',
      },
    });
    expect(create.ok()).toBeTruthy();
    const { event } = (await create.json()) as { event: { id: string } };

    const post = await request.post('/api/fnb/banket', {
      headers,
      data: { action: 'postFolio', id: event.id, reservationId: checkedIn!.id },
    });
    expect(post.ok()).toBeTruthy();

    const folioAfter = await request.get(`/api/folio?reservationId=${checkedIn!.id}`, { headers });
    const afterJ = (await folioAfter.json()) as { balance: number };
    expect(afterJ.balance).toBeGreaterThanOrEqual(beforeJ.balance + 2500);
  });
});
