#!/usr/bin/env node
/**
 * Production deploy hazırlık kontrolü.
 * Kullanım: npm run test:production-ready
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const files = [
  'fly.toml',
  'render.yaml',
  'railway.toml',
  'Dockerfile',
  'docker-compose.prod.yml',
  '.github/workflows/deploy-production.yml',
  'scripts/docker-entrypoint.mjs',
];

let ok = true;
console.log('Production deploy hazırlık\n');

for (const f of files) {
  const hit = existsSync(f);
  console.log(`${hit ? '✓' : '✗'} ${f}`);
  if (!hit) ok = false;
}

const flyOk = spawnSync('npm', ['run', 'deploy:fly'], { stdio: 'inherit', shell: true }).status === 0;
ok = flyOk && ok;

if (existsSync('docker-compose.prod.yml')) {
  const compose = readFileSync('docker-compose.prod.yml', 'utf8');
  for (const key of ['SENTRY_DSN', 'VAPID_PUBLIC_KEY', 'REDIS_URL']) {
    const hit = compose.includes(key);
    console.log(`${hit ? '✓' : '✗'} compose → ${key}`);
    if (!hit) ok = false;
  }
}

console.log(ok ? '\n✓ Production deploy hazır\n' : '\n✗ Eksik yapılandırma\n');
process.exit(ok ? 0 : 1);
