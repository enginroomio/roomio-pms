import { test, expect } from '@playwright/test';
import { HK_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Offline HK durum kuyruğu', () => {
  test('sync push housekeeping oda durumunu günceller', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };

    const roomsRes = await request.get('/api/housekeeping/rooms', { headers });
    expect(roomsRes.ok()).toBeTruthy();
    const roomsJ = (await roomsRes.json()) as { rooms: Array<{ roomNo: string; status: string }> };
    const room = roomsJ.rooms.find((r) => r.roomNo);
    expect(room).toBeTruthy();

    const targetStatus = room!.status === 'DIRTY' ? 'CLEAN' : 'DIRTY';
    const entityId = `hk-e2e-${room!.roomNo}-${Date.now()}`;

    const push = await request.post('/api/sync/push', {
      headers,
      data: {
        deviceId: 'e2e-hk-offline-device',
        items: [
          {
            id: entityId,
            entity: 'housekeeping',
            operation: 'update',
            entityId: room!.roomNo,
            payload: { roomNo: room!.roomNo, hkStatus: targetStatus },
            createdAt: new Date().toISOString(),
            deviceId: 'e2e-hk-offline-device',
            checksum: 'e2e',
          },
        ],
      },
    });
    expect(push.ok()).toBeTruthy();
    const body = (await push.json()) as { accepted?: string[] };
    expect(body.accepted).toContain(entityId);

    const afterRes = await request.get('/api/housekeeping/rooms', { headers });
    const afterJ = (await afterRes.json()) as { rooms: Array<{ roomNo: string; status: string }> };
    const updated = afterJ.rooms.find((r) => r.roomNo === room!.roomNo);
    expect(updated?.status).toBe(targetStatus);
  });
});
