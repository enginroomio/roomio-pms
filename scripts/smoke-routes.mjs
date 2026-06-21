#!/usr/bin/env node
/** Roomio — temel rota + API smoke testi */
const BASE = process.env.ROOMIO_URL ?? 'http://127.0.0.1:3100';

const routes = [
  '/',
  '/reservations',
  '/reservations/new',
  '/reservations/1',
  '/reception',
  '/reception/inhouse',
  '/reception/arrivals',
  '/reception/departures',
  '/reception/vacant',
  '/rooms',
  '/reception/check-in/3',
  '/reception/guest/1',
  '/housekeeping',
  '/housekeeping/rooms',
  '/housekeeping/tasks',
  '/guest-relations',
  '/guest-relations/reviews',
  '/guest-relations/reviews/new',
  '/guest-relations/daily-activities',
  '/guest-relations/vip',
  '/guest-relations/traces',
  '/guest-relations/reclamations',
  '/settings',
  '/settings/privacy',
  '/settings/licensing',
  '/settings/integrations',
  '/settings/integrations/tesa',
  '/settings/compliance/5651',
  '/tools/rollout',
  '/tools/license',
  '/reports',
  '/api/health',
  '/api/integrations/tesa/config',
  '/api/integrations/tesa/encode',
  '/api/compliance/5651/config',
  '/api/compliance/5651/stats',
  '/api/compliance/5651/devices',
  '/api/compliance/5651/automation',
  '/api/reception/check-in',
  '/api/reception/checkout',
  '/wifi',
  '/api/compliance/5651/radius/accounting',
  '/api/sync/pull?since=1970-01-01T00:00:00.000Z&deviceId=test',
];

async function main() {
  let failed = 0;
  for (const path of routes) {
    const url = `${BASE}${path}`;
    try {
      const res = await fetch(url, { redirect: 'follow' });
      const ok = res.ok;
      console.log(`${ok ? '✓' : '✗'} ${path} → ${res.status}`);
      if (!ok) failed++;
    } catch (e) {
      console.log(`✗ ${path} → ${e instanceof Error ? e.message : e}`);
      failed++;
    }
  }
  if (failed) {
    console.error(`\n${failed} rota başarısız. npm run dev veya npm run start`);
    process.exit(1);
  }
  console.log(`\n${routes.length}/${routes.length} rota OK`);
}

main();
