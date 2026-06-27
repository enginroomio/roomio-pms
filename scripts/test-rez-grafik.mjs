#!/usr/bin/env node
/**
 * Rezervasyon grafik sayfası + availability API smoke test.
 * Kullanım: node scripts/test-rez-grafik.mjs
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

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const BUSINESS_DATE = '2026-06-18';

const PAGES = [
  { id: 'forecast-f1', href: '/reservations/calendar', must: ['Grafikler', 'Elektra Forecast F1', 'Raporu Hazırla'] },
  { id: 'filter-wizard', href: '/reservations/calendar?mode=filter-wizard', must: ['Filtre Sihirbazı', 'Raporu Hazırla'] },
  { id: 'calendar', href: '/reservations/calendar?mode=calendar', must: ['Takvim', 'Doluluk'] },
  { id: 'elektra', href: '/reservations/calendar?mode=elektra', must: ['Elektra v5'] },
  { id: 'forecast', href: '/reservations/calendar?mode=forecast', must: ['Forecast', 'Analiz'] },
];

const STUCK_ONLY = 'Grafikler yükleniyor';

async function fetchText(url) {
  const res = await fetch(url, { headers: { Accept: 'text/html' } });
  return { status: res.status, text: await res.text() };
}

async function testPage({ id, href, must }) {
  const url = `${BASE}${href}`;
  const { status, text } = await fetchText(url);
  const errors = [];

  if (status !== 200) errors.push(`HTTP ${status}`);

  const stuck = text.includes(STUCK_ONLY) && !text.includes('roomio-rez-graphic-pro');
  if (stuck) errors.push('yalnızca Suspense fallback — sayfa kabuğu eksik');

  for (const needle of must) {
    if (!text.includes(needle)) errors.push(`eksik: "${needle}"`);
  }

  return { id, url, ok: errors.length === 0, errors };
}

async function testApi() {
  const url = `${BASE}/api/reservations/availability?from=${BUSINESS_DATE}&days=31`;
  const res = await fetch(url);
  if (!res.ok) return { ok: false, errors: [`HTTP ${res.status}`] };
  const j = await res.json();
  if (!Array.isArray(j.matrix)) return { ok: false, errors: ['matrix dizisi yok'] };
  if (j.matrix.length === 0) return { ok: false, errors: ['matrix boş'] };
  return { ok: true, errors: [], days: j.matrix.length };
}

async function main() {
  console.log(`ROOMIO_URL=${BASE}\n`);

  const api = await testApi();
  console.log(api.ok ? `✓ API availability (${api.days} gün)` : `✗ API: ${api.errors.join(', ')}`);

  let failed = api.ok ? 0 : 1;
  for (const page of PAGES) {
    const r = await testPage(page);
    if (r.ok) {
      console.log(`✓ ${r.id}`);
    } else {
      failed++;
      console.log(`✗ ${r.id}: ${r.errors.join('; ')}`);
      console.log(`  ${r.url}`);
    }
  }

  if (failed > 0) {
    console.log(`\n${failed} hata — tarayıcıda client bundle kontrol edin.`);
    process.exit(1);
  }
  console.log('\nTüm grafik smoke testleri geçti.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
