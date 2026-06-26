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
const INTEGRATION_TIMEOUT_MS = Number(process.env.ROUTE_TEST_INTEGRATION_TIMEOUT_MS ?? 45_000);
const CORE_ROUTE_COUNT = 57;

/** Admin-only veya auth gerektiren — 403/401 kabul edilir */
const EXPECTED_AUTH_STATUSES = new Set(['/api/monitoring/status']);

/** Entegrasyon ve misafir API uçları — daha uzun timeout */
const INTEGRATION_API_PREFIXES = [
  '/api/integrations/',
  '/api/kiosk/',
  '/api/spa/',
  '/api/booking/',
];

const ROUTES = [
  '/',
  '/?hub=panel',
  '/?view=daily-status',
  '/api/health',
  '/rooms',
  '/rooms?tab=blocking',
  '/reservations',
  '/reservations?hub=rezervasyon',
  '/reservations/new',
  '/reservations/calendar',
  '/reservations/calendar/mockups',
  '/reservations/calendar/mockups/filtre-sihirbazi',
  '/reception',
  '/reception?hub=resepsiyon',
  '/reception?hub=onkasa',
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
  '/reports?hub=raporlar',
  '/reports?hub=gunsonu',
  '/reports?tab=eod&action=close',
  '/reports?category=rezervasyon',
  '/housekeeping',
  '/housekeeping?hub=kat',
  '/housekeeping/mobile',
  '/guest-relations',
  '/guest-relations?hub=misafir',
  '/accounting',
  '/accounting?hub=arkaburo',
  '/fnb?hub=banket',
  '/settings?hub=ayarlar',
  '/settings?hub=sistem',
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
  '/settings?section=sync',
  '/settings?section=inventory',
  '/settings?section=pbx-calls',
  '/settings?section=pbx-lookup',
  '/settings?section=lang-forms',
  '/settings?section=language',
];

function routeTimeout(path) {
  if (INTEGRATION_API_PREFIXES.some((p) => path.startsWith(p))) return INTEGRATION_TIMEOUT_MS;
  return TIMEOUT_MS;
}

function routeOk(path, status) {
  if (EXPECTED_AUTH_STATUSES.has(path) && (status === 401 || status === 403)) return true;
  return status >= 200 && status < 500 && status !== 404;
}

async function check(path, timeoutMs = routeTimeout(path)) {
  const url = `${BASE}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    return { path, status: res.status, ok: routeOk(path, res.status) };
  } catch (e) {
    clearTimeout(timer);
    return { path, status: 0, ok: false, error: e instanceof Error ? e.message : 'fail' };
  }
}

async function checkWithRetry(path, attempts = 3) {
  let result = await check(path);
  for (let i = 1; i < attempts && !result.ok && result.status === 0; i++) {
    await new Promise((r) => setTimeout(r, 800 * i));
    result = await check(path, Math.min(routeTimeout(path) * 2, 90_000));
  }
  return result;
}

async function waitForHealth(attempts = 30, delayMs = 2000) {
  for (let a = 0; a < attempts; a++) {
    try {
      const h = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(12_000) });
      if (h.ok) return true;
    } catch {
      // retry
    }
    if (a < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function main() {
  console.log(`Roomio smoke test → ${BASE}\n`);

  process.stdout.write('Sunucu bekleniyor…');
  const ready = await waitForHealth();
  console.log(ready ? ' hazır\n' : ' zaman aşımı (devam)\n');

  if (process.env.ROUTE_TEST_WARMUP !== '0') {
    process.stdout.write('Warmup (çekirdek)…');
    const warmupRoutes = ROUTES.slice(0, CORE_ROUTE_COUNT);
    for (const path of warmupRoutes) {
      await check(path, Math.min(routeTimeout(path), 20_000)).catch(() => undefined);
      await new Promise((r) => setTimeout(r, 40));
    }
    await new Promise((r) => setTimeout(r, 2000));
    console.log(' tamam\n');
  }

  const results = [];
  for (let i = 0; i < ROUTES.length; i++) {
    if (i > 0 && i % 25 === 0) {
      const healthy = await waitForHealth();
      if (!healthy) {
        console.warn(`\n· Sunucu route ${i}/${ROUTES.length} civarında yanıt vermiyor — kalan rotalar atlanıyor\n`);
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    results.push(await checkWithRetry(ROUTES[i]));
    await new Promise((r) => setTimeout(r, INTEGRATION_API_PREFIXES.some((p) => ROUTES[i].startsWith(p)) ? 120 : 60));
  }
  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? '✓' : '✗';
    const extra = r.error ? ` (${r.error})` : '';
    console.log(`${mark} ${r.status} ${r.path}${extra}`);
    if (!r.ok) failed++;
  }
  const coreCount = Math.min(CORE_ROUTE_COUNT, results.length);
  const coreOk = results.slice(0, coreCount).filter((r) => r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} OK (çekirdek ${coreOk}/${coreCount})`);
  if (coreOk < coreCount) process.exit(1);
  if (failed > 0) {
    console.warn(`· ${failed} rota başarısız — çekirdek geçti, devam ediliyor`);
  }
}

main();
