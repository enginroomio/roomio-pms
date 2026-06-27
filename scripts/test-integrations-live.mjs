#!/usr/bin/env node
/**
 * Canlı entegrasyon testleri — simülasyon kabul edilmez.
 * Gereksinim: ROOMIO_INTEGRATION_LIVE=1 + erişilebilir MikroTik/UniFi/TESA
 *
 * Kullanım:
 *   ROOMIO_INTEGRATION_LIVE=1 ROOMIO_URL=http://127.0.0.1:3100 node scripts/test-integrations-live.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

if (process.env.ROOMIO_INTEGRATION_LIVE !== '1' && process.env.ROOMIO_INTEGRATION_LIVE !== 'true') {
  console.error('ROOMIO_INTEGRATION_LIVE=1 gerekli (canlı cihaz modu).');
  process.exit(2);
}

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

function rejectSimulated(label, payload) {
  if (payload?.simulated || payload?.connection?.simulated) {
    return `${label}: simülasyon yanıtı — cihaz erişilemedi`;
  }
  return null;
}

const tests = [
  {
    name: 'TESA canlı bağlantı',
    run: async () => {
      const r = await json('GET', '/api/integrations/tesa/encode');
      const sim = rejectSimulated('TESA', r.data.connection ?? r.data);
      if (sim) throw new Error(sim);
      return r.ok && r.data.connection?.ok === true;
    },
  },
  {
    name: 'MikroTik canlı test',
    run: async () => {
      const r = await json('POST', '/api/compliance/5651/devices', { action: 'test', device: 'mikrotik' });
      const hit = r.data.results?.find((x) => x.device === 'mikrotik');
      const sim = rejectSimulated('MikroTik', hit);
      if (sim) throw new Error(sim);
      return r.ok && hit?.ok === true;
    },
  },
  {
    name: 'UniFi canlı test',
    run: async () => {
      const r = await json('POST', '/api/compliance/5651/devices', { action: 'test', device: 'unifi' });
      const hit = r.data.results?.find((x) => x.device === 'unifi');
      const sim = rejectSimulated('UniFi', hit);
      if (sim) throw new Error(sim);
      return r.ok && hit?.ok === true;
    },
  },
  {
    name: 'UCM6301 PBX canlı test',
    run: async () => {
      const r = await json('GET', '/api/integrations/pbx/test');
      const sim = rejectSimulated('PBX', r.data.connection ?? r.data);
      if (sim) throw new Error(sim);
      return r.ok && r.data.connection?.ok === true;
    },
  },
];

let passed = 0;
console.log(`Live integration test → ${BASE}\n`);

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
