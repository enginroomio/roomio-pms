import { test, expect } from '@playwright/test';
import { DEMO_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Hızlı POS → folyo', () => {
  test('restoran satışını konaklayan folyosuna yazar', async ({ request }) => {
    const token = await loginApiTokenWith(request, DEMO_EMAIL, DEMO_PASSWORD);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };

    const reservations = await request.get('/api/reservations', { headers });
    expect(reservations.ok()).toBeTruthy();
    const resList = (await reservations.json()) as { reservations: Array<{ id: string; status: string; roomNo?: string }> };
    const checkedIn = resList.reservations.find((r) => r.status === 'CHECKED_IN' && r.roomNo);
    expect(checkedIn).toBeTruthy();

    const folioBefore = await request.get(`/api/folio?reservationId=${checkedIn!.id}`, { headers });
    const beforeJ = (await folioBefore.json()) as { balance: number };

    const charge = await request.post('/api/folio', {
      headers,
      data: {
        action: 'charge',
        reservationId: checkedIn!.id,
        amount: 175,
        description: 'E2E Hızlı POS — Kahve',
        user: 'F&B',
      },
    });
    expect(charge.ok()).toBeTruthy();

    const folioAfter = await request.get(`/api/folio?reservationId=${checkedIn!.id}`, { headers });
    const afterJ = (await folioAfter.json()) as { balance: number };
    expect(afterJ.balance).toBeGreaterThanOrEqual(beforeJ.balance + 175);
  });
});
