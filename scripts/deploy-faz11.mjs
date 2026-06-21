#!/usr/bin/env node
/**
 * Faz 11 — otomatik Fly deploy (token tabanlı, Terminal gerekmez).
 * Kullanım: npm run deploy:faz11
 *
 * Gereksinim: .env.fly içinde FLY_API_TOKEN
 * Token: https://fly.io/user/personal_access_tokens
 */
import { spawnSync } from 'node:child_process';
import { ensureFlyAuth, flyProcessEnv } from './fly-auth.mjs';
import { productionUrl, saveProductionUrl, defaultFlyUrl, flyAppName } from './fly-production.mjs';

console.log('\n── Faz 11 otomatik deploy ──\n');

const auth = await ensureFlyAuth();
if (!auth.ok) {
  console.error(`✗ ${auth.message}`);
  process.exit(1);
}
console.log(`✓ Fly auth — ${auth.user}`);

const deploy = spawnSync('node', ['scripts/fly-deploy-live.mjs'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: flyProcessEnv(),
});
if (deploy.status !== 0) {
  console.error('\n✗ deploy:fly:live başarısız');
  process.exit(deploy.status ?? 1);
}

const prod = productionUrl() ?? defaultFlyUrl(flyAppName());
saveProductionUrl(prod);
console.log(`\nℹ Faz 11 test — ${prod}`);

const test = spawnSync('node', ['scripts/test-faz11-steps.mjs', '--step', '11.1', '--step', '11.3'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: { ...flyProcessEnv(), ROOMIO_PRODUCTION_URL: prod, ROOMIO_URL: prod },
});
if (test.status !== 0) process.exit(test.status ?? 1);

console.log(`\n✅ Faz 11 deploy tamamlandı → ${prod}`);
console.log(`📱 Telefon: ${prod}/housekeeping/mobile → Bildirimleri aç\n`);
