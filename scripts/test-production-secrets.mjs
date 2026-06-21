#!/usr/bin/env node
/**
 * Production secret şablonu doğrulaması.
 * Kullanım: npm run test:secrets
 */
import { existsSync, readFileSync } from 'node:fs';
import { parseEnvFile } from './parse-env-file.mjs';

const requiredInExample = ['ROOMIO_JWT_SECRET', 'DATABASE_URL', 'REDIS_URL'];
const optionalInExample = ['SENTRY_DSN', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'ROOMIO_INTEGRATION_LIVE'];

let ok = true;
console.log('Production secrets doğrulama\n');

if (!existsSync('.env.production.example')) {
  console.log('✗ .env.production.example eksik');
  process.exit(1);
}

const example = readFileSync('.env.production.example', 'utf8');
for (const key of requiredInExample) {
  const hit = example.includes(`${key}=`);
  console.log(`${hit ? '✓' : '✗'} zorunlu → ${key}`);
  if (!hit) ok = false;
}

for (const key of optionalInExample) {
  const hit = example.includes(key);
  console.log(`${hit ? '✓' : 'ℹ'} opsiyonel → ${key}${hit ? '' : ' (dokümante edilmemiş)'}`);
}

if (existsSync('.env.vapid.generated')) {
  const vapid = parseEnvFile('.env.vapid.generated');
  for (const key of ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']) {
    const hit = Boolean(vapid[key]?.length > 10);
    console.log(`${hit ? '✓' : '✗'} .env.vapid.generated → ${key}`);
    if (!hit) ok = false;
  }
} else {
  console.log('ℹ .env.vapid.generated yok — npm run vapid:gen ile üretin');
}

console.log(ok ? '\n✓ Secret şablonları hazır\n' : '\n✗ Secret eksik/hatalı\n');
process.exit(ok ? 0 : 1);
