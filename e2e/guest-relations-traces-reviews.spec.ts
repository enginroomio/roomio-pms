import { test, expect } from '@playwright/test';
import { DEMO_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Misafir İlişkileri — trace & review', () => {
  test('trace oluştur, düzenle, tamamla, sil', async ({ request }) => {
    const token = await loginApiTokenWith(request, DEMO_EMAIL, DEMO_PASSWORD);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };

    const create = await request.post('/api/guest-traces', {
      headers,
      data: {
        guest: 'Trace E2E',
        roomNo: '318',
        subject: 'Geç çıkış',
        due: '20.06 12:00',
        assignee: 'Ön Büro',
      },
    });
    expect(create.ok()).toBeTruthy();
    const { trace } = (await create.json()) as { trace: { id: string } };

    const update = await request.post('/api/guest-traces', {
      headers,
      data: {
        id: trace.id,
        guest: 'Trace E2E',
        roomNo: '318',
        subject: 'Geç çıkış — güncellendi',
        due: '20.06 14:00',
        assignee: 'Resepsiyon',
        status: 'Açık',
      },
    });
    expect(update.ok()).toBeTruthy();

    const done = await request.post('/api/guest-traces', {
      headers,
      data: { action: 'complete', id: trace.id },
    });
    expect(done.ok()).toBeTruthy();

    const del = await request.delete(`/api/guest-traces?id=${encodeURIComponent(trace.id)}`, { headers });
    expect(del.ok()).toBeTruthy();
  });

  test('review oluştur, cevapla, sil', async ({ request }) => {
    const token = await loginApiTokenWith(request, DEMO_EMAIL, DEMO_PASSWORD);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };

    const create = await request.post('/api/guest-reviews', {
      headers,
      data: {
        guestName: 'Review E2E',
        roomNo: '205',
        rating: 4,
        comment: 'Harika konaklama',
        title: 'Teşekkür',
      },
    });
    expect(create.ok()).toBeTruthy();
    const { review } = (await create.json()) as { review: { id: string } };

    const answer = await request.post('/api/guest-reviews', {
      headers,
      data: { action: 'answer', id: review.id, response: 'Teşekkür ederiz' },
    });
    expect(answer.ok()).toBeTruthy();

    const del = await request.delete(`/api/guest-reviews?id=${encodeURIComponent(review.id)}`, { headers });
    expect(del.ok()).toBeTruthy();
  });
});
