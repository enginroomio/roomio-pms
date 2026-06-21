#!/usr/bin/env node
/**
 * Production Docker smoke testi.
 * Kullanım: npm run test:docker
 */
import { execSync, spawnSync } from 'node:child_process';

const IMAGE = process.env.ROOMIO_DOCKER_IMAGE ?? 'roomio-pms:test';
const PORT = Number(process.env.ROOMIO_DOCKER_PORT ?? 13100);
const BASE = `http://127.0.0.1:${PORT}`;
const CONTAINER = 'roomio-docker-test';

function run(cmd) {
  execSync(cmd, { stdio: 'inherit', shell: true });
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

async function fetchOk(path) {
  const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(5000) });
  return { ok: res.ok, status: res.status };
}

function hasDocker() {
  return spawnSync('docker', ['--version'], { stdio: 'ignore' }).status === 0;
}

console.log(`\n── Docker build (${IMAGE}) ──`);
if (!hasDocker()) {
  console.log('⚠ Docker yüklü değil — dosya doğrulamasına geçiliyor');
  const fs = await import('node:fs');
  const required = ['Dockerfile', 'docker-compose.prod.yml', 'scripts/docker-entrypoint.mjs', '.env.production.example'];
  for (const f of required) {
    if (!fs.existsSync(f)) throw new Error(`Eksik: ${f}`);
    console.log(`✓ ${f}`);
  }
  console.log('\n✓ Adım 5.1 dosyaları hazır (Docker CI/staging’de test:docker çalıştırın)\n');
  process.exit(0);
}
run(`docker build -t ${IMAGE} .`);

try {
  run(`docker rm -f ${CONTAINER} 2>/dev/null || true`);
  console.log(`\n── Container start (port ${PORT}) ──`);
  run(
    `docker run -d --name ${CONTAINER} -p ${PORT}:3100 -e DATABASE_URL=file:/data/roomio.db ${IMAGE}`,
  );

  console.log('\n── Health bekleniyor ──');
  let healthy = false;
  for (let i = 0; i < 45; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        healthy = true;
        break;
      }
    } catch {
      // retry
    }
    sleep(2000);
  }
  if (!healthy) throw new Error('Container health timeout');

  const checks = [
    ['/api/health', 'Health'],
    ['/housekeeping/mobile', 'HK mobil'],
    ['/api/push/vapid-public-key', 'Push API'],
    ['/tools/rollout', 'Rollout'],
  ];

  console.log('\n── Canary rotalar ──');
  let passed = 0;
  for (const [path, label] of checks) {
    const r = await fetchOk(path);
    console.log(`${r.ok ? '✓' : '✗'} ${label} — ${path} [${r.status}]`);
    if (r.ok) passed += 1;
  }

  console.log(`\n${passed}/${checks.length} docker canary geçti`);
  process.exit(passed === checks.length ? 0 : 1);
} catch (e) {
  console.error('\n✗ Docker test başarısız:', e instanceof Error ? e.message : e);
  try {
    execSync(`docker logs ${CONTAINER} 2>&1 | tail -30`, { stdio: 'inherit', shell: true });
  } catch {
    // ignore
  }
  process.exit(1);
} finally {
  spawnSync('docker', ['rm', '-f', CONTAINER], { stdio: 'ignore' });
}
