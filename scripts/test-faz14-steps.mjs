#!/usr/bin/env node
/**
 * Faz 14 — EGM canlı, Fly Postgres, konsolide rapor.
 * Kullanım: npm run test:faz14
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { productionUrl, waitForHealth, defaultFlyUrl, flyAppName } from './fly-production.mjs';

const LOCAL = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const PROD = productionUrl();
const BASE = LOCAL;

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
  return spawnSync(cmd, args, { cwd: process.cwd(), stdio: 'inherit', shell: true, env: { ...process.env, ROOMIO_URL: BASE, ...env } }).status === 0;
}

console.log(`Faz 14 adım testi → ${BASE}`);
if (PROD) console.log(`Production → ${PROD}\n`);

let ok = true;

if (shouldRun('14.1')) {
  console.log('══ Adım 14.1 EGM/KBS canlı gateway ══');
  const egm = await fetch(`${BASE}/api/integrations/egm/test`);
  const ej = await egm.json().catch(() => ({}));
  console.log(`${egm.ok && ej.connection?.ok ? '✓' : '✗'} EGM test — ${ej.connection?.message ?? '?'} [${egm.status}]`);
  ok = egm.ok && ej.connection?.ok === true && ok;
  ok = runStep('EGM live (opsiyonel)', 'npm', ['run', 'test:egm:live']) && ok;
}

if (shouldRun('14.2')) {
  console.log('\n══ Adım 14.2 Fly Postgres production ══');
  ok = runStep('Postgres şema', 'npm', ['run', 'test:postgres']) && ok;
  ok = runStep('Fly Postgres setup', 'npm', ['run', 'fly:postgres:setup']) && ok;

  if (PROD) {
    const health = await waitForHealth(PROD, 10, 2000);
    console.log(`${health.ok ? '✓' : 'ℹ'} Production health — ${PROD}`);
  } else {
    console.log(`ℹ Production URL yok — beklenen: ${defaultFlyUrl(flyAppName())}`);
  }
}

if (shouldRun('14.3')) {
  console.log('\n══ Adım 14.3 Multi-property konsolide rapor ══');
  const res = await fetch(`${BASE}/api/reports/consolidated`);
  const j = await res.json().catch(() => ({}));
  const consOk = res.ok && j.totals?.properties >= 2 && Array.isArray(j.properties);
  console.log(`${consOk ? '✓' : '✗'} Consolidated API — ${j.totals?.properties ?? 0} tesis [${res.status}]`);
  ok = consOk && ok;

  const csv = await fetch(`${BASE}/api/reports/consolidated?format=csv`);
  const csvOk = csv.ok && (await csv.text()).includes('TOPLAM');
  console.log(`${csvOk ? '✓' : '✗'} Consolidated CSV export`);
  ok = csvOk && ok;

  ok = runStep('Multi-property', 'npm', ['run', 'test:multiproperty']) && ok;
}

if (!process.argv.includes('--step')) {
  console.log('\n══ Faz 13 regresyon ══');
  ok = runStep('Faz 13', 'npm', ['run', 'test:faz13'], { ROOMIO_URL: BASE }) && ok;
}

console.log(ok ? '\n✅ Faz 14 adımları geçti' : '\n❌ Bazı Faz 14 adımları başarısız');
process.exit(ok ? 0 : 1);
