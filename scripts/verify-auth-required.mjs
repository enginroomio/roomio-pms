#!/usr/bin/env node
/**
 * Production auth modu smoke — ROOMIO_AUTH_REQUIRED=1 + JWT 401/403 matrisi.
 * Kullanım: npm run verify:auth
 */
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const PORT = process.env.VERIFY_AUTH_PORT ?? process.env.VERIFY_PORT ?? '3119';
const BASE = `http://127.0.0.1:${PORT}`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function killPort() {
  spawnSync(`lsof -ti :${PORT} 2>/dev/null | xargs kill -9 2>/dev/null; true`, { shell: true, stdio: 'ignore' });
}

async function dashboardStatus() {
  try {
    const res = await fetch(`${BASE}/api/dashboard`, { signal: AbortSignal.timeout(5000) });
    return res.status;
  } catch {
    return 0;
  }
}

async function preparePort() {
  killPort();
  await sleep(800);
  const status = await dashboardStatus();
  if (status === 0) return { reuse: false };
  if (status === 401) {
    console.log(`· Port ${PORT} auth-required sunucu ile dolu — yeniden kullanılıyor\n`);
    return { reuse: true };
  }
  console.error(`✗ Port ${PORT} demo modda sunucu çalışıyor (dashboard ${status}).`);
  console.error(`  Kapatın: lsof -ti :${PORT} | xargs kill -9`);
  console.error(`  veya VERIFY_AUTH_PORT=3120 npm run verify:auth\n`);
  process.exit(1);
}

async function main() {
  console.log('════════════════════════════════════════');
  console.log('  Roomio — verify:auth (ROOMIO_AUTH_REQUIRED=1)');
  console.log(`  Port: ${PORT}`);
  console.log('════════════════════════════════════════');

  const { reuse } = await preparePort();

  console.log('\n▶ E2E — auth-required smoke\n');
  const r = spawnSync('npm', ['run', 'test:e2e', '--', 'e2e/auth-required.spec.ts'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      ROOMIO_URL: BASE,
      PLAYWRIGHT_PORT: PORT,
      ROOMIO_AUTH_REQUIRED: '1',
      ...(reuse ? { PLAYWRIGHT_REUSE_SERVER: '1' } : {}),
    },
  });

  if (!reuse) killPort();

  if (r.status !== 0) {
    console.error(`\n✗ verify:auth başarısız (kod ${r.status})\n`);
    process.exit(r.status ?? 1);
  }

  console.log('\n════════════════════════════════════════');
  console.log('  ✓ verify:auth tamamlandı');
  console.log('════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
