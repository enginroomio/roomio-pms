#!/usr/bin/env node
/**
 * Faz 8 adım adım test.
 * Kullanım: npm run test:faz8
 *         npm run test:faz8 -- --step 8.3
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

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

console.log(`Faz 8 adım testi → ${BASE}\n`);
let ok = true;

if (shouldRun('8.1')) {
  console.log('══ Adım 8.1 Production deploy hazırlık ══');
  ok = runStep('Deploy readiness', 'npm', ['run', 'test:production-ready']) && ok;
}

if (shouldRun('8.2')) {
  console.log('\n══ Adım 8.2 Production secrets ══');
  ok = runStep('Secret şablonları', 'npm', ['run', 'test:secrets']) && ok;

  const res = await fetch(`${BASE}/api/monitoring/status`);
  const j = await res.json().catch(() => ({}));
  const monOk = res.ok && j.sentry?.detail;
  console.log(`${monOk ? '✓' : '✗'} Monitoring — ${j.sentry?.detail ?? 'yok'}`);
  ok = monOk && ok;
}

if (shouldRun('8.3')) {
  console.log('\n══ Adım 8.3 Mobil HK push ══');
  ok = runStep('Push pipeline', 'npm', ['run', 'test:push-mobile']) && ok;
}

if (shouldRun('8.4')) {
  console.log('\n══ Adım 8.4 Sahada canlı entegrasyon ══');
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
  console.log('\n══ Faz 7 regresyon ══');
  ok = runStep('Faz 7 smoke', 'npm', ['run', 'test:faz7']) && ok;
}

console.log(ok ? '\n✅ Faz 8 adımları geçti' : '\n❌ Bazı Faz 8 adımları başarısız');
process.exit(ok ? 0 : 1);
