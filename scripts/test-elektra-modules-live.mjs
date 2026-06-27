#!/usr/bin/env node
/**
 * Elektra modülleri canlı gateway testleri.
 * Gereksinim: ROOMIO_INTEGRATION_LIVE=1 + en az bir *_GATEWAY_URL
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

if (process.env.ROOMIO_INTEGRATION_LIVE !== '1' && process.env.ROOMIO_INTEGRATION_LIVE !== 'true') {
  console.error('ROOMIO_INTEGRATION_LIVE=1 gerekli.');
  process.exit(2);
}

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const ADMIN_EMAIL = process.env.ROOMIO_ADMIN_EMAIL ?? 'admin@roomio.local';
const ADMIN_PASSWORD = process.env.ROOMIO_CHECKLIST_PASSWORD ?? 'roomio123';

const GATEWAYS = [
  ['ROOMIO_CHANNEL_GATEWAY_URL', 'Kanal yöneticisi', 'channel'],
  ['ROOMIO_BOOKING_GATEWAY_URL', 'Online rezervasyon', 'booking'],
  ['ROOMIO_EFATURA_GATEWAY_URL', 'e-Fatura', 'efatura'],
  ['ROOMIO_GUEST_PORTAL_GATEWAY_URL', 'Misafir portalı', 'guestPortal'],
  ['ROOMIO_HR_PORTAL_GATEWAY_URL', 'IK portalı', 'hrPortal'],
  ['ROOMIO_VIRTUAL_POS_GATEWAY_URL', 'Sanal POS', 'virtualPos'],
];

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

async function json(method, path, body, token) {
  const headers = body ? { 'Content-Type': 'application/json' } : {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const configured = GATEWAYS.filter(([key]) => process.env[key]?.trim());
if (!configured.length) {
  console.error('En az bir gateway URL gerekli:');
  for (const [key] of GATEWAYS) console.error(`  ${key}=https://...`);
  process.exit(2);
}

let passed = 0;
console.log(`Elektra modules LIVE → ${BASE}\n`);

const login = await json('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
const token = login.data?.token;
if (!token) {
  console.error('Admin login başarısız');
  process.exit(1);
}

const probe = await json('GET', '/api/integrations/live-probe', null, token);
if (!probe.ok) {
  console.log('✗ live-probe API');
  process.exit(1);
}
console.log('✓ live-probe API');

for (const [key, label, probeKey] of configured) {
  const hit = probe.data.probes?.[probeKey];
  if (hit?.ok && !hit.simulated) {
    passed += 1;
    console.log(`✓ ${label} — ${hit.message}`);
    continue;
  }
  try {
    const res = await fetch(process.env[key], { signal: AbortSignal.timeout(15_000) });
    if (res.ok) {
      passed += 1;
      console.log(`✓ ${label} (${key}) HTTP ${res.status}`);
    } else {
      console.log(`✗ ${label} (${key}) HTTP ${res.status}`);
    }
  } catch (e) {
    console.log(`✗ ${label} — ${e instanceof Error ? e.message : 'error'}`);
  }
}

const checkIn = new Date();
checkIn.setDate(checkIn.getDate() + 14);
const checkOut = new Date(checkIn);
checkOut.setDate(checkOut.getDate() + 2);
const reserve = await json('POST', '/api/booking/reserve', {
  guestName: 'Live Gateway Test',
  email: `live-${Date.now()}@roomio.test`,
  checkIn: checkIn.toISOString().slice(0, 10),
  checkOut: checkOut.toISOString().slice(0, 10),
  roomType: 'DBL',
  adults: 2,
});
if (reserve.ok && reserve.data.ok) {
  if (process.env.ROOMIO_BOOKING_GATEWAY_URL?.trim() && reserve.data.simulated !== true) {
    passed += 1;
    console.log('✓ booking reserve (canlı gateway)');
  } else {
    console.log('· booking reserve (simülasyon — gateway yok veya erişilemedi)');
  }
} else {
  console.log('✗ booking reserve');
}

console.log(`\n${passed} canlı kontrol geçti`);
process.exit(passed >= configured.length ? 0 : 1);
