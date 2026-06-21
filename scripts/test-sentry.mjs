#!/usr/bin/env node
/**
 * Sentry production monitoring testi.
 * Kullanım: npm run test:sentry
 *         SENTRY_DSN=https://... npm run test:sentry
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

let ok = true;
console.log(`Sentry monitoring testi → ${BASE}\n`);

const status = await fetch(`${BASE}/api/monitoring/status`);
const body = await status.json().catch(() => ({}));
const statusOk = status.ok && typeof body.sentry?.detail === 'string';
console.log(`${statusOk ? '✓' : '✗'} Monitoring status — ${body.sentry?.detail ?? 'yok'} [${status.status}]`);
ok = statusOk && ok;

const health = await fetch(`${BASE}/api/health`);
const healthBody = await health.json().catch(() => ({}));
const monitoring = healthBody.checks?.monitoring?.detail ?? '';
const healthOk = health.ok && monitoring.includes('sentry:');
console.log(`${healthOk ? '✓' : '✗'} Health monitoring — ${monitoring || 'yok'}`);
ok = healthOk && ok;

if (process.env.SENTRY_DSN?.trim() || body.sentry?.configured) {
  const ping = await fetch(`${BASE}/api/monitoring/status?test=1`);
  const pingBody = await ping.json().catch(() => ({}));
  const pingOk = ping.ok && pingBody.sentry?.configured === true && pingBody.sentry?.active === true;
  console.log(`${pingOk ? '✓' : '✗'} Sentry ping — active=${pingBody.sentry?.active}`);
  ok = pingOk && ok;
} else {
  console.log('ℹ SENTRY_DSN yok — ping atlandı (production’da fly secrets set SENTRY_DSN=...)');
}

console.log('\nℹ Sentry alert önerileri (dashboard):');
console.log('  • Error rate > 5% / 5dk → email');
console.log('  • /api/health 5xx → PagerDuty veya Slack');
console.log('  • roomio monitoring ping kaybolursa → uptime alert');

console.log(ok ? '\n✓ Sentry monitoring geçti\n' : '\n✗ Sentry monitoring başarısız\n');
process.exit(ok ? 0 : 1);
