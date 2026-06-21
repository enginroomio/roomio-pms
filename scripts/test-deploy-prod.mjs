#!/usr/bin/env node
/**
 * Production deploy dosya doğrulaması.
 * Kullanım: npm run test:deploy
 */
import { existsSync, readFileSync } from 'node:fs';

const required = [
  'fly.toml',
  'railway.toml',
  'Dockerfile',
  'docker-compose.prod.yml',
  '.github/workflows/deploy-production.yml',
  '.github/workflows/deploy-staging.yml',
  '.env.production.example',
];

let ok = true;
console.log('Production deploy doğrulama\n');

for (const file of required) {
  const hit = existsSync(file);
  console.log(`${hit ? '✓' : '✗'} ${file}`);
  if (!hit) ok = false;
}

if (existsSync('fly.toml')) {
  const fly = readFileSync('fly.toml', 'utf8');
  for (const needle of ['/api/health', 'dockerfile = "Dockerfile"']) {
    const hit = fly.includes(needle);
    console.log(`${hit ? '✓' : '✗'} fly.toml → ${needle}`);
    if (!hit) ok = false;
  }
}

console.log(ok ? '\n✓ Deploy dosyaları hazır' : '\n✗ Eksik deploy dosyası');
process.exit(ok ? 0 : 1);
