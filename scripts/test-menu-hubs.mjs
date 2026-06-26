#!/usr/bin/env node
/**
 * Elektra menü hub panelleri — HTTP smoke (200 + başlık veya route işareti).
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
  const candidates = [
    process.env.ROOMIO_URL,
    'http://127.0.0.1:3100',
    readActivePort(),
  ].filter(Boolean);
  const seen = new Set();
  for (const base of candidates) {
    if (seen.has(base)) continue;
    seen.add(base);
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return base;
    } catch {
      // try next
    }
  }
  return 'http://127.0.0.1:3100';
}

const BASE = await resolveBaseUrl();
const TIMEOUT_MS = Number(process.env.MENU_HUB_TEST_TIMEOUT_MS ?? 60_000);
const RETRIES = Number(process.env.MENU_HUB_TEST_RETRIES ?? 3);
const STATUS_ONLY = process.env.MENU_HUB_TEST_STATUS_ONLY === '1';

/** needles: en az biri yanıtta bulunmalı (RSC stream veya SSR) */
const HUBS = [
  { path: '/?hub=panel', needles: ['Panel merkezi', 'roomio-gr-grid', 'hub=panel'] },
  { path: '/reservations?hub=rezervasyon', needles: ['Rezervasyon Merkezi', 'Rezervasyon merkezi', 'hub=rezervasyon'] },
  { path: '/reception?hub=resepsiyon', needles: ['Resepsiyon Merkezi', 'Resepsiyon merkezi', 'hub=resepsiyon'] },
  { path: '/reception?hub=onkasa', needles: ['Ön Kasa Merkezi', 'Ön kasa merkezi', 'hub=onkasa'] },
  { path: '/housekeeping?hub=kat', needles: ['Kat Hizmetleri Merkezi', 'Kat hizmetleri merkezi', 'hub=kat'] },
  { path: '/guest-relations?hub=misafir', needles: ['Misafir İlişkileri Merkezi', 'Misafir ilişkileri merkezi', 'hub=misafir'] },
  { path: '/fnb?hub=banket', needles: ['Banket Merkezi', 'Banket merkezi', 'hub=banket'] },
  { path: '/accounting?hub=arkaburo', needles: ['Arka Büro', 'Arka büro merkezi', 'hub=arkaburo'] },
  { path: '/reports?hub=raporlar', needles: ['Raporlar Merkezi', 'Raporlar merkezi', 'hub=raporlar'] },
  { path: '/reports?hub=gunsonu', needles: ['Gün Sonu Merkezi', 'Gün sonu merkezi', 'hub=gunsonu'] },
  { path: '/settings?hub=ayarlar', needles: ['Ayarlar ve Kısayollar', 'hub=ayarlar'] },
  { path: '/settings?hub=sistem', needles: ['Sistem ve Kuruluş', 'hub=sistem'] },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(path) {
  let lastErr;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok || attempt === RETRIES || (res.status !== 404 && res.status !== 503)) {
        return res;
      }
      await sleep(1500 * attempt);
    } catch (err) {
      lastErr = err;
      if (attempt === RETRIES) throw err;
      await sleep(1500 * attempt);
    }
  }
  throw lastErr ?? new Error('fetch failed');
}

async function bodyHasNeedle(res, needles) {
  const reader = res.body?.getReader();
  if (!reader) return false;
  const decoder = new TextDecoder();
  let chunk = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunk += decoder.decode(value, { stream: true });
    if (chunk.length > 512_000) chunk = chunk.slice(-256_000);
    if (needles.some((n) => chunk.includes(n))) {
      reader.cancel().catch(() => {});
      return true;
    }
  }
  reader.cancel().catch(() => {});
  return false;
}

let passed = 0;
let failed = 0;

console.log(`Menu hub smoke @ ${BASE} (retries=${RETRIES})\n`);

for (const hub of HUBS) {
  const label = hub.path;
  try {
    const res = await fetchWithRetry(hub.path);
    if (!res.ok) {
      console.log(`✗ ${label} → HTTP ${res.status}`);
      failed++;
      continue;
    }
    if (STATUS_ONLY) {
      console.log(`✓ ${label} (status only)`);
      passed++;
      continue;
    }
    const found = await bodyHasNeedle(res, hub.needles);
    if (!found) {
      console.log(`✗ ${label} → 200 ama işaret bulunamadı (${hub.needles[0]})`);
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
