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

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const TIMEOUT_MS = 8000;

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
  '/tools/rollout',
];

async function check(path) {
  const url = `${BASE}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    return { path, status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch (e) {
    clearTimeout(timer);
    return { path, status: 0, ok: false, error: e instanceof Error ? e.message : 'fail' };
  }
}

async function main() {
  console.log(`Roomio smoke test → ${BASE}\n`);
  const results = await Promise.all(ROUTES.map(check));
  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? '✓' : '✗';
    const extra = r.error ? ` (${r.error})` : '';
    console.log(`${mark} ${r.status} ${r.path}${extra}`);
    if (!r.ok) failed++;
  }
  console.log(`\n${results.length - failed}/${results.length} OK`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
