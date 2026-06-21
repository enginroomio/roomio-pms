#!/usr/bin/env node
/**
 * MikroTik / UniFi / TESA entegrasyon smoke testleri (simülasyon modu).
 * Kullanım: ROOMIO_URL=http://127.0.0.1:3156 node scripts/test-integrations.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

async function json(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const tests = [
  {
    name: 'health deep check',
    run: async () => {
      const r = await json('GET', '/api/health');
      const legacy = r.ok && r.data.ok && !r.data.checks;
      const deep = r.ok && r.data.ok && r.data.checks?.database?.ok;
      return legacy || deep;
    },
  },
  {
    name: 'TESA connection test',
    run: async () => {
      const r = await json('GET', '/api/integrations/tesa/encode');
      return r.ok && r.data.connection?.ok === true;
    },
  },
  {
    name: 'UCM6301 PBX connection test',
    run: async () => {
      const r = await json('GET', '/api/integrations/pbx/test');
      return r.ok && r.data.connection?.ok === true;
    },
  },
  {
    name: '5651 device test (all)',
    run: async () => {
      const r = await json('POST', '/api/compliance/5651/devices', { action: 'test' });
      return r.ok && Array.isArray(r.data.results) && r.data.results.length > 0;
    },
  },
  {
    name: '5651 bridge dry-run (mikrotik)',
    run: async () => {
      const r = await json('POST', '/api/compliance/5651/bridge/test', {
        provider: 'mikrotik',
        sample: 'mikrotik_login',
        dryRun: true,
      });
      return r.ok && r.data.parsed;
    },
  },
  {
    name: '5651 bridge dry-run (unifi)',
    run: async () => {
      const r = await json('POST', '/api/compliance/5651/bridge/test', {
        provider: 'unifi',
        sample: 'unifi_connect',
        dryRun: true,
      });
      return r.ok && r.data.parsed;
    },
  },
  {
    name: 'reception check-in auto PBX',
    run: async () => {
      const r = await json('POST', '/api/reception/check-in', {
        reservationId: '3',
        roomNo: '201',
        guestName: 'PBX Test',
        checkIn: '2026-06-21',
        checkOut: '2026-06-23',
        reservationRef: 'REF-3',
      });
      return (
        r.ok
        && r.data.ok === true
        && r.data.pbx?.ok === true
        && Array.isArray(r.data.messages)
        && r.data.messages.some((m) => m.startsWith('Santral:'))
      );
    },
  },
  {
    name: 'reception checkout auto PBX',
    run: async () => {
      const r = await json('POST', '/api/reception/checkout', {
        roomNo: '201',
        guestName: 'PBX Test',
        reservationId: '3',
      });
      return (
        r.ok
        && r.data.ok === true
        && r.data.pbx?.ok === true
        && Array.isArray(r.data.messages)
        && r.data.messages.some((m) => m.startsWith('Santral:'))
      );
    },
  },
];

let passed = 0;
console.log(`Integration smoke → ${BASE}\n`);

for (const test of tests) {
  try {
    const ok = await test.run();
    if (ok) {
      passed += 1;
      console.log(`✓ ${test.name}`);
    } else {
      console.log(`✗ ${test.name}`);
    }
  } catch (e) {
    console.log(`✗ ${test.name} — ${e instanceof Error ? e.message : 'error'}`);
  }
}

console.log(`\n${passed}/${tests.length} geçti`);
process.exit(passed === tests.length ? 0 : 1);
