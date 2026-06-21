#!/usr/bin/env node
/**
 * Roomio'yu temiz şekilde yeniden başlatır.
 *   npm run restart
 *   npm run restart:dev
 */
import { spawn, execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  baseUrlForPort,
  findWorkingPort,
  preparePort,
  pruneStaleServers,
  verifyHomeAssets,
  waitForHealth,
  writeActivePort,
} from './roomio-port.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = process.env.ROOMIO_HOST ?? '127.0.0.1';
const devMode = process.argv.includes('--dev');
const skipTest = process.argv.includes('--no-test');
const BUILD_ID = join(ROOT, '.next', 'BUILD_ID');
const SERVER_DIR = join(ROOT, '.next', 'server');

function run(cmd, args) {
  execSync([cmd, ...args].join(' '), { cwd: ROOT, stdio: 'inherit', shell: true });
}

function runAutoTests(baseUrl) {
  if (skipTest) return true;
  console.log('\n[restart] Otomatik smoke testleri…\n');
  const r = spawnSync('node', ['scripts/test-faz4-steps.mjs'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ROOMIO_URL: baseUrl.replace(/\/$/, '') },
  });
  return r.status === 0;
}

function hasValidBuild() {
  return existsSync(BUILD_ID) && existsSync(SERVER_DIR);
}

function cleanBuild() {
  console.log('[restart] .next temizleniyor…');
  rmSync(join(ROOT, '.next'), { recursive: true, force: true });
}

async function main() {
  const force = process.argv.includes('--force');

  console.log('[restart] Güncel sunucu aranıyor…');
  if (process.argv.includes('--prune')) await pruneStaleServers();

  const existing = force ? null : await findWorkingPort();
  if (existing) {
    writeActivePort(existing);
    const baseUrl = baseUrlForPort(existing);
    console.log(`\n✓ Güncel Roomio çalışıyor → ${baseUrl}\n`);
    runAutoTests(baseUrl);
    return;
  }

  console.log('\n════════════════════════════════════════');
  console.log('  Roomio — Temiz yeniden başlatma');
  console.log('════════════════════════════════════════\n');

  try {
    run('node', ['scripts/roomio-kill-ports.mjs']);
  } catch {
    console.warn('[restart] Bazı portlar kapatılamadı — devam ediliyor…');
  }

  if (!devMode) {
    run('npm', ['run', 'db:push']);

    if (!hasValidBuild() || process.argv.includes('--force-build') || force) {
      cleanBuild();
    }

    console.log('[restart] Production build…');
    try {
      run('npm', ['run', 'build']);
    } catch {
      cleanBuild();
      run('npm', ['run', 'build']);
    }

    run('node', ['scripts/write-release-manifest.mjs']);
  }

  const port = await preparePort();
  writeActivePort(port);

  const nextBin = join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  const args = devMode
    ? [nextBin, 'dev', '-H', HOST, '-p', String(port)]
    : [nextBin, 'start', '-H', HOST, '-p', String(port)];

  const baseUrl = baseUrlForPort(port);
  console.log(`[restart] Sunucu başlatılıyor → ${baseUrl}`);

  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    stdio: 'inherit',
    detached: false,
    env: { ...process.env, NODE_ENV: devMode ? 'development' : 'production' },
  });

  child.on('exit', (code) => process.exit(code ?? 0));

  if (!devMode) {
    await waitForHealth(baseUrl);
    await verifyHomeAssets(baseUrl);
    const manifest = JSON.parse(readFileSync(join(ROOT, 'public', 'release-manifest.json'), 'utf8'));
    console.log(`\n✓ Roomio hazır · ${manifest.label}`);
    console.log(`  → ${baseUrl}\n`);
    runAutoTests(baseUrl);
  }
}

main().catch((err) => {
  console.error('[restart]', err.message);
  process.exit(1);
});
