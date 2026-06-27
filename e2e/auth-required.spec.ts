import { test, expect } from '@playwright/test';
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  VIEWER_EMAIL,
  authHeaders,
  loginApiToken,
  loginApiTokenWith,
} from './helpers/api-auth';

/**
 * ROOMIO_AUTH_REQUIRED=1 — oturum zorunlu production modu.
 * verify:auth / pipeline aşama 4.
 */
test.describe('Auth-required — tokensiz erişim', () => {
  test('dashboard API tokensiz 401', async ({ request }) => {
    expect((await request.get('/api/dashboard')).status()).toBe(401);
  });

  test('folio API tokensiz 401', async ({ request }) => {
    expect((await request.get('/api/folio?reservationId=1')).status()).toBe(401);
  });

  test('rack API tokensiz 401', async ({ request }) => {
    expect((await request.get('/api/rack')).status()).toBe(401);
  });

  test('auth/session tokensiz 401', async ({ request }) => {
    expect((await request.get('/api/auth/session')).status()).toBe(401);
  });
});

test.describe('Auth-required — JWT ile erişim', () => {
  test('login ve dashboard 200', async ({ request }) => {
    const token = await loginApiToken(request);
    const dash = await request.get('/api/dashboard', { headers: authHeaders(token) });
    expect(dash.ok()).toBeTruthy();
    const session = await request.get('/api/auth/session', { headers: authHeaders(token) });
    expect(session.ok()).toBeTruthy();
    const j = (await session.json()) as { authenticated?: boolean };
    expect(j.authenticated).toBe(true);
  });

  test('viewer yazma 403', async ({ request }) => {
    const token = await loginApiTokenWith(request, VIEWER_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/folio', {
      headers: authHeaders(token),
      data: { reservationId: '1', type: 'payment', amount: 1, description: 'auth-required test' },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('Auth-required — herkese açık uçlar', () => {
  test('health ve login tokensiz erişilebilir', async ({ request }) => {
    expect((await request.get('/api/health')).ok()).toBeTruthy();
    const login = await request.post('/api/auth/login', {
      data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    });
    expect(login.ok()).toBeTruthy();
    const j = (await login.json()) as { token?: string };
    expect(j.token).toBeTruthy();
  });

  test('booking ve guest portal tokensiz erişilebilir', async ({ request }) => {
    const checkIn = '2026-06-25';
    const checkOut = '2026-06-27';
    const avail = await request.get(`/api/booking/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
    expect(avail.ok()).toBeTruthy();
    const session = await request.post('/api/guest-portal/session', {
      data: { refNo: 'INVALID', email: 'nobody@test.com' },
    });
    expect([404, 400]).toContain(session.status());
    expect((await request.get('/api/integrations/digital-menu/menu')).ok()).toBeTruthy();
    expect((await request.get('/api/kiosk/info')).ok()).toBeTruthy();
    expect((await request.get('/api/spa/catalog')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/viofun/catalog')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/marina/catalog')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/guest-app/info')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/fair-events/catalog')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/gym/catalog')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/website-builder/preview')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/hr-portal/info')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/inventory/summary')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/restaurant-booking/catalog')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/carbon/info')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/lite-mobile/info')).ok()).toBeTruthy();
    expect((await request.post('/api/integrations/carbon/quote', { data: { nights: 1 } })).ok()).toBeTruthy();
  });
});
