#!/usr/bin/env node
/**
 * Orijinal ana sayfa + bulut yedek + gün sonu modül doğrulaması.
 *
 *   node scripts/verify-modules.mjs
 *   ROOMIO_URL=http://127.0.0.1:3100 node scripts/verify-modules.mjs --e2e
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const withE2e = process.argv.includes('--e2e');

function baseUrl() {
  if (process.env.ROOMIO_URL) return process.env.ROOMIO_URL.replace(/\/$/, '');
  const portFile = join(ROOT, '.roomio/runtime/active-port.txt');
  if (existsSync(portFile)) {
    const p = readFileSync(portFile, 'utf8').trim();
    if (p) return `http://127.0.0.1:${p}`;
  }
  return 'http://127.0.0.1:3100';
}

function run(label, cmd, args, env = {}) {
  console.log(`\n▶ ${label}\n`);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, ...env },
  });
  if (r.status !== 0) {
    console.error(`\n✗ ${label} başarısız (kod ${r.status})\n`);
    process.exit(r.status ?? 1);
  }
}

function chromiumInstalled() {
  const r = spawnSync(
    'node',
    ['-e', "const { chromium } = require('playwright'); const p = chromium.executablePath(); process.exit(require('fs').existsSync(p)?0:1)"],
    { cwd: ROOT, encoding: 'utf8' },
  );
  return r.status === 0;
}

async function main() {
  const BASE = baseUrl();
  console.log('════════════════════════════════════════');
  console.log('  Roomio — verify:modules');
  console.log(`  Sunucu: ${BASE}`);
  console.log('════════════════════════════════════════');

  run('Birim — modül paketi', 'npm', ['run', 'test:modules:unit']);

  try {
    const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      run('API — bulut yedek', 'node', ['scripts/test-cloud-backup-api.mjs'], { ROOMIO_URL: BASE });
    } else {
      console.log('\n· Bulut yedek API atlandı (sunucu yanıt vermiyor)\n');
    }
  } catch {
    console.log('\n· Bulut yedek API atlandı (sunucu kapalı)\n');
  }

  if (withE2e) {
    if (!chromiumInstalled()) {
      console.error('✗ Playwright chromium gerekli: npx playwright install chromium');
      process.exit(1);
    }
    run('E2E — modül paketi', 'npm', ['run', 'test:modules:e2e'], {
      ROOMIO_URL: BASE,
      PLAYWRIGHT_REUSE_SERVER: '1',
      PLAYWRIGHT_SKIP_WARM: '1',
      ROOMIO_AUTH_REQUIRED: '0',
    });
  }

  console.log('\n════════════════════════════════════════');
  console.log('  ✓ verify:modules tamamlandı');
  console.log('════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
