#!/usr/bin/env node
/**
 * Fly.io production secret kontrolü.
 * Kullanım: npm run fly:secrets:check
 */
import { existsSync, readFileSync } from 'node:fs';
import { parseEnvFile } from './parse-env-file.mjs';
import {
  FLY_OPTIONAL_SECRETS,
  FLY_REQUIRED_SECRETS,
  flyAppName,
  hasFlyCli,
  runFly,
} from './fly-production.mjs';

let ok = true;
console.log('\n── Fly secrets kontrolü ──\n');

if (!hasFlyCli()) {
  console.log('ℹ fly CLI yüklü değil — şablon kontrolü');
  if (existsSync('.env.production.example')) {
    const example = readFileSync('.env.production.example', 'utf8');
    for (const key of FLY_REQUIRED_SECRETS) {
      const hit = example.includes(key);
      console.log(`${hit ? '✓' : '✗'} şablon → ${key}`);
      if (!hit) ok = false;
    }
    for (const key of FLY_OPTIONAL_SECRETS) {
      console.log(`${example.includes(key) ? '✓' : 'ℹ'} opsiyonel → ${key}`);
    }
  }
  if (existsSync('.env.vapid.generated')) {
    const vapid = parseEnvFile('.env.vapid.generated');
    for (const key of ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']) {
      const hit = Boolean(vapid[key]?.length > 10);
      console.log(`${hit ? '✓' : '✗'} .env.vapid.generated → ${key}`);
      if (!hit) ok = false;
    }
  } else {
    console.log('ℹ .env.vapid.generated yok — npm run vapid:gen');
  }
  console.log('\nKurulum: https://fly.io/docs/hands-on/install-flyctl/');
  console.log('Deploy sonrası: fly secrets set ROOMIO_JWT_SECRET=... VAPID_PUBLIC_KEY=...');
  process.exit(ok ? 0 : 1);
}

const app = flyAppName();
const whoami = runFly(['auth', 'whoami']);
if (whoami.status !== 0) {
  console.log('✗ fly auth gerekli — fly auth login');
  process.exit(1);
}
console.log(`✓ fly auth — ${whoami.stdout.trim()}`);
console.log(`✓ app — ${app}\n`);

const listed = runFly(['secrets', 'list', '-a', app]);
if (listed.status !== 0) {
  console.log('✗ fly secrets list başarısız');
  console.log(listed.stderr?.trim() || listed.stdout?.trim());
  process.exit(1);
}

const present = new Set(
  listed.stdout
    .split('\n')
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean),
);

for (const key of FLY_REQUIRED_SECRETS) {
  const hit = present.has(key);
  console.log(`${hit ? '✓' : '✗'} secret → ${key}`);
  if (!hit) ok = false;
}

for (const key of FLY_OPTIONAL_SECRETS) {
  console.log(`${present.has(key) ? '✓' : 'ℹ'} opsiyonel → ${key}`);
}

console.log(ok ? '\n✓ Fly secrets hazır\n' : '\n✗ Eksik Fly secret — fly secrets set ...\n');
process.exit(ok ? 0 : 1);
