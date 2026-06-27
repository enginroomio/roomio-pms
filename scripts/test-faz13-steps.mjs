#!/usr/bin/env node
/**
 * Faz 13 — multi-property, EGM/KBS, SLA dashboard.
 * Kullanım: npm run test:faz13
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { productionUrl } from './fly-production.mjs';

const LOCAL = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const BASE = productionUrl() ?? LOCAL;
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
  return spawnSync(cmd, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ROOMIO_URL: BASE, ...extraEnv },
  }).status === 0;
}

console.log(`Faz 13 adım testi → ${BASE}\n`);
let ok = true;

if (shouldRun('13.1')) {
  console.log('══ Adım 13.1 Multi-property (Antalya + İstanbul) ══');
  ok = runStep('Multi-property', 'npm', ['run', 'test:multiproperty']) && ok;
}

if (shouldRun('13.2')) {
  console.log('\n══ Adım 13.2 EGM/KBS entegrasyon ══');
  const egm = await fetch(`${BASE}/api/integrations/egm/test`);
  const ej = await egm.json().catch(() => ({}));
  const egmOk = egm.ok && ej.connection?.ok === true;
  console.log(`${egmOk ? '✓' : '✗'} EGM connection — ${ej.connection?.message ?? '?'} [${egm.status}]`);
  ok = egmOk && ok;

  const list = await fetch(`${BASE}/api/egm/identity`, { headers: { 'x-roomio-property-id': 'prop-sapphire-ist' } });
  console.log(`${list.ok ? '✓' : '✗'} EGM identity list [${list.status}]`);
  ok = list.ok && ok;
}

if (shouldRun('13.3')) {
  console.log('\n══ Adım 13.3 Production SLA dashboard ══');
  const sla = await fetch(`${BASE}/api/monitoring/sla`);
  const sj = await sla.json().catch(() => ({}));
  const slaOk = sla.ok && sj.sla && sj.properties?.count >= 2;
  console.log(`${slaOk ? '✓' : '✗'} SLA API — ${sj.properties?.count ?? 0} tesis, health=${sj.sla?.healthOk} [${sla.status}]`);
  ok = slaOk && ok;

  const page = await fetch(`${BASE}/tools/sla`);
  const html = await page.text();
  const uiOk = page.ok && html.includes('Production SLA');
  console.log(`${uiOk ? '✓' : '✗'} SLA UI — /tools/sla [${page.status}]`);
  ok = uiOk && ok;
}

if (!onlyStep) {
  console.log('\n══ Faz 12 regresyon ══');
  ok = runStep('Faz 12 smoke', 'npm', ['run', 'test:faz12'], { ROOMIO_URL: LOCAL }) && ok;
}

console.log(ok ? '\n✅ Faz 13 adımları geçti' : '\n❌ Bazı Faz 13 adımları başarısız');
process.exit(ok ? 0 : 1);
