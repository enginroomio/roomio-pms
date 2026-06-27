#!/usr/bin/env node
/**
 * Mockup PNG envanteri — kod referanslarını public/mockups ile doğrular.
 * Kullanım:
 *   node scripts/audit-mockups.mjs           # dosya sistemi denetimi
 *   node scripts/audit-mockups.mjs --http    # + referans PNG HTTP 200
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const MOCK_DIR = join(ROOT, 'public/mockups');
const http = process.argv.includes('--http');
const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';

function readActivePort() {
  try {
    const port = readFileSync(join(ROOT, '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

function catalogMockups() {
  const path = join(ROOT, 'public/screen-catalog.json');
  if (!existsSync(path)) return [];
  const catalog = JSON.parse(readFileSync(path, 'utf8'));
  return catalog.screens.map((s) => s.file);
}

function scanCodeRefs(dir, acc = new Set()) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (name.name === 'node_modules' || name.name === '.next' || name.name === '.git' || name.name === 'references') continue;
    const path = join(dir, name.name);
    if (name.isDirectory()) {
      scanCodeRefs(path, acc);
      continue;
    }
    if (!/\.(tsx?|jsx?|mjs|md|json)$/.test(name.name)) continue;
    if (name.name === 'screen-catalog.json') continue;
    const text = readFileSync(path, 'utf8');
    for (const m of text.matchAll(/\/mockups\/([A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpe?g|webp))/gi)) {
      acc.add(m[1]);
    }
  }
  return acc;
}

function pngOnDisk() {
  return readdirSync(MOCK_DIR).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
}

async function checkHttp(file) {
  const url = `${BASE}/mockups/${file}`;
  const res = await fetch(url, { redirect: 'follow' });
  return res.status === 200;
}

async function main() {
  const catalog = new Set(catalogMockups());
  const refs = scanCodeRefs(ROOT);
  const disk = new Set(pngOnDisk());

  const refMissing = [...refs].filter((f) => !disk.has(f)).sort();
  const uncatalogued = [...disk].filter((f) => !catalog.has(f)).sort();

  console.log(`Mockup envanteri → ${MOCK_DIR}`);
  console.log(`Disk: ${disk.size} görsel · Katalog: ${catalog.size} · Kod refs: ${refs.size}\n`);

  let failed = 0;

  console.log('── Kod referansları ──');
  if (refMissing.length) {
    failed += refMissing.length;
    for (const f of refMissing) console.log(`✗ referans var, dosya yok  ${f}`);
  } else {
    console.log(refs.size ? `✓ Tüm kod referansları (${refs.size}) diskte` : '✓ Kodda PNG mockup referansı yok');
  }

  console.log('\n── Katalog dışı PNG ──');
  if (uncatalogued.length) {
    console.log(`${uncatalogued.length} dosya screen-catalog.json dışında:`);
    for (const f of uncatalogued) console.log(`  · ${f}`);
  } else if (disk.size) {
    console.log('✓ Tüm PNG dosyaları katalogda');
  } else {
    console.log('— mockups klasörü boş');
  }

  if (http && refs.size) {
    console.log(`\n── HTTP smoke (${BASE}) ──`);
    let ok = 0;
    for (const f of refs) {
      if (!disk.has(f)) continue;
      const pass = await checkHttp(f);
      if (pass) {
        ok += 1;
        console.log(`✓ ${f}`);
      } else {
        failed += 1;
        console.log(`✗ HTTP ${f}`);
      }
    }
    console.log(`\n${ok}/${refs.size} referans PNG HTTP 200`);
  }

  console.log(failed ? `\n${failed} sorun` : '\nEnvanter temiz');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
