#!/usr/bin/env node
/**
 * Tüm menu-params*.spec.ts E2E (chromium gerekli).
 * Kullanım: npm run verify:menu-params
 * Mevcut sunucu: PLAYWRIGHT_REUSE_SERVER=1 ROOMIO_URL=http://127.0.0.1:3100 npm run verify:menu-params
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MENU_PARAMS_SPECS = [
  'e2e/menu-params.spec.ts',
  'e2e/menu-params-sistem.spec.ts',
  'e2e/menu-params-rezervasyon.spec.ts',
  'e2e/menu-params-resepsiyon.spec.ts',
  'e2e/menu-params-onkasa.spec.ts',
  'e2e/menu-params-kat.spec.ts',
  'e2e/menu-params-misafir.spec.ts',
  'e2e/menu-params-raporlar.spec.ts',
  'e2e/menu-params-arkaburo.spec.ts',
  'e2e/menu-params-ayarlar.spec.ts',
];

const ROOT = process.cwd();
const PORT = process.env.VERIFY_PORT ?? '3119';

function baseUrl() {
  if (process.env.ROOMIO_URL) return process.env.ROOMIO_URL.replace(/\/$/, '');
  const portFile = join(ROOT, '.roomio/runtime/active-port.txt');
  if (existsSync(portFile)) {
    const p = readFileSync(portFile, 'utf8').trim();
    if (p) return `http://127.0.0.1:${p}`;
  }
  return `http://127.0.0.1:${PORT}`;
}

const REUSE = process.env.PLAYWRIGHT_REUSE_SERVER === '1';
const BASE = REUSE ? baseUrl() : `http://127.0.0.1:${PORT}`;

function chromiumInstalled() {
  const r = spawnSync(
    'node',
    ['-e', "const { chromium } = require('playwright'); const p = chromium.executablePath(); process.exit(require('fs').existsSync(p)?0:1)"],
    { cwd: ROOT, encoding: 'utf8' },
  );
  return r.status === 0;
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

function killPort() {
  spawnSync(`lsof -ti :${PORT} 2>/dev/null | xargs kill -9 2>/dev/null; true`, { shell: true, stdio: 'ignore' });
}

async function waitHealth(maxMs = 180_000, { requireHome = true } = {}) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`health ${res.status}`);
      if (!requireHome) return true;
      const home = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(20_000) });
      if (!home.ok) throw new Error(`home ${home.status}`);
      return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

async function main() {
  if (!chromiumInstalled()) {
    console.error('✗ Playwright chromium kurulu değil. Çalıştırın: npx playwright install chromium');
    process.exit(1);
  }

  console.log('════════════════════════════════════════');
  console.log('  Roomio — verify:menu-params (tüm URL E2E)');
  console.log(`  Port: ${PORT} — ${MENU_PARAMS_SPECS.length} spec`);
  console.log('════════════════════════════════════════');

  let server = null;
  if (!REUSE) {
    killPort();
    mkdirSync(join(ROOT, '.roomio/runtime'), { recursive: true });
    writeFileSync(join(ROOT, '.roomio/runtime/active-port.txt'), PORT);
    server = spawn('npx', ['next', 'dev', '-p', PORT, '-H', '127.0.0.1'], {
      cwd: ROOT,
      stdio: 'ignore',
      env: {
        ...process.env,
        ROOMIO_AUTH_REQUIRED: '0',
        ROOMIO_DEMO_AUTH: '1',
        WATCHPACK_POLLING: 'true',
      },
    });
    if (!(await waitHealth())) {
      server.kill('SIGTERM');
      console.error('✗ Sunucu hazır değil');
      process.exit(1);
    }
  } else if (!(await waitHealth())) {
    console.error(`✗ Mevcut sunucu hazır değil (${BASE})`);
    process.exit(1);
  }

  const e2eEnv = {
    ROOMIO_URL: BASE,
    PLAYWRIGHT_REUSE_SERVER: '1',
    PLAYWRIGHT_PORT: PORT,
    ROOMIO_AUTH_REQUIRED: '0',
  };

  for (const spec of MENU_PARAMS_SPECS) {
    if (!(await waitHealth(120_000, { requireHome: false }))) {
      console.error(`✗ Sunucu yanıt vermiyor — ${spec} öncesi durdu`);
      if (server) server.kill('SIGTERM');
      process.exit(1);
    }
    const label = `E2E — ${spec.replace('e2e/', '').replace('.spec.ts', '')}`;
    run(label, 'npx', ['playwright', 'test', '--config=playwright.rollout.config.ts', spec], e2eEnv);
  }

  if (server) {
    server.kill('SIGTERM');
    killPort();
  }

  console.log('\n════════════════════════════════════════');
  console.log('  ✓ verify:menu-params tamamlandı');
  console.log(`    · ${MENU_PARAMS_SPECS.length} menu-params spec`);
  console.log('════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
