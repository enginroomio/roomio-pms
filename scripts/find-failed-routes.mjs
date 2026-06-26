#!/usr/bin/env node
/**
 * Başarısız rotaları bul — warmup + test (dev sunucu gerekir).
 * Kullanım: ROOMIO_URL=http://127.0.0.1:3100 node scripts/find-failed-routes.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const TIMEOUT_MS = Number(process.env.ROUTE_TEST_TIMEOUT_MS ?? 20_000);

// test-routes.mjs ile aynı liste (+ egm)
const ROUTES = [
  '/',
  '/api/health',
  '/rooms',
  '/rooms?tab=blocking',
  '/reservations',
  '/reservations/new',
  '/reservations/calendar',
  '/reservations/calendar/mockups',
  '/reservations/calendar/mockups/filtre-sihirbazi',
  '/reception',
  '/reception/arrivals',
  '/reception/departures',
  '/reception/inhouse',
  '/reception/vacant',
  '/reception/guest-requests',
  '/guest-relations/info-rack',
  '/guest-relations/complaints',
  '/guest-relations/traces',
  '/guest-relations/vip',
  '/guest-relations/reviews',
  '/fnb',
  '/reception?tab=kasa-close',
  '/reception/departures?tab=fx',
  '/reception/vacant?tab=deposit',
  '/reports',
  '/reports?tab=eod&action=close',
  '/reports?category=rezervasyon',
  '/housekeeping',
  '/housekeeping/mobile',
  '/guest-relations',
  '/accounting',
  '/reservations?tab=availability',
  '/reception?tab=kimlik',
  '/api/folio?reservationId=1',
  '/api/cash',
  '/api/reservations',
  '/api/eod/close',
  '/api/reports/export?format=csv',
  '/api/identity/notifications',
  '/api/auth/session',
  '/api/integrations/status',
  '/api/monitoring/status',
  '/api/push/vapid-public-key',
  '/settings/compliance/5651',
  '/settings/integrations/tesa',
  '/settings/integrations/pbx',
  '/settings/integrations/egm',
  '/wifi',
  '/book',
  '/guest',
  '/menu',
  '/kiosk',
  '/spa',
  '/viofun',
  '/marina',
  '/app',
  '/ask',
  '/restaurant',
  '/carbon',
  '/staff',
  '/hr',
  '/settings/integrations/channel-manager',
  '/settings/integrations/booking-engine',
  '/settings/integrations/dynamic-pricing',
  '/settings/integrations/guest-portal',
  '/settings/integrations/efatura',
  '/settings/integrations/whatsapp',
  '/settings/integrations/kiosk',
  '/settings/integrations/loyalty',
  '/settings/integrations/spa',
  '/settings/integrations/digital-menu',
  '/settings/integrations/reputation',
  '/settings/integrations/banking',
  '/settings/integrations/call-center',
  '/settings/integrations/tour-operator',
  '/settings/integrations/viofun',
  '/settings/integrations/guest-app',
  '/settings/integrations/ai-assistant',
  '/settings/integrations/marina',
  '/settings/integrations/hr-portal',
  '/settings/integrations/supplier-portal',
  '/settings/integrations/inventory',
  '/settings/integrations/restaurant-booking',
  '/settings/integrations/virtual-pos',
  '/settings/integrations/lite-mobile',
  '/settings/integrations/quality',
  '/settings/integrations/carbon',
  '/settings/integrations/fair-events',
  '/settings/integrations/google-backup',
  '/settings/integrations/fixed-assets',
  '/settings/integrations/procurement',
  '/settings/integrations/website-builder',
  '/settings/integrations/gym',
  '/settings/integrations/e-dispatch',
  '/settings/integrations/id-reader',
  '/fair',
  '/gym',
  '/hotel',
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
  '/api/kiosk/info',
  '/api/spa/catalog',
  '/api/booking/availability?checkIn=2026-06-25&checkOut=2026-06-27',
  '/tools/rollout',
  '/tools/theme',
  '/tools/pro',
  '/settings?tab=theme',
  '/settings?section=rate-plans',
  '/settings?section=agencies',
  '/reports?category=forecast',
  '/reports?category=gunluk',
  '/reports?category=gelir',
  '/reports?category=crm',
  '/tools/sistem',
  '/tools/sistem?tab=sql',
  '/housekeeping?hub=kat',
  '/guest-relations?hub=misafir',
  '/settings?hub=sistem',
  '/settings?hub=ayarlar',
  '/settings?tool=calculator',
  '/accounting?hub=arkaburo',
  '/accounting?tab=proforma',
  '/accounting?tab=cari',
  '/reports?tab=design',
  '/reports?tab=forms',
  '/reports?tab=consolidated',
  '/reports?tab=management',
  '/reception/inhouse?action=share',
  '/reception?tab=advance',
  '/fnb?mode=card-prep',
  '/fnb?tab=calendar',
  '/groups',
  '/revenue',
  '/loyalty',
  '/tools/deploy',
  '/setup',
  '/settings?tab=password',
  '/settings/integrations/tesa?tab=modules',
  '/reception/guest-profile',
  '/reception/queue',
  '/reception/vacant?tab=deposit-collect',
];

async function fetchRoute(path) {
  const url = `${BASE}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    const ok = res.status >= 200 && res.status < 500 && res.status !== 404;
    return { path, status: res.status, ok };
  } catch (e) {
    clearTimeout(timer);
    return { path, status: 0, ok: false, error: e instanceof Error ? e.message : 'fail' };
  }
}

async function main() {
  console.log(`Warmup → ${BASE} (${ROUTES.length} rota)\n`);
  for (const path of ROUTES) {
    await fetchRoute(path);
    await new Promise((r) => setTimeout(r, 40));
  }
  console.log('Warmup bitti — test:\n');
  const failed = [];
  for (const path of ROUTES) {
    const r = await fetchRoute(path);
    const mark = r.ok ? '✓' : '✗';
    const extra = r.error ? ` (${r.error})` : '';
    console.log(`${mark} ${r.status} ${r.path}${extra}`);
    if (!r.ok) failed.push(r);
    await new Promise((r) => setTimeout(r, 30));
  }
  console.log(`\n${ROUTES.length - failed.length}/${ROUTES.length} OK`);
  if (failed.length) {
    console.log('\nBaşarısız rotalar:');
    for (const f of failed) console.log(`  ${f.status} ${f.path}${f.error ? ` — ${f.error}` : ''}`);
    process.exit(1);
  }
}

main();
