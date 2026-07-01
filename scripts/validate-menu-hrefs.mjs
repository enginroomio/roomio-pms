#!/usr/bin/env node
/**
 * Sidebar ve alt menü href'lerini smoke test eder.
 * Kullanım: ROOMIO_URL=http://127.0.0.1:3100 npm run test:menus
 */
import { readFileSync, readdirSync } from 'node:fs';
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

const NAV_DIR = join(process.cwd(), 'lib/navigation');
const HREF_PATTERNS = [
  /href:\s*['"]([^'"]+)['"]/g,
  /sub\([^,]+,\s*['"]([^'"]+)['"]/g,
];

function collectHrefsFromFile(path) {
  const text = readFileSync(path, 'utf8');
  const found = new Set();
  for (const re of HREF_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const href = m[1];
      if (!href || href === '#' || href.startsWith('http')) continue;
      if (!href.startsWith('/') || href.startsWith('/api/')) continue;
      found.add(href);
    }
  }
  return found;
}

function collectAllMenuHrefs() {
  const all = new Set();
  const files = readdirSync(NAV_DIR).filter((f) => f.endsWith('.ts'));
  for (const file of files) {
    for (const href of collectHrefsFromFile(join(NAV_DIR, file))) {
      all.add(href);
    }
  }
  return [...all].sort();
}

const TIMEOUT_MS = Number(process.env.MENU_TEST_TIMEOUT_MS ?? 25_000);

async function check(base, path) {
  const url = `${base}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    clearTimeout(timer);
    return { path, status: res.status, ok: res.status >= 200 && res.status < 500 && res.status !== 404 };
  } catch (e) {
    clearTimeout(timer);
    return { path, status: 0, ok: false, error: e instanceof Error ? e.message : 'fail' };
  }
}

async function checkWithRetry(base, path) {
  let r = await check(base, path);
  for (let attempt = 0; !r.ok && r.status === 0 && attempt < 2; attempt++) {
    await new Promise((res) => setTimeout(res, attempt === 0 ? 600 : 1500));
    r = await check(base, path);
  }
  return r;
}

async function waitForHealth(base, attempts = 30, delayMs = 2000) {
  for (let i = 0; i < attempts; i++) {
    try {
      const h = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(10_000) });
      if (h.ok) return true;
    } catch {
      // retry
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function main() {
  const BASE = await resolveBaseUrl();
  const hrefs = collectAllMenuHrefs();
  console.log(`Menü href smoke test → ${BASE}`);
  console.log(`${hrefs.length} benzersiz link\n`);

  process.stdout.write('Sunucu bekleniyor…');
  const ready = await waitForHealth(BASE);
  console.log(ready ? ' hazır\n' : ' zaman aşımı\n');
  if (!ready) {
    console.error('Dev sunucu çalışmıyor — npm run dev ile başlatın.');
    process.exit(1);
  }

  // İlk derleme için birkaç sayfa ısıt
  for (const warm of hrefs.slice(0, 8)) {
    await check(BASE, warm).catch(() => undefined);
    await new Promise((r) => setTimeout(r, 80));
  }
  await new Promise((r) => setTimeout(r, 1500));

  let failed = 0;
  const failures = [];
  for (let i = 0; i < hrefs.length; i++) {
    const path = hrefs[i];
    const r = await checkWithRetry(BASE, path);
    if (!r.ok) {
      failed++;
      failures.push(r);
      console.log(`✗ ${r.status} ${path}${r.error ? ` (${r.error})` : ''}`);
    } else if (process.env.MENU_TEST_VERBOSE === '1') {
      console.log(`✓ ${r.status} ${path}`);
    }
    if (i > 0 && i % 20 === 0) {
      await new Promise((res) => setTimeout(res, 300));
    }
  }

  const ok = hrefs.length - failed;
  console.log(`\n${ok}/${hrefs.length} menü linki OK`);
  if (failures.length) {
    console.warn(`· ${failures.length} başarısız`);
    process.exit(1);
  }
}

main();
