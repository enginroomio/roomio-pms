import { test as setup } from '@playwright/test';

setup.setTimeout(120_000);

/** Next.js dev ilk derleme 404'lerini önlemek için kritik rotaları ısıtır. */
const WARM_PATHS = [
  '/api/health',
  '/api/auth/session',
  '/api/auth/config',
  '/api/business-date',
  '/api/user-params',
  '/api/config-params',
  '/api/identity/notifications',
  '/api/egm/identity',
  '/api/reservations/availability?days=7',
  '/api/users',
  '/api/sync/pull?deviceId=e2e-warm&since=1970-01-01T00:00:00.000Z',
  '/api/guest-complaints',
  '/api/dashboard',
  '/api/properties',
  '/api/reports/consolidated',
  '/api/rack',
  '/api/reservations',
  '/api/folio?reservationId=1',
  '/api/cash',
  '/api/integrations/tesa/encode',
  '/api/booking/availability?checkIn=2026-06-25&checkOut=2026-06-27',
  '/api/integrations/hr-portal/info',
  '/api/integrations/inventory/summary',
  '/api/integrations/restaurant-booking/catalog',
  '/api/integrations/carbon/info',
  '/api/integrations/lite-mobile/info',
  '/api/integrations/fair-events/catalog',
  '/api/integrations/gym/catalog',
  '/api/integrations/website-builder/preview',
  '/api/integrations/viofun/catalog',
  '/api/integrations/marina/catalog',
  '/api/integrations/guest-app/info',
  '/api/integrations/digital-menu/menu',
  '/api/loyalty/summary',
  '/api/loyalty/accounts',
  '/api/reservations/groups?view=summary',
  '/groups',
  '/tools/deploy',
  '/carbon',
  '/staff',
  '/hr',
  '/fair',
  '/gym',
  '/hotel',
  '/settings/integrations/egm',
  '/settings/integrations/carbon',
  '/tools/rollout',
  '/tools/theme',
  '/tools/pro',
];

setup('warm API routes', async ({ request }) => {
  for (const path of WARM_PATHS) {
    try {
      await request.get(path, { timeout: 90_000 });
    } catch {
      // POST-only rotalar veya auth gerektiren uçlar GET'te 401/405 olabilir; derleme yeterli.
    }
  }
  // POST rotalarını da derle
  for (const path of [
    '/api/egm/identity',
    '/api/integrations/tesa/encode',
    '/api/business-date',
    '/api/integrations/carbon/quote',
    '/api/integrations/restaurant-booking/book',
    '/api/integrations/fair-events/register',
    '/api/integrations/gym/book',
    '/api/loyalty/accounts',
    '/api/loyalty/earn',
    '/api/loyalty/redeem',
  ]) {
    try {
      await request.post(path, { data: {}, timeout: 90_000 });
    } catch {
      // ignore
    }
  }

  for (let i = 0; i < 45; i++) {
    const h = await request.get('/api/health', { timeout: 30_000 });
    if (h.ok()) {
      const j = (await h.json()) as { ok?: boolean };
      if (j.ok) break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
});
