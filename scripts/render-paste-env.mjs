#!/usr/bin/env node
/**
 * Render Dashboard → Environment için kopyala-yapıştır env dosyası üretir.
 * Kullanım: npm run render:paste-env
 */
import { randomBytes } from 'node:crypto';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnvFile } from './parse-env-file.mjs';

const OUT = join(process.cwd(), '.roomio', 'render-env-paste.env');

const jwt = process.env.ROOMIO_JWT_SECRET?.trim() || randomBytes(48).toString('base64');
const vapid = existsSync('.env.vapid.generated') ? parseEnvFile('.env.vapid.generated') : {};

const lines = [
  '# Render Dashboard → roomio-pms-v2 → Environment → Add from .env',
  '# Kaydettikten sonra: Manual Deploy → Deploy latest commit',
  '',
  `ROOMIO_JWT_SECRET=${jwt}`,
  'ROOMIO_AUTH_REQUIRED=1',
];

if (vapid.VAPID_PUBLIC_KEY) lines.push(`VAPID_PUBLIC_KEY=${vapid.VAPID_PUBLIC_KEY}`);
if (vapid.VAPID_PRIVATE_KEY) lines.push(`VAPID_PRIVATE_KEY=${vapid.VAPID_PRIVATE_KEY}`);
if (vapid.VAPID_SUBJECT) lines.push(`VAPID_SUBJECT=${vapid.VAPID_SUBJECT}`);
else lines.push('VAPID_SUBJECT=mailto:hk@hotelsapphire.com');

mkdirSync(join(process.cwd(), '.roomio'), { recursive: true });
writeFileSync(OUT, `${lines.join('\n')}\n`, 'utf8');

console.log('\n── Render env yapıştırma dosyası ──\n');
console.log(`✓ ${OUT}`);
console.log('\nRender Dashboard → roomio-pms-v2 → Environment');
console.log('  "Add from .env" veya her satırı tek tek ekleyin');
console.log('  Sonra Manual Deploy\n');
console.log('Otomatik (API key varsa): RENDER_API_KEY=rnd_... npm run render:set-secrets\n');
