#!/usr/bin/env node
/**
 * Faz 12 — Sentry monitoring + PostgreSQL + sahada canlı döngü.
 * Kullanım: npm run test:faz12
 *         npm run test:faz12 -- --step 12.1
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { productionUrl } from './fly-production.mjs';

const LOCAL = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const PROD = productionUrl();
const BASE = PROD ?? LOCAL;
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

console.log(`Faz 12 adım testi → ${BASE}`);
if (PROD) console.log(`Production → ${PROD}\n`);
else console.log('');

let ok = true;

if (shouldRun('12.1')) {
  console.log('══ Adım 12.1 Sentry production monitoring ══');
  ok = runStep('Sentry test', 'npm', ['run', 'test:sentry'], { ROOMIO_URL: BASE }) && ok;

  const health = await fetch(`${BASE}/api/health`).then((r) => r.json()).catch(() => ({}));
  const mon = health.checks?.monitoring?.detail ?? '';
  console.log(`${mon.includes('push:') ? '✓' : '✗'} Health checks — ${mon}`);
  ok = mon.includes('push:') && ok;
}

if (shouldRun('12.2')) {
  console.log('\n══ Adım 12.2 PostgreSQL / Fly Postgres ══');
  ok = runStep('Postgres şema', 'npm', ['run', 'test:postgres']) && ok;
  ok = runStep('Fly Postgres setup', 'npm', ['run', 'fly:postgres:setup']) && ok;
}

if (shouldRun('12.3')) {
  console.log('\n══ Adım 12.3 Otel sahasında tam canlı döngü ══');
  const statusBase = PROD ?? LOCAL;
  const res = await fetch(`${statusBase}/api/integrations/status`);
  const j = await res.json().catch(() => ({}));
  const statusOk = res.ok && j.tesa && j.pbx && j.hotspot5651;
  console.log(`${statusOk ? '✓' : '✗'} Integration status mode=${j.mode ?? '?'} [${res.status}]`);
  ok = statusOk && ok;

  if (process.env.ROOMIO_INTEGRATION_LIVE === '1' || process.env.ROOMIO_INTEGRATION_LIVE === 'true') {
    ok = runStep('Canlı cihaz (TESA/MikroTik/UniFi/PBX)', 'npm', ['run', 'test:integrations:live'], {
      ROOMIO_URL: statusBase,
    }) && ok;

    const checkIn = await fetch(`${statusBase}/api/reception/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservationId: 'rez-04',
        roomNo: '301',
        guestName: 'Faz 12 Live',
        checkIn: '2026-06-26',
        checkOut: '2026-06-29',
        reservationRef: '4',
      }),
    });
    const checkBody = await checkIn.json().catch(() => ({}));
    const liveCycle = checkIn.ok && checkBody.ok && checkBody.messages?.some((m) => m.startsWith('Santral:'));
    console.log(`${liveCycle ? '✓' : '✗'} Check-in canlı döngü (TESA+Santral+WiFi)`);
    ok = liveCycle && ok;
  } else {
    console.log('ℹ ROOMIO_INTEGRATION_LIVE=1 değil — simülasyon smoke');
    ok = runStep('Simülasyon smoke', 'npm', ['run', 'test:integrations'], { ROOMIO_URL: statusBase }) && ok;
    console.log('ℹ Sahada: ROOMIO_INTEGRATION_LIVE=1 npm run test:faz12 -- --step 12.3');
  }
}

if (!onlyStep) {
  console.log('\n══ Faz 11 regresyon ══');
  ok = runStep('Faz 11 smoke', 'npm', ['run', 'test:faz11'], { ROOMIO_URL: LOCAL }) && ok;
}

console.log(ok ? '\n✅ Faz 12 adımları geçti' : '\n❌ Bazı Faz 12 adımları başarısız');
process.exit(ok ? 0 : 1);
