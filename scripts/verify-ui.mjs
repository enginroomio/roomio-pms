#!/usr/bin/env node
/**
 * Playwright UI rollout testleri (chromium gerekli).
 * verify:all sonrası veya bağımsız: npm run verify:ui
 *
 * Ortam: VERIFY_PORT (varsayılan 3117), mevcut sunucu için PLAYWRIGHT_REUSE_SERVER=1
 */
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PORT = process.env.VERIFY_PORT ?? '3117';
const BASE = `http://127.0.0.1:${PORT}`;
const REUSE = process.env.PLAYWRIGHT_REUSE_SERVER === '1';

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

function killPort() {
  spawnSync(`lsof -ti :${PORT} 2>/dev/null | xargs kill -9 2>/dev/null; true`, { shell: true, stdio: 'ignore' });
}

async function waitHealth(maxMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const j = await res.json();
        if (j.ok) return true;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

async function main() {
  if (!chromiumInstalled()) {
    console.error('✗ Playwright chromium kurulu değil. Çalıştırın: npx playwright install chromium');
    process.exit(1);
  }

  console.log('════════════════════════════════════════');
  console.log('  Roomio — verify:ui (rollout)');
  console.log(`  Port: ${PORT}`);
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
        WATCHPACK_POLLING: 'true',
        ROOMIO_DISABLE_RATE_LIMIT: '1',
      },
    });
    const healthy = await waitHealth();
    if (!healthy) {
      server.kill('SIGTERM');
      console.error('✗ Sunucu hazır değil');
      process.exit(1);
    }
  }

  const e2eEnv = {
    ROOMIO_URL: BASE,
    PLAYWRIGHT_REUSE_SERVER: '1',
    PLAYWRIGHT_PORT: PORT,
    ROOMIO_AUTH_REQUIRED: '0',
  };

  const specs = [
    ['E2E — kabuk rollout', 'e2e/rollout-shell.spec.ts'],
    ['E2E — ana sayfa rollout', 'e2e/rollout-home.spec.ts'],
    ['E2E — rezervasyon rollout', 'e2e/rollout-rezervasyon.spec.ts'],
    ['E2E — resepsiyon rollout', 'e2e/rollout-resepsiyon.spec.ts'],
    ['E2E — ön kasa rollout', 'e2e/rollout-onkasa.spec.ts'],
    ['E2E — folio UI', 'e2e/folio-cash.spec.ts', 'Folyo UI'],
    ['E2E — i18n & PWA UI', 'e2e/i18n-pwa.spec.ts', 'dil değişince|offline sayfası|service worker'],
    ['E2E — login & şube UI', 'e2e/auth-multiproperty.spec.ts', 'giriş akışı|şube değişince|konsolide rapor sekmesi'],
    ['E2E — roomio sayfa UI', 'e2e/roomio.spec.ts', 'ana sayfa|oda rack|muhasebe|kat hizmetleri|rezervasyon'],
  ];

  for (const [label, spec, grep] of specs) {
    const args = ['run', 'test:e2e', '--', spec];
    if (grep) args.push('-g', grep);
    run(label, 'npm', args, e2eEnv);
  }

  if (server) server.kill('SIGTERM');
  if (!REUSE) killPort();

  console.log('\n════════════════════════════════════════');
  console.log('  ✓ verify:ui tamamlandı');
  console.log('════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
