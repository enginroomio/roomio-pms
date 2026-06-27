import { test, expect } from '@playwright/test';
import { ADMIN_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Production Deploy', () => {
  test('readiness API — altyapı ve modül kontrolleri', async ({ request }) => {
    test.setTimeout(120_000);
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/deploy/readiness', {
      headers: authHeaders(token),
      timeout: 90_000,
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      ok: boolean;
      checks: Array<{ id: string; ok: boolean }>;
      summary: { total: number; passed: number };
    };
    expect(body.checks.length).toBeGreaterThanOrEqual(11);
    expect(body.summary.total).toBe(body.checks.length);
    expect(body.summary.passed).toBeGreaterThan(0);
    const ids = body.checks.map((c) => c.id);
    expect(ids).toContain('rms');
    expect(ids).toContain('loyalty');
    expect(ids).toContain('groups');
    expect(ids).toContain('channel-manager');
    expect(ids).toContain('push');
    expect(ids).toContain('https');
  });

  test('Production Deploy hub UI', async ({ page, request }) => {
    test.setTimeout(90_000);
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    await page.goto('/login');
    await page.evaluate((t) => localStorage.setItem('roomio-token', t), token);
    await page.goto('/tools/deploy');
    await expect(page.getByRole('heading', { name: /Production Deploy/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Sistem sağlığı')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Gelir yönetimi (RMS)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'HK mobil push (saha)' })).toBeVisible();
  });
});
