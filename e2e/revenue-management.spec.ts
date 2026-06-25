import { test, expect } from '@playwright/test';
import { ADMIN_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Gelir Yönetimi (RMS)', () => {
  test('forecast API — KPI ve 14 günlük tahmin', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/revenue-management/forecast?days=14', {
      headers: authHeaders(token),
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      ok: boolean;
      days: unknown[];
      summary: { avgOccupancy: number; totalForecastRevenue: number };
      channelMix: unknown[];
      recommendedActions: string[];
    };
    expect(body.ok).toBe(true);
    expect(body.days.length).toBe(14);
    expect(body.summary.totalForecastRevenue).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(body.channelMix)).toBe(true);
    expect(body.recommendedActions.length).toBeGreaterThan(0);
  });

  test('kanal stratejisi kaydet + dinamik fiyat uygula', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const headers = authHeaders(token);

    const save = await request.post('/api/revenue-management/config', {
      headers,
      data: {
        channelStrategies: [
          { channelId: 'booking', channelName: 'Booking.com', enabled: true, markupPercent: 12 },
          { channelId: 'roomio-direct', channelName: 'Direkt', enabled: true, markupPercent: -5 },
        ],
        competitor: { enabled: true, marketIndex: 60, adjustmentPer10Points: -2 },
      },
    });
    expect(save.ok()).toBeTruthy();

    const apply = await request.post('/api/integrations/dynamic-pricing/apply', { headers });
    expect(apply.ok()).toBeTruthy();
    const applyBody = (await apply.json()) as { ok: boolean; updatedCells: number };
    expect(applyBody.ok).toBe(true);
  });

  test('RMS dashboard UI', async ({ page }) => {
    await page.goto('/revenue');
    await expect(page.getByRole('heading', { name: /Gelir Yönetimi/i })).toBeVisible();
    await expect(page.getByText('14 Günlük Gelir Tahmini')).toBeVisible();
    await expect(page.getByText('Kanal Fiyat Stratejisi')).toBeVisible();
  });
});
