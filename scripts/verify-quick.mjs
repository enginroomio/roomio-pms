#!/usr/bin/env node
/**
 * Hızlı doğrulama — mevcut sunucu üzerinde (sunucu başlatmaz).
 * Kullanım:
 *   ROOMIO_URL=http://127.0.0.1:3100 npm run verify:quick
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

function baseUrl() {
  if (process.env.ROOMIO_URL) return process.env.ROOMIO_URL.replace(/\/$/, '');
  if (process.env.ROOMIO_PUBLIC_URL) return process.env.ROOMIO_PUBLIC_URL.replace(/\/$/, '');
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

async function main() {
  const BASE = baseUrl();
  console.log('════════════════════════════════════════');
  console.log('  Roomio — verify:quick');
  console.log(`  Sunucu: ${BASE}`);
  console.log('════════════════════════════════════════');

  try {
    const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`health ${res.status}`);
  } catch {
    console.error(`✗ Sunucu yanıt vermiyor: ${BASE}/api/health`);
    console.error('  Önce: npm run dev  veya  npm run verify:all');
    process.exit(1);
  }

  run('Typecheck', 'npm', ['run', 'typecheck']);
  run('Deploy checklist', 'npm', ['run', 'deploy:checklist'], {
    ROOMIO_URL: BASE,
    ROOMIO_PUBLIC_URL: BASE,
  });

  const e2eEnv = {
    ROOMIO_URL: BASE,
    PLAYWRIGHT_REUSE_SERVER: '1',
    ROOMIO_AUTH_REQUIRED: '0',
  };

  const suites = [
    ['E2E — auth API', 'e2e/api-protected.spec.ts'],
    ['E2E — folio API', 'e2e/folio-cash.spec.ts', 'Folyo API|Kasa API'],
    ['E2E — entegrasyonlar', 'e2e/integrations.spec.ts'],
  ];

  for (const [label, spec, grep] of suites) {
    const args = ['run', 'test:e2e', '--', spec];
    if (grep) args.push('-g', grep);
    run(label, 'npm', args, e2eEnv);
  }

  console.log('\n════════════════════════════════════════');
  console.log('  ✓ verify:quick tamamlandı');
  console.log('════════════════════════════════════════\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
