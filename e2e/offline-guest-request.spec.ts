import { test, expect } from '@playwright/test';
import { RECEPTION_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Offline misafir talebi kuyruğu', () => {
  test('sync push guest_request oluşturur', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };
    const entityId = `gr-e2e-${Date.now()}`;

    const push = await request.post('/api/sync/push', {
      headers,
      data: {
        deviceId: 'e2e-offline-device',
        items: [
          {
            id: entityId,
            entity: 'guest_request',
            operation: 'create',
            entityId,
            payload: {
              roomNo: '305',
              requestType: 'extra_towel',
              description: 'E2E offline kuyruk',
              requestedBy: 'E2E',
            },
            createdAt: new Date().toISOString(),
            deviceId: 'e2e-offline-device',
            checksum: 'e2e',
          },
        ],
      },
    });
    expect(push.ok()).toBeTruthy();
    const body = (await push.json()) as { accepted?: string[] };
    expect(body.accepted).toContain(entityId);

    const list = await request.get('/api/housekeeping/requests?status=active&roomNo=305', { headers });
    expect(list.ok()).toBeTruthy();
    const data = (await list.json()) as { requests: Array<{ description?: string }> };
    expect(data.requests.some((r) => r.description === 'E2E offline kuyruk')).toBeTruthy();
  });
});
