#!/usr/bin/env node
/**
 * Elektra menü hub panelleri — HTTP smoke (200 + başlık metni).
 * Kullanım: ROOMIO_URL=http://127.0.0.1:3100 npm run test:menu-hubs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

async function resolveBaseUrl() {
  const candidates = [process.env.ROOMIO_URL, readActivePort(), 'http://127.0.0.1:3100'].filter(Boolean);
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return base;
    } catch {
      // try next
    }
  }
  return candidates[0] ?? 'http://127.0.0.1:3100';
}

const BASE = await resolveBaseUrl();
const TIMEOUT_MS = Number(process.env.MENU_HUB_TEST_TIMEOUT_MS ?? 45_000);

const HUBS = [
  { path: '/?hub=panel', needle: 'Panel merkezi' },
  { path: '/reservations?hub=rezervasyon', needle: 'Rezervasyon Merkezi' },
  { path: '/reception?hub=resepsiyon', needle: 'Resepsiyon Merkezi' },
  { path: '/reception?hub=onkasa', needle: 'Ön Kasa Merkezi' },
  { path: '/housekeeping?hub=kat', needle: 'Kat Hizmetleri Merkezi' },
  { path: '/guest-relations?hub=misafir', needle: 'Misafir İlişkileri Merkezi' },
  { path: '/fnb?hub=banket', needle: 'Banket Merkezi' },
  { path: '/accounting?hub=arkaburo', needle: 'Arka Büro' },
  { path: '/reports?hub=raporlar', needle: 'Raporlar Merkezi' },
  { path: '/reports?hub=gunsonu', needle: 'Gün Sonu Merkezi' },
  { path: '/settings?hub=ayarlar', needle: 'Ayarlar ve Kısayollar' },
  { path: '/settings?hub=sistem', needle: 'Sistem ve Kuruluş' },
];

let passed = 0;
let failed = 0;

console.log(`Menu hub smoke @ ${BASE}\n`);

for (const hub of HUBS) {
  const label = `${hub.path}`;
  try {
    const res = await fetch(`${BASE}${hub.path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      console.log(`✗ ${label} → HTTP ${res.status}`);
      failed++;
      continue;
    }
    const reader = res.body?.getReader();
    if (!reader) {
      console.log(`✗ ${label} → boş yanıt`);
      failed++;
      continue;
    }
    const decoder = new TextDecoder();
    let found = false;
    let chunk = '';
    while (!found) {
      const { done, value } = await reader.read();
      if (done) break;
      chunk += decoder.decode(value, { stream: true });
      if (chunk.length > 512_000) chunk = chunk.slice(-256_000);
      if (chunk.includes(hub.needle)) found = true;
    }
    reader.cancel().catch(() => {});
    if (!found) {
      console.log(`✗ ${label} → 200 ama "${hub.needle}" bulunamadı`);
      failed++;
      continue;
    }
    console.log(`✓ ${label}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${label} → ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

console.log(`\n${passed}/${HUBS.length} passed`);
process.exit(failed ? 1 : 0);
