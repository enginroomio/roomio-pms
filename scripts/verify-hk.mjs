#!/usr/bin/env node
/**
 * HK modülü doğrulama — sağ tık menü + rollout + menü URL'leri.
 * Mevcut sunucu: ROOMIO_URL=http://127.0.0.1:3100 npm run verify:hk
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

function baseUrl() {
  if (process.env.ROOMIO_URL) return process.env.ROOMIO_URL.replace(/\/$/, '');
  const portFile = join(ROOT, '.roomio/runtime/active-port.txt');
  if (existsSync(portFile)) {
    const p = readFileSync(portFile, 'utf8').trim();
    if (p) return `http://127.0.0.1:${p}`;
  }
  return 'http://127.0.0.1:3100';
}

function run(label, args, config = 'playwright.rollout.config.ts') {
  console.log(`\n▶ ${label}\n`);
  const r = spawnSync(
    'npx',
    ['playwright', 'test', ...args, '-c', config, '--reporter=line'],
    {
      cwd: ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        ROOMIO_URL: baseUrl(),
        PLAYWRIGHT_REUSE_SERVER: '1',
        PLAYWRIGHT_SKIP_WARM: '1',
        ROOMIO_AUTH_REQUIRED: '0',
      },
    },
  );
  if (r.status !== 0) {
    console.error(`\n✗ ${label} başarısız\n`);
    process.exit(r.status ?? 1);
  }
}

async function main() {
  const BASE = baseUrl();
  console.log('════════════════════════════════════════');
  console.log('  Roomio — verify:hk');
  console.log(`  Sunucu: ${BASE}`);
  console.log('════════════════════════════════════════');

  try {
    const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`health ${res.status}`);
  } catch {
    console.error(`✗ Sunucu yanıt vermiyor: ${BASE}/api/health`);
    console.error('  Önce: npm run dev');
    process.exit(1);
  }

  run('HK sağ tık menü', ['e2e/hk-context-menu.spec.ts']);
  run('Rollout Kat HK', ['e2e/rollout-kat.spec.ts']);
  run('Menü URL Kat HK', ['e2e/menu-params-kat.spec.ts']);

  console.log('\n════════════════════════════════════════');
  console.log('  ✓ verify:hk tamamlandı');
  console.log('════════════════════════════════════════\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
