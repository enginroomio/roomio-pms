#!/usr/bin/env node
/**
 * Go-live adım testleri — yerel + production.
 * Kullanım: npm run go-live:test
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PROD = (process.env.ROOMIO_PRODUCTION_URL ?? 'https://www.roomio.web.tr').replace(/\/$/, '');
const LOCAL = (process.env.ROOMIO_URL ?? 'http://127.0.0.1:3119').replace(/\/$/, '');

async function probe(base, label) {
  const out = { label, base, steps: [], ok: true };
  async function get(path) {
    const res = await fetch(`${base}${path}`);
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  }

  try {
    const health = await get('/api/health');
    const healthOk = health.status === 200 && health.body?.ok === true;
    out.steps.push({
      name: 'health',
      pass: healthOk,
      database: health.body?.checks?.database?.ok,
      detail: health.body?.checks?.database?.detail,
      monitoring: health.body?.checks?.monitoring?.detail,
    });
    if (!healthOk) out.ok = false;

    const vapid = await get('/api/push/vapid-public-key');
    const vapidOk = vapid.status === 200 && vapid.body?.ok === true;
    out.steps.push({ name: 'vapid', pass: vapidOk });

    const subs = await get('/api/push/subscribe?role=hk&detail=1');
    out.steps.push({
      name: 'hk-subscribers',
      pass: subs.status === 200 && subs.body?.ok === true,
      count: subs.body?.count,
      online: subs.body?.online,
    });

    const sendRes = await fetch(`${base}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Go-live test', body: 'Otomatik push' }),
    });
    const sendBody = await sendRes.json().catch(() => ({}));
    const sendOk = sendRes.status === 200;
    out.steps.push({
      name: 'push-send',
      pass: sendOk,
      status: sendRes.status,
      sent: sendBody.sent,
      failed: sendBody.failed,
      note: sendBody.sent === 0 ? 'abone yok — pipeline hazır' : undefined,
    });
    if (base === PROD && sendRes.status !== 200) out.ok = false;
  } catch (err) {
    out.ok = false;
    out.error = err instanceof Error ? err.message : String(err);
  }

  return out;
}

console.log('\n── Roomio go-live test ──\n');

const results = {
  at: new Date().toISOString(),
  production: await probe(PROD, 'production'),
  local: await probe(LOCAL, 'local'),
};

for (const block of [results.production, results.local]) {
  console.log(`\n${block.label.toUpperCase()} → ${block.base}`);
  if (block.error) {
    console.log(`  ✗ ${block.error}`);
    continue;
  }
  for (const step of block.steps) {
    console.log(`  ${step.pass ? '✓' : '✗'} ${step.name}${step.sent != null ? ` sent=${step.sent}` : ''}${step.count != null ? ` count=${step.count} online=${step.online}` : ''}${step.database != null ? ` db=${step.database}` : ''}${step.detail ? ` (${step.detail})` : ''}${step.note ? ` (${step.note})` : ''}`);
  }
  console.log(`  → ${block.ok ? 'PASS' : 'FAIL'}`);
}

const reportDir = join(process.cwd(), '.roomio');
mkdirSync(reportDir, { recursive: true });
const reportPath = join(reportDir, 'go-live-report.json');
writeFileSync(reportPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
console.log(`\nRapor: ${reportPath}\n`);

const exitOk = results.production.ok;
process.exit(exitOk ? 0 : 1);
