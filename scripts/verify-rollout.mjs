#!/usr/bin/env node
/**
 * Tüm rollout-*.spec.ts E2E (chromium gerekli).
 * verify:ui alt kümesini genişletir: günsonu, kat, misafir, raporlar, sistem dahil.
 * Kullanım: npm run verify:rollout
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PORT = process.env.VERIFY_PORT ?? '3117';
const BASE = `http://127.0.0.1:${PORT}`;
const REUSE = process.env.PLAYWRIGHT_REUSE_SERVER === '1';

const ROLLOUT_SPECS = [
  'e2e/rollout-shell.spec.ts',
  'e2e/rollout-home.spec.ts',
  'e2e/rollout-rezervasyon.spec.ts',
  'e2e/rollout-resepsiyon.spec.ts',
  'e2e/rollout-onkasa.spec.ts',
  'e2e/rollout-gunsonu.spec.ts',
  'e2e/rollout-kat.spec.ts',
  'e2e/rollout-misafir.spec.ts',
  'e2e/rollout-raporlar.spec.ts',
  'e2e/rollout-sistem.spec.ts',
];

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

async function waitHealth(maxMs = 180_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const home = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(20_000) });
      if (!home.ok) throw new Error(`home ${home.status}`);
      try {
        const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(10_000) });
        if (res.ok) {
          const j = await res.json();
          if (j.ok) return true;
        }
      } catch {
        /* dev derlemesinde /api/health geçici yanıt vermeyebilir */
      }
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
  console.log('  Roomio — verify:rollout (tüm rollout E2E)');
  console.log(`  Port: ${PORT} — ${ROLLOUT_SPECS.length} spec`);
  console.log('════════════════════════════════════════');

  let server = null;
  if (!REUSE) {
    killPort();
    mkdirSync(join(ROOT, '.roomio/runtime'), { recursive: true });
    writeFileSync(join(ROOT, '.roomio/runtime/active-port.txt'), PORT);
    server = spawn('npx', ['next', 'dev', '-p', PORT, '-H', '127.0.0.1'], {
      cwd: ROOT,
      stdio: 'ignore',
      env: { ...process.env, ROOMIO_AUTH_REQUIRED: '0', WATCHPACK_POLLING: 'true' },
    });
    if (!(await waitHealth())) {
      server.kill('SIGTERM');
      console.error('✗ Sunucu hazır değil');
      process.exit(1);
    }
  } else if (!(await waitHealth())) {
    console.error(`✗ Mevcut sunucu hazır değil (${BASE}) — önce dev sunucuyu başlatın veya PLAYWRIGHT_REUSE_SERVER=0 kullanın`);
    process.exit(1);
  }

  const e2eEnv = {
    ROOMIO_URL: BASE,
    PLAYWRIGHT_REUSE_SERVER: '1',
    PLAYWRIGHT_PORT: PORT,
    ROOMIO_AUTH_REQUIRED: '0',
  };

  for (const spec of ROLLOUT_SPECS) {
    if (!(await waitHealth(120_000))) {
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
  console.log('  ✓ verify:rollout tamamlandı');
  console.log(`    · ${ROLLOUT_SPECS.length} rollout spec`);
  console.log('════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
