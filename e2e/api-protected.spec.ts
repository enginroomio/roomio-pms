import { test, expect } from '@playwright/test';
import {
  ADMIN_EMAIL,
  DEMO_PASSWORD,
  VIEWER_EMAIL,
  HK_EMAIL,
  ACCOUNTING_EMAIL,
  RECEPTION_EMAIL,
  authedGet,
  authedPatch,
  authedPost,
  authedPostAs,
  authHeaders,
  loginApiToken,
  loginApiTokenWith,
} from './helpers/api-auth';

test.describe('Oturum API', () => {
  test('auth/session tokensiz demo modda erişilir', async ({ request }) => {
    const res = await request.get('/api/auth/session');
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as {
      ok?: boolean;
      user?: { role: string; permissions?: string[] };
      authenticated?: boolean;
    };
    expect(j.ok).toBe(true);
    expect(j.user?.role).toBeTruthy();
    expect(j.authenticated).toBe(false);
  });

  test('auth/session login sonrası authenticated', async ({ request }) => {
    const token = await loginApiToken(request);
    const res = await request.get('/api/auth/session', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as {
      authenticated?: boolean;
      user?: { permissions?: string[]; email?: string };
    };
    expect(j.authenticated).toBe(true);
    expect((j.user?.permissions?.length ?? 0)).toBeGreaterThan(0);
  });
});

test.describe('Korumalı API — entegrasyon durumu', () => {
  test('entegrasyon durumu auth ile erişilir', async ({ request }) => {
    const res = await authedGet(request, '/api/integrations/status');
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as {
      ok?: boolean;
      tesa?: { enabled?: boolean };
      pbx?: { enabled?: boolean };
      hotspot5651?: unknown;
    };
    expect(j.ok).toBe(true);
    expect(j.tesa).toBeTruthy();
    expect(j.pbx).toBeTruthy();
    expect(j.hotspot5651).toBeTruthy();
  });
});

test.describe('Korumalı API — kimlik ve doluluk', () => {
  test('kimlik bildirim listesi auth ile erişilir', async ({ request }) => {
    const res = await authedGet(request, '/api/identity/notifications');
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; notifications?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.notifications)).toBe(true);
  });

  test('EGM kimlik kayıtları auth ile erişilir', async ({ request }) => {
    const res = await authedGet(request, '/api/egm/identity');
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; records?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.records)).toBe(true);
  });

  test('doluluk matrisi auth ile erişilir', async ({ request }) => {
    const res = await authedGet(request, '/api/reservations/availability?days=7');
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; matrix?: unknown[]; days?: number };
    expect(j.ok).toBe(true);
    expect(j.days).toBe(7);
    expect(Array.isArray(j.matrix)).toBe(true);
    expect((j.matrix?.length ?? 0)).toBeGreaterThan(0);
  });
});

test.describe('Korumalı API — grup rezervasyon', () => {
  test('grup listesi auth ile erişilir', async ({ request }) => {
    const res = await authedGet(request, '/api/reservations/groups');
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; groups?: Array<{ id: string }> };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.groups)).toBe(true);
  });

  test('grup pickup raporu auth ile erişilir', async ({ request }) => {
    const res = await authedGet(request, '/api/reservations/groups?view=pickup-report');
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as {
      ok?: boolean;
      report?: { rows?: unknown[]; totals?: { groups?: number } };
    };
    expect(j.ok).toBe(true);
    expect(j.report).toBeTruthy();
    expect(Array.isArray(j.report?.rows)).toBe(true);
  });

  test('grup allotment auth ile erişilir', async ({ request }) => {
    const listRes = await authedGet(request, '/api/reservations/groups');
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { groups?: Array<{ id: string }> };
    const groupId = list.groups?.[0]?.id;
    expect(groupId, 'En az bir seed grubu gerekli').toBeTruthy();

    const res = await authedGet(
      request,
      `/api/reservations/groups?groupId=${encodeURIComponent(groupId!)}&view=allotment`,
    );
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; status?: { totalAllotted?: number } };
    expect(j.ok).toBe(true);
    expect(j.status).toBeTruthy();
  });

  test('kullanıcı grupları auth ile erişilir', async ({ request }) => {
    const res = await authedGet(request, '/api/user-groups');
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; groups?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.groups)).toBe(true);
    expect((j.groups?.length ?? 0)).toBeGreaterThan(0);
  });
});

test.describe('Korumalı API — rezervasyon', () => {
  test('rezervasyon PATCH auth ile çalışır', async ({ request }) => {
    const listRes = await authedGet(request, '/api/reservations');
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { reservations?: Array<{ id: string; notes?: string }> };
    const reservation = list.reservations?.[0];
    expect(reservation?.id, 'En az bir rezervasyon gerekli').toBeTruthy();

    const patchRes = await authedPatch(request, '/api/reservations', {
      id: reservation!.id,
      notes: `E2E PATCH ${Date.now()}`,
    });
    expect(patchRes.ok()).toBeTruthy();
    const patched = (await patchRes.json()) as { ok?: boolean; reservation?: { id: string } };
    expect(patched.ok).toBe(true);
    expect(patched.reservation?.id).toBe(reservation!.id);
  });

  test('kullanıcı listesi auth ile erişilir', async ({ request }) => {
    const res = await authedGet(request, '/api/users');
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; users?: unknown[]; count?: number };
    expect(j.ok).toBe(true);
    expect((j.count ?? j.users?.length ?? 0)).toBeGreaterThan(0);
  });

  test('rezervasyon POST auth ile çalışır', async ({ request }) => {
    const stamp = Date.now();
    const payload = {
      id: `e2e-res-${stamp}`,
      refNo: `E2E-${stamp}`,
      guestName: 'E2E Test Guest',
      checkIn: '2026-07-01',
      checkOut: '2026-07-03',
      roomType: 'DBL',
      adults: 2,
      children: 0,
      mealPlan: 'BB',
      rate: 5000,
      currency: 'TRY',
      agency: 'Direct',
      market: 'BAR',
      status: 'CONFIRMED',
      createdAt: '2026-06-23',
    };
    const res = await authedPost(request, '/api/reservations', payload);
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; reservation?: { id: string; refNo: string } };
    expect(j.ok).toBe(true);
    expect(j.reservation?.id).toBe(payload.id);
    expect(j.reservation?.refNo).toBe(payload.refNo);
  });

  test('yeni rezervasyon sonrası EGM eksik form 400 döner', async ({ request }) => {
    const stamp = Date.now();
    const payload = {
      id: `e2e-egm-${stamp}`,
      refNo: `E2E-EGM-${stamp}`,
      guestName: 'E2E EGM Guest',
      checkIn: '2026-07-05',
      checkOut: '2026-07-07',
      roomType: 'SGL',
      adults: 1,
      children: 0,
      mealPlan: 'RO',
      rate: 3200,
      currency: 'TRY',
      agency: 'Direct',
      market: 'BAR',
      status: 'CONFIRMED',
      createdAt: '2026-06-23',
    };
    const resRes = await authedPost(request, '/api/reservations', payload);
    expect(resRes.ok()).toBeTruthy();

    const egmRes = await authedPost(request, '/api/egm/identity', {});
    expect(egmRes.status()).toBe(400);
    const egmBody = (await egmRes.json()) as { error?: string };
    expect(egmBody.error).toBeTruthy();
  });
});

test.describe('Korumalı API — admin kullanıcı', () => {
  test('admin kullanıcı güncellemesi auth ile çalışır', async ({ request }) => {
    const adminToken = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const listRes = await request.get('/api/users', { headers: authHeaders(adminToken) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as {
      users?: Array<{ id: string; email: string; department: string }>;
    };
    const target = list.users?.find((u) => u.email !== ADMIN_EMAIL) ?? list.users?.[0];
    expect(target?.id, 'Güncellenecek kullanıcı gerekli').toBeTruthy();

    const postRes = await authedPostAs(
      request,
      '/api/users',
      { id: target!.id, department: target!.department },
      ADMIN_EMAIL,
      DEMO_PASSWORD,
    );
    expect(postRes.ok()).toBeTruthy();
    const updated = (await postRes.json()) as { ok?: boolean; user?: { id: string } };
    expect(updated.ok).toBe(true);
    expect(updated.user?.id).toBe(target!.id);
  });

  test('admin program tarihi güncelleyebilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const getRes = await request.get('/api/business-date', { headers: authHeaders(token) });
    expect(getRes.ok()).toBeTruthy();
    const current = (await getRes.json()) as { businessDate?: string };
    expect(current.businessDate).toBeTruthy();

    const postRes = await request.post('/api/business-date', {
      headers: authHeaders(token),
      data: { businessDate: current.businessDate, user: 'E2E Admin' },
    });
    expect(postRes.ok()).toBeTruthy();
    const updated = (await postRes.json()) as { ok?: boolean };
    expect(updated.ok).toBe(true);
  });

  test('admin otel profili güncelleyebilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const getRes = await request.get('/api/property-profile', { headers: authHeaders(token) });
    expect(getRes.ok()).toBeTruthy();
    const { profile } = (await getRes.json()) as { profile?: { name: string; code: string } };
    expect(profile?.name).toBeTruthy();

    const postRes = await request.post('/api/property-profile', {
      headers: authHeaders(token),
      data: { ...profile, user: 'E2E Admin' },
    });
    expect(postRes.ok()).toBeTruthy();
    const updated = (await postRes.json()) as { ok?: boolean };
    expect(updated.ok).toBe(true);
  });
});

test.describe('Korumalı API — viewer salt okunur', () => {
  test('viewer rezervasyon listesi okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { reservations?: unknown[] };
    expect(Array.isArray(j.reservations)).toBe(true);
  });

  test('viewer rezervasyon POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/reservations', {
      headers: authHeaders(token),
      data: {
        id: `e2e-viewer-deny-${Date.now()}`,
        refNo: 'E2E-VIEWER',
        guestName: 'Viewer Deny',
        checkIn: '2026-08-10',
        checkOut: '2026-08-12',
        roomType: 'DBL',
        adults: 1,
        children: 0,
        mealPlan: 'BB',
        rate: 1000,
        currency: 'TRY',
        agency: 'Direct',
        market: 'BAR',
        status: 'CONFIRMED',
        createdAt: '2026-06-23',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer rezervasyon PATCH yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const listRes = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { reservations?: Array<{ id: string }> };
    const reservation = list.reservations?.[0];
    expect(reservation?.id).toBeTruthy();

    const patchRes = await request.patch('/api/reservations', {
      headers: authHeaders(token),
      data: { id: reservation!.id, notes: 'viewer deny' },
    });
    expect(patchRes.status()).toBe(403);
  });

  test('viewer kullanıcı listesi identity.read ile okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/users', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; users?: unknown[]; count?: number };
    expect(j.ok).toBe(true);
    expect((j.count ?? j.users?.length ?? 0)).toBeGreaterThan(0);
  });

  test('viewer kullanıcı grupları identity.read ile okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/user-groups', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; groups?: unknown[] };
    expect(j.ok).toBe(true);
    expect((j.groups?.length ?? 0)).toBeGreaterThan(0);
  });

  test('viewer kullanıcı POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const listRes = await request.get('/api/users', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { users?: Array<{ id: string; department: string }> };
    const target = list.users?.[0];
    expect(target?.id).toBeTruthy();

    const postRes = await request.post('/api/users', {
      headers: authHeaders(token),
      data: { id: target!.id, department: target!.department },
    });
    expect(postRes.status()).toBe(403);
  });

  test('viewer EGM kimlik POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/egm/identity', {
      headers: authHeaders(token),
      data: {
        form: {
          reservationId: 'viewer-deny',
          refNo: 'VIEWER-DENY',
          firstName: 'Test',
          lastName: 'Viewer',
          nationality: 'TR',
          idNo: '12345678901',
          idType: 'TCKN',
          checkIn: '2026-08-01',
          checkOut: '2026-08-03',
        },
      },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer kullanıcı grupları POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/user-groups', {
      headers: authHeaders(token),
      data: { code: 'E2E-DENY', name: 'E2E Deny Group' },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer HK oda listesi GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/housekeeping/rooms', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('viewer HK routing GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/hk/routes', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('viewer HK routing POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/hk/routes', {
      headers: authHeaders(token),
      data: { code: 'E2E-VIEWER', name: 'Viewer Deny', floors: [1] },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer oda öneri GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reception/room-suggest?reservationId=viewer-deny', {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(403);
  });

  test('viewer check-in POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/reception/check-in', {
      headers: authHeaders(token),
      data: {
        reservationId: 'viewer-deny',
        roomNo: '101',
        guestName: 'Viewer',
        checkIn: '2026-09-01',
        checkOut: '2026-09-03',
        reservationRef: 'VIEWER-DENY',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer check-out POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/reception/checkout', {
      headers: authHeaders(token),
      data: { roomNo: '101', guestName: 'Viewer Deny' },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer doluluk matrisi GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reservations/availability?days=7', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; matrix?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.matrix)).toBe(true);
  });

  test('viewer dashboard GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/dashboard', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; occupancy?: number };
    expect(j.ok).toBe(true);
    expect(typeof j.occupancy).toBe('number');
  });

  test('viewer rack GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/rack', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { cells?: unknown[]; totalRooms?: number };
    expect(Array.isArray(j.cells)).toBe(true);
    expect(typeof j.totalRooms).toBe('number');
  });

  test('viewer kasa defteri GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/cash?view=ledger', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; report?: unknown };
    expect(j.ok).toBe(true);
    expect(j.report).toBeTruthy();
  });

  test('viewer kasa kapanış raporu GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/cash?view=close-report', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; report?: unknown };
    expect(j.ok).toBe(true);
    expect(j.report).toBeTruthy();
  });

  test('viewer kimlik bildirimleri GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/identity/notifications', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; notifications?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.notifications)).toBe(true);
  });

  test('viewer EGM kimlik kayıtları GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/egm/identity', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; records?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.records)).toBe(true);
  });

  test('viewer program tarihi POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/business-date', {
      headers: authHeaders(token),
      data: { businessDate: '2026-12-01', user: 'Viewer Deny' },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer program tarihi GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/business-date', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; businessDate?: string };
    expect(j.ok).toBe(true);
    expect(j.businessDate).toBeTruthy();
  });

  test('viewer kullanıcı parametreleri GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/user-params', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; params?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.params)).toBe(true);
  });

  test('viewer konfig parametreleri GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/config-params', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; params?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.params)).toBe(true);
  });

  test('viewer kullanıcı parametresi POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/user-params', {
      headers: authHeaders(token),
      data: { key: 'E2E_DENY', value: '1' },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer konfig parametresi POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/config-params', {
      headers: authHeaders(token),
      data: { key: 'E2E_DENY', value: '1' },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer market zorunluluğu GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/market-required', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; required?: boolean };
    expect(j.ok).toBe(true);
    expect(typeof j.required).toBe('boolean');
  });

  test('viewer otel profili POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const getRes = await request.get('/api/property-profile', { headers: authHeaders(token) });
    expect(getRes.ok()).toBeTruthy();
    const { profile } = (await getRes.json()) as { profile?: Record<string, unknown> };
    const res = await request.post('/api/property-profile', {
      headers: authHeaders(token),
      data: { ...profile, user: 'Viewer Deny' },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer TESA ayarı POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/integrations/tesa/config', {
      headers: authHeaders(token),
      data: { enabled: false },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer vergi kuralı POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/tax/rules', {
      headers: authHeaders(token),
      data: { rules: [{ code: 'E2E', name: 'Deny', ratePct: 0 }] },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer TESA encode POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/integrations/tesa/encode', {
      headers: authHeaders(token),
      data: {
        roomNo: '101',
        guestName: 'Viewer Deny',
        checkIn: '2026-09-01',
        checkOut: '2026-09-03',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer döviz ayarı POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/exchange/config', {
      headers: authHeaders(token),
      data: { config: { exchangeDiscountPct: 5 } },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer konsolide rapor GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reports/consolidated', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('viewer rapor şablonu POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/reports/templates', {
      headers: authHeaders(token),
      data: { name: 'Viewer Deny', module: 'reservations', columns: ['refNo'] },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer operasyon özeti GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/operations/summary', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; summary?: unknown };
    expect(j.ok).toBe(true);
    expect(j.summary).toBeTruthy();
  });

  test('viewer gece denetim GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/audit', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('viewer oda blokajı GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/room-blocks', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; blocks?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.blocks)).toBe(true);
  });

  test('viewer misafir şikayetleri GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/guest-complaints', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; complaints?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.complaints)).toBe(true);
  });

  test('viewer misafir şikayeti POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/guest-complaints', {
      headers: authHeaders(token),
      data: {
        roomNo: '101',
        guest: 'Viewer Deny',
        category: 'Servis',
        description: 'E2E deny',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer banket etkinliği POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/fnb/banket', {
      headers: authHeaders(token),
      data: {
        eventName: 'Viewer Deny',
        hall: 'Salon',
        contact: 'viewer@hotelsapphire.com',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer gece ön kontrol GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/eod/pre-close', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('viewer depozit listesi GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/deposits', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; deposits?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.deposits)).toBe(true);
  });

  test('viewer depozit POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/deposits', {
      headers: authHeaders(token),
      data: { guestName: 'Viewer Deny', amount: 100 },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer folyo GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const listRes = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as {
      reservations?: Array<{ id: string; status: string }>;
    };
    const guest = list.reservations?.find((r) => r.status === 'CHECKED_IN') ?? list.reservations?.[0];
    expect(guest?.id).toBeTruthy();

    const res = await request.get(`/api/folio?reservationId=${guest!.id}`, { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { reservationId?: string; lines?: unknown[] };
    expect(j.reservationId).toBe(guest!.id);
    expect(Array.isArray(j.lines)).toBe(true);
  });

  test('viewer folyo POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const listRes = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { reservations?: Array<{ id: string }> };
    const guest = list.reservations?.[0];
    expect(guest?.id).toBeTruthy();

    const res = await request.post('/api/folio', {
      headers: authHeaders(token),
      data: {
        reservationId: guest!.id,
        amount: 10,
        register: 'VIEWER-DENY',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer stok listesi GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/inventory/stock', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; items?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.items)).toBe(true);
  });

  test('viewer stok hareketi POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/inventory/stock', {
      headers: authHeaders(token),
      data: { stockId: 'deny', type: 'in', qty: 1 },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer misafir talepleri GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/housekeeping/requests?status=active', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('viewer grup rezervasyonları GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reservations/groups', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; groups?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.groups)).toBe(true);
  });

  test('viewer oda blokajı POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/room-blocks', {
      headers: authHeaders(token),
      data: {
        roomNo: '101',
        from: '2026-12-01',
        to: '2026-12-02',
        reason: 'Viewer Deny',
        blockedBy: 'Viewer',
        status: 'active',
      },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('Korumalı API — HK rolü', () => {
  test('HK rezervasyon listesi okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
  });

  test('HK rezervasyon POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/reservations', {
      headers: authHeaders(token),
      data: {
        id: `e2e-hk-deny-${Date.now()}`,
        refNo: 'E2E-HK',
        guestName: 'HK Deny',
        checkIn: '2026-08-15',
        checkOut: '2026-08-17',
        roomType: 'DBL',
        adults: 1,
        children: 0,
        mealPlan: 'BB',
        rate: 1000,
        currency: 'TRY',
        agency: 'Direct',
        market: 'BAR',
        status: 'CONFIRMED',
        createdAt: '2026-06-23',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('HK oda durumu PATCH yapabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const boardRes = await request.get('/api/housekeeping/rooms', { headers: authHeaders(token) });
    expect(boardRes.ok()).toBeTruthy();
    const board = (await boardRes.json()) as { rooms?: Array<{ roomNo: string }> };
    const roomNo = board.rooms?.[0]?.roomNo;
    expect(roomNo, 'En az bir oda gerekli').toBeTruthy();

    const patchRes = await request.patch('/api/housekeeping/rooms', {
      headers: authHeaders(token),
      data: { roomNo, notes: `E2E HK ${Date.now()}` },
    });
    expect(patchRes.ok()).toBeTruthy();
  });

  test('HK routing listesi okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/hk/routes', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; routes?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.routes)).toBe(true);
  });

  test('HK routing kaydedebilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const code = `E${String(Date.now()).slice(-5)}`;
    const res = await request.post('/api/hk/routes', {
      headers: authHeaders(token),
      data: { code, name: `E2E HK Route ${code}`, floors: [1] },
    });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; route?: { code: string } };
    expect(j.ok).toBe(true);
    expect(j.route?.code).toBe(code);
  });

  test('HK oda öneri GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reception/room-suggest?reservationId=hk-deny', {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(403);
  });

  test('HK EGM kimlik POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/egm/identity', {
      headers: authHeaders(token),
      data: { form: { reservationId: 'hk-deny', refNo: 'HK-DENY', firstName: 'HK', lastName: 'Test' } },
    });
    expect(res.status()).toBe(403);
  });

  test('HK sync pull okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.get(
      '/api/sync/pull?deviceId=e2e-hk&since=1970-01-01T00:00:00.000Z',
      { headers: authHeaders(token) },
    );
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { items?: unknown[] };
    expect(Array.isArray(j.items)).toBe(true);
  });

  test('HK misafir şikayetleri GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/guest-complaints', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('HK kayıp-buluntu GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/lost-found', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('HK misafir talepleri GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/housekeeping/requests?status=active', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { requests?: unknown[] };
    expect(Array.isArray(j.requests)).toBe(true);
  });

  test('HK doluluk matrisi GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reservations/availability?days=7', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; matrix?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.matrix)).toBe(true);
  });

  test('HK check-in POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/reception/check-in', {
      headers: authHeaders(token),
      data: {
        reservationId: 'hk-deny',
        roomNo: '101',
        guestName: 'HK Deny',
        checkIn: '2026-09-01',
        checkOut: '2026-09-03',
        reservationRef: 'HK-DENY',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('HK check-out POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/reception/checkout', {
      headers: authHeaders(token),
      data: { roomNo: '101', guestName: 'HK Deny' },
    });
    expect(res.status()).toBe(403);
  });

  test('HK folyo GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const listRes = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { reservations?: Array<{ id: string }> };
    const guest = list.reservations?.[0];
    expect(guest?.id).toBeTruthy();

    const res = await request.get(`/api/folio?reservationId=${guest!.id}`, { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('HK kasa defteri GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/cash?view=ledger', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('HK kimlik bildirimleri GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/identity/notifications', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('HK EGM kimlik kayıtları GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/egm/identity', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('HK depozit listesi GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/deposits', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('HK depozit POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, HK_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/deposits', {
      headers: authHeaders(token),
      data: { guestName: 'HK Deny', amount: 50, method: 'cash' },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('Korumalı API — muhasebe rolü', () => {
  test('muhasebe defteri okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/accounting/ledger', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; entries?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.entries)).toBe(true);
  });

  test('muhasebe defteri yazabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/accounting/ledger', {
      headers: authHeaders(token),
      data: {
        account: 'E2E',
        description: `E2E ledger ${Date.now()}`,
        debit: 100,
        credit: 0,
      },
    });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; entry?: { id: string } };
    expect(j.ok).toBe(true);
    expect(j.entry?.id).toBeTruthy();
  });

  test('muhasebe rezervasyon POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/reservations', {
      headers: authHeaders(token),
      data: {
        id: `e2e-acc-deny-${Date.now()}`,
        refNo: 'E2E-ACC',
        guestName: 'Accounting Deny',
        checkIn: '2026-09-10',
        checkOut: '2026-09-12',
        roomType: 'DBL',
        adults: 1,
        children: 0,
        mealPlan: 'BB',
        rate: 1000,
        currency: 'TRY',
        agency: 'Direct',
        market: 'BAR',
        status: 'CONFIRMED',
        createdAt: '2026-06-23',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('muhasebe doluluk matrisi GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reservations/availability?days=7', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('muhasebe dashboard GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/dashboard', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('muhasebe rack GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/rack', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('muhasebe kimlik bildirimleri GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/identity/notifications', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('muhasebe EGM kimlik kayıtları GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/egm/identity', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('muhasebe oda öneri GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reception/room-suggest?reservationId=acc-deny', {
      headers: authHeaders(token),
    });
    expect(res.status()).toBe(403);
  });

  test('muhasebe konsolide rapor okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reports/consolidated', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean };
    expect(j.ok).toBe(true);
  });

  test('muhasebe gece denetim okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/audit', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; logs?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.logs)).toBe(true);
  });

  test('muhasebe gece ön kontrol GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/eod/pre-close', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('muhasebe depozit listesi okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/deposits', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; deposits?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.deposits)).toBe(true);
  });

  test('muhasebe kasa defteri GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/cash?view=ledger', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; report?: unknown };
    expect(j.ok).toBe(true);
    expect(j.report).toBeTruthy();
  });

  test('muhasebe folyo POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/folio', {
      headers: authHeaders(token),
      data: {
        action: 'payment',
        reservationId: '1',
        amount: 10,
        register: 'E2E',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('muhasebe check-out POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/reception/checkout', {
      headers: authHeaders(token),
      data: { roomNo: '101', guestName: 'Accounting Deny' },
    });
    expect(res.status()).toBe(403);
  });

  test('viewer muhasebe defteri okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/accounting/ledger', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
  });

  test('viewer muhasebe defteri POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/accounting/ledger', {
      headers: authHeaders(token),
      data: { account: 'VIEWER', description: 'deny', debit: 1, credit: 0 },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('Korumalı API — resepsiyon rolü', () => {
  test('resepsiyon rezervasyon listesi okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
  });

  test('resepsiyon rezervasyon POST yapabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const stamp = Date.now();
    const res = await request.post('/api/reservations', {
      headers: authHeaders(token),
      data: {
        id: `e2e-rec-${stamp}`,
        refNo: `E2E-REC-${stamp}`,
        guestName: 'Reception Guest',
        checkIn: '2026-09-15',
        checkOut: '2026-09-17',
        roomType: 'DBL',
        adults: 2,
        children: 0,
        mealPlan: 'BB',
        rate: 4200,
        currency: 'TRY',
        agency: 'Direct',
        market: 'BAR',
        status: 'CONFIRMED',
        createdAt: '2026-06-23',
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('resepsiyon doluluk matrisi GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/reservations/availability?days=7', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; matrix?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.matrix)).toBe(true);
  });

  test('resepsiyon dashboard GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/dashboard', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; occupancy?: number };
    expect(j.ok).toBe(true);
    expect(typeof j.occupancy).toBe('number');
  });

  test('resepsiyon rack GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/rack', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { cells?: unknown[]; totalRooms?: number };
    expect(Array.isArray(j.cells)).toBe(true);
    expect(typeof j.totalRooms).toBe('number');
  });

  test('resepsiyon kasa kapanış raporu GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/cash?view=close-report', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; report?: unknown };
    expect(j.ok).toBe(true);
    expect(j.report).toBeTruthy();
  });

  test('resepsiyon folyo GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const listRes = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { reservations?: Array<{ id: string }> };
    const guest = list.reservations?.[0];
    expect(guest?.id).toBeTruthy();

    const res = await request.get(`/api/folio?reservationId=${guest!.id}`, { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { reservationId?: string; lines?: unknown[] };
    expect(j.reservationId).toBe(guest!.id);
    expect(Array.isArray(j.lines)).toBe(true);
  });

  test('resepsiyon folyo ödeme POST yapabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const listRes = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { reservations?: Array<{ id: string; status: string }> };
    const guest = list.reservations?.find((r) => r.status === 'CHECKED_IN') ?? list.reservations?.[0];
    expect(guest?.id).toBeTruthy();

    const res = await request.post('/api/folio', {
      headers: authHeaders(token),
      data: {
        reservationId: guest!.id,
        amount: 10,
        register: 'E2E-REC',
        description: 'E2E reception payment',
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { ok?: boolean };
    expect(body.ok).toBe(true);
  });

  test('resepsiyon check-in auth ile çalışır (403 değil)', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const listRes = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as {
      reservations?: Array<{ id: string; refNo: string; guestName: string; checkIn: string; checkOut: string; status: string }>;
    };
    const arrival = list.reservations?.find((r) => r.status === 'CONFIRMED') ?? list.reservations?.[0];
    expect(arrival?.id).toBeTruthy();

    const res = await request.post('/api/reception/check-in', {
      headers: authHeaders(token),
      data: {
        reservationId: arrival!.id,
        roomNo: '101',
        guestName: arrival!.guestName,
        checkIn: arrival!.checkIn,
        checkOut: arrival!.checkOut,
        reservationRef: arrival!.refNo,
        hotspot: false,
        tesa: false,
        pbx: false,
      },
    });
    expect(res.status()).not.toBe(403);
  });

  test('resepsiyon oda öneri okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const listRes = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { reservations?: Array<{ id: string }> };
    const arrival = list.reservations?.[0];
    expect(arrival?.id).toBeTruthy();

    const res = await request.get(
      `/api/reception/room-suggest?reservationId=${encodeURIComponent(arrival!.id)}`,
      { headers: authHeaders(token) },
    );
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; suggestions?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.suggestions)).toBe(true);
  });

  test('resepsiyon check-out auth ile çalışır (403 değil)', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const listRes = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as {
      reservations?: Array<{ id: string; guestName: string; roomNo?: string; status: string }>;
    };
    const guest = list.reservations?.find((r) => r.status === 'CHECKED_IN' && r.roomNo);
    expect(guest?.roomNo, 'Konaklayan misafir gerekli').toBeTruthy();

    const res = await request.post('/api/reception/checkout', {
      headers: authHeaders(token),
      data: {
        roomNo: guest!.roomNo,
        guestName: guest!.guestName,
        reservationId: guest!.id,
      },
    });
    expect(res.status()).not.toBe(403);
  });

  test('resepsiyon TESA encode POST auth ile çalışır (403 değil)', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/integrations/tesa/encode', {
      headers: authHeaders(token),
      data: {
        roomNo: '101',
        guestName: 'Reception TESA',
        checkIn: '2026-09-01',
        checkOut: '2026-09-03',
      },
    });
    expect(res.status()).not.toBe(403);
    const j = (await res.json()) as { ok?: boolean; message?: string };
    expect(j.ok === true || res.status() === 502).toBe(true);
  });

  test('resepsiyon gece ön kontrol GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/eod/pre-close', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('resepsiyon misafir talepleri GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/housekeeping/requests?status=active', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { requests?: unknown[] };
    expect(Array.isArray(j.requests)).toBe(true);
  });

  test('resepsiyon depozit listesi GET okuyabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/deposits', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; deposits?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.deposits)).toBe(true);
  });

  test('resepsiyon depozit POST yapabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/deposits', {
      headers: authHeaders(token),
      data: {
        guestName: 'E2E Reception Deposit',
        amount: 150,
        method: 'cash',
        notes: 'E2E smoke',
      },
    });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; deposit?: { id: string } };
    expect(j.ok).toBe(true);
    expect(j.deposit?.id).toBeTruthy();
  });

  test('resepsiyon banket etkinliği POST yapabilir', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const stamp = Date.now();
    const res = await request.post('/api/fnb/banket', {
      headers: authHeaders(token),
      data: {
        eventName: `E2E Banket ${stamp}`,
        hall: 'Ana Salon',
        contact: 'reception@hotelsapphire.com',
        pax: 40,
        status: 'option',
      },
    });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; event?: { id: string } };
    expect(j.ok).toBe(true);
    expect(j.event?.id).toBeTruthy();
  });

  test('muhasebe check-in POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/reception/check-in', {
      headers: authHeaders(token),
      data: {
        reservationId: 'acc-deny',
        roomNo: '101',
        guestName: 'Accounting',
        checkIn: '2026-09-01',
        checkOut: '2026-09-03',
        reservationRef: 'ACC-DENY',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('resepsiyon HK routing GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/hk/routes', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('resepsiyon HK oda listesi GET yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/housekeeping/rooms', { headers: authHeaders(token) });
    expect(res.status()).toBe(403);
  });

  test('resepsiyon HK routing POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/hk/routes', {
      headers: authHeaders(token),
      data: { code: 'E2E-REC', name: 'Reception Deny', floors: [2] },
    });
    expect(res.status()).toBe(403);
  });

  test('resepsiyon push abonelik POST yapamaz', async ({ request }) => {
    const token = await loginApiTokenWith(request, RECEPTION_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/push/subscribe', {
      headers: authHeaders(token),
      data: {
        subscription: {
          endpoint: 'https://e2e.example/push',
          keys: { p256dh: 'dGVzdA', auth: 'dGVzdA' },
        },
        role: 'hk',
      },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('Korumalı API — fo_manager rolü', () => {
  test('fo_manager HK routing okuyabilir', async ({ request }) => {
    const token = await loginApiToken(request);
    const res = await request.get('/api/hk/routes', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
  });

  test('fo_manager oda öneri okuyabilir', async ({ request }) => {
    const token = await loginApiToken(request);
    const listRes = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { reservations?: Array<{ id: string }> };
    const arrival = list.reservations?.[0];
    expect(arrival?.id).toBeTruthy();

    const res = await request.get(
      `/api/reception/room-suggest?reservationId=${encodeURIComponent(arrival!.id)}`,
      { headers: authHeaders(token) },
    );
    expect(res.ok()).toBeTruthy();
  });

  test('fo_manager program tarihi okuyabilir', async ({ request }) => {
    const token = await loginApiToken(request);
    const res = await request.get('/api/business-date', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; businessDate?: string };
    expect(j.ok).toBe(true);
    expect(j.businessDate).toBeTruthy();
  });

  test('fo_manager program tarihi POST yapamaz', async ({ request }) => {
    const token = await loginApiToken(request);
    const res = await request.post('/api/business-date', {
      headers: authHeaders(token),
      data: { businessDate: '2026-12-15', user: 'FO Manager Deny' },
    });
    expect(res.status()).toBe(403);
  });

  test('fo_manager gece ön kontrol okuyabilir', async ({ request }) => {
    const token = await loginApiToken(request);
    const res = await request.get('/api/eod/pre-close', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; checks?: unknown[] };
    expect(j.ok).toBe(true);
    expect(Array.isArray(j.checks)).toBe(true);
  });

  test('fo_manager check-in auth ile çalışır (403 değil)', async ({ request }) => {
    const token = await loginApiToken(request);
    const listRes = await request.get('/api/reservations', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as {
      reservations?: Array<{ id: string; refNo: string; guestName: string; checkIn: string; checkOut: string; status: string }>;
    };
    const arrival = list.reservations?.find((r) => r.status === 'CONFIRMED') ?? list.reservations?.[0];
    expect(arrival?.id).toBeTruthy();

    const res = await request.post('/api/reception/check-in', {
      headers: authHeaders(token),
      data: {
        reservationId: arrival!.id,
        roomNo: '102',
        guestName: arrival!.guestName,
        checkIn: arrival!.checkIn,
        checkOut: arrival!.checkOut,
        reservationRef: arrival!.refNo,
        hotspot: false,
        tesa: false,
        pbx: false,
      },
    });
    expect(res.status()).not.toBe(403);
  });

  test('fo_manager check-out auth ile çalışır (403 değil)', async ({ request }) => {
    const token = await loginApiToken(request);
    const res = await request.post('/api/reception/checkout', {
      headers: authHeaders(token),
      data: { roomNo: '999', guestName: 'FO Manager Auth Probe' },
    });
    expect(res.status()).not.toBe(403);
  });

  test('fo_manager market zorunluluğu POST yapamaz', async ({ request }) => {
    const token = await loginApiToken(request);
    const res = await request.post('/api/market-required', {
      headers: authHeaders(token),
      data: { required: true },
    });
    expect(res.status()).toBe(403);
  });

  test('fo_manager kullanıcı POST yapamaz', async ({ request }) => {
    const token = await loginApiToken(request);
    const listRes = await request.get('/api/users', { headers: authHeaders(token) });
    expect(listRes.ok()).toBeTruthy();
    const list = (await listRes.json()) as { users?: Array<{ id: string; department: string }> };
    const target = list.users?.[0];
    expect(target?.id).toBeTruthy();

    const postRes = await request.post('/api/users', {
      headers: authHeaders(token),
      data: { id: target!.id, department: 'E2E Deneme' },
    });
    expect(postRes.status()).toBe(403);
  });
});
