import { test, expect } from '@playwright/test';
import { ACCOUNTING_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Yazarkasa cihazları', () => {
  test('status ve ping API', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const headers = authHeaders(token);

    const status = await request.get('/api/fiscal-devices?view=status', { headers });
    expect(status.ok()).toBeTruthy();
    const statusJ = (await status.json()) as { devices: Array<{ code: string; zReportNo: number; connection: string }> };
    expect(statusJ.devices.length).toBeGreaterThan(0);
    expect(statusJ.devices[0].zReportNo).toBeGreaterThan(1000);

    const ping = await request.get('/api/fiscal-devices?view=ping', { headers });
    expect(ping.ok()).toBeTruthy();
    const pingJ = (await ping.json()) as { ok: boolean; online: number; total: number };
    expect(pingJ.total).toBeGreaterThan(0);
    expect(pingJ.online).toBeGreaterThan(0);
  });

  test('muhasebe aktif/pasif toggle', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const headers = { ...authHeaders(token), 'Content-Type': 'application/json' };

    const list = await request.get('/api/fiscal-devices?view=status', { headers });
    const { devices } = (await list.json()) as { devices: Array<{ id: string; active: boolean }> };
    const device = devices[0];
    expect(device).toBeTruthy();

    const patch = await request.patch('/api/fiscal-devices', {
      headers,
      data: { id: device.id, active: !device.active },
    });
    expect(patch.ok()).toBeTruthy();

    await request.patch('/api/fiscal-devices', {
      headers,
      data: { id: device.id, active: device.active },
    });
  });
});
