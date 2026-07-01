#!/usr/bin/env node
/** Production container entrypoint — DB şema + sunucu başlat. */
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { isPostgresUrl, prismaSchemaPath } from './prisma-schema.mjs';

const dbUrl = process.env.DATABASE_URL ?? 'file:/data/roomio.db';
if (dbUrl.startsWith('file:')) {
  const path = dbUrl.replace(/^file:/, '');
  mkdirSync(dirname(path), { recursive: true });
}

const schema = prismaSchemaPath(dbUrl);
const provider = isPostgresUrl(dbUrl) ? 'postgresql' : 'sqlite';

console.log(`[entrypoint] Prisma client (${provider})…`);
execSync(`npx prisma generate --schema=${schema}`, { stdio: 'inherit' });

console.log(`[entrypoint] Veritabanı şeması (${provider})…`);
execSync(`npx prisma db push --schema=${schema} --skip-generate`, { stdio: 'inherit' });

execSync('node scripts/patch-release-git-sha.mjs', { stdio: 'inherit' });

const jwt = process.env.ROOMIO_JWT_SECRET?.trim() ?? '';
const authRequired = process.env.ROOMIO_AUTH_REQUIRED === '1';
if (process.env.NODE_ENV === 'production' && authRequired && (jwt.length < 32 || jwt.includes('replace-with'))) {
  console.warn('[entrypoint] ⚠ ROOMIO_JWT_SECRET eksik veya zayıf — /api/health ok:false olur.');
  console.warn('[entrypoint]   Düzeltme: npm run render:paste-env → Render Environment → Manual Deploy');
}

console.log('[entrypoint] Roomio başlatılıyor…');
const port = process.env.PORT ?? '3100';
console.log(`[entrypoint] PORT=${port}`);
execSync('node server.js', { stdio: 'inherit', env: { ...process.env, PORT: port, HOSTNAME: '0.0.0.0' } });
