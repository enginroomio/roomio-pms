#!/usr/bin/env node
/** Render.com Node runtime başlatıcı (Docker gerekmez). */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

/** Render build sırasında .git yoksa manifest gitSha boş kalır — runtime commit ile düzelt. */
function patchReleaseManifestGitSha() {
  const sha = process.env.RENDER_GIT_COMMIT?.trim() || process.env.GITHUB_SHA?.trim();
  if (!sha) return;
  const short = sha.slice(0, 7);
  const targets = [join(ROOT, 'public', 'release-manifest.json')];
  if (existsSync(standalone)) targets.push(join(standalone, 'public', 'release-manifest.json'));
  for (const path of targets) {
    if (!existsSync(path)) continue;
    try {
      const manifest = JSON.parse(readFileSync(path, 'utf8'));
      manifest.gitSha = short;
      writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
      console.log(`[render] release-manifest gitSha=${short}`);
    } catch {
      /* ignore */
    }
  }
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
patchReleaseManifestGitSha();
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
