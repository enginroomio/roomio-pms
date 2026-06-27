#!/usr/bin/env node
/**
 * Faz 15 — deploy + doğrulama.
 * Kullanım: npm run deploy:faz15
 * Gereksinim: .env.fly → FLY_API_TOKEN (boş olmamalı)
 */
import { spawnSync } from 'node:child_process';
import { loadFlyToken } from './fly-auth.mjs';
import { flyProcessEnv } from './fly-auth.mjs';
import { productionUrl, saveProductionUrl, defaultFlyUrl, flyAppName } from './fly-production.mjs';

console.log('\n── Faz 15 deploy + doğrulama ──\n');

const token = loadFlyToken();
if (!token) {
  console.error('✗ FLY_API_TOKEN boş veya eksik');
  console.error('  1. https://fly.io/user/personal_access_tokens');
  console.error('  2. .env.fly → FLY_API_TOKEN=fo1_...');
  process.exit(1);
}

const deploy = spawnSync('node', ['scripts/deploy-faz11.mjs'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: flyProcessEnv(),
});
if (deploy.status !== 0) process.exit(deploy.status ?? 1);

const prod = productionUrl() ?? defaultFlyUrl(flyAppName());
saveProductionUrl(prod);

const test = spawnSync('node', ['scripts/test-faz15-steps.mjs'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: { ...flyProcessEnv(), ROOMIO_PRODUCTION_URL: prod, ROOMIO_URL: prod },
});
process.exit(test.status ?? 1);
