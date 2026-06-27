import { test, expect } from '@playwright/test';
import { ADMIN_EMAIL, DEMO_PASSWORD, authHeaders, loginApiTokenWith } from './helpers/api-auth';

test.describe('Grup & Blok Yönetimi', () => {
  test('summary API — KPI şeridi', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reservations/groups?view=summary', {
      headers: authHeaders(token),
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      ok: boolean;
      summary: {
        groupCount: number;
        openBlocks: number;
        roomsAllotted: number;
        roomsPickedUp: number;
        pickupPct: number;
      };
    };
    expect(body.ok).toBe(true);
    expect(body.summary.groupCount).toBeGreaterThanOrEqual(0);
    expect(body.summary.pickupPct).toBeGreaterThanOrEqual(0);
  });

  test('grup oluştur + allotment + release döngüsü', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const headers = authHeaders(token);

    const create = await request.post('/api/reservations/groups', {
      headers,
      data: {
        name: `E2E Grup ${Date.now()}`,
        checkIn: '2026-07-01',
        checkOut: '2026-07-05',
        roomCount: 4,
        releaseDays: 5,
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = (await create.json()) as { ok: boolean; group: { id: string; refNo: string } };
    expect(created.ok).toBe(true);

    const allotment = await request.get(
      `/api/reservations/groups?groupId=${encodeURIComponent(created.group.id)}&view=allotment`,
      { headers },
    );
    expect(allotment.ok()).toBeTruthy();
    const allotBody = (await allotment.json()) as {
      status?: { releaseDays?: number; totalAllotted: number };
    };
    expect(allotBody.status?.releaseDays).toBe(5);
    expect(allotBody.status?.totalAllotted).toBeGreaterThan(0);

    const release = await request.post('/api/reservations/groups', {
      headers,
      data: { action: 'release', groupId: created.group.id },
    });
    expect(release.ok()).toBeTruthy();
    const releaseBody = (await release.json()) as { ok: boolean; group?: { status: string } };
    expect(releaseBody.ok).toBe(true);
    expect(releaseBody.group?.status).toBe('released');
  });

  test('Grup hub UI', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/groups');
    await expect(page.getByRole('heading', { name: /Grup & Blok Yönetimi/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Aktif blok')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Grup pickup raporu')).toBeVisible();
  });
});
