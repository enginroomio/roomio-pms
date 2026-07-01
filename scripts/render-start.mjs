#!/usr/bin/env node
/** Render.com Node runtime başlatıcı (Docker gerekmez). */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { prismaSchemaPath } from './prisma-schema.mjs';

const ROOT = process.cwd();
const dbUrl = process.env.DATABASE_URL ?? 'file:/tmp/roomio.db';

if (dbUrl.startsWith('file:')) {
  mkdirSync(dirname(dbUrl.replace(/^file:/, '')), { recursive: true });
}

const standalone = join(ROOT, '.next', 'standalone');
const staticDir = join(ROOT, '.next', 'static');
const publicDir = join(ROOT, 'public');

if (existsSync(standalone)) {
  if (existsSync(publicDir)) {
    cpSync(publicDir, join(standalone, 'public'), { recursive: true });
  }
  if (existsSync(staticDir)) {
    mkdirSync(join(standalone, '.next'), { recursive: true });
    cpSync(staticDir, join(standalone, '.next', 'static'), { recursive: true });
  }
  writeFileSync(join(standalone, '.env'), `DATABASE_URL="${dbUrl}"\n`, 'utf8');
}

const schema = prismaSchemaPath(dbUrl);
console.log('[render] Veritabanı şeması…');
execSync(`npx prisma db push --schema=${schema} --skip-generate`, { stdio: 'inherit', cwd: ROOT });

const port = process.env.PORT ?? '3100';
const jwt = process.env.ROOMIO_JWT_SECRET?.trim() ?? '';
const authRequired = process.env.ROOMIO_AUTH_REQUIRED === '1';
if (process.env.NODE_ENV === 'production' && authRequired && (jwt.length < 32 || jwt.includes('replace-with'))) {
  console.warn('[render] ⚠ ROOMIO_JWT_SECRET eksik veya zayıf — /api/health ok:false olur.');
  console.warn('[render]   Düzeltme: npm run render:paste-env → Render Environment → Manual Deploy');
}
console.log(`[render] Roomio başlatılıyor — PORT=${port}`);

if (existsSync(join(standalone, 'server.js'))) {
  execSync('node server.js', {
    stdio: 'inherit',
    cwd: standalone,
    env: { ...process.env, DATABASE_URL: dbUrl, PORT: port, HOSTNAME: '0.0.0.0' },
  });
} else {
  execSync('npx next start -p ' + port + ' -H 0.0.0.0', {
    stdio: 'inherit',
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
}
