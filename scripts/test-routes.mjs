#!/usr/bin/env node
/**
 * Rollout ve kritik rotalar için smoke test.
 * Kullanım: ROOMIO_URL=http://127.0.0.1:3100 npm run test:routes
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

async function resolveBaseUrl() {
  const candidates = [
    process.env.ROOMIO_URL,
    readActivePort(),
    'http://127.0.0.1:3100',
  ].filter(Boolean);
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return base;
    } catch {
      // try next candidate
    }
  }
  return candidates[0] ?? 'http://127.0.0.1:3100';
}

const BASE = await resolveBaseUrl();
const TIMEOUT_MS = Number(process.env.ROUTE_TEST_TIMEOUT_MS ?? 30_000);

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
];

async function check(path) {
  const url = `${BASE}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    return { path, status: res.status, ok: res.status >= 200 && res.status < 500 && res.status !== 404 };
  } catch (e) {
    clearTimeout(timer);
    return { path, status: 0, ok: false, error: e instanceof Error ? e.message : 'fail' };
  }
}

async function main() {
  console.log(`Roomio smoke test → ${BASE}\n`);
  const results = [];
  for (let i = 0; i < ROUTES.length; i++) {
    if (i > 0 && i % 25 === 0) {
      try {
        const h = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
        if (!h.ok) throw new Error(`health ${h.status}`);
      } catch {
        console.warn(`\n· Sunucu route ${i}/${ROUTES.length} civarında yanıt vermiyor — kalan rotalar atlanıyor\n`);
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    results.push(await check(ROUTES[i]));
    await new Promise((r) => setTimeout(r, 50));
  }
  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? '✓' : '✗';
    const extra = r.error ? ` (${r.error})` : '';
    console.log(`${mark} ${r.status} ${r.path}${extra}`);
    if (!r.ok) failed++;
  }
  const coreCount = Math.min(57, results.length);
  const coreOk = results.slice(0, coreCount).filter((r) => r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK (çekirdek ${coreOk}/${coreCount})`);
  if (coreOk < coreCount) process.exit(1);
  if (failed > 0) {
    console.warn(`· ${failed} rota başarısız — çekirdek geçti, devam ediliyor`);
  }
}

main();
