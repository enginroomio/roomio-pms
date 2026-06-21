#!/usr/bin/env node
/**
 * Faz 15 — Fly canlı deploy, telefon push, Postgres cutover, EGM sahada.
 * Kullanım: npm run test:faz15
 *         npm run test:faz15 -- --step 15.1
 *         npm run deploy:faz15
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadFlyToken } from './fly-auth.mjs';
import {
  defaultFlyUrl,
  flyAppName,
  hasFlyCli,
  productionUrl,
  runFly,
  waitForHealth,
} from './fly-production.mjs';

const LOCAL = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const PROD = productionUrl();
const EXPECTED = defaultFlyUrl(flyAppName());

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

function shouldRun(step) {
  const only = process.argv.find((a) => a.startsWith('--step'))?.split('=')[1]
    ?? (process.argv.includes('--step') ? process.argv[process.argv.indexOf('--step') + 1] : null);
  if (!only) return true;
  return only === step || only === step.replace('Adım ', '');
}

function runStep(name, cmd, args, env = {}) {
  console.log(`\n── ${name} ──`);
  return spawnSync(cmd, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ROOMIO_URL: LOCAL, ROOMIO_PRODUCTION_URL: PROD ?? '', ...env },
  }).status === 0;
}

console.log('Faz 15 adım testi');
console.log(`  Yerel  → ${LOCAL}`);
console.log(`  Prod   → ${PROD ?? `(yok — beklenen ${EXPECTED})`}\n`);

let ok = true;

if (shouldRun('15.1')) {
  console.log('══ Adım 15.1 Fly canlı deploy ══');
  const token = loadFlyToken();
  if (!token) {
    console.log('⚠ FLY_API_TOKEN boş — .env.fly dosyasına token yapıştırın');
    console.log('  https://fly.io/user/personal_access_tokens');
    if (process.argv.includes('--deploy')) ok = false;
  } else {
    console.log(`✓ Fly token yüklü (${token.length} karakter)`);
    ok = runStep('Fly auth', 'npm', ['run', 'fly:auth:check']) && ok;
  }

  if (PROD) {
    const health = await waitForHealth(PROD, 20, 2000);
    console.log(`${health.ok ? '✓' : '✗'} Production health — ${PROD}/api/health`);
    if (health.ok) {
      const detail = health.body?.checks?.monitoring?.detail ?? '';
      console.log(`✓ Monitoring — ${detail || 'ok'}`);
    }
    ok = health.ok && ok;
  } else {
    console.log(`ℹ Production URL yok — deploy: npm run deploy:faz11`);
    ok = runStep('Deploy hazırlık', 'npm', ['run', 'test:production-ready']) && ok;
    if (process.argv.includes('--deploy') && token && hasFlyCli()) {
      ok = runStep('Fly deploy', 'npm', ['run', 'deploy:faz11']) && ok;
    }
  }
}

if (shouldRun('15.2')) {
  console.log('\n══ Adım 15.2 Production telefon push (HTTPS) ══');
  if (!PROD) {
    console.log(`ℹ Production URL yok — deploy sonrası:`);
    console.log(`  ROOMIO_PRODUCTION_URL=${EXPECTED} npm run test:faz15 -- --step 15.2`);
  } else {
    ok = runStep('Push pipeline (prod)', 'npm', ['run', 'test:faz11', '--', '--step', '11.3'], {
      ROOMIO_PRODUCTION_URL: PROD,
      ROOMIO_URL: PROD,
    }) && ok;
  }
}

if (shouldRun('15.3')) {
  console.log('\n══ Adım 15.3 Fly Postgres cutover ══');
  ok = runStep('Postgres şema', 'npm', ['run', 'test:postgres']) && ok;
  ok = runStep('Fly Postgres setup', 'npm', ['run', 'fly:postgres:setup']) && ok;

  if (hasFlyCli() && loadFlyToken()) {
    const pg = runFly(['postgres', 'list']);
    if (pg.status === 0) {
      const hasCluster = pg.stdout.includes('roomio-pms-db') || pg.stdout.includes('roomio');
      console.log(`${hasCluster ? '✓' : 'ℹ'} Fly Postgres cluster — ${hasCluster ? 'bulundu' : 'henüz oluşturulmadı'}`);
      if (!hasCluster) {
        console.log('  fly postgres create --name roomio-pms-db --region fra --initial-cluster-size 1');
        console.log('  fly postgres attach roomio-pms-db -a roomio-pms');
      }
    }
  }

  if (PROD) {
    const health = await waitForHealth(PROD, 5, 1500);
    const db = health.body?.checks?.database?.detail ?? health.body?.database ?? '';
    if (db) console.log(`ℹ Production DB — ${typeof db === 'string' ? db : JSON.stringify(db)}`);
  }
}

if (shouldRun('15.4')) {
  console.log('\n══ Adım 15.4 EGM gateway sahada ══');
  const egmBase = PROD ?? LOCAL;
  const egm = await fetch(`${egmBase}/api/integrations/egm/test`);
  const ej = await egm.json().catch(() => ({}));
  console.log(`${egm.ok && ej.connection?.ok ? '✓' : '✗'} EGM bağlantı — ${ej.connection?.message ?? '?'} [${egm.status}]`);
  ok = egm.ok && ej.connection?.ok === true && ok;

  if (process.env.ROOMIO_EGM_LIVE === '1' || process.env.ROOMIO_EGM_LIVE === 'true') {
    ok = runStep('EGM canlı smoke', 'npm', ['run', 'test:egm:live'], { ROOMIO_URL: egmBase }) && ok;
  } else {
    console.log('ℹ ROOMIO_EGM_LIVE=1 değil — simülasyon modu');
    console.log('  Sahada: ROOMIO_EGM_GATEWAY_URL=... ROOMIO_EGM_LIVE=1 npm run test:faz15 -- --step 15.4');
  }
}

if (!process.argv.includes('--step')) {
  console.log('\n══ Faz 14 regresyon ══');
  ok = runStep('Faz 14 smoke', 'npm', ['run', 'test:faz14', '--', '--step', '14.1', '--step', '14.3']) && ok;
}

console.log(ok ? '\n✅ Faz 15 adımları geçti' : '\n❌ Bazı Faz 15 adımları başarısız — eksikler yukarıda');
process.exit(ok ? 0 : 1);
