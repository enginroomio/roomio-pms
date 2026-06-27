#!/usr/bin/env node
/**
 * EGM/KBS canlı gateway testi.
 * Gereksinim: ROOMIO_EGM_LIVE=1 veya ROOMIO_INTEGRATION_LIVE=1
 */
if (process.env.ROOMIO_EGM_LIVE !== '1' && process.env.ROOMIO_EGM_LIVE !== 'true'
  && process.env.ROOMIO_INTEGRATION_LIVE !== '1' && process.env.ROOMIO_INTEGRATION_LIVE !== 'true') {
  console.log('ℹ ROOMIO_EGM_LIVE=1 değil — simülasyon smoke');
  process.exit(0);
}

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

console.log(`EGM live test → ${BASE}\n`);

const test = await fetch(`${BASE}/api/integrations/egm/test`);
const tj = await test.json().catch(() => ({}));
if (tj.connection?.simulated) {
  console.log(`✗ EGM live — simülasyon yanıtı: ${tj.connection.message}`);
  process.exit(1);
}
console.log(`✓ EGM gateway — ${tj.connection?.message ?? 'ok'}`);

const list = await fetch(`${BASE}/api/egm/identity`, { headers: { 'x-roomio-property': 'prop-sapphire-ist' } });
const records = await list.json().catch(() => ({}));
const ready = (records.records ?? []).find((r) => r.status === 'ready');
if (!ready) {
  console.log('ℹ Gönderilecek ready kayıt yok — connection test yeterli');
  process.exit(0);
}

const send = await fetch(`${BASE}/api/egm/identity`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-roomio-property': 'prop-sapphire-ist' },
  body: JSON.stringify({ action: 'send', id: ready.id }),
});
const sj = await send.json().catch(() => ({}));
const sendOk = send.ok && sj.record?.status === 'sent' && !sj.record?.errorMessage?.includes('Simülasyon');
console.log(`${sendOk ? '✓' : '✗'} EGM send — ${sj.record?.egmRef ?? sj.error ?? send.status}`);
process.exit(sendOk ? 0 : 1);
