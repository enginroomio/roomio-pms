#!/usr/bin/env node
/**
 * Production tanı + düzeltme rehberi (sıralı go-live öncesi).
 * Kullanım: npm run render:diagnose
 */
import { productionUrl, saveProductionUrl, waitForHealth } from './render-production.mjs';

const BASE = (productionUrl() ?? 'https://www.roomio.web.tr').replace(/\/$/, '');

console.log('\n── Roomio production tanı ──\n');
console.log(`URL: ${BASE}\n`);

const health = await waitForHealth(BASE, 3, 2000);

if (health.ok) {
  console.log('✓ Health OK — production hazır');
  console.log(`  git: ${health.body?.gitSha ?? '—'}`);
  saveProductionUrl(BASE);
  process.exit(0);
}

console.log('✗ Health başarısız\n');

if (health.body?.checks) {
  for (const [key, val] of Object.entries(health.body.checks)) {
    const c = val;
    console.log(`${c.ok ? '✓' : '✗'} ${key}: ${c.detail ?? '—'}`);
  }
}

const authFail = health.body?.checks?.auth?.ok === false;
if (authFail) {
  console.log('\n── JWT + VAPID (tek dosya) ──');
  console.log('  npm run render:paste-env');
  console.log('  → .roomio/render-env-paste.env dosyasını Render Environment\'a yapıştırın');
}

console.log('\n── Sıradaki adımlar ──');
console.log('1. npm run render:paste-env → Render Dashboard → Environment');
console.log('2. git push master (veya main) → GHCR + Render auto-deploy (veya Manual Deploy)');
console.log('3. npm run render:go-live -- --step 1');
console.log('4. npm run go-live:verify\n');

process.exit(1);
