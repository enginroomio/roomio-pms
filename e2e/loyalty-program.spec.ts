import { test, expect } from '@playwright/test';
import { ADMIN_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Sadakat Programı', () => {
  test('summary API — KPI ve demo üyeler', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/loyalty/summary', {
      headers: authHeaders(token),
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      ok: boolean;
      summary: { accountCount: number; totalPoints: number; enabled: boolean };
      config: { pointsPerNight: number };
    };
    expect(body.ok).toBe(true);
    expect(body.summary.accountCount).toBeGreaterThanOrEqual(3);
    expect(body.summary.totalPoints).toBeGreaterThan(0);
    expect(body.config.pointsPerNight).toBeGreaterThan(0);
  });

  test('puan kazan + harca döngüsü', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const headers = authHeaders(token);

    const email = `loyalty-test-${Date.now()}@example.com`;
    const create = await request.post('/api/loyalty/accounts', {
      headers,
      data: { guestName: 'Test Misafir', email },
    });
    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as { account: { id: string } };

    const earn = await request.post('/api/loyalty/earn', {
      headers,
      data: {
        accountId: created.account.id,
        nights: 3,
        spendTry: 6000,
        agencyCode: 'DIRECT-WEB',
      },
    });
    expect(earn.ok()).toBeTruthy();
    const earnBody = (await earn.json()) as { ok: boolean; earned: number };
    expect(earnBody.ok).toBe(true);
    expect(earnBody.earned).toBeGreaterThan(0);

    const redeem = await request.post('/api/loyalty/redeem', {
      headers,
      data: { accountId: created.account.id, points: Math.min(100, earnBody.earned) },
    });
    expect(redeem.ok()).toBeTruthy();
    const redeemBody = (await redeem.json()) as { ok: boolean };
    expect(redeemBody.ok).toBe(true);
  });

  test('Sadakat hub UI', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/loyalty');
    await expect(page.getByRole('heading', { name: /Sadakat Programı/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Üye sayısı')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Mehmet Kaya')).toBeVisible({ timeout: 20000 });
  });
});
