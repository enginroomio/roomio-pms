#!/usr/bin/env node
/**
 * Production tanı + düzeltme rehberi (sıralı go-live öncesi).
 * Kullanım: npm run render:diagnose
 */
import { randomBytes } from 'node:crypto';
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
  const secret = randomBytes(48).toString('base64');
  console.log('\n── JWT secret (Render Environment\'a yapıştırın) ──');
  console.log(`ROOMIO_JWT_SECRET=${secret}`);
}

console.log('\n── Sıradaki adımlar ──');
console.log('1. Render Dashboard → Environment → ROOMIO_JWT_SECRET kaydet');
console.log('2. VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY (npm run vapid:gen)');
console.log('3. git push → auto-deploy veya Manual Deploy');
console.log('4. npm run render:go-live -- --step 1');
console.log('5. npm run go-live:verify\n');

process.exit(1);
