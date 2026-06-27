#!/usr/bin/env node
/**
 * Fly.io deploy hazırlık (dry-run).
 * Kullanım: npm run deploy:fly
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function hasFly() {
  return spawnSync('fly', ['version'], { stdio: 'ignore' }).status === 0;
}

let ok = true;
console.log('\n── Fly.io deploy hazırlık ──\n');

for (const f of ['fly.toml', 'Dockerfile', '.env.production.example']) {
  const hit = existsSync(f);
  console.log(`${hit ? '✓' : '✗'} ${f}`);
  if (!hit) ok = false;
}

if (existsSync('fly.toml')) {
  const fly = readFileSync('fly.toml', 'utf8');
  for (const needle of ['app = "roomio-pms"', '/api/health']) {
    console.log(`${fly.includes(needle) ? '✓' : '✗'} fly.toml → ${needle}`);
    if (!fly.includes(needle)) ok = false;
  }
}

if (!hasFly()) {
  console.log('\nℹ fly CLI yüklü değil — dry-run modu');
  console.log('  Kurulum: brew install flyctl');
  console.log('  Canlı:   npm run deploy:fly:live');
} else {
  console.log('\n✓ fly CLI mevcut');
  console.log('  Dry-run: npm run deploy:fly');
  console.log('  Canlı:   npm run deploy:fly:live');
}

console.log(ok ? '\n✓ Fly deploy dosyaları hazır\n' : '\n✗ Eksik dosya\n');
process.exit(ok ? 0 : 1);
