import { test, expect } from '@playwright/test';
import { RECEPTION_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Offline trace kuyruğu', () => {
  test('sync push guest_trace oluşturur', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };
    const entityId = `gt-e2e-${Date.now()}`;
    const subject = `E2E offline trace ${Date.now()}`;

    const push = await request.post('/api/sync/push', {
      headers,
      data: {
        deviceId: 'e2e-trace-offline-device',
        items: [
          {
            id: entityId,
            entity: 'guest_trace',
            operation: 'create',
            entityId,
            payload: {
              id: entityId,
              guest: 'E2E Misafir',
              roomNo: '305',
              subject,
              due: '14:00',
              assignee: 'Ön Büro',
              date: new Date().toISOString().slice(0, 10),
              status: 'Açık',
            },
            createdAt: new Date().toISOString(),
            deviceId: 'e2e-trace-offline-device',
            checksum: 'e2e',
          },
        ],
      },
    });
    expect(push.ok()).toBeTruthy();
    const body = (await push.json()) as { accepted?: string[] };
    expect(body.accepted).toContain(entityId);

    const list = await request.get('/api/guest-traces', { headers });
    expect(list.ok()).toBeTruthy();
    const data = (await list.json()) as { traces: Array<{ subject?: string }> };
    expect(data.traces.some((t) => t.subject === subject)).toBeTruthy();
  });
});
