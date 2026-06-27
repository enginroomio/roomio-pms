#!/usr/bin/env node
/**
 * Roomio'yu tek komutla ayağa kaldırır.
 * Port 3100 meşgulse önce temizler; yine olmazsa boş port bulur.
 *
 *   npm run up
 *   npm run up -- --dev
 */
import { spawn, execSync } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PREFERRED = Number(process.env.PORT ?? 3100);
const BIND_HOST = process.env.ROOMIO_BIND_HOST ?? process.env.HOST ?? process.env.ROOMIO_HOST ?? '0.0.0.0';
const CONNECT_HOST = process.env.ROOMIO_CONNECT_HOST ?? '127.0.0.1';
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
  if (port !== PREFERRED) {
    console.warn(`[up] Uyarı: ${PREFERRED} meşgul → ${port} kullanılıyor`);
  }

  if (!devMode) {
    console.log('[up] Veritabanı…');
    await run('npm', ['run', 'db:push']);
    console.log('[up] Production build…');
    await run('npm', ['run', 'build']);
  }

  const args = devMode
    ? ['run', 'dev']
    : ['exec', 'next', 'start', '-H', BIND_HOST, '-p', String(port)];

  console.log('\n════════════════════════════════════════');
  console.log(`  Roomio hazır → http://${CONNECT_HOST}:${port}`);
  console.log(`  Rollout    → http://${CONNECT_HOST}:${port}/tools/rollout`);
  console.log('════════════════════════════════════════\n');

  if (devMode) {
    await run('npm', ['run', 'dev']);
  } else {
    const child = spawn('npx', ['next', 'start', '-H', BIND_HOST, '-p', String(port)], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => process.exit(code ?? 0));
  }
}

main().catch((err) => {
  console.error('[up]', err.message);
  process.exit(1);
});
