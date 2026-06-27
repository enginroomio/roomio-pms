#!/usr/bin/env node
/**
 * UDP Syslog dinleyici — MikroTik/UniFi satırlarını Roomio 5651 ingest API'sine iletir.
 *
 * Kullanım:
 *   ROOMIO_URL=http://127.0.0.1:3100 \
 *   ROOMIO_BRIDGE_SECRET=roomio-bridge-dev \
 *   node scripts/hotspot-syslog-bridge.mjs
 */
import dgram from 'node:dgram';

const ROOMIO_URL = process.env.ROOMIO_URL ?? 'http://127.0.0.1:3100';
const SECRET = process.env.ROOMIO_BRIDGE_SECRET ?? 'roomio-bridge-dev';
const PORT = Number(process.env.SYSLOG_UDP_PORT ?? 5514);
const PROVIDER = process.env.HOTSPOT_PROVIDER ?? 'mikrotik';

const socket = dgram.createSocket('udp4');

socket.on('message', (msg) => {
  const line = msg.toString('utf8').trim();
  if (!line) return;

  void fetch(`${ROOMIO_URL}/api/compliance/5651/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Roomio-Bridge-Secret': SECRET,
    },
    body: JSON.stringify({ provider: PROVIDER, line }),
  })
    .then(async (res) => {
      const j = await res.json();
      const ts = new Date().toISOString();
      console.log(`[${ts}] ${res.status} ${j.message ?? JSON.stringify(j)} ← ${line.slice(0, 80)}`);
    })
    .catch((err) => {
      console.error('ingest error:', err.message);
    });
});

socket.on('listening', () => {
  const addr = socket.address();
  console.log(`5651 syslog bridge UDP :${addr.port} → ${ROOMIO_URL}/api/compliance/5651/ingest`);
});

socket.bind(PORT, '0.0.0.0');
