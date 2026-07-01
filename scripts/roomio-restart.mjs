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
import { syncStandaloneAssets } from './sync-standalone-assets.mjs';
import { roomioDatabaseUrl } from './roomio-db-url.mjs';
import {
  baseUrlForPort,
  BIND_HOST,
  findWorkingPort,
  preparePort,
  pruneStaleServers,
  verifyHomeAssets,
  waitForHealth,
  writeActivePort,
} from './roomio-port.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
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
  const quick = process.argv.includes('--quick');

  console.log('[restart] Güncel sunucu aranıyor…');
  if (process.argv.includes('--prune')) await pruneStaleServers();

  const existing = force || quick ? null : await findWorkingPort();
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

    const mustBuild = !hasValidBuild() || process.argv.includes('--force-build');
    if (mustBuild) {
      if (process.argv.includes('--force-build') || force) cleanBuild();
      console.log('[restart] Production build…');
      try {
        run('npm', ['run', 'build']);
      } catch {
        cleanBuild();
        run('npm', ['run', 'build']);
      }
      run('node', ['scripts/write-release-manifest.mjs']);
    }
    syncStandaloneAssets();
  }

  const port = await preparePort();
  writeActivePort(port);

  const baseUrl = baseUrlForPort(port);
  console.log(`[restart] Sunucu başlatılıyor → ${baseUrl}`);

  const standaloneServer = join(ROOT, '.next', 'standalone', 'server.js');
  const useStandalone = !devMode && existsSync(standaloneServer);

  const dbUrl = roomioDatabaseUrl();
  const prodEnv = { ...process.env, NODE_ENV: 'production', PORT: String(port), HOSTNAME: BIND_HOST, DATABASE_URL: dbUrl };

  const child = useStandalone
    ? spawn(process.execPath, [standaloneServer], {
        cwd: join(ROOT, '.next', 'standalone'),
        stdio: 'inherit',
        detached: false,
        env: prodEnv,
      })
    : spawn(process.execPath, [join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'), ...(devMode ? ['dev'] : ['start']), '-H', BIND_HOST, '-p', String(port)], {
        cwd: ROOT,
        stdio: 'inherit',
        detached: false,
        env: { ...process.env, NODE_ENV: devMode ? 'development' : 'production', DATABASE_URL: dbUrl },
      });

  child.on('exit', (code) => process.exit(code ?? 0));

  if (!devMode) {
    await waitForHealth(baseUrl);
    if (!quick) {
      await verifyHomeAssets(baseUrl);
    }
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
