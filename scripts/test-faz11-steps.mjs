#!/usr/bin/env node
/**
 * Faz 11 — gerçek Fly deploy + telefon push.
 * Kullanım: npm run test:faz11
 *         ROOMIO_PRODUCTION_URL=https://roomio-pms.fly.dev npm run test:faz11
 *         npm run test:faz11 -- --step 11.3
 *         npm run test:faz11 -- --deploy   (fly deploy dener)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  defaultFlyUrl,
  flyAppName,
  hasFlyCli,
  productionUrl,
  waitForHealth,
} from './fly-production.mjs';

const LOCAL = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const PROD = productionUrl();
const BASE = PROD ?? LOCAL;
const onlyStep = process.argv.find((a) => a.startsWith('--step'))?.split('=')[1]
  ?? (process.argv.includes('--step') ? process.argv[process.argv.indexOf('--step') + 1] : null);
const tryDeploy = process.argv.includes('--deploy');

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
    env: { ...process.env, ROOMIO_URL: BASE, ROOMIO_PRODUCTION_URL: PROD ?? '', ...extraEnv },
  });
  return r.status === 0;
}

console.log(`Faz 11 adım testi`);
console.log(`  Yerel  → ${LOCAL}`);
console.log(`  Prod   → ${PROD ?? '(yok — dry-run veya --deploy)'}\n`);
let ok = true;

if (shouldRun('11.1')) {
  console.log('══ Adım 11.1 Fly production deploy ══');
  ok = runStep('Deploy dosyaları', 'npm', ['run', 'test:production-ready']) && ok;

  if (tryDeploy && hasFlyCli()) {
    ok = runStep('Fly canlı deploy', 'npm', ['run', 'deploy:fly:live']) && ok;
  } else if (PROD) {
    const health = await waitForHealth(PROD, 15, 2000);
    console.log(`${health.ok ? '✓' : '✗'} Production health — ${PROD}/api/health`);
    if (health.ok) {
      const pushReady = health.body?.checks?.monitoring?.detail?.includes('push:ready');
      console.log(`${pushReady ? '✓' : 'ℹ'} Push durumu — ${health.body?.checks?.monitoring?.detail ?? '?'}`);
    }
    ok = health.ok && ok;
  } else {
    console.log('ℹ Production URL yok — dry-run modu');
    console.log(`  Deploy: npm run deploy:fly:live`);
    console.log(`  veya:   ROOMIO_PRODUCTION_URL=${defaultFlyUrl(flyAppName())} npm run test:faz11`);
    ok = runStep('Fly dry-run', 'npm', ['run', 'deploy:fly']) && ok;
    if (!hasFlyCli()) {
      console.log('ℹ fly CLI yok — canlı deploy atlandı (brew install flyctl)');
    }
  }
}

if (shouldRun('11.2')) {
  console.log('\n══ Adım 11.2 Fly production secrets ══');
  ok = runStep('Secret şablonları', 'npm', ['run', 'test:secrets']) && ok;
  ok = runStep('Fly secrets', 'npm', ['run', 'fly:secrets:check']) && ok;
}

if (shouldRun('11.3')) {
  console.log('\n══ Adım 11.3 Telefon push (HTTPS) ══');
  const pushBase = PROD ?? LOCAL;
  const isHttps = pushBase.startsWith('https://');

  const mobile = await fetch(`${pushBase}/housekeeping/mobile`);
  const html = await mobile.text();
  const uiOk = mobile.ok && (
    html.includes('Roomio HK Mobil')
    || html.includes('HousekeepingMobileLoader')
    || html.includes('Bildirimleri aç')
  );
  console.log(`${uiOk ? '✓' : '✗'} HK mobil UI — ${pushBase}/housekeeping/mobile [${mobile.status}]`);
  ok = uiOk && ok;

  const vapid = await fetch(`${pushBase}/api/push/vapid-public-key`).then((r) => r.json()).catch(() => ({}));
  const vapidOk = vapid.ok === true && Boolean(vapid.publicKey);
  console.log(`${vapidOk ? '✓' : '✗'} VAPID yapılandırılmış`);
  ok = vapidOk && ok;

  const sendRes = await fetch(`${pushBase}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Faz 11',
      body: PROD ? 'Fly production push test' : 'Yerel push pipeline',
    }),
  });
  const sendOk = sendRes.status === 200;
  console.log(`${sendOk ? '✓' : '✗'} Push send API [${sendRes.status}]`);
  ok = sendOk && ok;

  if (PROD && isHttps) {
    console.log('\n📱 Gerçek telefon testi:');
    console.log(`   1. iPhone/Android → ${pushBase}/housekeeping/mobile`);
    console.log('   2. "Bildirimleri aç" → izin ver');
    console.log(`   3. Terminal: curl -X POST ${pushBase}/api/push/send -H 'Content-Type: application/json' -d '{"title":"HK","body":"Oda 101 hazır"}'`);
    console.log('   4. Bildirim cihazda görünmeli\n');
  } else if (!PROD) {
    console.log('ℹ Gerçek telefon push için HTTPS production URL gerekli');
    console.log('  npm run deploy:fly:live → ardından npm run test:faz11');
  } else {
    console.log('⚠ Production URL HTTP — telefon push için HTTPS (Fly) kullanın');
  }
}

if (shouldRun('11.4')) {
  console.log('\n══ Adım 11.4 Sahada canlı entegrasyon ══');
  const statusBase = PROD ?? LOCAL;
  const res = await fetch(`${statusBase}/api/integrations/status`);
  const j = await res.json().catch(() => ({}));
  const statusOk = res.ok && j.hotspot5651 && j.tesa && j.pbx;
  console.log(`${statusOk ? '✓' : '✗'} Integration status mode=${j.mode ?? '?'} [${res.status}]`);
  ok = statusOk && ok;

  if (process.env.ROOMIO_INTEGRATION_LIVE === '1' || process.env.ROOMIO_INTEGRATION_LIVE === 'true') {
    ok = runStep('Canlı cihaz testleri', 'npm', ['run', 'test:integrations:live'], {
      ROOMIO_URL: statusBase,
    }) && ok;
  } else {
    console.log('ℹ ROOMIO_INTEGRATION_LIVE=1 değil — simülasyon smoke');
    ok = runStep('Simülasyon smoke', 'npm', ['run', 'test:integrations'], {
      ROOMIO_URL: statusBase,
    }) && ok;
    console.log('ℹ Sahada test: ROOMIO_INTEGRATION_LIVE=1 npm run test:faz11 -- --step 11.4');
  }
}

if (!onlyStep) {
  console.log('\n══ Faz 10 regresyon ══');
  ok = runStep('Faz 10 smoke', 'npm', ['run', 'test:faz10'], { ROOMIO_URL: LOCAL }) && ok;
}

console.log(ok ? '\n✅ Faz 11 adımları geçti' : '\n❌ Bazı Faz 11 adımları başarısız');
process.exit(ok ? 0 : 1);
