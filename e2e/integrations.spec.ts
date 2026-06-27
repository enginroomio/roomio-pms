import { test, expect } from '@playwright/test';
import { ADMIN_EMAIL, DEMO_PASSWORD, authHeaders, loginApiToken, loginApiTokenWith } from './helpers/api-auth';

test.describe('Faz 3 — entegrasyon API', () => {
  test('health — DB + redis durumu', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      ok: boolean;
      checks?: { database: { ok: boolean }; redis: { ok: boolean; detail: string } };
    };
    expect(body.ok).toBe(true);
    if (body.checks) {
      expect(body.checks.database.ok).toBe(true);
      expect(body.checks.redis.ok).toBe(true);
    }
  });

  test('TESA bağlantı testi', async ({ request }) => {
    const token = await loginApiToken(request);
    const res = await request.get('/api/integrations/tesa/encode', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { connection: { ok: boolean } };
    expect(body.connection.ok).toBe(true);
  });

  test('5651 cihaz testi', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/compliance/5651/devices', {
      headers: authHeaders(token),
      data: { action: 'test' },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { ok: boolean; results: Array<{ ok: boolean }> };
    expect(body.ok).toBe(true);
    expect(body.results.length).toBeGreaterThan(0);
  });

  test('5651 bridge dry-run', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/compliance/5651/bridge/test', {
      headers: authHeaders(token),
      data: { provider: 'mikrotik', sample: 'mikrotik_login', dryRun: true },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { ok: boolean; parsed: Record<string, unknown> };
    expect(body.ok).toBe(true);
    expect(body.parsed).toBeTruthy();
  });
});
