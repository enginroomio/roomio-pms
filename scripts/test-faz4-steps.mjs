#!/usr/bin/env node
/**
 * Faz 3/4 adım adım smoke testi — her blok bitince sonuç yazdırır.
 * Kullanım: npm run test:faz4
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

async function check(label, path, expectStatus = 200) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'follow' });
  const ok = res.status === expectStatus;
  console.log(`${ok ? '✓' : '✗'} ${label} — ${path} [${res.status}]`);
  return ok;
}

function runStep(name, cmd, args) {
  console.log(`\n── ${name} ──`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, env: { ...process.env, ROOMIO_URL: BASE } });
  return r.status === 0;
}

console.log(`Faz 3/4 adım testi → ${BASE}\n`);

console.log('── Adım 1: Kritik rotalar (404 avcılığı) ──');
const routeChecks = [
  ['HK mobil', '/housekeeping/mobile'],
  ['Push VAPID', '/api/push/vapid-public-key'],
  ['Push subscribe API', '/api/push/subscribe'],
  ['Derin health', '/api/health'],
  ['Rollout', '/tools/rollout'],
  ['F1 grafik', '/reservations/calendar'],
  ['Gün sonu', '/reports?tab=eod&action=fetch'],
];
let step1 = true;
for (const [label, path, status = 200] of routeChecks) {
  const ok = await check(label, path, status);
  if (!ok) step1 = false;
}
console.log(step1 ? '\n✓ Adım 1 geçti' : '\n✗ Adım 1 başarısız — npm run fix && http://127.0.0.1:3100 kullanın');

const step2 = runStep('Adım 2: Tüm rotalar', 'npm', ['run', 'test:routes']);
const step3 = runStep('Adım 3: Entegrasyonlar', 'npm', ['run', 'test:integrations']);
const step4 = runStep('Adım 4: Rollout (45 adım)', 'npm', ['run', 'test:rollout']);

const allOk = step1 && step2 && step3 && step4;
console.log(allOk ? '\n✅ Tüm adımlar geçti' : '\n❌ Bazı adımlar başarısız');
process.exit(allOk ? 0 : 1);
