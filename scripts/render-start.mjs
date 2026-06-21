#!/usr/bin/env node
/** Render.com Node runtime başlatıcı (Docker gerekmez). */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { isPostgresUrl, prismaSchemaPath } from './prisma-schema.mjs';

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
}

const schema = prismaSchemaPath(dbUrl);
console.log('[render] Veritabanı şeması…');
execSync(`npx prisma db push --schema=${schema} --skip-generate`, { stdio: 'inherit', cwd: ROOT });

const port = process.env.PORT ?? '3100';
console.log(`[render] Roomio başlatılıyor — PORT=${port}`);

if (existsSync(join(standalone, 'server.js'))) {
  execSync('node server.js', {
    stdio: 'inherit',
    cwd: standalone,
    env: { ...process.env, PORT: port, HOSTNAME: '0.0.0.0' },
  });
} else {
  execSync('npx next start -p ' + port + ' -H 0.0.0.0', { stdio: 'inherit', cwd: ROOT, env: process.env });
}
