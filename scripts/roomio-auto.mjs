#!/usr/bin/env node
/**
 * Otomatik: eski portları temizle → sunucuyu doğrula/başlat → adım testleri → (isteğe bağlı) tarayıcı aç
 *
 *   npm run auto
 *   npm run auto:open
 */
import { execSync, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseUrlForPort, ensureRoomioServer } from './roomio-port.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const openBrowser = process.argv.includes('--open');
const prune = process.argv.includes('--prune');

function runTests(baseUrl) {
  console.log('\n── Otomatik testler (4 adım) ──\n');
  const r = spawnSync('node', ['scripts/test-faz4-steps.mjs'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ROOMIO_URL: baseUrl.replace(/\/$/, '') },
  });
  return r.status === 0;
}

async function main() {
  console.log('\n════════════════════════════════════════');
  console.log('  Roomio — Otomatik doğrulama');
  console.log('════════════════════════════════════════\n');

  console.log('── 1/3 Sunucu doğrulama ──');
  const port = await ensureRoomioServer({ prune });
  const baseUrl = baseUrlForPort(port);
  writeActivePortNote(port);

  console.log('\n── 2/3 Smoke testler ──');
  const ok = runTests(baseUrl);

  if (openBrowser) {
    console.log('\n── 3/3 Tarayıcı ──');
    try {
      execSync(`open -a "Google Chrome" ${JSON.stringify(baseUrl)}`, { stdio: 'ignore' });
    } catch {
      try {
        execSync(`open ${JSON.stringify(baseUrl)}`, { stdio: 'ignore' });
      } catch {
        console.log(`  Tarayıcı açılamadı — ${baseUrl}`);
      }
    }
  } else {
    console.log('\n── 3/3 Tarayıcı atlandı (npm run auto:open ile açılır) ──');
  }

  console.log(`\n${ok ? '✅ Otomasyon tamamlandı' : '❌ Testler başarısız'} → ${baseUrl}\n`);
  process.exit(ok ? 0 : 1);
}

function writeActivePortNote(port) {
  if (port !== 3100) {
    console.log(`  Not: http://127.0.0.1:3100 eski olabilir — ${baseUrlForPort(port)} kullanın`);
  }
}

main().catch((err) => {
  console.error('[auto]', err.message);
  process.exit(1);
});
