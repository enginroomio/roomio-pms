#!/usr/bin/env node
/**
 * Faz 10 adım adım test.
 * Kullanım: npm run test:faz10
 *         npm run test:faz10 -- --step 10.1
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

console.log(`Faz 10 adım testi → ${BASE}\n`);
let ok = true;

if (shouldRun('10.1')) {
  console.log('══ Adım 10.1 Production deploy hazırlık ══');
  ok = runStep('Deploy readiness', 'npm', ['run', 'test:production-ready']) && ok;
  ok = runStep('Fly dry-run', 'npm', ['run', 'deploy:fly']) && ok;
}

if (shouldRun('10.2')) {
  console.log('\n══ Adım 10.2 Production secrets checklist ══');
  ok = runStep('Secret şablonları', 'npm', ['run', 'test:secrets']) && ok;
  ok = runStep('Docker prod compose', 'npm', ['run', 'test:docker']) && ok;
}

if (shouldRun('10.3')) {
  console.log('\n══ Adım 10.3 Mobil HK UI + push API ══');
  const mobile = await fetch(`${BASE}/housekeeping/mobile`);
  const html = await mobile.text();
  const uiOk = mobile.ok && (
    html.includes('Roomio HK Mobil')
    || html.includes('HousekeepingMobileLoader')
    || html.includes('Bildirimleri aç')
  );
  console.log(`${uiOk ? '✓' : '✗'} HK mobil UI — /housekeeping/mobile [${mobile.status}]`);
  ok = uiOk && ok;

  ok = runStep('Push pipeline', 'npm', ['run', 'test:push-mobile']) && ok;
}

if (shouldRun('10.4')) {
  console.log('\n══ Adım 10.4 Canlı entegrasyon ══');
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
  console.log('\n══ Faz 9 regresyon ══');
  ok = runStep('Faz 9 smoke', 'npm', ['run', 'test:faz9']) && ok;
}

console.log(ok ? '\n✅ Faz 10 adımları geçti' : '\n❌ Bazı Faz 10 adımları başarısız');
process.exit(ok ? 0 : 1);
