#!/usr/bin/env node
/**
 * Roomio 5651 otomasyon döngüsü — sunucu dışında bağımsız çalıştırılabilir.
 *
 *   ROOMIO_URL=http://127.0.0.1:3100 node scripts/hotspot-automation.mjs
 */
const ROOMIO_URL = process.env.ROOMIO_URL ?? 'http://127.0.0.1:3100';
const INTERVAL_MS = Number(process.env.AUTOMATION_POLL_MS ?? 60_000);

async function tick() {
  try {
    const statusRes = await fetch(`${ROOMIO_URL}/api/compliance/5651/automation`);
    if (!statusRes.ok) {
      console.error(`[automation] status ${statusRes.status}`);
      return;
    }
    const status = await statusRes.json();
    if (!status.enabled) return;

    const intervalMs = Math.max(1, status.intervalMinutes ?? 3) * 60_000;
    const last = status.lastRun ? new Date(status.lastRun).getTime() : 0;
    if (Date.now() - last < intervalMs) return;

    const res = await fetch(`${ROOMIO_URL}/api/compliance/5651/automation`, { method: 'POST' });
    const j = await res.json();
    console.log(`[${new Date().toISOString()}] automation`, JSON.stringify(j.result ?? j));
  } catch (err) {
    console.error('[automation]', err.message);
  }
}

console.log(`Roomio hotspot automation → ${ROOMIO_URL} (poll ${INTERVAL_MS}ms)`);
void tick();
setInterval(() => void tick(), INTERVAL_MS);
