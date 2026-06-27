#!/usr/bin/env node
/**
 * Roomio'yu tek komutla ayağa kaldırır.
 * Port 3100 meşgulse önce temizler; yine olmazsa boş port bulur.
 *
 *   npm run up
 *   npm run up -- --dev
 */
import { spawn, execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { syncStandaloneAssets } from './sync-standalone-assets.mjs';
import { roomioDatabaseUrl } from './roomio-db-url.mjs';
import {
  baseUrlForPort,
  BIND_HOST,
  CONNECT_HOST,
  verifyHomeAssets,
  waitForHealth,
  writeActivePort,
} from './roomio-port.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PREFERRED = Number(process.env.PORT ?? process.env.ROOMIO_PORT ?? 3100);
const devMode = process.argv.includes('--dev');

function killPort(port) {
  try {
    const out = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
    if (!out) return;
    for (const pid of out.split(/\s+/)) {
      if (!pid) continue;
      try {
        process.kill(Number(pid), 'SIGKILL');
        console.log(`[up] Kapatıldı PID ${pid} (port ${port})`);
      } catch {
        // ignore
      }
    }
  } catch {
    // port boş
  }
}

function portFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen(port, BIND_HOST, () => server.close(() => resolve(true)));
  });
}

async function pickPort() {
  killPort(PREFERRED);
  await new Promise((r) => setTimeout(r, 800));
  if (await portFree(PREFERRED)) return PREFERRED;
  for (let p = PREFERRED + 1; p < PREFERRED + 100; p++) {
    if (await portFree(p)) return p;
  }
  throw new Error('Boş port bulunamadı');
}

async function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

async function main() {
  const port = await pickPort();
  writeActivePort(port);
  if (port !== PREFERRED) {
    console.warn(`[up] Uyarı: ${PREFERRED} meşgul → ${port} kullanılıyor`);
    console.warn(`[up] http://${CONNECT_HOST}:${PREFERRED} eski/hatalı sunucu olabilir.`);
  }

  if (!devMode) {
    console.log('[up] Veritabanı…');
    await run('npm', ['run', 'db:push']);
    console.log('[up] Production build…');
    await run('npm', ['run', 'build']);
    syncStandaloneAssets();
  }

  const baseUrl = baseUrlForPort(port);
  const dbUrl = roomioDatabaseUrl();
  const standaloneServer = join(ROOT, '.next', 'standalone', 'server.js');
  const useStandalone = !devMode && existsSync(standaloneServer);
  const nextBin = join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');

  console.log('\n════════════════════════════════════════');
  console.log(`  Roomio başlatılıyor → ${baseUrl}`);
  console.log(`  Rollout           → ${baseUrl}tools/rollout`);
  console.log('════════════════════════════════════════\n');

  if (devMode) {
    await run('npm', ['run', 'dev']);
    return;
  }

  const prodEnv = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(port),
    HOSTNAME: BIND_HOST,
    DATABASE_URL: dbUrl,
  };

  const child = useStandalone
    ? spawn(process.execPath, [standaloneServer], {
        cwd: join(ROOT, '.next', 'standalone'),
        stdio: 'inherit',
        env: prodEnv,
      })
    : spawn(process.execPath, [nextBin, 'start', '-H', BIND_HOST, '-p', String(port)], {
        cwd: ROOT,
        stdio: 'inherit',
        env: prodEnv,
      });

  child.on('exit', (code) => process.exit(code ?? 0));

  await waitForHealth(baseUrl);
  await verifyHomeAssets(baseUrl);

  try {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'public', 'release-manifest.json'), 'utf8'));
    console.log(`\n✓ Roomio hazır · ${manifest.label}`);
  } catch {
    console.log(`\n✓ Roomio hazır → ${baseUrl}`);
  }
}

main().catch((err) => {
  console.error('[up]', err.message);
  process.exit(1);
});
