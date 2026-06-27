#!/usr/bin/env node
/**
 * Faz 9 adım adım test.
 * Kullanım: npm run test:faz9
 *         npm run test:faz9 -- --step 9.1
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseEnvFile } from './parse-env-file.mjs';

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const onlyStep = process.argv.find((a) => a.startsWith('--step'))?.split('=')[1]
  ?? (process.argv.includes('--step') ? process.argv[process.argv.indexOf('--step') + 1] : null);

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

function shouldRun(step) {
  if (!onlyStep) return true;
  return onlyStep === step || onlyStep === step.replace('Adım ', '');
}

function runStep(name, cmd, args, extraEnv = {}) {
  console.log(`\n── ${name} ──`);
  const r = spawnSync(cmd, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ROOMIO_URL: BASE, ...extraEnv },
  });
  return r.status === 0;
}

console.log(`Faz 9 adım testi → ${BASE}\n`);
let ok = true;

if (shouldRun('9.1')) {
  console.log('══ Adım 9.1 VAPID ana sunucuda ══');
  const env = parseEnvFile('.env');
  for (const key of ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']) {
    const hit = Boolean(env[key]?.length > 10);
    console.log(`${hit ? '✓' : '✗'} .env → ${key}`);
    if (!hit) ok = false;
  }

  const vapid = await fetch(`${BASE}/api/push/vapid-public-key`).then((r) => r.json()).catch(() => ({}));
  const vapidOk = vapid.ok === true && Boolean(vapid.publicKey);
  console.log(`${vapidOk ? '✓' : '✗'} VAPID API — ana sunucuda yapılandırılmış`);
  if (!vapidOk) {
    console.log('ℹ VAPID yoksa: .env.vapid.generated → .env + npm run fix');
    ok = false;
  }

  const sendRes = await fetch(`${BASE}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Faz 9', body: 'Ana sunucu push' }),
  });
  const sendOk = sendRes.status === 200;
  console.log(`${sendOk ? '✓' : '✗'} Push send ana sunucu [${sendRes.status}] (beklenen 200)`);
  ok = sendOk && ok;
}

if (shouldRun('9.2')) {
  console.log('\n══ Adım 9.2 Production deploy ══');
  ok = runStep('Deploy readiness', 'npm', ['run', 'test:production-ready']) && ok;
  ok = runStep('Fly dry-run', 'npm', ['run', 'deploy:fly']) && ok;
}

if (shouldRun('9.3')) {
  console.log('\n══ Adım 9.3 Production secrets ══');
  ok = runStep('Secret şablonları', 'npm', ['run', 'test:secrets']) && ok;
}

if (shouldRun('9.4')) {
  console.log('\n══ Adım 9.4 Mobil HK push (ana sunucu) ══');
  ok = runStep('Push pipeline', 'npm', ['run', 'test:push-mobile']) && ok;
}

if (shouldRun('9.5')) {
  console.log('\n══ Adım 9.5 Canlı entegrasyon ══');
  const res = await fetch(`${BASE}/api/integrations/status`);
  const j = await res.json().catch(() => ({}));
  const statusOk = res.ok && j.hotspot5651 && j.tesa;
  console.log(`${statusOk ? '✓' : '✗'} Integration status mode=${j.mode ?? '?'} [${res.status}]`);
  ok = statusOk && ok;

  if (process.env.ROOMIO_INTEGRATION_LIVE === '1' || process.env.ROOMIO_INTEGRATION_LIVE === 'true') {
    ok = runStep('Canlı cihaz testleri', 'npm', ['run', 'test:integrations:live']) && ok;
  } else {
    console.log('ℹ ROOMIO_INTEGRATION_LIVE=1 değil — sahada test atlandı');
    ok = runStep('Simülasyon smoke', 'npm', ['run', 'test:integrations']) && ok;
  }
}

if (!onlyStep) {
  console.log('\n══ Faz 8 regresyon ══');
  ok = runStep('Faz 8 smoke', 'npm', ['run', 'test:faz8']) && ok;
}

console.log(ok ? '\n✅ Faz 9 adımları geçti' : '\n❌ Bazı Faz 9 adımları başarısız');
process.exit(ok ? 0 : 1);
